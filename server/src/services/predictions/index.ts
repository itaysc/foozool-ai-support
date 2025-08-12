import { PredictionModel } from '../../schemas/prediction.schema';
import mongoose from 'mongoose';

export interface PredictionSummary {
  totalPredictions: number;
  highEscalationRisk: number;
  highCSATRisk: number;
  escalationRiskPercentage: number;
  csatRiskPercentage: number;
  avgEscalationConfidence: number;
  avgCSATConfidence: number;
}

export class PredictionService {
  /**
   * Get predictions for an organization
   */
  static async getPredictionsByOrganization(
    organizationId: string,
    limit: number = 20
  ) {
    const predictions = await PredictionModel.find({ 
      organizationId: new mongoose.Types.ObjectId(organizationId) 
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
      
    return predictions;
  }

  /**
   * Get prediction analytics summary for an organization
   */
  static async getPredictionSummary(organizationId: string): Promise<PredictionSummary> {
    const recentPredictions = await PredictionModel.find({ 
      organizationId: new mongoose.Types.ObjectId(organizationId),
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    }).lean();

    const totalPredictions = recentPredictions.length;
    const highEscalationRisk = recentPredictions.filter(p => p.predictedEscalation.risk === 'High').length;
    const highCSATRisk = recentPredictions.filter(p => p.predictedCSAT.risk === 'High').length;
    
    const avgEscalationConfidence = totalPredictions > 0 
      ? recentPredictions.reduce((sum, p) => sum + p.predictedEscalation.confidence, 0) / totalPredictions 
      : 0;
    
    const avgCSATConfidence = totalPredictions > 0 
      ? recentPredictions.reduce((sum, p) => sum + p.predictedCSAT.confidence, 0) / totalPredictions 
      : 0;

    return {
      totalPredictions,
      highEscalationRisk,
      highCSATRisk,
      escalationRiskPercentage: totalPredictions > 0 ? (highEscalationRisk / totalPredictions) * 100 : 0,
      csatRiskPercentage: totalPredictions > 0 ? (highCSATRisk / totalPredictions) * 100 : 0,
      avgEscalationConfidence: Math.round(avgEscalationConfidence * 100) / 100,
      avgCSATConfidence: Math.round(avgCSATConfidence * 100) / 100,
    };
  }

  /**
   * Get high-risk predictions for an organization
   */
  static async getHighRiskPredictions(organizationId: string, limit: number = 50) {
    const highRiskPredictions = await PredictionModel.find({ 
      organizationId: new mongoose.Types.ObjectId(organizationId),
      $or: [
        { 'predictedEscalation.risk': 'High' },
        { 'predictedCSAT.risk': 'High' }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
      
    return highRiskPredictions;
  }
}