import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../../middleware/authenticate';
import { validateRequest } from '../../middleware/validateRequest';
import { UserContextManager } from '../../context/userContext';
import actionItemsService from '../../services/actionItems/actionItems.service';
import {
  actionItemIdParamSchema,
  customerIdParamSchema,
  insightIdParamSchema,
  actionItemsQuerySchema,
  createActionItemSchema,
  updateActionItemSchema,
  updateStatusSchema,
  updateAssigneeSchema,
  updatePrioritySchema,
} from './validations';

const router = Router();

/**
 * GET /api/action-items
 * Get all action items with filters
 */
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) {
      return res.status(400).json({
        status: 400,
        error: 'Organization ID not found in user context',
      });
    }

    // Validate query parameters
    const queryValidation = actionItemsQuerySchema.safeParse(req.query);
    if (!queryValidation.success) {
      return res.status(400).json({
        status: 400,
        error: 'Invalid query parameters',
        details: queryValidation.error.issues,
      });
    }

    const result = await actionItemsService.getAllActionItems({
      ...queryValidation.data,
      organizationId,
    });

    res.status(200).json({
      status: 200,
      ...result,
    });
  } catch (error: any) {
    console.error('Error fetching action items:', error);
    res.status(500).json({
      status: 500,
      error: error?.message || 'Internal server error',
    });
  }
});

/**
 * GET /api/action-items/customer/:customerId
 * Get action items by customer
 */
router.get('/customer/:customerId', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) {
      return res.status(400).json({
        status: 400,
        error: 'Organization ID not found in user context',
      });
    }

    // Validate params
    const paramValidation = customerIdParamSchema.safeParse(req.params.customerId);
    if (!paramValidation.success) {
      return res.status(400).json({
        status: 400,
        error: 'Invalid customer ID',
        details: paramValidation.error.issues,
      });
    }

    // Validate query parameters
    const queryValidation = actionItemsQuerySchema.safeParse(req.query);
    const filters = queryValidation.success ? queryValidation.data : {};

    const result = await actionItemsService.getActionItemsByCustomer(
      paramValidation.data,
      organizationId,
      { ...filters, organizationId }
    );

    res.status(200).json({
      status: 200,
      ...result,
    });
  } catch (error: any) {
    console.error('Error fetching action items by customer:', error);
    res.status(500).json({
      status: 500,
      error: error?.message || 'Internal server error',
    });
  }
});

/**
 * GET /api/action-items/insight/:insightId
 * Get action items by insight
 */
router.get('/insight/:insightId', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) {
      return res.status(400).json({
        status: 400,
        error: 'Organization ID not found in user context',
      });
    }

    // Validate params
    const paramValidation = insightIdParamSchema.safeParse(req.params.insightId);
    if (!paramValidation.success) {
      return res.status(400).json({
        status: 400,
        error: 'Invalid insight ID',
        details: paramValidation.error.issues,
      });
    }

    const result = await actionItemsService.getActionItemsByInsight(
      paramValidation.data,
      organizationId
    );

    res.status(200).json({
      status: 200,
      ...result,
    });
  } catch (error: any) {
    console.error('Error fetching action items by insight:', error);
    res.status(500).json({
      status: 500,
      error: error?.message || 'Internal server error',
    });
  }
});

/**
 * GET /api/action-items/:actionItemId
 * Get single action item by ID
 */
router.get('/:actionItemId', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) {
      return res.status(400).json({
        status: 400,
        error: 'Organization ID not found in user context',
      });
    }

    // Validate params
    const paramValidation = actionItemIdParamSchema.safeParse(req.params.actionItemId);
    if (!paramValidation.success) {
      return res.status(400).json({
        status: 400,
        error: 'Invalid action item ID',
        details: paramValidation.error.issues,
      });
    }

    const actionItem = await actionItemsService.getActionItemById(
      paramValidation.data,
      organizationId
    );

    res.status(200).json({
      status: 200,
      data: actionItem,
    });
  } catch (error: any) {
    console.error('Error fetching action item:', error);
    res.status(404).json({
      status: 404,
      error: error?.message || 'Action item not found',
    });
  }
});

/**
 * POST /api/action-items
 * Create new action item
 */
router.post('/', authenticateJWT, validateRequest(createActionItemSchema), async (req: Request, res: Response) => {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) {
      return res.status(400).json({
        status: 400,
        error: 'Organization ID not found in user context',
      });
    }

    const userId = UserContextManager.getCurrentUserId();

    const actionItem = await actionItemsService.createActionItem(
      req.body,
      organizationId,
      userId || undefined
    );

    res.status(201).json({
      status: 201,
      data: actionItem,
    });
  } catch (error: any) {
    console.error('Error creating action item:', error);
    res.status(500).json({
      status: 500,
      error: error?.message || 'Internal server error',
    });
  }
});

/**
 * PUT /api/action-items/:actionItemId
 * Update action item
 */
