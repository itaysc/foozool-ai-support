import express from 'express';
import { authenticateJWT } from '../../../middleware/authenticate';
import { hasPermission } from '../../../middleware/permissions';
import { UserContextManager } from '../../../context/userContext';
import { getInsightsAnalytics } from '../../../services/customers';
import { CustomerService } from '../../../services/customers';

const router = express.Router();

/**
 * GET /customers/dashboard/insights-analytics
 * Get insights data aggregated by period for customer dashboard analytics
 * Query params:
 * - customerId (optional): Filter insights for a specific customer
 */
router.get('/insights-analytics', authenticateJWT, hasPermission('customers:read'), async (req, res) => {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    const { customerId } = req.query;
    
    if (!organizationId) {
      return res.status(400).json({ 
        status: 400, 
        error: 'Organization ID not found in user context' 
      });
    }

    const analyticsData = await getInsightsAnalytics(organizationId, customerId as string);

    return res.status(200).json({
      status: 200,
      data: analyticsData
    });

  } catch (error: any) {
    console.error('Error fetching insights analytics:', error);
    return res.status(500).json({ 
      status: 500, 
      error: 'Failed to fetch insights analytics',
      details: error.message 
    });
  }
});

/**
 * GET /customers/dashboard/payment-history
 * Get payment history for customer dashboard
 * Query params:
 * - customerId (optional): Filter payments for a specific customer
 */
router.get('/payment-history', authenticateJWT, hasPermission('customers:read'), async (req, res) => {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    const { customerId } = req.query;
    
    if (!organizationId) {
      return res.status(400).json({ 
        status: 400, 
        error: 'Organization ID not found in user context' 
      });
    }

    if (!customerId) {
      return res.status(400).json({ 
        status: 400, 
        error: 'Customer ID is required' 
      });
    }

    // Get customer with payment history
    const customer = await CustomerService.getCustomerById(organizationId, customerId as string);
    
    if (!customer) {
      return res.status(404).json({ 
        status: 404, 
        error: 'Customer not found' 
      });
    }

    const paymentHistory = customer.financialMetrics?.paymentHistory || [];

    // Sort by date (newest first) and limit to recent payments
    const sortedPayments = paymentHistory
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10); // Show last 10 payments

    return res.status(200).json({
      status: 200,
      data: {
        customerName: customer.name,
        paymentHistory: sortedPayments,
        summary: {
          totalPayments: paymentHistory.length,
          recentPayments: sortedPayments.length,
          lastPaymentDate: paymentHistory.length > 0 ? paymentHistory[0].date : null,
          outstandingBalance: customer.financialMetrics?.outstandingBalance || 0,
          averagePaymentDays: customer.financialMetrics?.averagePaymentDays || 0,
          paymentReliability: customer.financialMetrics?.paymentReliability || 'unknown'
        }
      }
    });

  } catch (error: any) {
    console.error('Error fetching payment history:', error);
    return res.status(500).json({ 
      status: 500, 
      error: 'Failed to fetch payment history',
      details: error.message 
    });
  }
});

/**
 * GET /customers/dashboard/activity-analytics
 * Get customer activity data aggregated by period for dashboard analytics
 * Query params:
 * - customerId (required): Get activities for a specific customer
 */
router.get('/activity-analytics', authenticateJWT, hasPermission('customers:read'), async (req, res) => {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    const { customerId } = req.query;
    
    if (!organizationId) {
      return res.status(400).json({ 
        status: 400, 
        error: 'Organization ID not found in user context' 
      });
    }

    if (!customerId) {
      return res.status(400).json({ 
        status: 400, 
        error: 'Customer ID is required' 
      });
    }

    const { getActivityAnalytics } = await import('../../../services/customers/dashboard.service');
    const analyticsData = await getActivityAnalytics(organizationId, customerId as string);

    return res.status(200).json({
      status: 200,
      data: analyticsData
    });

  } catch (error: any) {
    console.error('Error fetching activity analytics:', error);
    return res.status(500).json({ 
      status: 500, 
      error: 'Failed to fetch activity analytics',
      details: error.message 
    });
  }
});

export default router;
