import { getRecentVectors } from '../../qdrant/service';
import { OrganizationModel } from '../../schemas/organization.schema';
import { AnomalyDetectionSettings } from '../../types';

export interface AnomalyDetectionConfig {
  volumeThreshold: number; // Standard deviations for volume anomalies
  sentimentThreshold: number; // Threshold for sentiment shifts
  timeWindows: {
    short: number; // 1 hour
    medium: number; // 6 hours
    long: number; // 24 hours
  };
  minDataPoints: number; // Minimum data points required for analysis
}

export interface VolumeAnomaly {
  type: 'spike' | 'drop' | 'seasonal';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  currentValue: number;
  expectedValue: number;
  zScore: number;
  confidence: number;
  organizationId: string;
  description: string;
}

export interface SentimentAnomaly {
  type: 'shift' | 'trend' | 'volatility';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  currentSentiment: number;
  baselineSentiment: number;
  shiftMagnitude: number;
  confidence: number;
  organizationId: string;
  description: string;
}

export class AnomalyDetectionService {

  /**
   * Get anomaly detection settings for an organization
   */
  private async getOrganizationSettings(organizationId: string): Promise<AnomalyDetectionSettings> {
    try {
      const organization = await OrganizationModel.findById(organizationId);
      if (!organization) {
        throw new Error(`Organization with ID ${organizationId} not found`);
      }

      // Return organization settings or defaults
      return organization.anomalySettings || {
        volumeThreshold: 2.5,
        sentimentThreshold: 0.3,
        timeWindows: {
          short: 60 * 60 * 1000, // 1 hour
          medium: 6 * 60 * 60 * 1000, // 6 hours
          long: 24 * 60 * 60 * 1000, // 24 hours
        },
        minDataPoints: 10,
        enabled: true,
      };
    } catch (error) {
      console.error(`Error fetching organization settings for ${organizationId}:`, error);
      // Return safe defaults
      return {
        volumeThreshold: 2.5,
        sentimentThreshold: 0.3,
        timeWindows: {
          short: 60 * 60 * 1000, // 1 hour
          medium: 6 * 60 * 60 * 1000, // 6 hours
          long: 24 * 60 * 60 * 1000, // 24 hours
        },
        minDataPoints: 10,
        enabled: true,
      };
    }
  }

  /**
   * Detect volume anomalies for a specific organization
   */
  async detectVolumeAnomalies(organizationId: string): Promise<VolumeAnomaly[]> {
    try {
      console.log(`🔍 Detecting volume anomalies for organization ${organizationId}`);

      // Check if anomaly detection is enabled for this organization
      const settings = await this.getOrganizationSettings(organizationId);
      if (!settings.enabled) {
        console.log(`⚠️ Anomaly detection is disabled for organization ${organizationId}`);
        return [];
      }

      const anomalies: VolumeAnomaly[] = [];

      // Check different time windows
      for (const [windowName, windowMs] of Object.entries(settings.timeWindows)) {
        const windowAnomalies = await this.detectVolumeAnomaliesForWindow(
          organizationId,
          windowMs as number,
          windowName,
          settings
        );
        anomalies.push(...windowAnomalies);
      }

      console.log(`✅ Detected ${anomalies.length} volume anomalies for organization ${organizationId}`);
      return anomalies;
    } catch (error) {
      console.error(`❌ Error detecting volume anomalies for organization ${organizationId}:`, error);
      return [];
    }
  }

  /**
   * Detect sentiment anomalies for a specific organization
   */
  async detectSentimentAnomalies(organizationId: string): Promise<SentimentAnomaly[]> {
    try {
      console.log(`🔍 Detecting sentiment anomalies for organization ${organizationId}`);

      // Check if anomaly detection is enabled for this organization
      const settings = await this.getOrganizationSettings(organizationId);
      if (!settings.enabled) {
        console.log(`⚠️ Anomaly detection is disabled for organization ${organizationId}`);
        return [];
      }

      const anomalies: SentimentAnomaly[] = [];

      // Check different time windows
      for (const [windowName, windowMs] of Object.entries(settings.timeWindows)) {
        const windowAnomalies = await this.detectSentimentAnomaliesForWindow(
          organizationId,
          windowMs as number,
          windowName,
          settings
        );
        anomalies.push(...windowAnomalies);
      }

      console.log(`✅ Detected ${anomalies.length} sentiment anomalies for organization ${organizationId}`);
      return anomalies;
    } catch (error) {
      console.error(`❌ Error detecting sentiment anomalies for organization ${organizationId}:`, error);
      return [];
    }
  }

