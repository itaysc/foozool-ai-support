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
   * Get customer dashboard data including insights
   */
  static async getCustomerDashboardData(organizationId: string, customerId: string): Promise<any> {
    // Get customer data
    const customer = await CustomerModel.findOne({
      _id: customerId,
      organizationId
    }).lean();

    if (!customer) {
      return null;
    }

    // Fetch insights for this customer
    let insights: any[] = [];
    try {
      const insightsResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/api/v1/insights/customer-success/${customerId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json();
        insights = insightsData.payload?.allInsights || [];
      }
    } catch (insightsError) {
      console.warn('Error fetching insights for dashboard:', insightsError);
    }

    // Generate chart data
    const insightsChartData = this.generateInsightsChartData(insights);
    const insightsStatusChartData = this.generateInsightsStatusChartData(insights);

    return {
      customer,
      insights,
      charts: {
        insightsByType: insightsChartData,
        insightsByStatus: insightsStatusChartData
      },
      summary: {
        totalInsights: insights.length,
        insightsLast8Weeks: insightsChartData.reduce((sum, item) => sum + item.total, 0),
        mostCommonType: this.getMostCommonInsightType(insights),
        statusBreakdown: this.getStatusBreakdown(insights)
      }
    };
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

  // Helper methods for dashboard data generation
  private static getWeekString(date: Date): string {
    const year = date.getFullYear();
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return `${year} W${week.toString().padStart(2, '0')}`;
  }

  private static generateInsightsChartData(insights: any[]) {
    if (!insights || insights.length === 0) {
      return [];
    }

    const groupedData: { [key: string]: { [key: string]: number } } = {};
    
    insights.forEach(insight => {
      const createdAt = new Date(insight.createdAt || insight.updatedAt);
      const week = this.getWeekString(createdAt);
      const type = insight.type || 'other';
      
      if (!groupedData[week]) {
        groupedData[week] = {};
      }
      
      groupedData[week][type] = (groupedData[week][type] || 0) + 1;
    });

    return Object.entries(groupedData)
      .map(([period, types]) => {
        const total = Object.values(types).reduce((sum, count) => sum + count, 0);
        return {
          period,
          ...types,
          total
        };
      })
      .sort((a, b) => a.period.localeCompare(b.period))
      .slice(-8);
  }

  private static generateInsightsStatusChartData(insights: any[]) {
    if (!insights || insights.length === 0) {
      return [];
    }

    const groupedData: { [key: string]: { [key: string]: number } } = {};
    
    insights.forEach(insight => {
      const createdAt = new Date(insight.createdAt || insight.updatedAt);
      const week = this.getWeekString(createdAt);
      const status = insight.status || 'new';
      
      if (!groupedData[week]) {
        groupedData[week] = { active: 0, resolved: 0, in_progress: 0, pending: 0 };
      }
      
      let normalizedStatus = 'active';
      if (status === 'resolved' || status === 'closed') {
        normalizedStatus = 'resolved';
      } else if (status === 'in_progress') {
        normalizedStatus = 'in_progress';
      } else if (status === 'reopened') {
        normalizedStatus = 'pending';
      }
      
      groupedData[week][normalizedStatus]++;
    });

    return Object.entries(groupedData)
      .map(([period, statuses]) => {
        const total = Object.values(statuses).reduce((sum, count) => sum + count, 0);
        return {
          period,
          ...statuses,
          total
        };
      })
      .sort((a, b) => a.period.localeCompare(b.period))
      .slice(-8);
  }

  private static getMostCommonInsightType(insights: any[]): string {
    if (insights.length === 0) return 'None';
    
    const typeCounts: { [key: string]: number } = {};
    insights.forEach(insight => {
      const type = insight.type || 'other';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    const mostCommon = Object.entries(typeCounts)
      .sort(([,a], [,b]) => b - a)[0];
    
    return mostCommon ? mostCommon[0] : 'None';
  }

  private static getStatusBreakdown(insights: any[]) {
    const breakdown = { active: 0, resolved: 0, in_progress: 0, pending: 0 };
    
    insights.forEach(insight => {
      const status = insight.status || 'new';
      if (status === 'resolved' || status === 'closed') {
        breakdown.resolved++;
      } else if (status === 'in_progress') {
        breakdown.in_progress++;
      } else if (status === 'reopened') {
        breakdown.pending++;
      } else {
        breakdown.active++;
      }
    });
    
    return breakdown;
  }
}
