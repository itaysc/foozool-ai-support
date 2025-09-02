import { ICustomer, CreateCustomerRequest, UpdateCustomerRequest } from '../../types';
import { CustomerModel } from '../../schemas';

export const createCustomer = async (organizationId: string, customerData: CreateCustomerRequest): Promise<ICustomer> => {
  const customer = new CustomerModel({
    organizationId,
    ...customerData,
    startDate: customerData.startDate ? new Date(customerData.startDate) : undefined,
  });
  return await customer.save();
};

export const getCustomers = async (organizationId: string, options: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filter?: {
    industry?: string;
    companySize?: string;
    accountManager?: string;
    healthScore?: { min?: number; max?: number };
  };
} = {}): Promise<{ customers: ICustomer[]; total: number; page: number; totalPages: number }> => {
  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', filter = {} } = options;
  
  const query: any = { organizationId };
  
  // Apply filters
  if (filter.industry) query.industry = filter.industry;
  if (filter.companySize) query.companySize = filter.companySize;
  if (filter.accountManager) query.accountManager = filter.accountManager;
  if (filter.healthScore) {
    if (filter.healthScore.min !== undefined || filter.healthScore.max !== undefined) {
      query.healthScore = {};
      if (filter.healthScore.min !== undefined) query.healthScore.$gte = filter.healthScore.min;
      if (filter.healthScore.max !== undefined) query.healthScore.$lte = filter.healthScore.max;
    }
  }
  
  const sort: any = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  const skip = (page - 1) * limit;
  
  const [customers, total] = await Promise.all([
    CustomerModel.find(query).sort(sort).skip(skip).limit(limit).lean(),
    CustomerModel.countDocuments(query),
  ]);
  
  return {
    customers,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

export const getCustomerById = async (organizationId: string, customerId: string): Promise<ICustomer | null> => {
  return await CustomerModel.findOne({ _id: customerId, organizationId }).lean();
};

export const updateCustomer = async (organizationId: string, customerId: string, updateData: UpdateCustomerRequest): Promise<ICustomer | null> => {
  const update: any = { ...updateData };
  if (updateData.startDate) {
    update.startDate = new Date(updateData.startDate);
  }
  
  return await CustomerModel.findOneAndUpdate(
    { _id: customerId, organizationId },
    update,
    { new: true, runValidators: true }
  ).lean();
};

export const deleteCustomer = async (organizationId: string, customerId: string): Promise<boolean> => {
  const result = await CustomerModel.deleteOne({ _id: customerId, organizationId });
  return result.deletedCount > 0;
};

export const getCustomerStats = async (organizationId: string): Promise<{
  totalCustomers: number;
  averageHealthScore: number;
  customersByIndustry: Array<{ industry: string; count: number }>;
  customersBySize: Array<{ size: string; count: number }>;
  healthScoreDistribution: Array<{ score: number; count: number }>;
}> => {
  const [
    totalCustomers,
    averageHealthScore,
    customersByIndustry,
    customersBySize,
    healthScoreDistribution,
  ] = await Promise.all([
    CustomerModel.countDocuments({ organizationId }),
    CustomerModel.aggregate([
      { $match: { organizationId, healthScore: { $exists: true } } },
      { $group: { _id: null, avg: { $avg: '$healthScore' } } },
    ]),
    CustomerModel.aggregate([
      { $match: { organizationId, industry: { $exists: true, $ne: '' } } },
      { $group: { _id: '$industry', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    CustomerModel.aggregate([
      { $match: { organizationId, companySize: { $exists: true, $ne: '' } } },
      { $group: { _id: '$companySize', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    CustomerModel.aggregate([
      { $match: { organizationId, healthScore: { $exists: true } } },
      { $group: { _id: '$healthScore', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);
  
  return {
    totalCustomers,
    averageHealthScore: averageHealthScore[0]?.avg || 0,
    customersByIndustry: customersByIndustry.map(item => ({ industry: item._id, count: item.count })),
    customersBySize: customersBySize.map(item => ({ size: item._id, count: item.count })),
    healthScoreDistribution: healthScoreDistribution.map(item => ({ score: item._id, count: item.count })),
  };
};