  /**
   * Detect volume anomalies from the beginning of time for a specific organization
   * This is useful for finding historical anomalies or testing the system
   */
  async detectVolumeAnomaliesFromBeginning(organizationId: string): Promise<VolumeAnomaly[]> {
    try {
      console.log(`🔍 Detecting volume anomalies from beginning of time for organization ${organizationId}`);

      // Check if anomaly detection is enabled for this organization
      const settings = await this.getOrganizationSettings(organizationId);
      if (!settings.enabled) {
        console.log(`⚠️ Anomaly detection is disabled for organization ${organizationId}`);
        return [];
      }

      const anomalies: VolumeAnomaly[] = [];

      // Check different time windows but start from the beginning of time
      for (const [windowName, windowMs] of Object.entries(settings.timeWindows)) {
        const windowAnomalies = await this.detectVolumeAnomaliesForWindowFromBeginning(
          organizationId,
          windowMs as number,
          windowName,
          settings
        );
        anomalies.push(...windowAnomalies);
      }

      console.log(`✅ Detected ${anomalies.length} volume anomalies from beginning of time for organization ${organizationId}`);
      return anomalies;
    } catch (error) {
      console.error(`❌ Error detecting volume anomalies from beginning of time for organization ${organizationId}:`, error);
      return [];
    }
  }

  /**
   * Detect sentiment anomalies from the beginning of time for a specific organization
   * This is useful for finding historical anomalies or testing the system
   */
  async detectSentimentAnomaliesFromBeginning(organizationId: string): Promise<SentimentAnomaly[]> {
    try {
      console.log(`🔍 Detecting sentiment anomalies from beginning of time for organization ${organizationId}`);

      // Check if anomaly detection is enabled for this organization
      const settings = await this.getOrganizationSettings(organizationId);
      if (!settings.enabled) {
        console.log(`⚠️ Anomaly detection is disabled for organization ${organizationId}`);
        return [];
      }

      const anomalies: SentimentAnomaly[] = [];

      // Check different time windows but start from the beginning of time
      for (const [windowName, windowMs] of Object.entries(settings.timeWindows)) {
        const windowAnomalies = await this.detectSentimentAnomaliesForWindowFromBeginning(
          organizationId,
          windowMs as number,
          windowName,
          settings
        );
        anomalies.push(...windowAnomalies);
      }

      console.log(`✅ Detected ${anomalies.length} sentiment anomalies from beginning of time for organization ${organizationId}`);
      return anomalies;
    } catch (error) {
      console.error(`❌ Error detecting sentiment anomalies from beginning of time for organization ${organizationId}:`, error);
      return [];
    }
  }

  /**
   * Comprehensive anomaly detection for all organizations
   */
  async detectAllAnomalies(): Promise<{
    volumeAnomalies: VolumeAnomaly[];
    sentimentAnomalies: SentimentAnomaly[];
  }> {
    try {
      console.log('🔍 Starting comprehensive anomaly detection for all organizations...');

      const organizations = await OrganizationModel.find({});
      const allVolumeAnomalies: VolumeAnomaly[] = [];
      const allSentimentAnomalies: SentimentAnomaly[] = [];

      for (const organization of organizations) {
        const orgId = organization._id.toString();
        
        // Detect volume anomalies
        const volumeAnomalies = await this.detectVolumeAnomalies(orgId);
        allVolumeAnomalies.push(...volumeAnomalies);

        // Detect sentiment anomalies
        const sentimentAnomalies = await this.detectSentimentAnomalies(orgId);
        allSentimentAnomalies.push(...sentimentAnomalies);
      }

      console.log(`✅ Comprehensive anomaly detection completed. Found ${allVolumeAnomalies.length} volume and ${allSentimentAnomalies.length} sentiment anomalies.`);

      return {
        volumeAnomalies: allVolumeAnomalies,
        sentimentAnomalies: allSentimentAnomalies
      };
    } catch (error) {
      console.error('❌ Error in comprehensive anomaly detection:', error);
      return {
        volumeAnomalies: [],
        sentimentAnomalies: []
      };
    }
  }

