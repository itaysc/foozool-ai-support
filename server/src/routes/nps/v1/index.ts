import express, { Request, Response } from 'express';
import multer from 'multer';
import { authenticateJWT, authenticateWebhook } from '../../../middleware/authenticate';
import { validateRequest } from '../../../middleware/validateRequest';
import { UserContextManager } from '../../../context/userContext';
import { 
  bulkNPSImportSchema,
  type BulkNPSImport 
} from './validation';
import NPSService from '../../../services/nps';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow CSV and Excel files
    if (file.mimetype === 'text/csv' || 
        file.mimetype === 'application/vnd.ms-excel' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'));
    }
  }
});

/**
 * POST /api/v1/nps/upload/csv
 * Upload NPS data via CSV file
 */
router.post('/upload/csv', 
  authenticateJWT, 
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('🔄 Processing CSV NPS data upload...');
      console.log('📁 File details:', {
        originalname: req.file?.originalname,
        mimetype: req.file?.mimetype,
        size: req.file?.size
      });
      
      if (!req.file) {
        res.status(400).json({ 
          status: 400,
          payload: { error: 'No file uploaded' } 
        });
        return;
      }
      const organizationId = UserContextManager.getCurrentOrganizationId();
      const userId = UserContextManager.getCurrentUserId();
      
      console.log('🏢 Organization ID:', organizationId);
      console.log('👤 User ID:', userId);
      // Call NPS service to process CSV file
      const result = await NPSService.getInstance().processCSVUpload(req.file, organizationId!, userId!);

      res.status(200).json({
        status: 200,
        payload: { 
          message: 'CSV file uploaded successfully',
          filename: req.file.originalname,
          size: req.file.size,
          result: result
        }
      });
    } catch (error: any) {
      console.error('Error processing CSV upload:', error);
      res.status(500).json({ 
        status: 500,
        payload: { error: 'Internal server error', message: error.message } 
      });
    }
  }
);

/**
 * POST /api/v1/nps/upload/json
 * Upload NPS data via JSON payload
 */
router.post('/upload/json', 
  authenticateJWT, 
  validateRequest(bulkNPSImportSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('🔄 Processing JSON NPS data upload...');
      console.log('📊 Request body:', JSON.stringify(req.body, null, 2));
      
      const organizationId = UserContextManager.getCurrentOrganizationId();
      const { survey, responses }: BulkNPSImport = req.body;
      const userId = UserContextManager.getCurrentUserId();
      
      console.log('🏢 Organization ID:', organizationId);
      console.log('👤 User ID:', userId);
      console.log('📋 Survey structure:', survey ? Object.keys(survey) : 'undefined');
      console.log('📝 Responses count:', responses ? responses.length : 'undefined');

      // Call NPS service to process JSON data
      const result = await NPSService.getInstance().processJSONUpload(survey, responses, organizationId!, userId!);

      res.status(200).json({
        status: 200,
        payload: { 
          message: 'JSON data uploaded successfully',
          surveyId: survey.surveyId || 'generated_id',
          responsesCount: responses.length,
          result: result
        }
      });
    } catch (error: any) {
      console.error('Error processing JSON upload:', error);
      res.status(500).json({ 
        status: 500,
        payload: { error: 'Internal server error', message: error.message } 
      });
    }
  }
);

/**
 * POST /api/v1/nps/upload/generic
 * Upload NPS data in any format - uses AI mapping to detect structure
 */
router.post('/upload/generic', 
  authenticateJWT, 
  async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('🔄 Processing generic NPS data upload...');
      console.log('📊 Request body:', JSON.stringify(req.body, null, 2));
      
      const organizationId = UserContextManager.getCurrentOrganizationId();
      const userId = UserContextManager.getCurrentUserId();
      
      console.log('🏢 Organization ID:', organizationId);
      console.log('👤 User ID:', userId);

      // Call NPS service to process generic data with AI mapping
      const result = await NPSService.getInstance().processGenericDataUpload(req.body, organizationId!, userId!);

      console.log('✅ Generic data processing completed successfully');
      console.log('📈 Result:', JSON.stringify(result, null, 2));

      res.status(200).json({
        status: 200,
        payload: { 
          message: 'Generic NPS data uploaded and processed successfully',
          dataType: 'generic',
          result: result
        }
      });
    } catch (error: any) {
      console.error('❌ Error processing generic NPS data upload:', error);
      console.error('🔍 Error details:', {
        message: error.message,
        name: error.name
      });
      
      res.status(500).json({ 
        status: 500,
        payload: { 
          error: 'Internal server error', 
          message: error.message
        } 
      });
    }
  }
);

/**
 * POST /api/v1/nps/upload/webhook
 * Receive NPS data via webhook
 */
router.post('/upload/webhook', 
  authenticateWebhook,
  async (req: Request, res: Response): Promise<void> => {
    try {
      // authenticateWebhook middleware already validated the user and organization
      const organizationId = UserContextManager.getCurrentOrganizationId();
      const userId = UserContextManager.getCurrentUserId();
    
      const npsData = req.body;

      // Call NPS service to process webhook data
      await NPSService.getInstance().processWebhookData(npsData, organizationId!, userId!);

      res.status(200).json({
        status: 200,
        payload: { 
          message: 'Webhook data received successfully',
          timestamp: new Date().toISOString(),
          // result: result
        }
      });
    } catch (error: any) {
      console.error('Error processing webhook data:', error);
      res.status(500).json({ 
        status: 500,
        payload: { error: 'Internal server error', message: error.message } 
      });
    }
  }
);

/**
 * GET /api/v1/nps/upload/status/:uploadId
 * Get status of a file upload or bulk import
 */
