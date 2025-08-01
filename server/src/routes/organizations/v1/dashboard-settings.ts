import { Router } from 'express';
import { authenticateJWT } from '../../../middleware/authenticate';
import { validateRequest } from '../../../middleware/validateRequest';
import dashboardSettingsService from '../../../services/organizations/dashboard-settings.service';
import { DashboardSettings } from '../../../types/organization';
import { 
  updateDashboardSettingsValidation
} from './validations';

const router = Router();

/**
 * @route GET /api/v1/organizations/:organizationId/dashboard-settings
 * @desc Get dashboard settings for an organization
 * @access Private
 */
router.get('/:organizationId/dashboard-settings', 
  authenticateJWT,
  async (req, res) => {
    try {
      const { organizationId } = req.params;
      
      const settings = await dashboardSettingsService.getDashboardSettings(organizationId);
      
      if (!settings) {
        // Return default settings if none exist
        const defaultSettings = dashboardSettingsService.getDefaultSettings();
        return res.json({
          success: true,
          data: defaultSettings,
          message: 'Using default dashboard settings'
        });
      }
      
      res.json({
        success: true,
        data: settings,
        message: 'Dashboard settings retrieved successfully'
      });
    } catch (error) {
      console.error('❌ Error getting dashboard settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get dashboard settings',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route PUT /api/v1/organizations/:organizationId/dashboard-settings
 * @desc Update dashboard settings for an organization
 * @access Private
 */
router.put('/:organizationId/dashboard-settings',
  authenticateJWT,
  validateRequest(updateDashboardSettingsValidation),
  async (req, res) => {
    try {
      const { organizationId } = req.params;
      const settings: Partial<DashboardSettings> = req.body;
      
      // Validate settings
      const validation = dashboardSettingsService.validateSettings(settings);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid dashboard settings',
          errors: validation.errors
        });
      }
      
      const updatedSettings = await dashboardSettingsService.updateDashboardSettings(organizationId, settings);
      
      res.json({
        success: true,
        data: updatedSettings,
        message: 'Dashboard settings updated successfully'
      });
    } catch (error) {
      console.error('❌ Error updating dashboard settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update dashboard settings',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route DELETE /api/v1/organizations/:organizationId/dashboard-settings
 * @desc Reset dashboard settings to defaults
 * @access Private
 */
router.delete('/:organizationId/dashboard-settings',
  authenticateJWT,
  async (req, res) => {
    try {
      const { organizationId } = req.params;
      
      const defaultSettings = await dashboardSettingsService.resetDashboardSettings(organizationId);
      
      res.json({
        success: true,
        data: defaultSettings,
        message: 'Dashboard settings reset to defaults successfully'
      });
    } catch (error) {
      console.error('❌ Error resetting dashboard settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reset dashboard settings',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route GET /api/v1/organizations/:organizationId/dashboard-settings/defaults
 * @desc Get default dashboard settings
 * @access Private
 */
router.get('/:organizationId/dashboard-settings/defaults',
  authenticateJWT,
  async (req, res) => {
    try {
      const defaultSettings = dashboardSettingsService.getDefaultSettings();
      
      res.json({
        success: true,
        data: defaultSettings,
        message: 'Default dashboard settings retrieved successfully'
      });
    } catch (error) {
      console.error('❌ Error getting default dashboard settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get default dashboard settings',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router; 