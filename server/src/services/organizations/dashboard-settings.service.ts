import { OrganizationModel } from '../../schemas/organization.schema';
import { DashboardSettings } from '../../types/organization';

export class DashboardSettingsService {
  /**
   * Get dashboard settings for an organization
   */
  async getDashboardSettings(organizationId: string): Promise<DashboardSettings | null> {
    try {
      const organization = await OrganizationModel.findById(organizationId).lean();
      return organization?.dashboardSettings || null;
    } catch (error) {
      console.error('❌ Error fetching dashboard settings:', error);
      throw new Error('Failed to fetch dashboard settings');
    }
  }

  /**
   * Update dashboard settings for an organization
   */
  async updateDashboardSettings(organizationId: string, settings: Partial<DashboardSettings>): Promise<DashboardSettings> {
    try {
      const organization = await OrganizationModel.findByIdAndUpdate(
        organizationId,
        { 
          $set: { 
            dashboardSettings: settings 
          } 
        },
        { 
          new: true, 
          runValidators: true 
        }
      );

      if (!organization) {
        throw new Error('Organization not found');
      }

      return organization.dashboardSettings || this.getDefaultSettings();
    } catch (error) {
      console.error('❌ Error updating dashboard settings:', error);
      throw new Error('Failed to update dashboard settings');
    }
  }

  /**
   * Reset dashboard settings to defaults
   */
  async resetDashboardSettings(organizationId: string): Promise<DashboardSettings> {
    try {
      const organization = await OrganizationModel.findByIdAndUpdate(
        organizationId,
        { 
          $unset: { dashboardSettings: 1 } 
        },
        { 
          new: true 
        }
      );

      if (!organization) {
        throw new Error('Organization not found');
      }

      return organization.dashboardSettings || this.getDefaultSettings();
    } catch (error) {
      console.error('❌ Error resetting dashboard settings:', error);
      throw new Error('Failed to reset dashboard settings');
    }
  }

  /**
   * Calculate time range based on dashboard settings
   */
  calculateTimeRange(settings: DashboardSettings): { start: string; end: string } | null {
    const { analyticsTimeRange } = settings;
    
    if (!analyticsTimeRange) {
      return null; // Use all time
    }

    const now = new Date();
    let start: Date;

    switch (analyticsTimeRange.type) {
      case 'all_time':
        return null; // No time filter, use all data
        
      case 'custom_days':
        if (!analyticsTimeRange.value) return null;
        start = new Date(now.getTime() - (analyticsTimeRange.value * 24 * 60 * 60 * 1000));
        break;
        
      case 'custom_months':
        if (!analyticsTimeRange.value) return null;
        start = new Date(now.getFullYear(), now.getMonth() - analyticsTimeRange.value, now.getDate());
        break;
        
      case 'custom_years':
        if (!analyticsTimeRange.value) return null;
        start = new Date(now.getFullYear() - analyticsTimeRange.value, now.getMonth(), now.getDate());
        break;
        
      default:
        return null;
    }

    return {
      start: start.toISOString(),
      end: now.toISOString()
    };
  }

  /**
   * Get default dashboard settings
   */
  getDefaultSettings(): DashboardSettings {
    return {
      analyticsTimeRange: {
        type: 'all_time'
      },
      refreshInterval: {
        enabled: true,
        minutes: 30
      },
      aggregationSettings: {
        groupBy: 'week',
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
  }

  /**
   * Validate dashboard settings
   */
  validateSettings(settings: Partial<DashboardSettings>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (settings.analyticsTimeRange) {
      const { type, value, startDate, endDate } = settings.analyticsTimeRange;
      
      if (type === 'custom_days' || type === 'custom_months' || type === 'custom_years') {
        if (!value || value < 1) {
          errors.push(`${type} requires a positive value`);
        }
      }
      
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start >= end) {
          errors.push('Start date must be before end date');
        }
      }
    }

    if (settings.refreshInterval) {
      const { minutes } = settings.refreshInterval;
      if (minutes && (minutes < 1 || minutes > 1440)) {
        errors.push('Refresh interval must be between 1 and 1440 minutes');
      }
    }

    if (settings.aggregationSettings) {
      const { maxDataPoints } = settings.aggregationSettings;
      if (maxDataPoints && (maxDataPoints < 10 || maxDataPoints > 1000)) {
        errors.push('Max data points must be between 10 and 1000');
      }
    }

    if (settings.thresholds) {
      const { criticalTicketVolume, highPriorityThreshold, satisfactionAlertThreshold } = settings.thresholds;
      
      if (criticalTicketVolume && criticalTicketVolume < 1) {
        errors.push('Critical ticket volume must be at least 1');
      }
      
      if (highPriorityThreshold && highPriorityThreshold < 1) {
        errors.push('High priority threshold must be at least 1');
      }
      
      if (satisfactionAlertThreshold && (satisfactionAlertThreshold < 0 || satisfactionAlertThreshold > 100)) {
        errors.push('Satisfaction alert threshold must be between 0 and 100');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default new DashboardSettingsService(); 