/**
 * Sentiment analysis functions for anomaly detection
 */

export interface SentimentTrend {
  direction: 'improving' | 'declining' | 'stable';
  slope: number;
  confidence: number;
  volatility: number;
  period: number;
}

export interface SentimentShift {
  magnitude: number;
  direction: 'positive' | 'negative';
  confidence: number;
  baselinePeriod: number;
  shiftPeriod: number;
  isSignificant: boolean;
}

/**
 * Detect significant shifts in sentiment over time
 */
export function detectSentimentShifts(
  sentimentData: Array<{ timestamp: Date; sentiment: number }>,
  shiftThreshold: number = 0.3,
  baselineWindow: number = 0.7 // Use 70% of data for baseline
): SentimentShift[] {
  if (sentimentData.length < 10) return [];

  const shifts: SentimentShift[] = [];
  const baselineSize = Math.floor(sentimentData.length * baselineWindow);
  const baselineData = sentimentData.slice(0, baselineSize);
  const recentData = sentimentData.slice(baselineSize);

  if (recentData.length === 0) return [];

  // Calculate baseline sentiment
  const baselineSentiment = baselineData.reduce((sum, d) => sum + d.sentiment, 0) / baselineData.length;
  const baselineStdDev = Math.sqrt(
    baselineData.reduce((sum, d) => sum + Math.pow(d.sentiment - baselineSentiment, 2), 0) / baselineData.length
  );

  // Check for shifts in recent data
  for (let i = 0; i < recentData.length; i++) {
    const currentSentiment = recentData[i].sentiment;
    const shiftMagnitude = Math.abs(currentSentiment - baselineSentiment);
    
    if (shiftMagnitude > shiftThreshold) {
      const direction = currentSentiment > baselineSentiment ? 'positive' : 'negative';
      const confidence = Math.min(shiftMagnitude / shiftThreshold, 1);
      
      shifts.push({
        magnitude: shiftMagnitude,
        direction,
        confidence,
        baselinePeriod: baselineData.length,
        shiftPeriod: i + 1,
        isSignificant: shiftMagnitude > (shiftThreshold * 1.5)
      });
    }
  }

  return shifts;
}

/**
 * Analyze sentiment trends over time
 */
export function analyzeSentimentTrends(
  sentimentData: Array<{ timestamp: Date; sentiment: number }>,
  minDataPoints: number = 5
): SentimentTrend[] {
  if (sentimentData.length < minDataPoints) return [];

  const trends: SentimentTrend[] = [];
  const sentiments = sentimentData.map(d => d.sentiment);

  // Calculate overall trend
  const overallTrend = calculateSentimentTrend(sentiments);
  
  // Calculate volatility
  const volatility = calculateSentimentVolatility(sentiments);

  // Determine trend direction
  let direction: 'improving' | 'declining' | 'stable';
  if (overallTrend.slope > 0.01) direction = 'improving';
  else if (overallTrend.slope < -0.01) direction = 'declining';
  else direction = 'stable';

  trends.push({
    direction,
    slope: overallTrend.slope,
    confidence: overallTrend.rSquared,
    volatility,
    period: sentimentData.length
  });

  // Analyze sub-periods for more granular trends
  if (sentimentData.length >= 10) {
    const halfPoint = Math.floor(sentimentData.length / 2);
    const firstHalf = sentiments.slice(0, halfPoint);
    const secondHalf = sentiments.slice(halfPoint);

    const firstHalfTrend = calculateSentimentTrend(firstHalf);
    const secondHalfTrend = calculateSentimentTrend(secondHalf);

    // Compare trends between periods
    if (Math.abs(firstHalfTrend.slope - secondHalfTrend.slope) > 0.02) {
      trends.push({
        direction: secondHalfTrend.slope > firstHalfTrend.slope ? 'improving' : 'declining',
        slope: secondHalfTrend.slope - firstHalfTrend.slope,
        confidence: Math.min(firstHalfTrend.rSquared, secondHalfTrend.rSquared),
        volatility: calculateSentimentVolatility(secondHalf),
        period: secondHalf.length
      });
    }
  }

  return trends;
}

/**
 * Calculate sentiment trend using linear regression
 */
function calculateSentimentTrend(sentiments: number[]): { slope: number; rSquared: number } {
  if (sentiments.length < 2) return { slope: 0, rSquared: 0 };

  const n = sentiments.length;
  const xValues = Array.from({ length: n }, (_, i) => i);
  
  const sumX = xValues.reduce((sum, x) => sum + x, 0);
  const sumY = sentiments.reduce((sum, y) => sum + y, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * sentiments[i], 0);
  const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  
  // Calculate R-squared
  const yMean = sumY / n;
  const ssRes = sentiments.reduce((sum, y, i) => {
    const predicted = slope * xValues[i] + (sumY - slope * sumX) / n;
    return sum + Math.pow(y - predicted, 2);
  }, 0);
  
  const ssTot = sentiments.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
  const rSquared = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;

  return { 
    slope: Math.round(slope * 1000) / 1000, 
    rSquared: Math.max(0, Math.min(1, rSquared)) 
  };
}

