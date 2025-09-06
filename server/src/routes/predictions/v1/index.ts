import express from 'express';
import { authenticateJWT } from '../../../middleware/authenticate';
import { UserContextManager } from '../../../context/userContext';
import { PredictionService } from '../../../services/predictions';
import { hasPermission } from '../../../middleware/permissions';

const router = express.Router();

/**
 * GET /predictions
 * Fetch recent predictions for the authenticated user's organization
 */
router.get('/predictions', authenticateJWT, hasPermission('predictions:read'), async (req, res) => {
  const { limit = '20' } = req.query;
  
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    
    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID not found in user context' });
    }

    const predictions = await PredictionService.getPredictionsByOrganization(
      organizationId,
      parseInt(limit as string)
    );
      
    res.status(200).json(predictions);
  } catch (error) {
    console.error('Error fetching predictions:', error);
    res.status(500).json({ message: 'Error fetching predictions', error });
  }
});

/**
 * GET /predictions/summary
 * Get prediction analytics summary for the authenticated user's organization
 */
router.get('/predictions/summary', authenticateJWT, hasPermission('predictions:read'), async (req, res) => {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    
    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID not found in user context' });
    }

    const summary = await PredictionService.getPredictionSummary(organizationId);
    res.status(200).json(summary);
  } catch (error) {
    console.error('Error fetching prediction summary:', error);
    res.status(500).json({ message: 'Error fetching prediction summary', error });
  }
});

/**
 * GET /predictions/high-risk
 * Get only high-risk predictions for immediate attention for the authenticated user's organization
 */
router.get('/predictions/high-risk', authenticateJWT, hasPermission('predictions:read'), async (req, res) => {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    
    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID not found in user context' });
    }

    const highRiskPredictions = await PredictionService.getHighRiskPredictions(organizationId);
    res.status(200).json(highRiskPredictions);
  } catch (error) {
    console.error('Error fetching high-risk predictions:', error);
    res.status(500).json({ message: 'Error fetching high-risk predictions', error });
  }
});

/**
 * GET /predictions/accuracy
 * Get prediction accuracy analysis for the authenticated user's organization
 */
router.get('/predictions/accuracy', authenticateJWT, hasPermission('predictions:read'), async (req, res) => {
  const { days = '30' } = req.query;
  
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    
    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID not found in user context' });
    }

    const accuracy = await PredictionService.getAccuracyAnalysis(
      organizationId,
      parseInt(days as string)
    );
    res.status(200).json(accuracy);
  } catch (error) {
    console.error('Error fetching prediction accuracy:', error);
    res.status(500).json({ message: 'Error fetching prediction accuracy', error });
  }
});

export default router;