router.get('/upload/status/:uploadId', 
  authenticateJWT, 
  async (req: Request, res: Response): Promise<void> => {
    try {
      const organizationId = UserContextManager.getCurrentOrganizationId();
      if (!organizationId) {
        res.status(400).json({ 
          status: 400,
          payload: { error: 'Organization ID not found in user context' } 
        });
        return;
      }

      const { uploadId } = req.params;

      // Call NPS service to get upload status
      const status = await NPSService.getInstance().getUploadStatus(uploadId, organizationId);

      res.status(200).json({
        status: 200,
        payload: { 
          uploadId,
          status: status
        }
      });
    } catch (error: any) {
      console.error('Error getting upload status:', error);
      res.status(500).json({ 
        status: 500,
        payload: { error: 'Internal server error', message: error.message } 
      });
    }
  }
);

/**
 * GET /api/v1/nps/upload/history
 * Get upload history for the organization
 */
router.get('/upload/history', 
  authenticateJWT, 
  async (req: Request, res: Response): Promise<void> => {
    try {
      const organizationId = UserContextManager.getCurrentOrganizationId();
      if (!organizationId) {
        res.status(400).json({ 
          status: 400,
          payload: { error: 'Organization ID not found in user context' } 
        });
        return;
      }

      const { limit = 50, offset = 0, status } = req.query;

      // Call NPS service to get upload history
      const history = await NPSService.getInstance().getUploadHistory(organizationId, {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        status: status as string
      });

      res.status(200).json({
        status: 200,
        payload: { 
          history: history
        }
      });
    } catch (error: any) {
      console.error('Error getting upload history:', error);
      res.status(500).json({ 
        status: 500,
        payload: { error: 'Internal server error', message: error.message } 
      });
    }
  }
);

/**
 * DELETE /api/v1/nps/upload/:uploadId
 * Delete/cancel an upload
 */
router.delete('/upload/:uploadId',
  authenticateJWT,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const organizationId = UserContextManager.getCurrentOrganizationId();
      if (!organizationId) {
        res.status(400).json({
          status: 400,
          payload: { error: 'Organization ID not found in user context' }
        });
        return;
      }

      const { uploadId } = req.params;

      // Call NPS service to delete upload
      await NPSService.getInstance().deleteUpload(uploadId, organizationId);

      res.status(200).json({
        status: 200,
        payload: {
          message: 'Upload deleted successfully',
          uploadId
        }
      });
    } catch (error: any) {
      console.error('Error deleting upload:', error);
      res.status(500).json({
        status: 500,
        payload: { error: 'Internal server error', message: error.message }
      });
    }
  }
);

/**
 * POST /api/v1/nps/upload/:uploadId/cancel
 * Cancel an in-progress upload
 */
router.post('/upload/:uploadId/cancel',
  authenticateJWT,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const organizationId = UserContextManager.getCurrentOrganizationId();
      if (!organizationId) {
        res.status(400).json({
          status: 400,
          payload: { error: 'Organization ID not found in user context' }
        });
        return;
      }

      const { uploadId } = req.params;

      // Call NPS service to cancel upload
      await NPSService.getInstance().cancelUpload(uploadId, organizationId);

      res.status(200).json({
        status: 200,
        payload: {
          message: 'Upload cancelled successfully',
          uploadId
        }
      });
    } catch (error: any) {
      console.error('Error cancelling upload:', error);
      res.status(500).json({
        status: 500,
        payload: { error: 'Internal server error', message: error.message }
      });
    }
  }
);

/**
 * GET /api/v1/nps/insights
 * Get current NPS insights for the organization
 */
router.get('/insights',
  authenticateJWT,
  async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('🔄 Getting NPS insights...');
      console.log('🔐 Request headers:', req.headers);
      
      const organizationId = UserContextManager.getCurrentOrganizationId();
      console.log('🏢 Organization ID from context:', organizationId);
      
      if (!organizationId) {
        console.error('❌ Organization ID not found in user context');
        res.status(400).json({
          status: 400,
          payload: { error: 'Organization ID not found in user context' }
        });
        return;
      }

      // Call NPS service to get insights
      console.log('📊 Calling NPSService.getNPSInsights...');
      const insights = await NPSService.getInstance().getNPSInsights(organizationId);
      console.log('📈 Insights result:', insights ? 'Found' : 'Not found');

      if (!insights) {
        console.log('ℹ️ No NPS insights found, returning empty state');
        // Return empty insights instead of 404 error
        res.status(200).json({
          status: 200,
          payload: {
            insights: null,
            message: 'No NPS insights found for this organization. Upload NPS data to get started.'
          }
        });
        return;
      }

      console.log('✅ Returning NPS insights successfully');
      res.status(200).json({
        status: 200,
        payload: {
          insights
        }
      });
    } catch (error: any) {
      console.error('❌ Error getting NPS insights:', error);
      console.error('🔍 Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      res.status(500).json({
        status: 500,
        payload: { error: 'Internal server error', message: error.message }
      });
    }
  }
);

/**
 * GET /api/v1/nps/insights/history
 * Get NPS insights history for the organization
 */
router.get('/insights/history',
  authenticateJWT,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const organizationId = UserContextManager.getCurrentOrganizationId();
      if (!organizationId) {
        res.status(400).json({
          status: 400,
          payload: { error: 'Organization ID not found in user context' }
        });
        return;
      }

      const { limit = 10, offset = 0 } = req.query;

      // Call NPS service to get insights history
      const history = await NPSService.getInstance().getNPSInsightsHistory(organizationId, {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

      res.status(200).json({
        status: 200,
        payload: {
          history
        }
      });
    } catch (error: any) {
      console.error('Error getting NPS insights history:', error);
      res.status(500).json({
        status: 500,
        payload: { error: 'Internal server error', message: error.message }
      });
    }
  }
);

export default router;