/**
 * Calculate sentiment volatility (standard deviation)
 */
function calculateSentimentVolatility(sentiments: number[]): number {
  if (sentiments.length < 2) return 0;

  const mean = sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length;
  const variance = sentiments.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / (sentiments.length - 1);
  
  return Math.sqrt(variance);
}

/**
 * Detect sentiment volatility changes
 */
export function detectSentimentVolatilityChanges(
  sentimentData: Array<{ timestamp: Date; sentiment: number }>,
  volatilityThreshold: number = 0.2
): Array<{ timestamp: Date; oldVolatility: number; newVolatility: number; change: number }> {
  if (sentimentData.length < 20) return [];

  const changes: Array<{ timestamp: Date; oldVolatility: number; newVolatility: number; change: number }> = [];
  const windowSize = Math.floor(sentimentData.length / 4); // Use 25% of data for each window

  for (let i = windowSize; i < sentimentData.length - windowSize; i += windowSize) {
    const oldWindow = sentimentData.slice(i - windowSize, i);
    const newWindow = sentimentData.slice(i, i + windowSize);

    const oldVolatility = calculateSentimentVolatility(oldWindow.map(d => d.sentiment));
    const newVolatility = calculateSentimentVolatility(newWindow.map(d => d.sentiment));

    const volatilityChange = Math.abs(newVolatility - oldVolatility);
    
    if (volatilityChange > volatilityThreshold) {
      changes.push({
        timestamp: newWindow[0].timestamp,
        oldVolatility: Math.round(oldVolatility * 1000) / 1000,
        newVolatility: Math.round(newVolatility * 1000) / 1000,
        change: Math.round(volatilityChange * 1000) / 1000
      });
    }
  }

  return changes;
}

/**
 * Analyze sentiment patterns by time of day
 */
export function analyzeSentimentByTimeOfDay(
  sentimentData: Array<{ timestamp: Date; sentiment: number }>
): Array<{ hour: number; averageSentiment: number; volume: number; volatility: number }> {
  const hourlyData = new Map<number, { sum: number; count: number; values: number[] }>();

  // Group by hour
  for (const dataPoint of sentimentData) {
    const hour = dataPoint.timestamp.getHours();
    const current = hourlyData.get(hour) || { sum: 0, count: 0, values: [] };
    
    current.sum += dataPoint.sentiment;
    current.count += 1;
    current.values.push(dataPoint.sentiment);
    hourlyData.set(hour, current);
  }

  // Calculate metrics for each hour
  const hourlyAnalysis: Array<{ hour: number; averageSentiment: number; volume: number; volatility: number }> = [];

  for (let hour = 0; hour < 24; hour++) {
    const data = hourlyData.get(hour);
    if (data && data.count > 0) {
      hourlyAnalysis.push({
        hour,
        averageSentiment: Math.round((data.sum / data.count) * 1000) / 1000,
        volume: data.count,
        volatility: calculateSentimentVolatility(data.values)
      });
    }
  }

  return hourlyAnalysis.sort((a, b) => a.hour - b.hour);
}

/**
 * Detect sentiment seasonality patterns
 */
export function detectSentimentSeasonality(
  sentimentData: Array<{ timestamp: Date; sentiment: number }>,
  minCycles: number = 3
): Array<{ period: number; strength: number; description: string }> {
  if (sentimentData.length < 24) return [];

  const patterns: Array<{ period: number; strength: number; description: string }> = [];
  const sentiments = sentimentData.map(d => d.sentiment);

  // Check for daily patterns (24 hours)
  if (sentimentData.length >= 24 * minCycles) {
    const dailyStrength = calculateSeasonalStrength(sentiments, 24);
    if (dailyStrength > 0.3) {
      patterns.push({
        period: 24,
        strength: dailyStrength,
        description: 'Daily sentiment pattern detected'
      });
    }
  }

  // Check for weekly patterns (168 hours)
  if (sentimentData.length >= 168 * minCycles) {
    const weeklyStrength = calculateSeasonalStrength(sentiments, 168);
    if (weeklyStrength > 0.3) {
      patterns.push({
        period: 168,
        strength: weeklyStrength,
        description: 'Weekly sentiment pattern detected'
      });
    }
  }

  return patterns.sort((a, b) => b.strength - a.strength);
}

/**
 * Calculate seasonal strength using autocorrelation
 */
function calculateSeasonalStrength(sentiments: number[], period: number): number {
  if (sentiments.length < period * 2) return 0;

  const mean = sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length;
  const variance = sentiments.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / sentiments.length;

  if (variance === 0) return 0;

  let autocorrelation = 0;
  for (let i = 0; i < sentiments.length - period; i++) {
    autocorrelation += (sentiments[i] - mean) * (sentiments[i + period] - mean);
  }

  return Math.abs(autocorrelation / ((sentiments.length - period) * variance));
}