  private async detectVolumeAnomaliesForWindow(
    organizationId: string,
    windowMs: number,
    windowName: string,
    settings: AnomalyDetectionSettings
  ): Promise<VolumeAnomaly[]> {
    try {
      const now = new Date();
      const windowStart = new Date(now.getTime() - windowMs);
      
      // Get ticket volume data for the time window
      const volumeData = await this.getTicketVolumeData(organizationId, windowStart, now);
      
      if (volumeData.length < settings.minDataPoints) {
        return []; // Not enough data for analysis
      }

      const anomalies: VolumeAnomaly[] = [];
      const volumes = volumeData.map(d => d.volume);
      
      // Calculate statistical measures
      const mean = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
      const stdDev = Math.sqrt(
        volumes.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / volumes.length
      );

      if (stdDev === 0) return []; // No variation in data

      // Check for anomalies in the most recent data points
      const recentVolumes = volumeData.slice(-3); // Last 3 data points
      
      for (const dataPoint of recentVolumes) {
        const zScore = this.calculateZScore(dataPoint.volume, mean, stdDev);
        
        if (Math.abs(zScore) > settings.volumeThreshold) {
          const anomaly: VolumeAnomaly = {
            type: zScore > 0 ? 'spike' : 'drop',
            severity: this.getSeverityLevel(Math.abs(zScore)),
            timestamp: dataPoint.timestamp,
            currentValue: dataPoint.volume,
            expectedValue: Math.round(mean),
            zScore: Math.round(zScore * 100) / 100,
            confidence: Math.min(Math.abs(zScore) / settings.volumeThreshold, 1),
            organizationId,
            description: this.generateVolumeAnomalyDescription(dataPoint.volume, mean, zScore, windowName)
          };
          
          anomalies.push(anomaly);
        }
      }

      return anomalies;
    } catch (error) {
      console.error(`Error detecting volume anomalies for window ${windowName}:`, error);
      return [];
    }
  }

  private async detectSentimentAnomaliesForWindow(
    organizationId: string,
    windowMs: number,
    windowName: string,
    settings: AnomalyDetectionSettings
  ): Promise<SentimentAnomaly[]> {
    try {
      const now = new Date();
      const windowStart = new Date(now.getTime() - windowMs);
      
      // Get sentiment data for the time window
      const sentimentData = await this.getSentimentData(organizationId, windowStart, now);
      
      if (sentimentData.length < settings.minDataPoints) {
        return []; // Not enough data for analysis
      }

      const anomalies: SentimentAnomaly[] = [];
      const sentiments = sentimentData.map(d => d.sentiment);
      
      // Calculate baseline sentiment (excluding recent data)
      const baselineData = sentimentData.slice(0, -3);
      const baselineSentiment = baselineData.length > 0 
        ? baselineData.reduce((sum, s) => sum + s.sentiment, 0) / baselineData.length
        : 0;

      // Check for recent sentiment shifts
      const recentSentiments = sentimentData.slice(-3);
      
      for (const dataPoint of recentSentiments) {
        const shiftMagnitude = Math.abs(dataPoint.sentiment - baselineSentiment);
        
        if (shiftMagnitude > settings.sentimentThreshold) {
          const anomaly: SentimentAnomaly = {
            type: 'shift',
            severity: this.getSeverityLevel(shiftMagnitude / settings.sentimentThreshold),
            timestamp: dataPoint.timestamp,
            currentSentiment: Math.round(dataPoint.sentiment * 100) / 100,
            baselineSentiment: Math.round(baselineSentiment * 100) / 100,
            shiftMagnitude: Math.round(shiftMagnitude * 100) / 100,
            confidence: Math.min(shiftMagnitude / settings.sentimentThreshold, 1),
            organizationId,
            description: this.generateSentimentAnomalyDescription(
              dataPoint.sentiment, 
              baselineSentiment, 
              shiftMagnitude, 
              windowName
            )
          };
          
          anomalies.push(anomaly);
        }
      }

      return anomalies;
    } catch (error) {
      console.error(`Error detecting sentiment anomalies for window ${windowName}:`, error);
      return [];
    }
  }

