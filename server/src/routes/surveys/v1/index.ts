import { Router } from 'express';
import { SurveysService } from '../../../services/surveys';
import { authenticateJWT } from '../../../middleware/authenticate';
import { 
  bulkSurveyImportSchema, 
  surveyResponseSchema 
} from './validation';
import { SurveyType } from '../../../types/surveys';

const router = Router();
const surveysService = SurveysService.getInstance();

/**
 * Upload CSV file for survey processing
 */
router.post('/:surveyType/csv', authenticateJWT, async (req, res) => {
  try {
    const { surveyType } = req.params as { surveyType: SurveyType };
    const organizationId = req.user!.organization.toString();
    const userId = req.user!._id.toString();
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!['nps', 'csat'].includes(surveyType)) {
      return res.status(400).json({ error: 'Invalid survey type. Must be "nps" or "csat"' });
    }

    const result = await surveysService.processCSVUpload(req.file, organizationId, userId, surveyType);
    
    res.json({
      success: true,
      data: result,
      message: `${surveyType.toUpperCase()} CSV processed successfully`
    });
  } catch (error) {
    console.error('CSV upload error:', error);
    res.status(500).json({ 
      error: 'Failed to process CSV upload',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Upload JSON file for survey processing
 */
router.post('/:surveyType/json', authenticateJWT, async (req, res) => {
  try {
    const { surveyType } = req.params as { surveyType: SurveyType };
    const organizationId = req.user!.organization.toString();
    const userId = req.user!._id.toString();
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!['nps', 'csat'].includes(surveyType)) {
      return res.status(400).json({ error: 'Invalid survey type. Must be "nps" or "csat"' });
    }

    const result = await surveysService.processJSONUpload(req.file, organizationId, userId, surveyType);
    
    res.json({
      success: true,
      data: result,
      message: `${surveyType.toUpperCase()} JSON processed successfully`
    });
  } catch (error) {
    console.error('JSON upload error:', error);
    res.status(500).json({ 
      error: 'Failed to process JSON upload',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Upload JSON data directly in request body for survey processing
 */
router.post('/:surveyType/data', authenticateJWT, async (req, res) => {
  try {
    const { surveyType } = req.params as { surveyType: SurveyType };
    const organizationId = req.user!.organization.toString();
    const userId = req.user!._id.toString();
    
    if (!['nps', 'csat'].includes(surveyType)) {
      return res.status(400).json({ error: 'Invalid survey type. Must be "nps" or "csat"' });
    }

    // Validate the request body contains survey data
    if (!req.body || !req.body.responses || !Array.isArray(req.body.responses)) {
      return res.status(400).json({ 
        error: 'Invalid JSON data. Expected object with "responses" array' 
      });
    }

    const result = await surveysService.processJSONData(req.body, organizationId, userId, surveyType);
    
    res.json({
      success: true,
      data: result,
      message: `${surveyType.toUpperCase()} JSON data processed successfully`
    });
  } catch (error) {
    console.error('JSON data upload error:', error);
    res.status(500).json({ 
      error: 'Failed to process JSON data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Upload generic data with AI mapping
 */
router.post('/:surveyType/generic', authenticateJWT, async (req, res) => {
  try {
    const { surveyType } = req.params as { surveyType: SurveyType };
    const organizationId = req.user!.organization.toString();
    const userId = req.user!._id.toString();
    
    if (!['nps', 'csat'].includes(surveyType)) {
      return res.status(400).json({ error: 'Invalid survey type. Must be "nps" or "csat"' });
    }

    const result = await surveysService.processGenericData(req.body, organizationId, userId, surveyType);
    
    res.json({
      success: true,
      data: result,
      message: `${surveyType.toUpperCase()} generic data processed successfully`
    });
  } catch (error) {
    console.error('Generic data upload error:', error);
    res.status(500).json({ 
      error: 'Failed to process generic data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Process webhook data
 */
router.post('/:surveyType/webhook', authenticateJWT, async (req, res) => {
  try {
    const { surveyType } = req.params as { surveyType: SurveyType };
    const organizationId = req.user!.organization.toString();
    const userId = req.user!._id.toString();
    
    if (!['nps', 'csat'].includes(surveyType)) {
      return res.status(400).json({ error: 'Invalid survey type. Must be "nps" or "csat"' });
    }

    const result = await surveysService.processWebhookData(req.body, organizationId, userId, surveyType);
    
    res.json({
      success: true,
      data: result,
      message: `${surveyType.toUpperCase()} webhook data processed successfully`
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ 
      error: 'Failed to process webhook data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get survey insights
 */
router.get('/:surveyType/insights', authenticateJWT, async (req, res) => {
  try {
    const { surveyType } = req.params as { surveyType: SurveyType };
    const organizationId = req.user!.organization.toString();
    
    if (!['nps', 'csat'].includes(surveyType)) {
      return res.status(400).json({ error: 'Invalid survey type. Must be "nps" or "csat"' });
    }

    const insights = await surveysService.getSurveyInsights(organizationId, surveyType);
    
    res.json({
      success: true,
      data: insights,
      message: `${surveyType.toUpperCase()} insights retrieved successfully`
    });
  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({ 
      error: 'Failed to get insights',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get survey insights history
 */
router.get('/:surveyType/insights/history', authenticateJWT, async (req, res) => {
  try {
    const { surveyType } = req.params as { surveyType: SurveyType };
    const organizationId = req.user!.organization.toString();
    
    if (!['nps', 'csat'].includes(surveyType)) {
      return res.status(400).json({ error: 'Invalid survey type. Must be "nps" or "csat"' });
    }

    const history = await surveysService.getSurveyInsightsHistory(organizationId, surveyType);
    
    res.json({
      success: true,
      data: history,
      message: `${surveyType.toUpperCase()} insights history retrieved successfully`
    });
  } catch (error) {
    console.error('Get insights history error:', error);
    res.status(500).json({ 
      error: 'Failed to get insights history',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get upload status
 */
router.get('/uploads/:uploadId/status', authenticateJWT, async (req, res) => {
  try {
    const { uploadId } = req.params;
    const status = await surveysService.getUploadStatus(uploadId);
    
    res.json({
      success: true,
      data: status,
      message: 'Upload status retrieved successfully'
    });
  } catch (error) {
    console.error('Get upload status error:', error);
    res.status(500).json({ 
      error: 'Failed to get upload status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get upload history
 */
router.get('/uploads/history', authenticateJWT, async (req, res) => {
  try {
    const organizationId = req.user!.organization.toString();
    const { surveyType } = req.query;
    
    const history = await surveysService.getUploadHistory(
      organizationId, 
      surveyType as SurveyType | undefined
    );
    
    res.json({
      success: true,
      data: history,
      message: 'Upload history retrieved successfully'
    });
  } catch (error) {
    console.error('Get upload history error:', error);
    res.status(500).json({ 
      error: 'Failed to get upload history',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Cancel upload
 */
router.post('/uploads/:uploadId/cancel', authenticateJWT, async (req, res) => {
  try {
    const { uploadId } = req.params;
    await surveysService.cancelUpload(uploadId);
    
    res.json({
      success: true,
      message: 'Upload cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel upload error:', error);
    res.status(500).json({ 
      error: 'Failed to cancel upload',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Delete upload
 */
router.delete('/uploads/:uploadId', authenticateJWT, async (req, res) => {
  try {
    const { uploadId } = req.params;
    await surveysService.deleteUpload(uploadId);
    
    res.json({
      success: true,
      message: 'Upload deleted successfully'
    });
  } catch (error) {
    console.error('Delete upload error:', error);
    res.status(500).json({ 
      error: 'Failed to delete upload',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get upload statistics
 */
router.get('/uploads/statistics', authenticateJWT, async (req, res) => {
  try {
    const organizationId = req.user!.organization.toString();
    const { surveyType } = req.query;
    
    const statistics = await surveysService.getUploadStatistics(
      organizationId, 
      surveyType as SurveyType | undefined
    );
    
    res.json({
      success: true,
      data: statistics,
      message: 'Upload statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Get upload statistics error:', error);
    res.status(500).json({ 
      error: 'Failed to get upload statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
