import express from 'express';
import { authenticateJWT } from '../../../middleware/authenticate';
import { UserContextManager } from '../../../context/userContext';
import { generateInsightsJob } from '../../../jobs/insights-generator.job';
import { generateCustomerInsightsJob, migratePredictionsToInsightsJob } from '../../../jobs/customer-insights-generator.job';
import { createTicket } from '../../../services/faker/create-ticket';
import { hasPermission } from '../../../middleware/permissions';

const router = express.Router();

// Available jobs registry with their execution functions
const availableJobs = {
  'insights-generation': {
    name: 'AI Insights Generation',
    description: 'Generates AI-powered insights from recent support tickets',
    requiresOrganization: true,
    execute: async (organizationId?: string, userId?: string) => {
      if (organizationId) {
        // Run insights generation for specific organization
        await generateInsightsJob(organizationId, userId);
        return { message: 'Insights generation completed successfully', organizationId };
      } else {
        // Run for all organizations
        await generateInsightsJob(undefined, userId);
        return { message: 'Insights generation completed for all organizations' };
      }
    }
  },
  'create-ticket': {
    name: 'Create Demo Ticket',
    description: 'Creates a demo support ticket for testing purposes',
    requiresOrganization: false,
    execute: async (organizationId?: string, userId?: string) => {
      const ticket = await createTicket();
      return { 
        message: 'Demo ticket created successfully', 
        ticketId: ticket.ticket.external_id,
        organizationId 
      };
    }
  },
  'customer-insights-generate': {
    name: 'Generate Comprehensive Customer Insights (by customer)',
    description: 'Generates all types of customer insights including Customer Success, Health Score Risk, and Prediction insights for a specific customer',
    requiresOrganization: true,
    execute: async (organizationId?: string, userId?: string, params?: { customerId?: string }) => {
      if (!organizationId) {
        throw new Error('organizationId is required');
      }
      if (!params?.customerId) {
        throw new Error('customerId is required');
      }
      
      const result = await generateCustomerInsightsJob(organizationId, params.customerId, userId);
      return result;
    }
  },
  'customer-insights-generate-all': {
    name: 'Generate Comprehensive Customer Insights (all customers)',
    description: 'Generates all types of customer insights including Customer Success, Health Score Risk, and Prediction insights for all customers in the organization',
    requiresOrganization: true,
    execute: async (organizationId?: string, userId?: string) => {
      if (!organizationId) {
        throw new Error('organizationId is required');
      }
      
      const result = await generateCustomerInsightsJob(organizationId, undefined, userId);
      return result;
    }
  },
  'migrate-predictions-to-insights': {
    name: 'Migrate Predictions to Insights',
    description: 'Migrates existing predictions from the predictions collection to the insights collection',
    requiresOrganization: true,
    execute: async (organizationId?: string, userId?: string) => {
      if (!organizationId) {
        throw new Error('organizationId is required');
      }
      
      const result = await migratePredictionsToInsightsJob(organizationId, userId);
      return result;
    }
  }
};

/**
 * GET /jobs
 * List all available jobs
 */
