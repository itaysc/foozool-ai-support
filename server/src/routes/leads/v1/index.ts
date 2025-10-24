import { Router, Request, Response } from 'express';
import { validateRequest } from '../../../middleware/validateRequest';
import { createLeadSchema } from './validation';
import { LeadService } from '../../../services/leads/lead.service';

const router = Router();
const leadService = new LeadService();

/**
 * POST /lead - Create a new lead
 */
router.post('/lead', validateRequest(createLeadSchema), async (req: Request, res: Response) => {
  try {
    const leadData = req.body;
    const lead = await leadService.createLead(leadData);

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: {
        id: lead._id,
        name: lead.name,
        email: lead.email,
        company: lead.company,
        message: lead.message,
        status: lead.status,
        source: lead.source,
        createdAt: lead.createdAt
      }
    });
  } catch (error: any) {
    console.error('Error in createLead route:', error);
    
    if (error.message === 'Lead with this email already exists') {
      return res.status(409).json({
        success: false,
        message: 'A lead with this email already exists',
        error: 'DUPLICATE_EMAIL'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create lead',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

/**
 * GET /leads - Get all leads with pagination and filtering
 */
router.get('/leads', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;

    const result = await leadService.getLeads(page, limit, status);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in getLeads route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leads',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

/**
 * GET /leads/stats - Get lead statistics
 */
router.get('/leads/stats', async (req: Request, res: Response) => {
  try {
    const stats = await leadService.getLeadStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error in getLeadStats route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lead statistics',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

/**
 * GET /leads/:id - Get lead by ID
 */
router.get('/leads/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const lead = await leadService.getLeadById(id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
        error: 'LEAD_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    console.error('Error in getLeadById route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lead',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

/**
 * PATCH /leads/:id/status - Update lead status
 */
router.patch('/leads/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
        error: 'MISSING_STATUS'
      });
    }

    const lead = await leadService.updateLeadStatus(id, status);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
        error: 'LEAD_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'Lead status updated successfully',
      data: lead
    });
  } catch (error: any) {
    console.error('Error in updateLeadStatus route:', error);
    
    if (error.message === 'Invalid status') {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
        error: 'INVALID_STATUS'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update lead status',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

export default router;
