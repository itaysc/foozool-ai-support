import { CustomerModel } from '../schemas';
import { 
  generateAndSaveCustomerSuccessInsights,
  savePredictionAsInsight,
  migratePredictionsToInsights
} from '../services/insights';
import { HealthScoreService } from '../services/insights/healthScore.service';
import { PredictionModel } from '../schemas/prediction.schema';
import { TicketModel } from '../schemas/ticket.schema';
import { callLLM } from '../services/llm';
import mongoose from 'mongoose';

/**
 * Generate comprehensive customer insights including:
 * - Customer Success Insights (user engagement, stakeholder insights, etc.)
 * - Health Score Risk Insights
 * - Prediction Insights (from existing predictions)
 * - Ticket-based insights
 */
export const generateCustomerInsightsJob = async (
  organizationId: string, 
  customerId?: string, 
  userId?: string
): Promise<{
  message: string;
  totalCustomers: number;
  successCount: number;
  errorCount: number;
  results: Array<{
    customerId: string;
    customerName?: string;
    success: boolean;
    insightsGenerated?: {
      customerSuccess: number;
      healthScoreRisk: number;
      predictions: number;
      total: number;
    };
    error?: string;
  }>;
}> => {
  console.log('🎯 Starting comprehensive customer insights generation job...');
  
  try {
    // Get customers to process
    let customers;
    if (customerId) {
      // Process specific customer
      const customer = await CustomerModel.findById(customerId);
      if (!customer) {
        throw new Error(`Customer with ID ${customerId} not found`);
      }
      customers = [customer];
      console.log(`Processing insights for specific customer: ${customer.name} (${customerId})`);
    } else {
      // Process all customers in organization
      customers = await CustomerModel.find({ organizationId })
        .select({ _id: 1, name: 1 })
        .lean();
      console.log(`Found ${customers.length} customers to process for organization ${organizationId}`);
    }

    const results: Array<{
      customerId: string;
      customerName?: string;
      success: boolean;
      insightsGenerated?: {
        customerSuccess: number;
        healthScoreRisk: number;
        predictions: number;
        total: number;
      };
      error?: string;
    }> = [];
    
    let successCount = 0;
    let errorCount = 0;

    // Initialize services
    const healthScoreService = new HealthScoreService();

    // Process each customer
    for (const customer of customers) {
      const currentCustomerId = String(customer._id);
      const customerName = customer.name;
      
      console.log(`\n📊 Processing customer: ${customerName} (${currentCustomerId})`);
      
      try {
        const insightsGenerated = {
          customerSuccess: 0,
          healthScoreRisk: 0,
          predictions: 0,
          total: 0
        };

        // 1. Generate Customer Success Insights
        console.log(`  🔍 Generating Customer Success insights...`);
        try {
          const csResult = await generateAndSaveCustomerSuccessInsights(currentCustomerId);
          insightsGenerated.customerSuccess = csResult.payload?.allInsights?.length || 0;
          console.log(`  ✅ Generated ${insightsGenerated.customerSuccess} Customer Success insights`);
        } catch (csError) {
          console.error(`  ❌ Failed to generate Customer Success insights:`, csError);
          // Continue with other insights even if CS fails
        }

        // 2. Generate Health Score Risk Insights
        console.log(`  🏥 Generating Health Score Risk insights...`);
        try {
          const healthScore = await healthScoreService.calculateHealthScore(currentCustomerId, organizationId);
          if (healthScore.overallScore < 60) {
            // Health score risk insights are automatically generated in calculateHealthScore
            // We just need to count them
            const existingRiskInsights = await healthScoreService.getHealthScoreInsights(healthScore);
            insightsGenerated.healthScoreRisk = existingRiskInsights.length;
            console.log(`  ✅ Generated ${insightsGenerated.healthScoreRisk} Health Score Risk insights`);
          } else {
            console.log(`  ℹ️  Health score is healthy (${healthScore.overallScore}), no risk insights needed`);
          }
        } catch (hsError) {
          console.error(`  ❌ Failed to generate Health Score Risk insights:`, hsError);
          // Continue with other insights even if health score fails
        }

        // 3. Generate Prediction Insights from existing predictions
        console.log(`  🔮 Generating Prediction insights...`);
        try {
          const predictionInsightsCount = await generatePredictionInsightsForCustomer(
            currentCustomerId, 
            organizationId, 
            customerName
          );
          insightsGenerated.predictions = predictionInsightsCount;
          console.log(`  ✅ Generated ${insightsGenerated.predictions} Prediction insights`);
        } catch (predError) {
          console.error(`  ❌ Failed to generate Prediction insights:`, predError);
          // Continue with other insights even if predictions fail
        }

        // Calculate total insights
        insightsGenerated.total = insightsGenerated.customerSuccess + insightsGenerated.healthScoreRisk + insightsGenerated.predictions;

        results.push({
          customerId: currentCustomerId,
          customerName,
          success: true,
          insightsGenerated
        });
        
        successCount++;
        console.log(`  🎉 Completed customer ${customerName}: ${insightsGenerated.total} total insights generated`);

      } catch (error) {
        console.error(`❌ Failed to process customer ${customerName}:`, error);
        results.push({
          customerId: currentCustomerId,
          customerName,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        errorCount++;
      }
    }

    console.log(`\n✅ Customer insights generation completed!`);
    console.log(`📊 Summary: ${successCount} successful, ${errorCount} failed out of ${customers.length} customers`);

    return {
      message: 'Customer insights generation completed',
      totalCustomers: customers.length,
      successCount,
      errorCount,
      results
    };

  } catch (error) {
    console.error('❌ Error in customer insights generation job:', error);
    throw error;
  }
};

/**
 * Generate prediction insights for a specific customer from existing predictions
 */
async function generatePredictionInsightsForCustomer(
  customerId: string, 
  organizationId: string, 
  customerName: string
): Promise<number> {
  try {
    // Get recent predictions for this customer's tickets
    const recentPredictions = await PredictionModel.find({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    }).sort({ createdAt: -1 }).limit(100);

    if (recentPredictions.length === 0) {
      console.log(`    ℹ️  No recent predictions found for customer ${customerName}`);
      return 0;
    }

    // Get customer's tickets to match with predictions
    const customerTickets = await TicketModel.find({
      customerId: new mongoose.Types.ObjectId(customerId)
    }).select({ _id: 1, externalId: 1 }).lean();

    const customerTicketIds = new Set(customerTickets.map(t => t.externalId));

    // Filter predictions for this customer's tickets
    const customerPredictions = recentPredictions.filter(pred => 
      customerTicketIds.has(pred.ticketId)
    );

    if (customerPredictions.length === 0) {
      console.log(`    ℹ️  No predictions found for customer ${customerName}'s tickets`);
      return 0;
    }

    console.log(`    📋 Found ${customerPredictions.length} predictions for customer ${customerName}'s tickets`);

    // Convert predictions to insights
    let insightsCreated = 0;
    for (const prediction of customerPredictions) {
      try {
        await savePredictionAsInsight(
          prediction.ticketId,
          organizationId,
          customerId,
          customerName,
          {
            predictedEscalation: prediction.predictedEscalation,
            predictedCSAT: prediction.predictedCSAT,
            longResolutionPredicted: prediction.longResolutionPredicted,
            predictionConfidence: prediction.predictionConfidence
          }
        );
        insightsCreated++;
      } catch (error) {
        console.error(`    ❌ Failed to save prediction insight for ticket ${prediction.ticketId}:`, error);
      }
    }

    return insightsCreated;

  } catch (error) {
    console.error(`Error generating prediction insights for customer ${customerName}:`, error);
    throw error;
  }
}

/**
 * Migrate existing predictions to insights for an organization
 */
export const migratePredictionsToInsightsJob = async (
  organizationId: string,
  userId?: string
): Promise<{
  message: string;
  migrated: number;
  errors: number;
}> => {
  console.log('🔄 Starting predictions migration to insights...');
  
  try {
    const result = await migratePredictionsToInsights(organizationId);
    
    console.log(`✅ Predictions migration completed: ${result.migrated} migrated, ${result.errors} errors`);
    
    return {
      message: 'Predictions migration completed',
      migrated: result.migrated,
      errors: result.errors
    };

  } catch (error) {
    console.error('❌ Error in predictions migration job:', error);
    throw error;
  }
};