  private async getTicketVolumeData(
    organizationId: string,
    startTime: Date,
    endTime: Date
  ): Promise<Array<{ timestamp: Date; volume: number }>> {
    try {
      // Get tickets from Qdrant for the time window
      const tickets = await getRecentVectors({
        organizationId,
        createdAfter: startTime,
        limit: 1000
      });

      // Group by hour and count tickets
      const hourlyVolumes = new Map<string, number>();
      
      for (const ticket of tickets) {
        const ticketTime = new Date(ticket.payload.created_at);
        const hourKey = ticketTime.toISOString().slice(0, 13) + ':00:00.000Z';
        hourlyVolumes.set(hourKey, (hourlyVolumes.get(hourKey) || 0) + 1);
      }

      // Convert to array and sort by timestamp
      const volumeData = Array.from(hourlyVolumes.entries())
        .map(([timestamp, volume]) => ({
          timestamp: new Date(timestamp),
          volume
        }))
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      return volumeData;
    } catch (error) {
      console.error('Error getting ticket volume data:', error);
      return [];
    }
  }

  private async getSentimentData(
    organizationId: string,
    startTime: Date,
    endTime: Date
  ): Promise<Array<{ timestamp: Date; sentiment: number }>> {
    try {
      // Get tickets from Qdrant for the time window
      const tickets = await getRecentVectors({
        organizationId,
        createdAfter: startTime,
        limit: 1000
      });

      // Group by hour and calculate average sentiment
      const hourlySentiments = new Map<string, { sum: number; count: number }>();
      
      for (const ticket of tickets) {
        const ticketTime = new Date(ticket.payload.created_at);
        const hourKey = ticketTime.toISOString().slice(0, 13) + ':00:00.000Z';
        const current = hourlySentiments.get(hourKey) || { sum: 0, count: 0 };
        current.sum += ticket.payload.sentiment_score || 0;
        current.count += 1;
        hourlySentiments.set(hourKey, current);
      }

      // Convert to array and sort by timestamp
      const sentimentData = Array.from(hourlySentiments.entries())
        .map(([timestamp, data]) => ({
          timestamp: new Date(timestamp),
          sentiment: data.sum / data.count
        }))
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      return sentimentData;
    } catch (error) {
      console.error('Error getting sentiment data:', error);
      return [];
    }
  }

