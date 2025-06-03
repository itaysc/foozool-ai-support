import { IInsight, InsightSeverity, InsightStatus, InsightCategory } from '@common/types';
import { InsightModel } from '../schemas/insight.schema';

export const create = async (insightData: Partial<IInsight>): Promise<IInsight> => {
  return await InsightModel.create(insightData);
};

export const findById = async (id: string): Promise<IInsight | null> => {
  return await InsightModel.findById(id).populate('organization').populate('productId').lean();
};

export const findSimilarInsight = async (query: {
  type: string;
  status: { $in: InsightStatus[] };
  productId?: string;
  organization?: string;
  $or?: Array<{ keywords: { $in: string[] } } | { title: { $regex: string; $options: string } }>;
}): Promise<IInsight | null> => {
  return await InsightModel.findOne(query).sort({ createdAt: -1 });
};

export const updateById = async (id: string, updateData: any): Promise<IInsight | null> => {
  return await InsightModel.findByIdAndUpdate(id, { $set: updateData }, { new: true });
};

export const findWithFilters = async (
  query: any,
  options: {
    limit?: number;
    skip?: number;
    sort?: any;
  } = {}
): Promise<IInsight[]> => {
  const {
    limit = 50,
    skip = 0,
    sort = { confidence: -1, frequency: -1, lastUpdated: -1 }
  } = options;

  return await InsightModel.find(query)
    .sort(sort)
    .limit(limit)
    .skip(skip)
    .populate('organization')
    .populate('productId')
    .lean();
};

export const countWithFilters = async (query: any): Promise<number> => {
  return await InsightModel.countDocuments(query);
};

export const updateStatus = async (
  id: string,
  status: InsightStatus,
  actionData?: {
    type: string;
    description: string;
    performedBy: string;
    performedAt: Date;
  }
): Promise<IInsight | null> => {
  const updateData: any = { 
    status,
    lastUpdated: new Date()
  };

  if (actionData) {
    updateData.actionTaken = actionData;
  }

  return await InsightModel.findByIdAndUpdate(id, updateData, { new: true });
};

export const getActiveInsightsByFilters = async (filters: {
  organization?: string;
  productId?: string;
  severity?: InsightSeverity;
  category?: InsightCategory;
  status?: InsightStatus;
  limit?: number;
  skip?: number;
}): Promise<{ insights: IInsight[]; total: number }> => {
  const query: any = {};
  
  if (filters.organization) query.organization = filters.organization;
  if (filters.productId) query.productId = filters.productId;
  if (filters.severity) query.severity = filters.severity;
  if (filters.category) query.category = filters.category;
  if (filters.status) query.status = filters.status;

  const total = await countWithFilters(query);
  const insights = await findWithFilters(query, {
    limit: filters.limit,
    skip: filters.skip
  });

  return { insights: insights as IInsight[], total };
}; 