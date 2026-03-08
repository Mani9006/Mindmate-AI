/**
 * MindMate AI - Analytics Service Utilities
 * Common helper functions for analytics calculations
 */

import { 
  TrendDirection, 
  TrendResult, 
  RollingAverage, 
  MoodEntry,
  TriggerEvent,
  TimePattern
} from './types';

// ============================================================================
// Date & Time Utilities
// ============================================================================

export function getStartOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function getEndOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

export function getStartOfWeek(date: Date, weekStartsOn: number = 0): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  result.setDate(result.getDate() - diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function getDaysBetween(startDate: Date, endDate: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((endDate.getTime() - startDate.getTime()) / msPerDay);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getTimeOfDay(date: Date): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ============================================================================
// Statistical Utilities
// ============================================================================

export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function calculateStandardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = calculateMean(values);
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = calculateMean(squaredDiffs);
  return Math.sqrt(variance);
}

export function calculateVariance(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = calculateMean(values);
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  return calculateMean(squaredDiffs);
}

export function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  
  if (upper >= sorted.length) return sorted[lower];
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

export function normalizeValue(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ============================================================================
// Linear Regression & Trend Analysis
// ============================================================================

export interface LinearRegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
  predictions: number[];
}

export function linearRegression(
  xValues: number[], 
  yValues: number[]
): LinearRegressionResult {
  if (xValues.length !== yValues.length || xValues.length < 2) {
    return { slope: 0, intercept: 0, rSquared: 0, predictions: [] };
  }

  const n = xValues.length;
  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = yValues.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
  const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);
  const sumY2 = yValues.reduce((sum, y) => sum + y * y, 0);

  const denominator = n * sumX2 - sumX * sumX;
  
  if (denominator === 0) {
    return { slope: 0, intercept: sumY / n, rSquared: 0, predictions: yValues.map(() => sumY / n) };
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R-squared
  const yMean = sumY / n;
  const ssTotal = sumY2 - n * yMean * yMean;
  const ssResidual = yValues.reduce((sum, y, i) => {
    const predicted = slope * xValues[i] + intercept;
    return sum + Math.pow(y - predicted, 2);
  }, 0);
  const rSquared = ssTotal > 0 ? 1 - (ssResidual / ssTotal) : 0;

  const predictions = xValues.map(x => slope * x + intercept);

  return { slope, intercept, rSquared, predictions };
}

export function detectTrend(
  values: { timestamp: Date; value: number }[],
  confidenceThreshold: number = 0.3
): TrendResult {
  if (values.length < 3) {
    return {
      direction: 'stable',
      strength: 0,
      confidence: 0,
      slope: 0,
      intercept: values[0]?.value || 0,
      dataPoints: values.length,
      startValue: values[0]?.value || 0,
      endValue: values[values.length - 1]?.value || 0,
      changePercent: 0
    };
  }

  // Normalize timestamps to days from start
  const startTime = values[0].timestamp.getTime();
  const xValues = values.map(v => (v.timestamp.getTime() - startTime) / (1000 * 60 * 60 * 24));
  const yValues = values.map(v => v.value);

  const regression = linearRegression(xValues, yValues);
  
  // Calculate volatility (coefficient of variation)
  const mean = calculateMean(yValues);
  const stdDev = calculateStandardDeviation(yValues);
  const volatility = mean > 0 ? stdDev / mean : 0;

  // Determine direction
  let direction: TrendDirection;
  const slopeMagnitude = Math.abs(regression.slope);
  
  if (volatility > 0.3) {
    direction = 'volatile';
  } else if (slopeMagnitude < 0.05) {
    direction = 'stable';
  } else if (regression.slope > 0) {
    direction = 'improving';
  } else {
    direction = 'declining';
  }

  // Calculate change percentage
  const startValue = yValues[0];
  const endValue = yValues[yValues.length - 1];
  const changePercent = startValue !== 0 
    ? ((endValue - startValue) / startValue) * 100 
    : 0;

  return {
    direction,
    strength: Math.min(1, slopeMagnitude * 10),
    confidence: regression.rSquared,
    slope: regression.slope,
    intercept: regression.intercept,
    dataPoints: values.length,
    startValue,
    endValue,
    changePercent
  };
}

// ============================================================================
// Rolling Average Calculations
// ============================================================================

export function calculateRollingAverage(
  values: { timestamp: Date; value: number }[],
  windowSize: number
): RollingAverage {
  if (values.length === 0) {
    return { window: windowSize, values: [], current: 0 };
  }

  const sorted = [...values].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const result: { timestamp: Date; value: number }[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const windowStart = Math.max(0, i - windowSize + 1);
    const windowValues = sorted.slice(windowStart, i + 1).map(v => v.value);
    const avg = calculateMean(windowValues);
    result.push({ timestamp: sorted[i].timestamp, value: avg });
  }

  return {
    window: windowSize,
    values: result,
    current: result[result.length - 1]?.value || 0
  };
}

export function calculateExponentialMovingAverage(
  values: { timestamp: Date; value: number }[],
  alpha: number = 0.3
): RollingAverage {
  if (values.length === 0) {
    return { window: Math.round(2 / alpha), values: [], current: 0 };
  }

  const sorted = [...values].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const result: { timestamp: Date; value: number }[] = [];
  
  let ema = sorted[0].value;
  result.push({ timestamp: sorted[0].timestamp, value: ema });

  for (let i = 1; i < sorted.length; i++) {
    ema = alpha * sorted[i].value + (1 - alpha) * ema;
    result.push({ timestamp: sorted[i].timestamp, value: ema });
  }

  return {
    window: Math.round(2 / alpha),
    values: result,
    current: ema
  };
}

// ============================================================================
// Pattern Detection Utilities
// ============================================================================

export function detectTimePatterns<T extends { timestamp: Date }>(
  events: T[]
): TimePattern {
  const patterns: TimePattern = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  
  events.forEach(event => {
    const timeOfDay = getTimeOfDay(event.timestamp);
    patterns[timeOfDay]++;
  });

  // Normalize to percentages
  const total = events.length;
  if (total > 0) {
    patterns.morning = patterns.morning / total;
    patterns.afternoon = patterns.afternoon / total;
    patterns.evening = patterns.evening / total;
    patterns.night = patterns.night / total;
  }

  return patterns;
}

export function detectDayOfWeekPattern<T extends { timestamp: Date }>(
  events: T[]
): Record<string, number> {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const counts: Record<string, number> = {};
  days.forEach(day => counts[day] = 0);

  events.forEach(event => {
    const day = days[event.timestamp.getDay()];
    counts[day]++;
  });

  // Normalize to percentages
  const total = events.length;
  if (total > 0) {
    days.forEach(day => {
      counts[day] = counts[day] / total;
    });
  }

  return counts;
}

export function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  return denominator === 0 ? 0 : numerator / denominator;
}

