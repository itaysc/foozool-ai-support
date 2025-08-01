import { OrganizationModel } from '../schemas/organization.schema';
import dashboardSettingsService from '../services/organizations/dashboard-settings.service';

export const seedDashboardSettings = async () => {
  try {
    console.log('🌱 Seeding dashboard settings...');

    // Find the first organization or create one
    let organization = await OrganizationModel.findOne();
    
    if (!organization) {
      console.log('⚠️ No organization found, creating one...');
      organization = await OrganizationModel.create({
        name: 'Default Organization',
        signature: 'default-org-signature',
        details: 'Default organization for testing dashboard settings'
      });
    }

    // Set up dashboard settings to use all time data
    const dashboardSettings = {
      analyticsTimeRange: {
        type: 'all_time' as const
      },
      refreshInterval: {
        enabled: true,
        minutes: 30
      },
      aggregationSettings: {
        groupBy: 'week' as const,
        includeHistoricalData: true,
        maxDataPoints: 100
      },
      features: {
        showPerformanceComparison: true,
        showTrendAnalysis: true,
        showAnomalyDetection: true,
        showSentimentAnalysis: true,
        showIntentAnalysis: true
      },
      thresholds: {
        criticalTicketVolume: 100,
        highPriorityThreshold: 50,
        satisfactionAlertThreshold: 70
      }
    };

    // Update organization with dashboard settings
    await dashboardSettingsService.updateDashboardSettings(organization._id.toString(), dashboardSettings);

    console.log('✅ Dashboard settings seeded successfully');
    console.log(`📊 Organization: ${organization.name} (${organization._id})`);
    console.log('📈 Analytics will now use ALL historical data (26K tickets)');
    console.log('🔄 Dashboard will refresh every 30 minutes');
    console.log('📋 Features enabled: Performance comparison, Trend analysis, Anomaly detection, Sentiment analysis, Intent analysis');

  } catch (error) {
    console.error('❌ Error seeding dashboard settings:', error);
    throw error;
  }
};

export default seedDashboardSettings; 