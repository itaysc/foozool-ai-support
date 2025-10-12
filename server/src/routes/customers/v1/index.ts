import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../../../middleware/authenticate';
import { validateRequest } from '../../../middleware/validateRequest';
import { hasPermission } from '../../../middleware/permissions';
import { UserContextManager } from '../../../context/userContext';
import { CustomerService } from '../../../services/customers';
import {
  createCustomerSchema,
  updateCustomerSchema,
  getCustomersQuerySchema,
} from './validations';
import stakeholderRoutes from './stakeholders';

const router = Router();


/**
 * POST /api/v1/customers
 * Create a new customer
 */
router.post('/', authenticateJWT, hasPermission('customers:create'), validateRequest(createCustomerSchema), async (req: Request, res: Response) => {
  try {
    const currentOrgId = UserContextManager.getCurrentOrganizationId();
    if (!currentOrgId) {
      return res.status(400).json({
        status: 400,
        error: 'Organization ID not found in user context',
      });
    }

    const customer = await CustomerService.createCustomer(currentOrgId, req.body);
    
    res.status(201).json({
      status: 201,
      payload: customer,
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({
      status: 500,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/v1/customers
 * Get all customers with pagination and filtering
 */
router.get('/', authenticateJWT, hasPermission('customers:read'), async (req: Request, res: Response) => {
  try {
    const currentOrgId = UserContextManager.getCurrentOrganizationId();
    if (!currentOrgId) {
      return res.status(400).json({
        status: 400,
        error: 'Organization ID not found in user context',
      });
    }

    // Validate query parameters
    const queryValidation = getCustomersQuerySchema.safeParse(req.query);
    if (!queryValidation.success) {
      return res.status(400).json({
        status: 400,
        error: 'Invalid query parameters',
        details: queryValidation.error.issues,
      });
    }

    const validatedQuery = queryValidation.data;
    const options = {
      page: validatedQuery.page || 1,
      limit: validatedQuery.limit || 10,
      sortBy: validatedQuery.sortBy || 'createdAt',
      sortOrder: validatedQuery.sortOrder || 'desc',
      filter: {
        industry: validatedQuery.industry,
        companySize: validatedQuery.companySize,
        segment: validatedQuery.segment,
        accountManager: validatedQuery.accountManager,
        healthScore: {
          min: validatedQuery.healthScoreMin,
          max: validatedQuery.healthScoreMax,
        },
      },
    };

    const result = await CustomerService.getCustomers(currentOrgId, options);
    
    res.status(200).json({
      status: 200,
      payload: result,
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      status: 500,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/v1/customers/stats
 * Get customer statistics
 */
router.get('/stats', authenticateJWT, hasPermission('customers:read'), async (req: Request, res: Response) => {
  try {
    const currentOrgId = UserContextManager.getCurrentOrganizationId();
    if (!currentOrgId) {
      return res.status(400).json({
        status: 400,
        error: 'Organization ID not found in user context',
      });
    }

    const stats = await CustomerService.getCustomerStats(currentOrgId);
    
    res.status(200).json({
      status: 200,
      payload: stats,
    });
  } catch (error) {
    console.error('Error fetching customer stats:', error);
    res.status(500).json({
      status: 500,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/v1/customers/:customerId/dashboard
 * Get customer dashboard data including insights charts
 */
router.get('/:customerId/dashboard', authenticateJWT, hasPermission('customers:read'), async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const currentOrgId = UserContextManager.getCurrentOrganizationId();
    
    if (!currentOrgId) {
      return res.status(400).json({
        status: 400,
        error: 'Organization ID not found in user context',
      });
    }

    const dashboardData = await CustomerService.getCustomerDashboardData(currentOrgId, customerId);
    if (!dashboardData) {
      return res.status(404).json({
        status: 404,
        error: 'Customer not found',
      });
    }

    res.status(200).json({
      status: 200,
      payload: dashboardData,
    });
  } catch (error) {
    console.error('Error fetching customer dashboard data:', error);
    res.status(500).json({
      status: 500,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/v1/customers/:customerId
 * Get a specific customer by ID
 */
router.get('/:customerId', authenticateJWT, hasPermission('customers:read'), async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const currentOrgId = UserContextManager.getCurrentOrganizationId();
    
    if (!currentOrgId) {
      return res.status(400).json({
        status: 400,
        error: 'Organization ID not found in user context',
      });
    }

    const customer = await CustomerService.getCustomerById(currentOrgId, customerId);
    if (!customer) {
      return res.status(404).json({
        status: 404,
        error: 'Customer not found',
      });
    }

    res.status(200).json({
      status: 200,
      payload: customer,
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      status: 500,
      error: 'Internal server error',
    });
  }
});

/**
 * PUT /api/v1/customers/:customerId
 * Update a customer
 */
router.put('/:customerId', authenticateJWT, hasPermission('customers:update'), validateRequest(updateCustomerSchema), async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const currentOrgId = UserContextManager.getCurrentOrganizationId();
    
    if (!currentOrgId) {
      return res.status(400).json({
        status: 400,
        error: 'Organization ID not found in user context',
      });
    }

    const customer = await CustomerService.updateCustomer(currentOrgId, customerId, req.body);
    if (!customer) {
      return res.status(404).json({
        status: 404,
        error: 'Customer not found',
      });
    }

    res.status(200).json({
      status: 200,
      payload: customer,
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({
      status: 500,
      error: 'Internal server error',
    });
  }
});

/**
 * DELETE /api/v1/customers/:customerId
 * Delete a customer
 */
router.delete('/:customerId', authenticateJWT, hasPermission('customers:delete'), async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const currentOrgId = UserContextManager.getCurrentOrganizationId();
    
    if (!currentOrgId) {
      return res.status(400).json({
        status: 400,
        error: 'Organization ID not found in user context',
      });
    }

    const deleted = await CustomerService.deleteCustomer(currentOrgId, customerId);
    if (!deleted) {
      return res.status(404).json({
        status: 404,
        error: 'Customer not found',
      });
    }

    res.status(200).json({
      status: 200,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({
      status: 500,
      error: 'Internal server error',
    });
  }
});

// Mount stakeholder routes
router.use('/', stakeholderRoutes);

export default router;
