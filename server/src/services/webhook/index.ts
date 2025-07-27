import { WebhookModel, IWebhook } from '../../schemas/webhook.schema';
import { Types } from 'mongoose';
import crypto from 'crypto';
import axios from 'axios';
import { IResponse } from '../../types';
import { IWebhookPayload, ICreateWebhookRequest, IUpdateWebhookRequest, IWebhookTestResult } from '../../types/webhook';

export class WebhookService {
  /**
   * Create a new webhook
   */
  static async createWebhook(request: ICreateWebhookRequest): Promise<IWebhook> {
    try {
      // Generate a secret for webhook signature verification
      const secret = crypto.randomBytes(32).toString('hex');
      
      const webhook = new WebhookModel({
        organization: new Types.ObjectId(request.organizationId),
        name: request.name,
        description: request.description,
        url: request.url,
        secret,
        events: request.events,
        isActive: request.isActive ?? true,
        maxRetries: request.maxRetries ?? 3,
        timeout: request.timeout ?? 10000,
        headers: request.headers || {}
      });

      const savedWebhook = await webhook.save();
      return savedWebhook.toObject() as IWebhook;
    } catch (error) {
      console.error('Error creating webhook:', error);
      throw new Error('Failed to create webhook');
    }
  }

  /**
   * Get all webhooks for an organization
   */
  static async getWebhooksByOrganization(organizationId: string): Promise<IWebhook[]> {
    try {
      const webhooks = await WebhookModel.find({
        organization: new Types.ObjectId(organizationId)
      }).sort({ createdAt: -1 }).lean();
      
      return webhooks as IWebhook[];
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      throw new Error('Failed to fetch webhooks');
    }
  }

  /**
   * Get a webhook by ID
   */
  static async getWebhookById(webhookId: string): Promise<IWebhook | null> {
    try {
      const webhook = await WebhookModel.findById(webhookId).lean();
      return webhook as IWebhook | null;
    } catch (error) {
      console.error('Error fetching webhook:', error);
      throw new Error('Failed to fetch webhook');
    }
  }

  /**
   * Update a webhook
   */
  static async updateWebhook(webhookId: string, updates: IUpdateWebhookRequest): Promise<IWebhook | null> {
    try {
      const webhook = await WebhookModel.findByIdAndUpdate(
        webhookId,
        { $set: updates },
        { new: true }
      ).lean();
      
      return webhook as IWebhook | null;
    } catch (error) {
      console.error('Error updating webhook:', error);
      throw new Error('Failed to update webhook');
    }
  }

  /**
   * Delete a webhook
   */
  static async deleteWebhook(webhookId: string): Promise<boolean> {
    try {
      const result = await WebhookModel.findByIdAndDelete(webhookId);
      return !!result;
    } catch (error) {
      console.error('Error deleting webhook:', error);
      throw new Error('Failed to delete webhook');
    }
  }

  /**
   * Get active webhooks for an organization and specific event
   */
  static async getActiveWebhooksForEvent(organizationId: string, event: string): Promise<IWebhook[]> {
    try {
      const webhooks = await WebhookModel.find({
        organization: new Types.ObjectId(organizationId),
        isActive: true,
        events: event
      }).lean();
      
      return webhooks as IWebhook[];
    } catch (error) {
      console.error('Error fetching active webhooks for event:', error);
      throw new Error('Failed to fetch active webhooks');
    }
  }

  /**
   * Fire webhooks for a specific event
   */
  static async fireWebhooks(organizationId: string, event: string, payload: any): Promise<void> {
    try {
      // Get active webhooks for this organization and event
      const webhooks = await this.getActiveWebhooksForEvent(organizationId, event);
      
      if (webhooks.length === 0) {
        console.log(`No active webhooks found for organization ${organizationId} and event ${event}`);
        return;
      }

      console.log(`Firing ${webhooks.length} webhooks for event ${event} in organization ${organizationId}`);

      // Fire webhooks in parallel
      const webhookPromises = webhooks.map(webhook => 
        this.fireSingleWebhook(webhook, event, payload)
      );

      await Promise.allSettled(webhookPromises);
    } catch (error) {
      console.error('Error firing webhooks:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Fire a single webhook
   */
  private static async fireSingleWebhook(webhook: IWebhook, event: string, payload: any): Promise<void> {
    try {
      // Create webhook payload
      const webhookPayload: IWebhookPayload = {
        event,
        timestamp: new Date().toISOString(),
        data: payload,
        organizationId: webhook.organization.toString()
      };

      // Generate signature
      const signature = this.generateSignature(webhookPayload, webhook.secret);

      // Prepare headers
      const headers = {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': event,
        'X-Webhook-Timestamp': webhookPayload.timestamp,
        ...webhook.headers
      };

      // Update last triggered timestamp
      await WebhookModel.findByIdAndUpdate(webhook._id, {
        lastTriggered: new Date()
      });

      // Send webhook
      const response = await axios.post(webhook.url, webhookPayload, {
        headers,
        timeout: webhook.timeout
      });

      // Update success timestamp
      await WebhookModel.findByIdAndUpdate(webhook._id, {
        lastSuccess: new Date(),
        retryCount: 0
      });

      console.log(`Webhook ${webhook.name} fired successfully for event ${event}`);
    } catch (error) {
      console.error(`Failed to fire webhook ${webhook.name} for event ${event}:`, error);
      
      // Update failure timestamp and count
      await WebhookModel.findByIdAndUpdate(webhook._id, {
        lastFailure: new Date(),
        failureCount: webhook.failureCount + 1
      });

      // Retry logic
      if (webhook.retryCount < webhook.maxRetries) {
        console.log(`Retrying webhook ${webhook.name} (attempt ${webhook.retryCount + 1}/${webhook.maxRetries})`);
        
        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, webhook.retryCount) * 1000;
        setTimeout(() => {
          this.fireSingleWebhook(webhook, event, payload);
        }, delay);

        // Update retry count
        await WebhookModel.findByIdAndUpdate(webhook._id, {
          retryCount: webhook.retryCount + 1
        });
      } else {
        console.error(`Webhook ${webhook.name} failed after ${webhook.maxRetries} retries`);
      }
    }
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  private static generateSignature(payload: IWebhookPayload, secret: string): string {
    const payloadString = JSON.stringify(payload);
    return crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');
  }

  /**
   * Verify webhook signature
   */
  static verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Test webhook connectivity
   */
  static async testWebhook(webhookId: string): Promise<IWebhookTestResult> {
    try {
      const webhook = await this.getWebhookById(webhookId);
      if (!webhook) {
        return { success: false, message: 'Webhook not found' };
      }

      const testPayload: IWebhookPayload = {
        event: 'test',
        timestamp: new Date().toISOString(),
        data: { message: 'This is a test webhook' },
        organizationId: webhook.organization.toString()
      };

      const signature = this.generateSignature(testPayload, webhook.secret);
      const headers = {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': 'test',
        'X-Webhook-Timestamp': testPayload.timestamp,
        ...webhook.headers
      };

      const response = await axios.post(webhook.url, testPayload, {
        headers,
        timeout: webhook.timeout
      });

      return { 
        success: true, 
        message: `Webhook test successful. Status: ${response.status}` 
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Webhook test failed: ${(error as Error).message}` 
      };
    }
  }
} 