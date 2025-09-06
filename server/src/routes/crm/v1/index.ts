import express, { Request, Response } from 'express';
import { authenticateJWT } from '../../../middleware/authenticate';
import { CRMService } from '../../../services/crm';
import { validateRequest } from '../../../middleware/validateRequest';
import { crmValidation, crmUpdateValidation, crmConfigValidation } from './validations';
import { hasPermission } from '../../../middleware/permissions';

const router = express.Router();

/**
 * @route GET /api/v1/crm
 * @desc Get all supported CRMs
 * @access Private
 */
router.get('/', authenticateJWT, hasPermission('crm:read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const crms = await CRMService.getAllCRMs();
    res.status(200).json({
      success: true,
      data: crms
    });
  } catch (error) {
    console.error('Error fetching CRMs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch CRMs',
      message: (error as Error).message
    });
  }
});

/**
 * @route GET /api/v1/crm/:id
 * @desc Get CRM by ID
 * @access Private
 */
router.get('/:id', authenticateJWT, hasPermission('crm:read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const crm = await CRMService.getCRMById(id);
    
    if (!crm) {
      res.status(404).json({
        success: false,
        error: 'CRM not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: crm
    });
  } catch (error) {
    console.error('Error fetching CRM:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch CRM',
      message: (error as Error).message
    });
  }
});

/**
 * @route POST /api/v1/crm
 * @desc Create a new CRM
 * @access Private
 */
router.post('/', authenticateJWT, hasPermission('crm:update'), validateRequest(crmValidation), async (req: Request, res: Response): Promise<void> => {
  try {
    const crm = await CRMService.createCRM(req.body);
    res.status(201).json({
      success: true,
      data: crm
    });
  } catch (error) {
    console.error('Error creating CRM:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create CRM',
      message: (error as Error).message
    });
  }
});

/**
 * @route PUT /api/v1/crm/:id
 * @desc Update CRM
 * @access Private
 */
router.put('/:id', authenticateJWT, hasPermission('crm:update'), validateRequest(crmUpdateValidation), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const crm = await CRMService.updateCRM(id, req.body);
    
    if (!crm) {
      res.status(404).json({
        success: false,
        error: 'CRM not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: crm
    });
  } catch (error) {
    console.error('Error updating CRM:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update CRM',
      message: (error as Error).message
    });
  }
});

/**
 * @route DELETE /api/v1/crm/:id
 * @desc Delete CRM
 * @access Private
 */
router.delete('/:id', authenticateJWT, hasPermission('crm:update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await CRMService.deleteCRM(id);
    
    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'CRM not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'CRM deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting CRM:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete CRM',
      message: (error as Error).message
    });
  }
});

/**
 * @route GET /api/v1/crm/organization/:organizationId
 * @desc Get organization's CRM configuration
 * @access Private
 */
router.get('/organization/:organizationId', authenticateJWT, hasPermission('crm:read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { organizationId } = req.params;
    const crmData = await CRMService.getOrganizationCRM(organizationId);
    
    if (!crmData) {
      res.status(404).json({
        success: false,
        error: 'No CRM configuration found for this organization'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: crmData
    });
  } catch (error) {
    console.error('Error fetching organization CRM:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch organization CRM',
      message: (error as Error).message
    });
  }
});

/**
 * @route POST /api/v1/crm/organization/:organizationId
 * @desc Set organization's CRM configuration
 * @access Private
 */
router.post('/organization/:organizationId', authenticateJWT, hasPermission('crm:update'), validateRequest(crmConfigValidation), async (req: Request, res: Response): Promise<void> => {
  try {
    const { organizationId } = req.params;
    const { crmType, config } = req.body;
    
    const success = await CRMService.setOrganizationCRM(organizationId, crmType, config);
    
    if (success) {
      res.status(200).json({
        success: true,
        message: 'Organization CRM configuration updated successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to update organization CRM configuration'
      });
    }
  } catch (error) {
    console.error('Error setting organization CRM config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set organization CRM configuration',
      message: (error as Error).message
    });
  }
});

export default router;
