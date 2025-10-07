import { CustomerModel } from '../../schemas/customer.schema';
import { CreateCustomerRequest, UpdateCustomerRequest, ICustomer, CustomerStats } from '../../types/customer';

export interface CustomerQueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filter?: {
    industry?: string;
    companySize?: string;
    segment?: string;
    accountManager?: string;
    healthScore?: {
      min?: number;
      max?: number;
    };
  };
}


    export class CustomerService {
  /**
   * Create a new customer
   */
  static async createCustomer(organizationId: string, customerData: CreateCustomerRequest): Promise<ICustomer> {
    const customer = new CustomerModel({
      ...customerData,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return await customer.save();
  }

  /**
   * Get customers with pagination and filtering
   */
  static async getCustomers(organizationId: string, options: CustomerQueryOptions = {}) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      filter = {}
    } = options;

    const query: any = { organizationId };

    // Apply filters
    if (filter.industry) {
      query.industry = filter.industry;
    }
    if (filter.companySize) {
      query.companySize = filter.companySize;
    }
    if (filter.segment) {
      query.segment = filter.segment;
    }
    if (filter.accountManager) {
      query.accountManager = filter.accountManager;
    }
    if (filter.healthScore?.min !== undefined || filter.healthScore?.max !== undefined) {
      query.healthScore = {};
      if (filter.healthScore.min !== undefined) {
        query.healthScore.$gte = filter.healthScore.min;
      }
      if (filter.healthScore.max !== undefined) {
        query.healthScore.$lte = filter.healthScore.max;
      }
    }

    const skip = (page - 1) * limit;
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [customers, total] = await Promise.all([
      CustomerModel.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      CustomerModel.countDocuments(query)
    ]);

    return {
      customers,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get a customer by ID
   */
  static async getCustomerById(organizationId: string, customerId: string): Promise<ICustomer | null> {
    return await CustomerModel.findOne({
      _id: customerId,
      organizationId
    }).lean();
  }

  /**
   * Update a customer
   */
  static async updateCustomer(organizationId: string, customerId: string, updateData: UpdateCustomerRequest): Promise<ICustomer | null> {
    const customer = await CustomerModel.findOneAndUpdate(
      {
        _id: customerId,
        organizationId
      },
      {
        ...updateData,
        updatedAt: new Date()
      },
      { new: true }
    ).lean();

    return customer;
  }

  /**
   * Delete a customer
   */
  static async deleteCustomer(organizationId: string, customerId: string): Promise<boolean> {
    const result = await CustomerModel.deleteOne({
      _id: customerId,
      organizationId
    });

    return result.deletedCount > 0;
  }

  /**
   * Get customer statistics
   */
  static async getCustomerStats(organizationId: string): Promise<CustomerStats> {
    const pipeline = [
      { $match: { organizationId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          averageHealthScore: { $avg: '$healthScore' },
          industries: { $push: '$industry' },
          sizes: { $push: '$companySize' },
          healthScores: { $push: '$healthScore' }
        }
      }
    ];

    const [result] = await CustomerModel.aggregate(pipeline);
    
    if (!result) {
      return {
        totalCustomers: 0,
        averageHealthScore: 0,
        customersByIndustry: [],
        customersBySize: [],
        healthScoreDistribution: []
      };
    }

    // Count occurrences and convert to arrays
    const industryCounts = result.industries.reduce((acc: Record<string, number>, industry: string) => {
      if (industry) {
        acc[industry] = (acc[industry] || 0) + 1;
      }
      return acc;
    }, {});

    const sizeCounts = result.sizes.reduce((acc: Record<string, number>, size: string) => {
      if (size) {
        acc[size] = (acc[size] || 0) + 1;
      }
      return acc;
    }, {});

    const healthScoreCounts = result.healthScores.reduce((acc: Record<number, number>, score: number) => {
      if (score) {
        acc[score] = (acc[score] || 0) + 1;
      }
      return acc;
    }, {});

    // Convert to arrays and sort by count (descending)
    const customersByIndustry = Object.entries(industryCounts)
      .map(([industry, count]) => ({ industry, count: count as number }))
      .sort((a, b) => b.count - a.count);

    const customersBySize = Object.entries(sizeCounts)
      .map(([size, count]) => ({ size, count: count as number }))
      .sort((a, b) => b.count - a.count);

    const healthScoreDistribution = Object.entries(healthScoreCounts)
      .map(([score, count]) => ({ score: Number(score), count: count as number }))
      .sort((a, b) => a.score - b.score);

    return {
      totalCustomers: result.total,
      averageHealthScore: result.averageHealthScore || 0,
      customersByIndustry,
      customersBySize,
      healthScoreDistribution
    };
  }
}
