import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../../../middleware/authenticate';
import { StakeholderService } from '../../../services/customers';
import multer from 'multer';

const router = Router();

// Configure multer for CSV uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// Get all stakeholders for a customer
router.get('/:customerId/stakeholders', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const organizationId = req.user!.organization.toString();

    const stakeholders = await StakeholderService.getStakeholdersByCustomerId(customerId, organizationId);

    res.json({
      success: true,
      payload: stakeholders
    });
  } catch (error: any) {
    console.error('Error fetching stakeholders:', error);
    const statusCode = error.message === 'Customer not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message === 'Customer not found' ? error.message : 'Failed to fetch stakeholders'
    });
  }
});

// Add a new stakeholder to a customer
router.post('/:customerId/stakeholders', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const organizationId = req.user!.organization.toString();
    const stakeholderData = req.body;

    const newStakeholder = await StakeholderService.createStakeholder(customerId, organizationId, stakeholderData);

    res.status(201).json({
      success: true,
      payload: newStakeholder
    });
  } catch (error: any) {
    console.error('Error creating stakeholder:', error);
    const statusCode = error.message.includes('Missing required fields') ? 400 : 
                      error.message === 'Customer not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message.includes('Missing required fields') || error.message === 'Customer not found' 
        ? error.message 
        : 'Failed to create stakeholder'
    });
  }
});

// Update a stakeholder
router.put('/:customerId/stakeholders/:stakeholderId', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { customerId, stakeholderId } = req.params;
    const organizationId = req.user!.organization.toString();
    const updateData = req.body;

    const updatedStakeholder = await StakeholderService.updateStakeholder(customerId, organizationId, stakeholderId, updateData);

    res.json({
      success: true,
      payload: updatedStakeholder
    });
  } catch (error: any) {
    console.error('Error updating stakeholder:', error);
    const statusCode = error.message === 'Customer not found' || error.message === 'Stakeholder not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message === 'Customer not found' || error.message === 'Stakeholder not found' 
        ? error.message 
        : 'Failed to update stakeholder'
    });
  }
});

// Delete a stakeholder
router.delete('/:customerId/stakeholders/:stakeholderId', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { customerId, stakeholderId } = req.params;
    const organizationId = req.user!.organization.toString();

    await StakeholderService.deleteStakeholder(customerId, organizationId, stakeholderId);

    res.json({
      success: true,
      message: 'Stakeholder deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting stakeholder:', error);
    const statusCode = error.message === 'Customer not found' || error.message === 'Stakeholder not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message === 'Customer not found' || error.message === 'Stakeholder not found' 
        ? error.message 
        : 'Failed to delete stakeholder'
    });
  }
});

// Bulk import stakeholders from CSV
router.post('/:customerId/stakeholders/import', authenticateJWT, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const organizationId = req.user!.organization.toString();

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const result = await StakeholderService.bulkImportStakeholders(customerId, organizationId, req.file);

    res.json({
      success: true,
      payload: result
    });
  } catch (error: any) {
    console.error('Error importing stakeholders:', error);
    const statusCode = error.message === 'Customer not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message === 'Customer not found' ? error.message : 'Failed to import stakeholders'
    });
  }
});

// Error handling middleware for multer
router.use((error: any, req: Request, res: Response, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 5MB.'
      });
    }
  }
  
  if (error.message === 'Only CSV files are allowed') {
    return res.status(400).json({
      success: false,
      error: 'Only CSV files are allowed'
    });
  }

  next(error);
});

export default router;
