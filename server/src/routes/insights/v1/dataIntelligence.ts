import { Request, Response } from 'express';
import { authenticateJWT } from '../../../middleware/authenticate';
import { hasPermission } from '../../../middleware/permissions';
import { DataIntelligenceService } from '../../../services/insights/dataIntelligence.service';
import { HealthScoreService } from '../../../services/insights/healthScore.service';
import { UserContextManager } from '../../../context/userContext';

const router = require('express').Router();
const dataIntelligenceService = new DataIntelligenceService();
const healthScoreService = new HealthScoreService();

/**
 * Get comprehensive data intelligence metrics for the organization
 * GET /api/v1/insights/data-intelligence
 */
router.get('/data-intelligence', authenticateJWT, hasPermission('insights:read'), async (req: Request, res: Response) => {
  try {
    const metrics = await dataIntelligenceService.getDataIntelligenceMetrics();
    
    res.status(200).json({
      status: 200,
      data: metrics,
      generatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error getting data intelligence metrics:', error);
    res.status(500).json({ 
      status: 500, 
      error: 'Failed to generate data intelligence metrics',
      details: error.message 
    });
  }
});

/**
 * Get customer-specific data intelligence
 * GET /api/v1/insights/data-intelligence/customer/:customerId
 */
router.get('/data-intelligence/customer/:customerId', authenticateJWT, hasPermission('insights:read'), async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const organizationId = UserContextManager.getCurrentOrganizationId();
    
    if (!organizationId) {
      return res.status(400).json({ 
        status: 400, 
        error: 'Organization ID not found in user context' 
      });
    }

    const customerIntelligence = await dataIntelligenceService.getCustomerDataIntelligence(customerId, organizationId);
    
    res.status(200).json({
      status: 200,
      data: customerIntelligence,
      generatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error getting customer data intelligence:', error);
    res.status(500).json({ 
      status: 500, 
      error: 'Failed to generate customer data intelligence',
      details: error.message 
    });
  }
});

/**
 * Get health score for a specific customer
 * GET /api/v1/insights/health-score/:customerId
 */
router.get('/health-score/:customerId', authenticateJWT, hasPermission('insights:read'), async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const organizationId = UserContextManager.getCurrentOrganizationId();
    
    if (!organizationId) {
      return res.status(400).json({ 
        status: 400, 
        error: 'Organization ID not found in user context' 
      });
    }

    const healthScore = await healthScoreService.calculateHealthScore(customerId, organizationId);
    const insights = await healthScoreService.getHealthScoreInsights(healthScore);
    
    res.status(200).json({
      status: 200,
      data: {
        healthScore,
        insights
      },
      generatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error calculating health score:', error);
    res.status(500).json({ 
      status: 500, 
      error: 'Failed to calculate health score',
      details: error.message 
    });
  }
});

/**
 * Get health scores for all customers in the organization
 * GET /api/v1/insights/health-scores
 */
router.get('/health-scores', authenticateJWT, hasPermission('insights:read'), async (req: Request, res: Response) => {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    
    if (!organizationId) {
      return res.status(400).json({ 
        status: 400, 
        error: 'Organization ID not found in user context' 
      });
    }

    // Get all customers
    const { CustomerModel } = require('../../../schemas/customer.schema');
    const customers = await CustomerModel.find({ organizationId: organizationId });
    
    // Calculate health scores for all customers
    const healthScores = await Promise.all(
      customers.map(async (customer: any) => {
        try {
          const healthScore = await healthScoreService.calculateHealthScore(
            customer._id.toString(), 
            organizationId
          );
          return {
            customerId: customer._id.toString(),
            customerName: customer.name,
            segment: customer.segment,
            contractValue: customer.contractValue,
            healthScore: healthScore.overallScore,
            trend: healthScore.trend,
            lastUpdated: healthScore.lastUpdated
          };
        } catch (error) {
          console.error(`Error calculating health score for customer ${customer._id}:`, error);
          return {
            customerId: customer._id.toString(),
            customerName: customer.name,
            segment: customer.segment,
            contractValue: customer.contractValue,
            healthScore: 50, // Default neutral score
            trend: 'stable' as const,
            lastUpdated: new Date()
          };
        }
      })
    );

    // Sort by health score (lowest first for attention)
    healthScores.sort((a, b) => a.healthScore - b.healthScore);
    
    res.status(200).json({
      status: 200,
      data: {
        customers: healthScores,
        summary: {
          total: healthScores.length,
          healthy: healthScores.filter(c => c.healthScore >= 70).length,
          atRisk: healthScores.filter(c => c.healthScore >= 40 && c.healthScore < 70).length,
          critical: healthScores.filter(c => c.healthScore < 40).length,
          averageScore: Math.round(healthScores.reduce((sum, c) => sum + c.healthScore, 0) / healthScores.length)
        }
      },
      generatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error getting health scores:', error);
    res.status(500).json({ 
      status: 500, 
      error: 'Failed to get health scores',
      details: error.message 
    });
  }
});

/**
 * Get predictive insights for the organization
 * GET /api/v1/insights/predictive
 */
router.get('/predictive', authenticateJWT, hasPermission('insights:read'), async (req: Request, res: Response) => {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    
    if (!organizationId) {
      return res.status(400).json({ 
        status: 400, 
        error: 'Organization ID not found in user context' 
      });
    }

    // Get recent predictions
    const { PredictionModel } = require('../../../schemas/prediction.schema');
    const recentPredictions = await PredictionModel.find({
      organizationId: organizationId,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    }).sort({ createdAt: -1 }).limit(100);

    // Analyze predictions
    const escalationPredictions = recentPredictions.filter(p => 
      p.predictedEscalation?.risk === 'High'
    );
    
    const csatPredictions = recentPredictions.filter(p => 
      p.predictedCSAT?.risk === 'High'
    );
    
    const longResolutionPredictions = recentPredictions.filter(p => 
      p.longResolutionPredicted === true
    );

    const insights = {
      totalPredictions: recentPredictions.length,
      escalationRisk: {
        high: escalationPredictions.length,
        percentage: recentPredictions.length > 0 ? Math.round((escalationPredictions.length / recentPredictions.length) * 100) : 0
      },
      csatRisk: {
        high: csatPredictions.length,
        percentage: recentPredictions.length > 0 ? Math.round((csatPredictions.length / recentPredictions.length) * 100) : 0
      },
      resolutionTime: {
        longResolution: longResolutionPredictions.length,
        percentage: recentPredictions.length > 0 ? Math.round((longResolutionPredictions.length / recentPredictions.length) * 100) : 0
      },
      recentPredictions: recentPredictions.slice(0, 10).map(p => ({
        ticketId: p.ticketId,
        escalationRisk: p.predictedEscalation?.risk,
        csatRisk: p.predictedCSAT?.risk,
        longResolution: p.longResolutionPredicted,
        confidence: p.predictionConfidence,
        createdAt: p.createdAt
      }))
    };
    
    res.status(200).json({
      status: 200,
      data: insights,
      generatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error getting predictive insights:', error);
    res.status(500).json({ 
      status: 500, 
      error: 'Failed to get predictive insights',
      details: error.message 
    });
  }
});

export default router;
