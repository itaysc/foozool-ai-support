import AnomalyDetectionService from '../services/anomaly-detection';
import AnomalyService from '../services/anomaly-detection/anomaly.service';
import { OrganizationModel } from '../schemas/organization.schema';
import { VolumeAnomaly, SentimentAnomaly } from '../services/anomaly-detection';

/**
 * Dedicated anomaly detection job that can run more frequently than insights generation
 * This job focuses solely on detecting and storing anomalies in real-time
 */
export const runAnomalyDetectionJob = async (targetOrganizationId?: string): Promise<void> => {
  console.log('🔍 Starting dedicated anomaly detection job...');
  
  try {
    let organizations;
    
    if (targetOrganizationId) {
      // Process only the specified organization
      const org = await OrganizationModel.findById(targetOrganizationId);
      if (!org) {
        throw new Error(`Organization with ID ${targetOrganizationId} not found`);
      }
      organizations = [org];
      console.log(`Running anomaly detection for specific organization: ${org.name} (${targetOrganizationId})`);
    } else {
      // Process all organizations
      organizations = await OrganizationModel.find({});
      console.log(`Running anomaly detection for ${organizations.length} organizations`);
    }

    const anomalyDetectionService = new AnomalyDetectionService();
    const anomalyService = new AnomalyService();
    let totalAnomaliesDetected = 0;
    
    for (const organization of organizations) {
      const organizationId = organization._id.toString();
      console.log(`🔍 Detecting anomalies for organization: ${organization.name} (${organizationId})`);

      try {
        // Run anomaly detection for this organization
        const [volumeAnomalies, sentimentAnomalies] = await Promise.all([
          anomalyDetectionService.detectVolumeAnomalies(organizationId),
          anomalyDetectionService.detectSentimentAnomalies(organizationId)
        ]);

        const allAnomalies = [...volumeAnomalies, ...sentimentAnomalies];
        console.log(`Found ${allAnomalies.length} anomalies for organization ${organization.name}`);

        // Store anomalies using the service
        const newAnomaliesStored = await anomalyService.storeAnomalies(allAnomalies, organizationId);

        totalAnomaliesDetected += newAnomaliesStored;
        console.log(`✅ Anomaly detection completed for organization ${organization.name}. Stored ${newAnomaliesStored} new anomalies.`);

      } catch (orgError) {
        console.error(`Error in anomaly detection for organization ${organization.name}:`, orgError);
      }
    }

    // Clean up old anomalies using the service
    const cleanupResult = await anomalyService.cleanupOldAnomalies(7);

    console.log(`✅ Anomaly detection job completed successfully. Total new anomalies detected: ${totalAnomaliesDetected}. Cleaned up ${cleanupResult} old anomalies.`);
  } catch (error) {
    console.error('❌ Error in anomaly detection job:', error);
    throw error;
  }
};

/**
 * Run anomaly detection for a specific organization (useful for testing or manual triggers)
 */
export const runAnomalyDetectionForOrganization = async (organizationId: string): Promise<void> => {
  try {
    console.log(`🔍 Running anomaly detection for organization ${organizationId}...`);
    await runAnomalyDetectionJob(organizationId);
  } catch (error) {
    console.error(`❌ Anomaly detection failed for organization ${organizationId}:`, error);
    throw error;
  }
};

/**
 * Run anomaly detection from the beginning of time for all organizations
 * This is useful for finding historical anomalies or testing the system
 */
export const runAnomalyDetectionFromBeginning = async (targetOrganizationId?: string): Promise<void> => {
  console.log('🔍 Starting anomaly detection from beginning of time...');
  
  try {
    let organizations;
    
    if (targetOrganizationId) {
      // Process only the specified organization
      const org = await OrganizationModel.findById(targetOrganizationId);
      if (!org) {
        throw new Error(`Organization with ID ${targetOrganizationId} not found`);
      }
      organizations = [org];
      console.log(`Running anomaly detection from beginning for specific organization: ${org.name} (${targetOrganizationId})`);
    } else {
      // Process all organizations
      organizations = await OrganizationModel.find({});
      console.log(`Running anomaly detection from beginning for ${organizations.length} organizations`);
    }

    const anomalyDetectionService = new AnomalyDetectionService();
    const anomalyService = new AnomalyService();
    let totalAnomaliesDetected = 0;
    
    for (const organization of organizations) {
      const organizationId = organization._id.toString();
      console.log(`🔍 Detecting anomalies from beginning for organization: ${organization.name} (${organizationId})`);

      try {
        // Run anomaly detection from beginning for this organization
        const [volumeAnomalies, sentimentAnomalies] = await Promise.all([
          anomalyDetectionService.detectVolumeAnomaliesFromBeginning(organizationId),
          anomalyDetectionService.detectSentimentAnomaliesFromBeginning(organizationId)
        ]);

        const allAnomalies = [...volumeAnomalies, ...sentimentAnomalies];
        console.log(`Found ${allAnomalies.length} anomalies from beginning for organization ${organization.name}`);

        // Store anomalies using the service
        const newAnomaliesStored = await anomalyService.storeAnomalies(allAnomalies, organizationId, true); // true = isHistorical

        totalAnomaliesDetected += newAnomaliesStored;
        console.log(`✅ Anomaly detection from beginning completed for organization ${organization.name}. Stored ${newAnomaliesStored} new anomalies.`);

      } catch (orgError) {
        console.error(`Error in anomaly detection from beginning for organization ${organization.name}:`, orgError);
      }
    }

    // Clean up old anomalies using the service
    const cleanupResult = await anomalyService.cleanupOldAnomalies(7);

    console.log(`✅ Anomaly detection from beginning completed successfully. Total new anomalies detected: ${totalAnomaliesDetected}. Cleaned up ${cleanupResult} old anomalies.`);
  } catch (error) {
    console.error('❌ Error in anomaly detection from beginning job:', error);
    throw error;
  }
};

/**
 * Get anomaly statistics for monitoring
 */
export const getAnomalyStats = async (): Promise<{
  totalActive: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  recentActivity: number;
}> => {
  try {
    const anomalyService = new AnomalyService();
    
    // Get stats for all organizations (this would need to be enhanced for multi-org)
    const organizations = await OrganizationModel.find({});
    let totalActive = 0;
    let totalRecentActivity = 0;
    const bySeverity: Record<string, number> = {};
    const byType: Record<string, number> = {};

    for (const organization of organizations) {
      const orgId = organization._id.toString();
      const stats = await anomalyService.getAnomalyStats(orgId, 24);
      
      totalActive += stats.totalActive;
      totalRecentActivity += stats.recentActivity;
      
      // Aggregate severity stats
      Object.entries(stats.bySeverity).forEach(([severity, count]) => {
        bySeverity[severity] = (bySeverity[severity] || 0) + count;
      });
      
      // Aggregate type stats
      Object.entries(stats.byType).forEach(([type, count]) => {
        byType[type] = (byType[type] || 0) + count;
      });
    }

    return {
      totalActive,
      bySeverity,
      byType,
      recentActivity: totalRecentActivity
    };
  } catch (error) {
    console.error('Error getting anomaly stats:', error);
    return {
      totalActive: 0,
      bySeverity: {},
      byType: {},
      recentActivity: 0
    };
  }
};
