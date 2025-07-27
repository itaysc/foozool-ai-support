import express, { Request, Response } from 'express';
import { authenticateJWT } from '../../../middleware/authenticate';
import { WebhookService } from '../../../services/webhook';
import { validateRequest } from '../../../middleware/validateRequest';
import { createWebhookSchema, updateWebhookSchema } from './validations';

const router = express.Router();

/**
 * @route GET /api/v1/webhooks
 * @desc Get all webhooks for organization
 * @access Private
 */
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organization?.toString();
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization not found' });
    }

    const webhooks = await WebhookService.getWebhooksByOrganization(organizationId);
    res.json({ success: true, data: webhooks });
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    res.status(500).json({ 
      error: 'Failed to fetch webhooks', 
      message: (error as Error).message 
    });
  }
});

/**
 * @route GET /api/v1/webhooks/:id
 * @desc Get webhook by ID
 * @access Private
 */
router.get('/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const webhook = await WebhookService.getWebhookById(id);
    
    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    // Check if webhook belongs to user's organization
    const organizationId = req.user?.organization?.toString();
    if (webhook.organization.toString() !== organizationId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ success: true, data: webhook });
  } catch (error) {
    console.error('Error fetching webhook:', error);
    res.status(500).json({ 
      error: 'Failed to fetch webhook', 
      message: (error as Error).message 
    });
  }
});

/**
 * @route POST /api/v1/webhooks
 * @desc Create a new webhook
 * @access Private
 */
router.post('/', 
  authenticateJWT, 
  validateRequest(createWebhookSchema), 
  async (req: Request, res: Response) => {
    try {
      const organizationId = req.user?.organization?.toString();
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization not found' });
      }

      const webhookData = {
        ...req.body,
        organizationId
      };

      const webhook = await WebhookService.createWebhook(webhookData);
      res.status(201).json({ success: true, data: webhook });
    } catch (error) {
      console.error('Error creating webhook:', error);
      res.status(500).json({ 
        error: 'Failed to create webhook', 
        message: (error as Error).message 
      });
    }
  }
);

/**
 * @route PUT /api/v1/webhooks/:id
 * @desc Update a webhook
 * @access Private
 */
router.put('/:id', 
  authenticateJWT, 
  validateRequest(updateWebhookSchema), 
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const organizationId = req.user?.organization?.toString();
      
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization not found' });
      }

      // Check if webhook exists and belongs to organization
      const existingWebhook = await WebhookService.getWebhookById(id);
      if (!existingWebhook) {
        return res.status(404).json({ error: 'Webhook not found' });
      }

      if (existingWebhook.organization.toString() !== organizationId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const webhook = await WebhookService.updateWebhook(id, req.body);
      res.json({ success: true, data: webhook });
    } catch (error) {
      console.error('Error updating webhook:', error);
      res.status(500).json({ 
        error: 'Failed to update webhook', 
        message: (error as Error).message 
      });
    }
  }
);

/**
 * @route DELETE /api/v1/webhooks/:id
 * @desc Delete a webhook
 * @access Private
 */
router.delete('/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organization?.toString();
    
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization not found' });
    }

    // Check if webhook exists and belongs to organization
    const existingWebhook = await WebhookService.getWebhookById(id);
    if (!existingWebhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    if (existingWebhook.organization.toString() !== organizationId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const deleted = await WebhookService.deleteWebhook(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    res.json({ success: true, message: 'Webhook deleted successfully' });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    res.status(500).json({ 
      error: 'Failed to delete webhook', 
      message: (error as Error).message 
    });
  }
});

/**
 * @route POST /api/v1/webhooks/:id/test
 * @desc Test webhook connectivity
 * @access Private
 */
router.post('/:id/test', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organization?.toString();
    
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization not found' });
    }

    // Check if webhook exists and belongs to organization
    const existingWebhook = await WebhookService.getWebhookById(id);
    if (!existingWebhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    if (existingWebhook.organization.toString() !== organizationId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await WebhookService.testWebhook(id);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error testing webhook:', error);
    res.status(500).json({ 
      error: 'Failed to test webhook', 
      message: (error as Error).message 
    });
  }
});

export default router; 