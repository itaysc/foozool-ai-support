import { Router, Request, Response } from 'express';
import { OrganizationModel } from '../../../schemas/organization.schema';
import { UserContextManager } from '../../../context/userContext';
import { AnomalyDetectionSettings } from '../../../types';
import { validateRequest } from '../../../middleware/validateRequest';
import { authenticateJWT } from '../../../middleware/authenticate';
import { z } from 'zod';

const router = Router();

// Schema for updating anomaly settings
const updateAnomalySettingsSchema = z.object({
  volumeThreshold: z.number().min(0.5).max(10).optional(),
  sentimentThreshold: z.number().min(0.1).max(2.0).optional(),
  timeWindows: z.object({
    short: z.number().min(15 * 60 * 1000).max(2 * 60 * 60 * 1000).optional(), // 15 min to 2 hours
    medium: z.number().min(2 * 60 * 60 * 1000).max(12 * 60 * 60 * 1000).optional(), // 2 to 12 hours
    long: z.number().min(12 * 60 * 60 * 1000).max(72 * 60 * 60 * 1000).optional(), // 12 to 72 hours
  }).optional(),
  minDataPoints: z.number().min(3).max(50).optional(),
  enabled: z.boolean().optional(),
});

/**
 * GET /api/v1/organizations/:organizationId/anomaly-settings
 * Get anomaly detection settings for an organization
 */
router.get('/:organizationId/anomaly-settings', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const currentOrgId = UserContextManager.getCurrentOrganizationId();
    
    if (!currentOrgId) {
      return res.status(400).json({ 
        status: 400, 
        error: 'Organization ID not found in user context' 
      });
    }
    
    // Check if user has access to this organization
    if (organizationId !== currentOrgId) {
      return res.status(403).json({ 
        status: 403, 
        error: 'Access denied to this organization' 
      });
    }

    const organization = await OrganizationModel.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ 
        status: 404, 
        error: 'Organization not found' 
      });
    }

    // Return current settings or defaults
    const settings = organization.anomalySettings || {
      volumeThreshold: 2.5,
      sentimentThreshold: 0.3,
      timeWindows: {
        short: 60 * 60 * 1000, // 1 hour
        medium: 6 * 60 * 60 * 1000, // 6 hours
        long: 24 * 60 * 60 * 1000, // 24 hours
      },
      minDataPoints: 10,
      enabled: true,
    };

    // Disable caching to ensure fresh data
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate, private, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Last-Modified': new Date().toUTCString(),
      'ETag': `"${Date.now()}"`
    });
    
    res.status(200).json({ 
      status: 200, 
      payload: settings 
    });
  } catch (error) {
    console.error('Error fetching anomaly settings:', error);
    res.status(500).json({ 
      status: 500, 
      error: 'Internal server error' 
    });
  }
});

/**
 * PUT /api/v1/organizations/:organizationId/anomaly-settings
 * Update anomaly detection settings for an organization
 */
router.put('/:organizationId/anomaly-settings', 
  authenticateJWT,
  validateRequest(updateAnomalySettingsSchema),
  async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.params;
      const currentOrgId = UserContextManager.getCurrentOrganizationId();
      const updateData = req.body;
      
      if (!currentOrgId) {
        return res.status(400).json({ 
          status: 400, 
          error: 'Organization ID not found in user context' 
        });
      }
      
      // Check if user has access to this organization
      if (organizationId !== currentOrgId) {
        return res.status(403).json({ 
          status: 403, 
          error: 'Access denied to this organization' 
        });
      }

      const organization = await OrganizationModel.findById(organizationId);
      if (!organization) {
        return res.status(404).json({ 
          status: 404, 
          error: 'Organization not found' 
        });
      }

      // Get current settings or defaults
      const currentSettings = organization.anomalySettings || {
        volumeThreshold: 2.5,
        sentimentThreshold: 0.3,
        timeWindows: {
          short: 60 * 60 * 1000, // 1 hour
          medium: 6 * 60 * 60 * 1000, // 6 hours
          long: 24 * 60 * 60 * 1000, // 24 hours
        },
        minDataPoints: 10,
        enabled: true,
      };

      // Merge updates with current settings
      const updatedSettings: AnomalyDetectionSettings = {
        ...currentSettings,
        ...updateData,
        timeWindows: {
          ...currentSettings.timeWindows,
          ...(updateData.timeWindows || {}),
        },
      };

      // Update organization with new settings
      organization.anomalySettings = updatedSettings;
      await organization.save();

      console.log(`✅ Updated anomaly settings for organization ${organization.name}:`, updatedSettings);

      // Disable caching to ensure fresh data
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate, private, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Last-Modified': new Date().toUTCString(),
        'ETag': `"${Date.now()}"`
      });
      
      res.status(200).json({ 
        status: 200, 
        payload: updatedSettings,
        message: 'Anomaly detection settings updated successfully'
      });
    } catch (error) {
      console.error('Error updating anomaly settings:', error);
      res.status(500).json({ 
        status: 500, 
        error: 'Internal server error' 
      });
    }
  }
);

/**
 * POST /api/v1/organizations/:organizationId/anomaly-settings/reset
 * Reset anomaly detection settings to defaults
 */
router.post('/:organizationId/anomaly-settings/reset', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const currentOrgId = UserContextManager.getCurrentOrganizationId();
    
    if (!currentOrgId) {
      return res.status(400).json({ 
        status: 400, 
        error: 'Organization ID not found in user context' 
      });
    }
    
    // Check if user has access to this organization
    if (organizationId !== currentOrgId) {
      return res.status(403).json({ 
        status: 403, 
        error: 'Access denied to this organization' 
      });
    }

    const organization = await OrganizationModel.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ 
        status: 404, 
        error: 'Organization not found' 
      });
    }

    // Reset to defaults
    const defaultSettings: AnomalyDetectionSettings = {
      volumeThreshold: 2.5,
      sentimentThreshold: 0.3,
      timeWindows: {
        short: 60 * 60 * 1000, // 1 hour
        medium: 6 * 60 * 60 * 1000, // 6 hours
        long: 24 * 60 * 60 * 1000, // 24 hours
      },
      minDataPoints: 10,
      enabled: true,
    };

    organization.anomalySettings = defaultSettings;
    await organization.save();

    console.log(`✅ Reset anomaly settings to defaults for organization ${organization.name}`);

    // Disable caching to ensure fresh data
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate, private, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Last-Modified': new Date().toUTCString(),
      'ETag': `"${Date.now()}"`
    });
    
    res.status(200).json({ 
      status: 200, 
      payload: defaultSettings,
      message: 'Anomaly detection settings reset to defaults'
    });
  } catch (error) {
    console.error('Error resetting anomaly settings:', error);
    res.status(500).json({ 
      status: 500, 
      error: 'Internal server error' 
    });
  }
});

export default router;