router.put('/:actionItemId', authenticateJWT, validateRequest(updateActionItemSchema), async (req: Request, res: Response) => {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) {
      return res.status(400).json({
        status: 400,
        error: 'Organization ID not found in user context',
      });
    }

    // Validate params
    const paramValidation = actionItemIdParamSchema.safeParse(req.params.actionItemId);
    if (!paramValidation.success) {
      return res.status(400).json({
        status: 400,
        error: 'Invalid action item ID',
        details: paramValidation.error.issues,
      });
    }

    const actionItem = await actionItemsService.updateActionItem(
      paramValidation.data,
      organizationId,
      req.body
    );

    res.status(200).json({
      status: 200,
      data: actionItem,
    });
  } catch (error: any) {
    console.error('Error updating action item:', error);
    res.status(404).json({
      status: 404,
      error: error?.message || 'Action item not found',
    });
  }
});

/**
 * PATCH /api/action-items/:actionItemId/status
 * Update action item status
 */
router.patch('/:actionItemId/status', authenticateJWT, validateRequest(updateStatusSchema), async (req: Request, res: Response) => {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) {
      return res.status(400).json({
        status: 400,
        error: 'Organization ID not found in user context',
      });
    }

    // Validate params
    const paramValidation = actionItemIdParamSchema.safeParse(req.params.actionItemId);
    if (!paramValidation.success) {
      return res.status(400).json({
        status: 400,
        error: 'Invalid action item ID',
        details: paramValidation.error.issues,
      });
    }

    const actionItem = await actionItemsService.updateStatus(
      paramValidation.data,
      organizationId,
      req.body.status
    );

    res.status(200).json({
      status: 200,
      data: actionItem,
    });
  } catch (error: any) {
    console.error('Error updating action item status:', error);
    res.status(404).json({
      status: 404,
      error: error?.message || 'Action item not found',
    });
  }
});

/**
 * PATCH /api/action-items/:actionItemId/assignee
 * Update action item assignee
 */
router.patch('/:actionItemId/assignee', authenticateJWT, validateRequest(updateAssigneeSchema), async (req: Request, res: Response) => {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) {
      return res.status(400).json({
        status: 400,
        error: 'Organization ID not found in user context',
      });
    }

    // Validate params
    const paramValidation = actionItemIdParamSchema.safeParse(req.params.actionItemId);
    if (!paramValidation.success) {
      return res.status(400).json({
        status: 400,
        error: 'Invalid action item ID',
        details: paramValidation.error.issues,
      });
    }

    const actionItem = await actionItemsService.updateAssignee(
      paramValidation.data,
      organizationId,
      req.body.assignee ?? null
    );

    res.status(200).json({
      status: 200,
      data: actionItem,
    });
  } catch (error: any) {
    console.error('Error updating action item assignee:', error);
    res.status(404).json({
      status: 404,
      error: error?.message || 'Action item not found',
    });
  }
});

/**
 * PATCH /api/action-items/:actionItemId/priority
 * Update action item priority
 */
router.patch('/:actionItemId/priority', authenticateJWT, validateRequest(updatePrioritySchema), async (req: Request, res: Response) => {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) {
      return res.status(400).json({
        status: 400,
        error: 'Organization ID not found in user context',
      });
    }

    // Validate params
    const paramValidation = actionItemIdParamSchema.safeParse(req.params.actionItemId);
    if (!paramValidation.success) {
      return res.status(400).json({
        status: 400,
        error: 'Invalid action item ID',
        details: paramValidation.error.issues,
      });
    }

    const actionItem = await actionItemsService.updatePriority(
      paramValidation.data,
      organizationId,
      req.body.priority
    );

    res.status(200).json({
      status: 200,
      data: actionItem,
    });
  } catch (error: any) {
    console.error('Error updating action item priority:', error);
    res.status(404).json({
      status: 404,
      error: error?.message || 'Action item not found',
    });
  }
});

/**
 * DELETE /api/action-items/:actionItemId
 * Delete action item
 */
router.delete('/:actionItemId', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) {
      return res.status(400).json({
        status: 400,
        error: 'Organization ID not found in user context',
      });
    }

    // Validate params
    const paramValidation = actionItemIdParamSchema.safeParse(req.params.actionItemId);
    if (!paramValidation.success) {
      return res.status(400).json({
        status: 400,
        error: 'Invalid action item ID',
        details: paramValidation.error.issues,
      });
    }

    await actionItemsService.deleteActionItem(
      paramValidation.data,
      organizationId
    );

    res.status(200).json({
      status: 200,
      message: 'Action item deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting action item:', error);
    res.status(404).json({
      status: 404,
      error: error?.message || 'Action item not found',
    });
  }
});

/**
 * POST /api/action-items/:actionItemId/complete
 * Complete action item
 */
router.post('/:actionItemId/complete', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) {
      return res.status(400).json({
        status: 400,
        error: 'Organization ID not found in user context',
      });
    }

    // Validate params
    const paramValidation = actionItemIdParamSchema.safeParse(req.params.actionItemId);
    if (!paramValidation.success) {
      return res.status(400).json({
        status: 400,
        error: 'Invalid action item ID',
        details: paramValidation.error.issues,
      });
    }

    const actionItem = await actionItemsService.completeActionItem(
      paramValidation.data,
      organizationId
    );

    res.status(200).json({
      status: 200,
      data: actionItem,
    });
  } catch (error: any) {
    console.error('Error completing action item:', error);
    res.status(404).json({
      status: 404,
      error: error?.message || 'Action item not found',
    });
  }
});

export default router;