  private async detectVolumeAnomaliesForWindowFromBeginning(
    organizationId: string,
    windowMs: number,
    windowName: string,
    settings: AnomalyDetectionSettings
  ): Promise<VolumeAnomaly[]> {
    try {
      const now = new Date();
      // Start from year 2000 to get all historical data
      const windowStart = new Date('2000-01-01T00:00:00.000Z');
      
      // Get ticket volume data from the beginning of time
      const volumeData = await this.getTicketVolumeDataFromBeginning(organizationId, windowStart, now);
      
      if (volumeData.length < settings.minDataPoints) {
        console.log(`⚠️ Not enough data points (${volumeData.length}) for ${windowName} window analysis. Need at least ${settings.minDataPoints}.`);
        return []; // Not enough data for analysis
      }

      const anomalies: VolumeAnomaly[] = [];
      const volumes = volumeData.map(d => d.volume);
      
      // Calculate statistical measures
      const mean = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
      const stdDev = Math.sqrt(
        volumes.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / volumes.length
      );

      if (stdDev === 0) {
        console.log(`⚠️ No variation in volume data for ${windowName} window.`);
        return []; // No variation in data
      }

      // Check for anomalies in all data points (not just recent ones)
      for (const dataPoint of volumeData) {
        const zScore = this.calculateZScore(dataPoint.volume, mean, stdDev);
        
        if (Math.abs(zScore) > settings.volumeThreshold) {
          const anomaly: VolumeAnomaly = {
            type: zScore > 0 ? 'spike' : 'drop',
            severity: this.getSeverityLevel(Math.abs(zScore)),
            timestamp: dataPoint.timestamp,
            currentValue: dataPoint.volume,
            expectedValue: Math.round(mean),
            zScore: Math.round(zScore * 100) / 100,
            confidence: Math.min(Math.abs(zScore) / settings.volumeThreshold, 1),
            organizationId,
            description: this.generateVolumeAnomalyDescription(dataPoint.volume, mean, zScore, windowName)
          };
          
          anomalies.push(anomaly);
        }
      }

      console.log(`📊 ${windowName} window: Analyzed ${volumeData.length} data points, found ${anomalies.length} anomalies`);
      return anomalies;
    } catch (error) {
      console.error(`Error detecting volume anomalies from beginning for window ${windowName}:`, error);
      return [];
    }
  }

  private async detectSentimentAnomaliesForWindowFromBeginning(
    organizationId: string,
    windowMs: number,
    windowName: string,
    settings: AnomalyDetectionSettings
  ): Promise<SentimentAnomaly[]> {
    try {
      const now = new Date();
      // Start from year 2000 to get all historical data
      const windowStart = new Date('2000-01-01T00:00:00.000Z');
      
      // Get sentiment data from the beginning of time
      const sentimentData = await this.getSentimentDataFromBeginning(organizationId, windowStart, now);
      
      if (sentimentData.length < settings.minDataPoints) {
        console.log(`⚠️ Not enough data points (${sentimentData.length}) for ${windowName} window sentiment analysis. Need at least ${settings.minDataPoints}.`);
        return []; // Not enough data for analysis
      }

      const anomalies: SentimentAnomaly[] = [];
      const sentiments = sentimentData.map(d => d.sentiment);
      
      // Calculate baseline sentiment (using all data)
      const baselineSentiment = sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length;

      // Check for sentiment shifts in all data points
      for (const dataPoint of sentimentData) {
        const shiftMagnitude = Math.abs(dataPoint.sentiment - baselineSentiment);
        
        if (shiftMagnitude > settings.sentimentThreshold) {
          const anomaly: SentimentAnomaly = {
            type: 'shift',
            severity: this.getSeverityLevel(shiftMagnitude / settings.sentimentThreshold),
            timestamp: dataPoint.timestamp,
            currentSentiment: Math.round(dataPoint.sentiment * 100) / 100,
            baselineSentiment: Math.round(baselineSentiment * 100) / 100,
            shiftMagnitude: Math.round(shiftMagnitude * 100) / 100,
            confidence: Math.min(shiftMagnitude / settings.sentimentThreshold, 1),
            organizationId,
            description: this.generateSentimentAnomalyDescription(
              dataPoint.sentiment, 
              baselineSentiment, 
              shiftMagnitude, 
              windowName
            )
          };
          
          anomalies.push(anomaly);
        }
      }

      console.log(`📊 ${windowName} window: Analyzed ${sentimentData.length} sentiment data points, found ${anomalies.length} anomalies`);
      return anomalies;
    } catch (error) {
      console.error(`Error detecting sentiment anomalies from beginning for window ${windowName}:`, error);
      return [];
    }
  }