router.get('/jobs', authenticateJWT, hasPermission('jobs:trigger'), async (req, res) => {
  try {
    const jobsList = Object.entries(availableJobs).map(([key, job]) => ({
      id: key,
      name: job.name,
      description: job.description,
      requiresOrganization: job.requiresOrganization
    }));

    res.status(200).json({
      success: true,
      data: jobsList,
      count: jobsList.length
    });
  } catch (error) {
    console.error('Error listing jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Error listing available jobs',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

/**
 * POST /jobs/run/:jobId
 * Execute a specific job by ID for the authenticated user's organization
 */
router.post('/jobs/run/:jobId', authenticateJWT, hasPermission('jobs:trigger'), async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Get user context from the middleware
    const userId = UserContextManager.getCurrentUserId();
    const organizationId = UserContextManager.getCurrentOrganizationId();
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User context not available',
        error: 'UNAUTHORIZED'
      });
    }

    // Check if job exists (jobId is the same as jobName in our registry)
    const job = availableJobs[jobId];
    if (!job) {
      return res.status(404).json({
        success: false,
        message: `Job with ID '${jobId}' not found`,
        error: 'JOB_NOT_FOUND',
        availableJobs: Object.keys(availableJobs)
      });
    }

    // Check if job requires organization and user has one
    if (job.requiresOrganization && !organizationId) {
      return res.status(400).json({
        success: false,
        message: `Job '${jobId}' requires an organization context`,
        error: 'ORGANIZATION_REQUIRED'
      });
    }

    console.log(`🚀 Running job ID '${jobId}' for user ${userId}, organization: ${organizationId || 'N/A'}`);

    // Execute the job
    const startTime = Date.now();
    const result = await job.execute(organizationId, userId, req.body);
    const executionTime = Date.now() - startTime;

    console.log(`✅ Job ID '${jobId}' completed in ${executionTime}ms`);

    res.status(200).json({
      success: true,
      message: `Job '${job.name}' executed successfully`,
      data: {
        jobId,
        jobName: job.name,
        executionTimeMs: executionTime,
        userId,
        organizationId,
        result
      }
    });

  } catch (error) {
    console.error(`❌ Error executing job ID '${req.params.jobId}':`, error);
    
    res.status(500).json({
      success: false,
      message: `Error executing job ID '${req.params.jobId}'`,
      error: 'JOB_EXECUTION_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /jobs/:jobName/run
 * Execute a specific job by name for the authenticated user's organization
 */
router.post('/jobs/:jobName/run', authenticateJWT, hasPermission('jobs:trigger'), async (req, res) => {
  try {
    const { jobName } = req.params;
    
    // Get user context from the middleware
    const userId = UserContextManager.getCurrentUserId();
    const organizationId = UserContextManager.getCurrentOrganizationId();
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User context not available',
        error: 'UNAUTHORIZED'
      });
    }

    // Check if job exists
    const job = availableJobs[jobName];
    if (!job) {
      return res.status(404).json({
        success: false,
        message: `Job '${jobName}' not found`,
        error: 'JOB_NOT_FOUND',
        availableJobs: Object.keys(availableJobs)
      });
    }

    // Check if job requires organization and user has one
    if (job.requiresOrganization && !organizationId) {
      return res.status(400).json({
        success: false,
        message: `Job '${jobName}' requires an organization context`,
        error: 'ORGANIZATION_REQUIRED'
      });
    }

    console.log(`🚀 Running job '${jobName}' for user ${userId}, organization: ${organizationId || 'N/A'}`);

    // Execute the job
    const startTime = Date.now();
    const result = await job.execute(organizationId, userId, req.body);
    const executionTime = Date.now() - startTime;

    console.log(`✅ Job '${jobName}' completed in ${executionTime}ms`);

    res.status(200).json({
      success: true,
      message: `Job '${jobName}' executed successfully`,
      data: {
        jobName,
        jobDisplayName: job.name,
        executionTimeMs: executionTime,
        userId,
        organizationId,
        result
      }
    });

  } catch (error) {
    console.error(`❌ Error executing job '${req.params.jobName}':`, error);
    
    res.status(500).json({
      success: false,
      message: `Error executing job '${req.params.jobName}'`,
      error: 'JOB_EXECUTION_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /jobs/:jobName
 * Get information about a specific job
 */
router.get('/jobs/:jobName', authenticateJWT, hasPermission('jobs:trigger'), async (req, res) => {
  try {
    const { jobName } = req.params;
    
    const job = availableJobs[jobName];
    if (!job) {
      return res.status(404).json({
        success: false,
        message: `Job '${jobName}' not found`,
        error: 'JOB_NOT_FOUND',
        availableJobs: Object.keys(availableJobs)
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: jobName,
        name: job.name,
        description: job.description,
        requiresOrganization: job.requiresOrganization
      }
    });
  } catch (error) {
    console.error('Error getting job info:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting job information',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

export default router;