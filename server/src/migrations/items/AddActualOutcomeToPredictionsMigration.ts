import { BaseMigration } from '../BaseMigration';
import { MigrationResult } from '../types';
import { PredictionModel } from '../../schemas/prediction.schema';
import mongoose from 'mongoose';

export class AddActualOutcomeToPredictionsMigration extends BaseMigration {
  name = 'add-actual-outcome-to-predictions';
  description = 'Add realistic actualOutcome data to existing predictions to simulate real-world outcomes';
  version = '1.0.0';
  databaseType = 'mongo' as const;

  protected async execute(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      totalRecords: 0,
      processedRecords: 0,
      errors: []
    };

    console.log(`🚀 Starting ${this.name} migration...`);

    try {
      // Find all predictions that don't have actualOutcome
      const predictionsWithoutOutcome = await PredictionModel.find({
        $or: [
          { actualOutcome: { $exists: false } },
          { actualOutcome: null }
        ]
      });

      result.totalRecords = predictionsWithoutOutcome.length;
      console.log(`📊 Found ${result.totalRecords} predictions without actualOutcome`);

      if (result.totalRecords === 0) {
        console.log(`✅ No predictions need updating`);
        result.success = true;
        return result;
      }

      // Process predictions in batches to avoid memory issues
      const batchSize = 100;
      let processedCount = 0;

      for (let i = 0; i < predictionsWithoutOutcome.length; i += batchSize) {
        const batch = predictionsWithoutOutcome.slice(i, i + batchSize);
        console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(predictionsWithoutOutcome.length / batchSize)}`);

        const updatePromises = batch.map(prediction => {
          const actualOutcome = this.generateRealisticOutcome(prediction);
          
          return PredictionModel.updateOne(
            { _id: prediction._id },
            { $set: { actualOutcome } }
          );
        });

        try {
          await Promise.all(updatePromises);
          processedCount += batch.length;
          console.log(`✅ Batch completed: ${processedCount}/${result.totalRecords} predictions updated`);
        } catch (error) {
          const errorMsg = `Failed to update batch: ${(error as Error).message}`;
          console.error(`❌ ${errorMsg}`);
          result.errors.push(errorMsg);
        }

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      result.processedRecords = processedCount;
      result.success = result.errors.length === 0;

      console.log(`🎯 Migration completed: ${processedCount}/${result.totalRecords} predictions updated`);
      
      if (result.errors.length > 0) {
        console.log(`⚠️  ${result.errors.length} errors occurred during migration`);
      }

      return result;

    } catch (error) {
      const errorMsg = `Migration failed: ${(error as Error).message}`;
      console.error(`❌ ${errorMsg}`);
      result.errors.push(errorMsg);
      return result;
    }
  }

  private generateRealisticOutcome(prediction: any) {
    const now = new Date();
    
    // Generate a realistic resolution date (between creation and now)
    const createdAt = prediction.createdAt || now;
    const minDays = 1;
    const maxDays = 30;
    const randomDays = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
    const resolvedAt = new Date(createdAt.getTime() + (randomDays * 24 * 60 * 60 * 1000));
    
    // Ensure resolvedAt is not in the future
    if (resolvedAt > now) {
      resolvedAt.setTime(now.getTime() - (Math.random() * 24 * 60 * 60 * 1000));
    }

    // Generate final status (most tickets get resolved)
    const statuses = ['resolved', 'closed', 'pending', 'open'];
    const statusWeights = [0.7, 0.2, 0.08, 0.02]; // 70% resolved, 20% closed, etc.
    const finalStatus = this.weightedRandomChoice(statuses, statusWeights);

    // Determine if ticket was escalated based on prediction and some randomness
    const escalationPrediction = prediction.predictedEscalation;
    const isEscalated = this.determineEscalationOutcome(escalationPrediction);

    // Generate CSAT score (1-5, with most being positive)
    const csatScore = this.generateRealisticCSAT(prediction.predictedCSAT);

    // Calculate accuracy based on predictions vs outcomes
    const accuracyEscalation = this.calculateEscalationAccuracy(
      escalationPrediction.risk,
      escalationPrediction.confidence,
      isEscalated
    );

    const accuracyCSAT = this.calculateCSATAccuracy(
      prediction.predictedCSAT.risk,
      prediction.predictedCSAT.confidence,
      csatScore
    );

    return {
      finalStatus,
      isEscalated,
      csatScore,
      resolvedAt,
      accuracyEscalation,
      accuracyCSAT,
      checkedAt: now
    };
  }

  private determineEscalationOutcome(escalationPrediction: any): boolean {
    const { risk, confidence } = escalationPrediction;
    
    // Base probability of escalation based on predicted risk
    let baseProbability = 0.1; // 10% for Low
    if (risk === 'Medium') baseProbability = 0.3; // 30% for Medium
    if (risk === 'High') baseProbability = 0.6; // 60% for High

    // Adjust based on confidence (higher confidence = more accurate prediction)
    const confidenceAdjustment = (confidence - 0.5) * 0.4; // ±20% adjustment
    const finalProbability = Math.max(0.05, Math.min(0.95, baseProbability + confidenceAdjustment));

    // Add some randomness to make it realistic (not 100% accurate)
    const randomFactor = 0.15; // ±15% randomness
    const adjustedProbability = finalProbability + (Math.random() - 0.5) * randomFactor;
    
    return Math.random() < adjustedProbability;
  }

  private generateRealisticCSAT(csatPrediction: any): number {
    const { risk, confidence } = csatPrediction;
    
    // Base CSAT score based on predicted risk
    let baseScore = 4.2; // Good score for Low risk
    if (risk === 'Medium') baseScore = 3.5; // Medium score for Medium risk
    if (risk === 'High') baseScore = 2.8; // Lower score for High risk

    // Adjust based on confidence
    const confidenceAdjustment = (confidence - 0.5) * 0.6; // ±0.3 adjustment
    let finalScore = baseScore + confidenceAdjustment;

    // Add realistic variation
    const variation = 0.8; // ±0.8 variation
    finalScore += (Math.random() - 0.5) * variation;

    // Ensure score is within 1-5 range and round to 1 decimal
    finalScore = Math.max(1, Math.min(5, finalScore));
    return Math.round(finalScore * 10) / 10;
  }

  private calculateEscalationAccuracy(predictedRisk: string, confidence: number, actualEscalated: boolean): boolean {
    // High confidence predictions are more likely to be accurate
    const accuracyThreshold = 0.5 - (confidence * 0.3); // Higher confidence = lower threshold
    const randomValue = Math.random();
    
    // Most predictions should be accurate (as requested)
    const accuracyBias = 0.8; // 80% chance of being accurate
    
    if (Math.random() < accuracyBias) {
      // Make it accurate based on the prediction
      if (predictedRisk === 'High') return actualEscalated;
      if (predictedRisk === 'Low') return !actualEscalated;
      // For Medium, be more flexible
      return Math.random() < 0.7;
    } else {
      // Sometimes make it inaccurate for realism
      return Math.random() < 0.5;
    }
  }

  private calculateCSATAccuracy(predictedRisk: string, confidence: number, actualCSAT: number): boolean {
    // Determine if the CSAT prediction was accurate
    let expectedLow = predictedRisk === 'High' && actualCSAT <= 3;
    let expectedHigh = predictedRisk === 'Low' && actualCSAT >= 4;
    let expectedMedium = predictedRisk === 'Medium' && actualCSAT > 2 && actualCSAT < 4.5;

    // Most predictions should be accurate (as requested)
    const accuracyBias = 0.75; // 75% chance of being accurate
    
    if (Math.random() < accuracyBias) {
      return expectedLow || expectedHigh || expectedMedium;
    } else {
      // Sometimes make it inaccurate for realism
      return Math.random() < 0.5;
    }
  }

  private weightedRandomChoice<T>(choices: T[], weights: number[]): T {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < choices.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return choices[i];
      }
    }
    
    return choices[choices.length - 1];
  }
}
