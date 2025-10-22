import { DBSCAN } from 'density-clustering';
import { ticketQdrantService } from '../qdrant/service';
import { getSummaryFromVector, calculateGrowthRate } from '../services/insights/summary.service';
import { InsightModel } from '../schemas/insights.schema';
import { OrganizationModel, CustomerModel } from '../schemas';
import AnomalyDetectionService from '../services/anomaly-detection';
import AnomalyService from '../services/anomaly-detection/anomaly.service';
import { generateCustomerSuccessInsightsForOrganization } from '../services/insights/customer-success';

/**
 * Generate insights for all organizations or a specific organization by clustering recent ticket vectors
 */
export const generateInsightsJob = async (targetOrganizationId?: string, userId?: string): Promise<void> => {
  console.log('🔍 Starting insights generation job...');
  
  try {
    let organizations;
    
    if (targetOrganizationId) {
      // Process only the specified organization
      const org = await OrganizationModel.findById(targetOrganizationId);
      if (!org) {
        throw new Error(`Organization with ID ${targetOrganizationId} not found`);
      }
      organizations = [org];
      console.log(`Processing insights for specific organization: ${org.name} (${targetOrganizationId})`);
    } else {
      // Process all organizations
      organizations = await OrganizationModel.find({});
      console.log(`Found ${organizations.length} organizations to process`);
    }

    // Use the singleton ticket service instance
    const anomalyDetectionService = new AnomalyDetectionService();
    const anomalyService = new AnomalyService();
    
    for (const organization of organizations) {
      const organizationId = organization._id;
      console.log(`Processing insights for organization: ${organization.name} (${organizationId})`);

      try {
        // 1. Fetch recent vectors for the specific organization (last 24 hours)
        const recentVectors = await ticketQdrantService.getRecentVectors({
          organizationId: organizationId.toString(),
          createdAfter: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          limit: 500 // Limit to avoid processing too many vectors
        });

        if (recentVectors.length < 5) {
          console.log(`Not enough recent vectors for organization ${organization.name} (${recentVectors.length}), skipping...`);
          continue;
        }

        console.log(`Retrieved ${recentVectors.length} recent vectors for clustering`);

        // 2. Extract vectors for clustering
        const vectors = recentVectors.map(point => point.vector);
        
        // 3. Perform DBSCAN clustering
        const dbscan = new DBSCAN();
        // eps: 0.5 (similarity threshold), minPts: 5 (minimum points per cluster)
        const clusters = dbscan.run(vectors, 0.5, 5);
        
        console.log(`Found ${clusters.length} clusters for organization ${organization.name}`);

        // 4. Process each cluster and create insights
        for (let i = 0; i < clusters.length; i++) {
          const cluster = clusters[i];
          if (!cluster || cluster.length === 0) continue;

          try {
            const clusterId = `cluster_${Date.now()}_${organizationId.toString()}_${i}`;
            
            // Get the most central point in the cluster (first point as representative)
            const representativeIndex = cluster[0];
            const representativeVector = vectors[representativeIndex];
            
            // Get related tickets for context
            const relatedTickets = cluster.map(index => recentVectors[index]);
            
            // Generate issue description using LLM
            const issueDescription = await getSummaryFromVector(
              representativeVector,
              relatedTickets,
              userId
            );
            
            const ticketVolume = cluster.length;
            
            // Calculate growth rate (placeholder - could be enhanced with historical data)
            const growthRate = calculateGrowthRate(ticketVolume);

            // Check if we already have a similar insight for this organization
            const existingInsight = await InsightModel.findOne({
              organizationId,
              issueDescription: { $regex: new RegExp(issueDescription.split(' ').slice(0, 3).join(' '), 'i') }
            }).sort({ lastUpdatedAt: -1 });

            if (existingInsight) {
              // Update existing insight
              existingInsight.ticketVolume += ticketVolume;
              existingInsight.lastUpdatedAt = new Date();
              existingInsight.growthRate = calculateGrowthRate(
                existingInsight.ticketVolume,
                existingInsight.ticketVolume - ticketVolume
              );
              await existingInsight.save();
              console.log(`Updated existing insight for organization ${organization.name}: ${issueDescription}`);
            } else {
              // Create new insight
              const newInsight = await InsightModel.create({
                clusterId,
                organizationId,
                issueDescription,
                ticketVolume,
                growthRate,
                firstDetectedAt: new Date(),
                lastUpdatedAt: new Date(),
              });
              console.log(`Created new insight for organization ${organization.name}: ${issueDescription}`);
            }
          } catch (clusterError) {
            console.error(`Error processing cluster ${i} for organization ${organization.name}:`, clusterError);
          }
        }

        // 5. Run anomaly detection for this organization
        console.log(`🔍 Running anomaly detection for organization ${organization.name}...`);
        
        try {
          // Detect volume anomalies
          const volumeAnomalies = await anomalyDetectionService.detectVolumeAnomalies(organizationId.toString());
          
          // Detect sentiment anomalies
          const sentimentAnomalies = await anomalyDetectionService.detectSentimentAnomalies(organizationId.toString());
          
          // Store detected anomalies using the service
          const allAnomalies = [...volumeAnomalies, ...sentimentAnomalies];
          const newAnomaliesStored = await anomalyService.storeAnomalies(allAnomalies, organizationId.toString());

          console.log(`✅ Anomaly detection completed for organization ${organization.name}. Stored ${newAnomaliesStored} new anomalies.`);
        } catch (anomalyError) {
          console.error(`Error in anomaly detection for organization ${organization.name}:`, anomalyError);
        }

        // 6. Clean up old insights (older than 30 days)
        await InsightModel.deleteMany({
          organizationId,
          firstDetectedAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });

        // 7. Clean up old anomalies (older than 7 days)
        await anomalyService.cleanupOldAnomalies(7);

        // 8. Generate Customer Success Insights for all customers in this organization
        console.log(`🎯 Generating Customer Success insights for organization ${organization.name}...`);
        try {
          // Get all customers for this organization
          const customers = await CustomerModel.find({ organizationId })
            .select({ _id: 1, name: 1 })
            .lean();

          let csSuccessCount = 0;
          let csErrorCount = 0;

          // Generate insights for each customer
          for (const customer of customers) {
            try {
              console.log(`Generating CS insights for customer: ${customer.name} (${customer._id})`);
              // Generate insights with organization context (the function will use the organizationId from the customer)
              await generateCustomerSuccessInsightsForOrganization(String(customer._id), organizationId.toString());
              csSuccessCount++;
            } catch (error) {
              console.error(`Failed to generate CS insights for customer ${customer._id}:`, error);
              csErrorCount++;
            }
          }

          console.log(`✅ Customer Success insights generation completed for organization ${organization.name}. Success: ${csSuccessCount}, Errors: ${csErrorCount}`);
        } catch (csError) {
          console.error(`Error generating Customer Success insights for organization ${organization.name}:`, csError);
        }

      } catch (orgError) {
        console.error(`Error processing organization ${organization.name}:`, orgError);
      }
    }

    console.log('✅ Insights generation job completed successfully');
  } catch (error) {
    console.error('❌ Error in insights generation job:', error);
    throw error;
  }
};

/**
 * Wrapper function for cron job integration (processes all organizations)
 */
export const runInsightsGenerationJob = async (): Promise<void> => {
  try {
    console.log('📊 Starting scheduled insights generation...');
    await generateInsightsJob(); // No organization ID = process all
  } catch (error) {
    console.error('❌ Scheduled insights generation failed:', error);
  }
};