  private async getTicketVolumeDataFromBeginning(
    organizationId: string,
    startTime: Date,
    endTime: Date
  ): Promise<Array<{ timestamp: Date; volume: number }>> {
    try {
      console.log(`🔍 Getting volume data from ${startTime.toISOString()} to ${endTime.toISOString()}`);
      
      // Get tickets from Qdrant from the beginning of time
      const tickets = await getRecentVectors({
        organizationId,
        createdAfter: startTime,
        limit: 10000 // Increased limit to get more historical data
      });

      console.log(`📊 Retrieved ${tickets.length} tickets from Qdrant`);

      // Group by hour and count tickets
      const hourlyVolumes = new Map<string, number>();
      
      for (const ticket of tickets) {
        const ticketTime = new Date(ticket.payload.created_at);
        const hourKey = ticketTime.toISOString().slice(0, 13) + ':00:00.000Z';
        hourlyVolumes.set(hourKey, (hourlyVolumes.get(hourKey) || 0) + 1);
      }

      // Convert to array and sort by timestamp
      const volumeData = Array.from(hourlyVolumes.entries())
        .map(([timestamp, volume]) => ({
          timestamp: new Date(timestamp),
          volume
        }))
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      console.log(`📊 Grouped into ${volumeData.length} hourly buckets with total volume: ${volumeData.reduce((sum, d) => sum + d.volume, 0)}`);
      return volumeData;
    } catch (error) {
      console.error('Error getting ticket volume data from beginning:', error);
      return [];
    }
  }

  private async getSentimentDataFromBeginning(
    organizationId: string,
    startTime: Date,
    endTime: Date
  ): Promise<Array<{ timestamp: Date; sentiment: number }>> {
    try {
      console.log(`🔍 Getting sentiment data from ${startTime.toISOString()} to ${endTime.toISOString()}`);
      
      // Get tickets from Qdrant from the beginning of time
      const tickets = await getRecentVectors({
        organizationId,
        createdAfter: startTime,
        limit: 10000 // Increased limit to get more historical data
      });

      console.log(`📊 Retrieved ${tickets.length} tickets from Qdrant for sentiment analysis`);

      // Group by hour and calculate average sentiment
      const hourlySentiments = new Map<string, { sum: number; count: number }>();
      
      for (const ticket of tickets) {
        const ticketTime = new Date(ticket.payload.created_at);
        const hourKey = ticketTime.toISOString().slice(0, 13) + ':00:00.000Z';
        const current = hourlySentiments.get(hourKey) || { sum: 0, count: 0 };
        current.sum += ticket.payload.sentiment_score || 0;
        current.count += 1;
        hourlySentiments.set(hourKey, current);
      }

      // Convert to array and sort by timestamp
      const sentimentData = Array.from(hourlySentiments.entries())
        .map(([timestamp, data]) => ({
          timestamp: new Date(timestamp),
          sentiment: data.sum / data.count
        }))
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      console.log(`📊 Grouped into ${sentimentData.length} hourly buckets for sentiment analysis`);
      return sentimentData;
    } catch (error) {
      console.error('Error getting sentiment data from beginning:', error);
      return [];
    }
  }

  private calculateZScore(value: number, mean: number, standardDeviation: number): number {
    if (standardDeviation === 0) return 0;
    return (value - mean) / standardDeviation;
  }

  private getSeverityLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 4.0) return 'critical';
    if (score >= 3.0) return 'high';
    if (score >= 2.0) return 'medium';
    return 'low';
  }

  private generateVolumeAnomalyDescription(
    current: number,
    expected: number,
    zScore: number,
    windowName: string
  ): string {
    const change = current - expected;
    const percentage = Math.round((change / expected) * 100);
    
    if (zScore > 0) {
      return `Ticket volume spike detected in ${windowName} window: ${current} tickets (${percentage > 0 ? '+' : ''}${percentage}% above expected ${expected})`;
    } else {
      return `Ticket volume drop detected in ${windowName} window: ${current} tickets (${percentage}% below expected ${expected})`;
    }
  }

  private generateSentimentAnomalyDescription(
    current: number,
    baseline: number,
    shiftMagnitude: number,
    windowName: string
  ): string {
    const direction = current > baseline ? 'improved' : 'declined';
    const magnitude = Math.round(shiftMagnitude * 100);
    
    return `Customer sentiment ${direction} in ${windowName} window: ${current.toFixed(2)} vs baseline ${baseline.toFixed(2)} (${magnitude}% shift)`;
  }
}

export default AnomalyDetectionService;
