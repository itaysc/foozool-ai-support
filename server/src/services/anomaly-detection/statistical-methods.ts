/**
 * Statistical methods for anomaly detection
 */

/**
 * Calculate Z-score for a value
 * Z-score = (value - mean) / standardDeviation
 */
export function calculateZScore(value: number, mean: number, standardDeviation: number): number {
  if (standardDeviation === 0) return 0;
  return (value - mean) / standardDeviation;
}

/**
 * Calculate moving average for a time series
 */
export function calculateMovingAverage(
  values: number[],
  windowSize: number
): number[] {
  if (windowSize > values.length) {
    return values.map(() => values.reduce((sum, val) => sum + val, 0) / values.length);
  }

  const result: number[] = [];
  
  for (let i = 0; i <= values.length - windowSize; i++) {
    const window = values.slice(i, i + windowSize);
    const average = window.reduce((sum, val) => sum + val, 0) / windowSize;
    result.push(average);
  }

  return result;
}

/**
 * Calculate exponential moving average
 */
export function calculateExponentialMovingAverage(
  values: number[],
  alpha: number = 0.1
): number[] {
  if (values.length === 0) return [];

  const result: number[] = [values[0]]; // First value is the same
  
  for (let i = 1; i < values.length; i++) {
    const ema = alpha * values[i] + (1 - alpha) * result[i - 1];
    result.push(ema);
  }

  return result;
}

/**
 * Detect seasonal patterns in time series data
 */
export function detectSeasonalPatterns(
  values: number[],
  periods: number[] = [24, 168, 720] // 1 day, 1 week, 1 month (assuming hourly data)
): Array<{ period: number; strength: number; confidence: number }> {
  const patterns: Array<{ period: number; strength: number; confidence: number }> = [];

  for (const period of periods) {
    if (period >= values.length / 2) continue; // Need at least 2 cycles

    const strength = calculateSeasonalStrength(values, period);
    const confidence = calculateSeasonalConfidence(values, period);

    if (strength > 0.3 && confidence > 0.5) { // Thresholds for meaningful seasonality
      patterns.push({ period, strength, confidence });
    }
  }

  return patterns.sort((a, b) => b.strength - a.strength);
}

/**
 * Calculate seasonal strength using autocorrelation
 */
function calculateSeasonalStrength(values: number[], period: number): number {
  if (values.length < period * 2) return 0;

  const autocorrelation = calculateAutocorrelation(values, period);
  return Math.abs(autocorrelation);
}

/**
 * Calculate seasonal confidence based on consistency
 */
function calculateSeasonalConfidence(values: number[], period: number): number {
  if (values.length < period * 2) return 0;

  const cycles = Math.floor(values.length / period);
  const cycleValues: number[][] = [];

  // Group values by cycle
  for (let i = 0; i < cycles; i++) {
    const cycleStart = i * period;
    const cycleEnd = cycleStart + period;
    cycleValues.push(values.slice(cycleStart, cycleEnd));
  }

  if (cycleValues.length < 2) return 0;

  // Calculate consistency between cycles
  let totalConsistency = 0;
  let comparisons = 0;

  for (let i = 0; i < cycleValues.length - 1; i++) {
    for (let j = i + 1; j < cycleValues.length; j++) {
      const consistency = calculateCycleConsistency(cycleValues[i], cycleValues[j]);
      totalConsistency += consistency;
      comparisons++;
    }
  }

  return comparisons > 0 ? totalConsistency / comparisons : 0;
}

/**
 * Calculate autocorrelation at a given lag
 */
function calculateAutocorrelation(values: number[], lag: number): number {
  if (lag >= values.length) return 0;

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;

  if (variance === 0) return 0;

  let autocorrelation = 0;
  for (let i = 0; i < values.length - lag; i++) {
    autocorrelation += (values[i] - mean) * (values[i + lag] - mean);
  }

  return autocorrelation / ((values.length - lag) * variance);
}

/**
 * Calculate consistency between two cycles
 */
function calculateCycleConsistency(cycle1: number[], cycle2: number[]): number {
  if (cycle1.length !== cycle2.length) return 0;

  const minLength = Math.min(cycle1.length, cycle2.length);
  let totalDifference = 0;

  for (let i = 0; i < minLength; i++) {
    totalDifference += Math.abs(cycle1[i] - cycle2[i]);
  }

  const averageDifference = totalDifference / minLength;
  const maxValue = Math.max(...cycle1, ...cycle2);
  
  // Convert to similarity (0 = completely different, 1 = identical)
  return Math.max(0, 1 - (averageDifference / maxValue));
}

/**
 * Calculate trend using linear regression
 */
export function calculateTrend(values: number[]): { slope: number; intercept: number; rSquared: number } {
  if (values.length < 2) {
    return { slope: 0, intercept: 0, rSquared: 0 };
  }

  const n = values.length;
  const xValues = Array.from({ length: n }, (_, i) => i);
  
  const sumX = xValues.reduce((sum, x) => sum + x, 0);
  const sumY = values.reduce((sum, y) => sum + y, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * values[i], 0);
  const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R-squared
  const yMean = sumY / n;
  const ssRes = values.reduce((sum, y, i) => {
    const predicted = slope * xValues[i] + intercept;
    return sum + Math.pow(y - predicted, 2);
  }, 0);
  
  const ssTot = values.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
  const rSquared = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;

  return { slope, intercept, rSquared: Math.max(0, Math.min(1, rSquared)) };
}

/**
 * Detect outliers using IQR method
 */
export function detectOutliersIQR(values: number[]): number[] {
  if (values.length < 4) return [];

  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  return values.filter(value => value < lowerBound || value > upperBound);
}

/**
 * Calculate confidence interval for a sample
 */
export function calculateConfidenceInterval(
  values: number[],
  confidenceLevel: number = 0.95
): { lower: number; upper: number; mean: number; marginOfError: number } {
  if (values.length < 2) {
    const value = values[0] || 0;
    return { lower: value, upper: value, mean: value, marginOfError: 0 };
  }

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const stdDev = Math.sqrt(
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1)
  );

  // Z-score for confidence level (95% = 1.96)
  const zScore = confidenceLevel === 0.95 ? 1.96 : 
                 confidenceLevel === 0.99 ? 2.58 : 
                 confidenceLevel === 0.90 ? 1.65 : 1.96;

  const marginOfError = zScore * (stdDev / Math.sqrt(values.length));

  return {
    lower: mean - marginOfError,
    upper: mean + marginOfError,
    mean,
    marginOfError
  };
}
