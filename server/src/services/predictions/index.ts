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
  longResolutionPredictions: number;
  longResolutionPercentage: number;
}

export interface AccuracyAnalysis {
  totalChecked: number;
  escalationAccuracy: {
    correct: number;
    total: number;
    percentage: number;
  };
  csatAccuracy: {
    correct: number;
    total: number;
    percentage: number;
  };
  overallAccuracy: number;
  confidenceBreakdown: {
    high: { correct: number; total: number; percentage: number };
    medium: { correct: number; total: number; percentage: number };
    low: { correct: number; total: number; percentage: number };
  };
  // New fields for resolution time prediction accuracy
  resolutionTimeAccuracy: {
    correct: number;
    total: number;
    percentage: number;
  };
  avgResolutionTime: number; // Average resolution time in hours
  avgPredictedLongResolutionTime: number; // Average resolution time for predicted long tickets
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
    const longResolutionPredictions = recentPredictions.filter(p => p.longResolutionPredicted === true).length;
    
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
      longResolutionPredictions,
      longResolutionPercentage: totalPredictions > 0 ? (longResolutionPredictions / totalPredictions) * 100 : 0,
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

  /**
   * Get accuracy analysis for predictions
   */
  static async getAccuracyAnalysis(organizationId: string, days: number = 30): Promise<AccuracyAnalysis> {
    const dateFilter = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const predictionsWithOutcomes = await PredictionModel.find({ 
      organizationId: new mongoose.Types.ObjectId(organizationId),
      createdAt: { $gte: dateFilter },
      'actualOutcome.checkedAt': { $exists: true }
    }).lean();

    const totalChecked = predictionsWithOutcomes.length;
    
    // Calculate escalation accuracy
    const escalationPredictions = predictionsWithOutcomes.filter(p => 
      p.actualOutcome?.accuracyEscalation !== undefined
    );
    const escalationCorrect = escalationPredictions.filter(p => 
      p.actualOutcome?.accuracyEscalation === true
    ).length;
    
    // Calculate CSAT accuracy
    const csatPredictions = predictionsWithOutcomes.filter(p => 
      p.actualOutcome?.accuracyCSAT !== undefined
    );
    const csatCorrect = csatPredictions.filter(p => 
      p.actualOutcome?.accuracyCSAT === true
    ).length;

    // Calculate overall accuracy (both escalation and CSAT correct)
    const bothCorrect = predictionsWithOutcomes.filter(p => 
      p.actualOutcome?.accuracyEscalation === true && 
      p.actualOutcome?.accuracyCSAT === true
    ).length;

    // Analyze accuracy by confidence levels
    const confidenceBreakdown = {
      high: { correct: 0, total: 0, percentage: 0 },
      medium: { correct: 0, total: 0, percentage: 0 },
      low: { correct: 0, total: 0, percentage: 0 }
    };

    predictionsWithOutcomes.forEach(prediction => {
      const avgConfidence = (prediction.predictedEscalation.confidence + prediction.predictedCSAT.confidence) / 2;
      const isCorrect = prediction.actualOutcome?.accuracyEscalation === true && 
                       prediction.actualOutcome?.accuracyCSAT === true;
      
      if (avgConfidence >= 0.8) {
        confidenceBreakdown.high.total++;
        if (isCorrect) confidenceBreakdown.high.correct++;
      } else if (avgConfidence >= 0.5) {
        confidenceBreakdown.medium.total++;
        if (isCorrect) confidenceBreakdown.medium.correct++;
      } else {
        confidenceBreakdown.low.total++;
        if (isCorrect) confidenceBreakdown.low.correct++;
      }
    });

    // Calculate percentages
    confidenceBreakdown.high.percentage = confidenceBreakdown.high.total > 0 
      ? (confidenceBreakdown.high.correct / confidenceBreakdown.high.total) * 100 
      : 0;
    confidenceBreakdown.medium.percentage = confidenceBreakdown.medium.total > 0 
      ? (confidenceBreakdown.medium.correct / confidenceBreakdown.medium.total) * 100 
      : 0;
    confidenceBreakdown.low.percentage = confidenceBreakdown.low.total > 0 
      ? (confidenceBreakdown.low.correct / confidenceBreakdown.low.total) * 100 
      : 0;

    // Calculate resolution time prediction accuracy
    const longResolutionPredictions = predictionsWithOutcomes.filter(p => 
      p.longResolutionPredicted === true && p.actualOutcome?.resolutionTimeMs
    );
    const longResolutionCorrect = longResolutionPredictions.filter(p => {
      const resolutionTimeHours = (p.actualOutcome?.resolutionTimeMs || 0) / (1000 * 60 * 60);
      return p.longResolutionPredicted && resolutionTimeHours > 24; // Correct if predicted long and actually took > 24 hours
    }).length;

    // Calculate average resolution times
    const resolvedTickets = predictionsWithOutcomes.filter(p => p.actualOutcome?.resolutionTimeMs);
    const avgResolutionTime = resolvedTickets.length > 0 
      ? resolvedTickets.reduce((sum, p) => sum + (p.actualOutcome?.resolutionTimeMs || 0), 0) / resolvedTickets.length
      : 0;

    const predictedLongResolved = predictionsWithOutcomes.filter(p => 
      p.longResolutionPredicted === true && p.actualOutcome?.resolutionTimeMs
    );
    const avgPredictedLongResolutionTime = predictedLongResolved.length > 0
      ? predictedLongResolved.reduce((sum, p) => sum + (p.actualOutcome?.resolutionTimeMs || 0), 0) / predictedLongResolved.length
      : 0;

    return {
      totalChecked,
      escalationAccuracy: {
        correct: escalationCorrect,
        total: escalationPredictions.length,
        percentage: escalationPredictions.length > 0 
          ? (escalationCorrect / escalationPredictions.length) * 100 
          : 0
      },
      csatAccuracy: {
        correct: csatCorrect,
        total: csatPredictions.length,
        percentage: csatPredictions.length > 0 
          ? (csatCorrect / csatPredictions.length) * 100 
          : 0
      },
      overallAccuracy: totalChecked > 0 ? (bothCorrect / totalChecked) * 100 : 0,
      confidenceBreakdown,
      resolutionTimeAccuracy: {
        correct: longResolutionCorrect,
        total: longResolutionPredictions.length,
        percentage: longResolutionPredictions.length > 0 
          ? (longResolutionCorrect / longResolutionPredictions.length) * 100 
          : 0
      },
      avgResolutionTime: Math.round(avgResolutionTime / (1000 * 60 * 60) * 100) / 100, // Convert to hours
      avgPredictedLongResolutionTime: Math.round(avgPredictedLongResolutionTime / (1000 * 60 * 60) * 100) / 100, // Convert to hours
    };
  }
}