// ============================================================================
// Scoring Utilities
// ============================================================================

export function calculateWeightedScore(
  scores: Record<string, number>,
  weights: Record<string, number>
): number {
  let totalWeight = 0;
  let weightedSum = 0;

  for (const [key, score] of Object.entries(scores)) {
    const weight = weights[key] || 0;
    weightedSum += score * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

export function scoreToGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

export function scoreToDescription(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Very Good';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Needs Improvement';
  return 'Concerning';
}

// ============================================================================
// Array & Collection Utilities
// ============================================================================

export function groupBy<T>(
  array: T[],
  keyFn: (item: T) => string
): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const key = keyFn(item);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

export function countBy<T>(
  array: T[],
  keyFn: (item: T) => string
): Record<string, number> {
  return array.reduce((counts, item) => {
    const key = keyFn(item);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);
}

export function mostFrequent<T>(array: T[]): T | null {
  if (array.length === 0) return null;
  
  const counts = new Map<T, number>();
  let maxCount = 0;
  let mostFrequent: T = array[0];

  for (const item of array) {
    const count = (counts.get(item) || 0) + 1;
    counts.set(item, count);
    if (count > maxCount) {
      maxCount = count;
      mostFrequent = item;
    }
  }

  return mostFrequent;
}

// ============================================================================
// Validation Utilities
// ============================================================================

export function isValidDate(date: any): date is Date {
  return date instanceof Date && !isNaN(date.getTime());
}

export function isValidNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

export function sanitizeNumber(value: any, defaultValue: number = 0): number {
  return isValidNumber(value) ? value : defaultValue;
}

// ============================================================================
// Performance Utilities
// ============================================================================

export function measureExecutionTime<T>(
  fn: () => T,
  label?: string
): { result: T; duration: number } {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  
  if (label) {
    console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
  }
  
  return { result, duration };
}

export async function measureExecutionTimeAsync<T>(
  fn: () => Promise<T>,
  label?: string
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  
  if (label) {
    console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
  }
  
  return { result, duration };
}
