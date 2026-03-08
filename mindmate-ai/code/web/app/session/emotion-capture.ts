/**
 * MindMate AI - Emotion Capture Service
 * Canvas-based emotion capture and Hume AI integration for real-time emotion analysis
 */

import {
  EmotionFrame,
  HumeEmotionResponse,
  EmotionAnalysis,
  SessionError,
  SessionErrorCode,
} from './types';

// Hume AI API configuration
const HUME_API_BASE_URL = 'https://api.hume.ai/v0';
const DEFAULT_FRAME_INTERVAL = 1000; // 1 second between frames
const DEFAULT_CAPTURE_WIDTH = 640;
const DEFAULT_CAPTURE_HEIGHT = 480;
const JPEG_QUALITY = 0.8;

// Emotion mapping for therapy context
const THERAPY_RELEVANT_EMOTIONS = [
  'anxiety',
  'calmness',
  'confusion',
  'contentment',
  'disappointment',
  'distress',
  'excitement',
  'fatigue',
  'fear',
  'frustration',
  'happiness',
  'interest',
  'sadness',
  'stress',
  'surprise',
];

// Event callbacks
interface EmotionCaptureCallbacks {
  onFrameCaptured?: (frame: EmotionFrame) => void;
  onEmotionAnalyzed?: (analysis: EmotionAnalysis) => void;
  onError?: (error: SessionError) => void;
  onEmotionSummary?: (summary: EmotionSummary) => void;
}

// Emotion summary for session insights
export interface EmotionSummary {
  sessionDuration: number;
  totalFrames: number;
  dominantEmotions: { emotion: string; count: number }[];
  averageEngagement: number;
  averageStressLevel: number;
  emotionTimeline: { timestamp: number; emotion: string; score: number }[];
}

// Configuration options
export interface EmotionCaptureConfig {
  humeApiKey: string;
  frameInterval?: number;
  captureWidth?: number;
  captureHeight?: number;
  jpegQuality?: number;
  enableContinuousAnalysis?: boolean;
  minConfidenceScore?: number;
}

export class EmotionCaptureService {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private videoElement: HTMLVideoElement | null = null;
  private config: Required<EmotionCaptureConfig>;
  private callbacks: EmotionCaptureCallbacks;
  private isCapturing: boolean = false;
  private captureInterval: number | null = null;
  private emotionHistory: EmotionAnalysis[] = [];
  private sessionStartTime: number = 0;
  private frameCount: number = 0;
  private abortController: AbortController | null = null;

  constructor(
    config: EmotionCaptureConfig,
    callbacks: EmotionCaptureCallbacks = {}
  ) {
    this.config = {
      frameInterval: DEFAULT_FRAME_INTERVAL,
      captureWidth: DEFAULT_CAPTURE_WIDTH,
      captureHeight: DEFAULT_CAPTURE_HEIGHT,
      jpegQuality: JPEG_QUALITY,
      enableContinuousAnalysis: true,
      minConfidenceScore: 0.5,
      ...config,
    };
    this.callbacks = callbacks;

    // Create canvas for frame capture
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.config.captureWidth;
    this.canvas.height = this.config.captureHeight;

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to create canvas context');
    }
    this.ctx = ctx;

    console.log('[EmotionCapture] Service initialized');
  }

  /**
   * Set the video element to capture frames from
   */
  public setVideoElement(videoElement: HTMLVideoElement): void {
    this.videoElement = videoElement;
    console.log('[EmotionCapture] Video element set');
  }

  /**
   * Start emotion capture
   */
  public start(): void {
    if (this.isCapturing) {
      console.warn('[EmotionCapture] Already capturing');
      return;
    }

    if (!this.videoElement) {
      this.handleError('No video element set for capture');
      return;
    }

    this.isCapturing = true;
    this.sessionStartTime = Date.now();
    this.frameCount = 0;
    this.emotionHistory = [];
    this.abortController = new AbortController();

    console.log('[EmotionCapture] Capture started');

    // Start capture loop
    this.captureLoop();
  }

  /**
   * Stop emotion capture
   */
  public stop(): void {
    if (!this.isCapturing) return;

    this.isCapturing = false;

    if (this.captureInterval) {
      clearTimeout(this.captureInterval);
      this.captureInterval = null;
    }

    this.abortController?.abort();
    this.abortController = null;

    // Generate summary
    const summary = this.generateSummary();
    this.callbacks.onEmotionSummary?.(summary);

    console.log('[EmotionCapture] Capture stopped');
  }

  /**
   * Capture loop - continuously capture and analyze frames
   */
  private captureLoop(): void {
    if (!this.isCapturing) return;

    this.captureAndAnalyzeFrame();

    this.captureInterval = window.setTimeout(
      () => this.captureLoop(),
      this.config.frameInterval
    );
  }

  /**
   * Capture a single frame and analyze
   */
  private async captureAndAnalyzeFrame(): Promise<void> {
    if (!this.videoElement || !this.isCapturing) return;

    // Check if video is ready
    if (this.videoElement.readyState < 2) {
      console.warn('[EmotionCapture] Video not ready');
      return;
    }

    try {
      // Draw video frame to canvas
      this.ctx.drawImage(
        this.videoElement,
        0,
        0,
        this.config.captureWidth,
        this.config.captureHeight
      );

      // Convert to base64 JPEG
      const frameData = this.canvas.toDataURL(
        'image/jpeg',
        this.config.jpegQuality
      );

      this.frameCount++;

      const frame: EmotionFrame = {
        timestamp: Date.now(),
        frameData,
        width: this.config.captureWidth,
        height: this.config.captureHeight,
      };

      this.callbacks.onFrameCaptured?.(frame);

      // Analyze if continuous analysis is enabled
      if (this.config.enableContinuousAnalysis) {
        await this.analyzeFrame(frame);
      }
    } catch (error) {
      console.error('[EmotionCapture] Frame capture error:', error);
    }
  }

  /**
   * Analyze a frame using Hume AI API
   */
  public async analyzeFrame(frame: EmotionFrame): Promise<EmotionAnalysis | null> {
    try {
      // Extract base64 data (remove data:image/jpeg;base64, prefix)
      const base64Data = frame.frameData.split(',')[1];

      // Call Hume AI API
      const response = await fetch(`${HUME_API_BASE_URL}/batch/jobs`, {
        method: 'POST',
        headers: {
          'X-Hume-Api-Key': this.config.humeApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          models: {
            face: {
              fps_pred: 1,
              prob_threshold: 0.5,
              identify_faces: false,
            },
          },
          data: [
            {
              type: 'base64',
              data: base64Data,
            },
          ],
        }),
        signal: this.abortController?.signal,
      });

      if (!response.ok) {
        throw new Error(`Hume API error: ${response.status} ${response.statusText}`);
      }

      const result: HumeEmotionResponse = await response.json();

      if (result.error) {
        throw new Error(`Hume API error: ${result.error}`);
      }

      // Process emotion predictions
      const analysis = this.processEmotionResult(result, frame.timestamp);

      if (analysis) {
        this.emotionHistory.push(analysis);
        this.callbacks.onEmotionAnalyzed?.(analysis);
      }

      return analysis;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        this.handleError('Failed to analyze frame', error);
      }
      return null;
    }
  }

  /**
   * Process Hume AI emotion result into analysis
   */
  private processEmotionResult(
    result: HumeEmotionResponse,
    timestamp: number
  ): EmotionAnalysis | null {
    if (!result.predictions || result.predictions.length === 0) {
      return null;
    }

    // Get the first face prediction (primary face)
    const prediction = result.predictions[0];
    
    if (!prediction.emotions || prediction.emotions.length === 0) {
      return null;
    }

    // Convert to record
    const emotionScores: Record<string, number> = {};
    prediction.emotions.forEach((emotion) => {
      emotionScores[emotion.name] = emotion.score;
    });

    // Find dominant emotion
    const dominantEmotion = prediction.emotions.reduce((prev, current) =>
      prev.score > current.score ? prev : current
    );

    // Calculate engagement score (based on expressiveness)
    const engagementScore = this.calculateEngagementScore(prediction.emotions);

    // Calculate stress level
    const stressLevel = this.calculateStressLevel(emotionScores);

    return {
      timestamp,
      dominantEmotion: dominantEmotion.name,
      emotionScores,
      engagementScore,
      stressLevel,
    };
  }

  /**
   * Calculate engagement score based on emotion expressiveness
   */
  private calculateEngagementScore(emotions: { name: string; score: number }[]): number {
    // Higher variance in emotion scores indicates higher engagement
    const scores = emotions.map((e) => e.score);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
    
    // Normalize to 0-1 scale
    return Math.min(variance * 10, 1);
  }

  /**
   * Calculate stress level from emotion scores
   */
  private calculateStressLevel(emotionScores: Record<string, number>): number {
    const stressIndicators = ['anxiety', 'distress', 'stress', 'fear', 'frustration'];
    const calmIndicators = ['calmness', 'contentment', 'happiness'];

    let stressScore = 0;
    let calmScore = 0;

    stressIndicators.forEach((emotion) => {
      if (emotionScores[emotion]) {
        stressScore += emotionScores[emotion];
      }
    });

    calmIndicators.forEach((emotion) => {
      if (emotionScores[emotion]) {
        calmScore += emotionScores[emotion];
      }
    });

    // Normalize to 0-1 scale
    const normalizedStress = Math.min(stressScore / stressIndicators.length, 1);
    const normalizedCalm = Math.min(calmScore / calmIndicators.length, 1);

    return Math.max(0, normalizedStress - normalizedCalm * 0.5);
  }

  /**
   * Capture a single frame (manual trigger)
   */
  public captureSingleFrame(): EmotionFrame | null {
    if (!this.videoElement || this.videoElement.readyState < 2) {
      return null;
    }

    try {
      this.ctx.drawImage(
        this.videoElement,
        0,
        0,
        this.config.captureWidth,
        this.config.captureHeight
      );

      const frameData = this.canvas.toDataURL(
        'image/jpeg',
        this.config.jpegQuality
      );

      return {
        timestamp: Date.now(),
        frameData,
        width: this.config.captureWidth,
        height: this.config.captureHeight,
      };
    } catch (error) {
      console.error('[EmotionCapture] Single frame capture error:', error);
      return null;
    }
  }

  /**
   * Get emotion history
   */
  public getEmotionHistory(): EmotionAnalysis[] {
    return [...this.emotionHistory];
  }

  /**
   * Get current emotion state
   */
  public getCurrentEmotionState(): EmotionAnalysis | null {
    if (this.emotionHistory.length === 0) return null;
    return this.emotionHistory[this.emotionHistory.length - 1];
  }

  /**
   * Generate emotion summary for the session
   */
  private generateSummary(): EmotionSummary {
    const sessionDuration = Date.now() - this.sessionStartTime;
    
    // Count dominant emotions
    const emotionCounts: Record<string, number> = {};
    const emotionTimeline: { timestamp: number; emotion: string; score: number }[] = [];
    
    let totalEngagement = 0;
    let totalStress = 0;

    this.emotionHistory.forEach((analysis) => {
      // Count dominant emotions
      emotionCounts[analysis.dominantEmotion] = 
        (emotionCounts[analysis.dominantEmotion] || 0) + 1;

      // Build timeline
      emotionTimeline.push({
        timestamp: analysis.timestamp,
        emotion: analysis.dominantEmotion,
        score: analysis.emotionScores[analysis.dominantEmotion] || 0,
      });

      // Accumulate scores
      totalEngagement += analysis.engagementScore;
      totalStress += analysis.stressLevel;
    });

    // Sort emotions by count
    const dominantEmotions = Object.entries(emotionCounts)
      .map(([emotion, count]) => ({ emotion, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const totalFrames = this.emotionHistory.length;

    return {
      sessionDuration,
      totalFrames,
      dominantEmotions,
      averageEngagement: totalFrames > 0 ? totalEngagement / totalFrames : 0,
      averageStressLevel: totalFrames > 0 ? totalStress / totalFrames : 0,
      emotionTimeline,
    };
  }

  /**
   * Get therapy-relevant emotion insights
   */
  public getTherapyInsights(): {
    currentMood: string;
    stressTrend: 'increasing' | 'decreasing' | 'stable';
    engagementLevel: 'high' | 'medium' | 'low';
    recommendations: string[];
  } {
    const summary = this.generateSummary();
    const recentAnalyses = this.emotionHistory.slice(-10);

    // Determine current mood
    const currentMood = summary.dominantEmotions[0]?.emotion || 'neutral';

    // Calculate stress trend
    let stressTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (recentAnalyses.length >= 5) {
      const firstHalf = recentAnalyses.slice(0, Math.floor(recentAnalyses.length / 2));
      const secondHalf = recentAnalyses.slice(Math.floor(recentAnalyses.length / 2));
      
      const firstAvg = firstHalf.reduce((a, b) => a + b.stressLevel, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b.stressLevel, 0) / secondHalf.length;
      
      if (secondAvg > firstAvg * 1.2) {
        stressTrend = 'increasing';
      } else if (secondAvg < firstAvg * 0.8) {
        stressTrend = 'decreasing';
      }
    }

    // Determine engagement level
    let engagementLevel: 'high' | 'medium' | 'low' = 'medium';
    if (summary.averageEngagement > 0.6) {
      engagementLevel = 'high';
    } else if (summary.averageEngagement < 0.3) {
      engagementLevel = 'low';
    }

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (stressTrend === 'increasing') {
      recommendations.push('Consider taking a moment to breathe and ground yourself');
    }
    
    if (engagementLevel === 'low') {
      recommendations.push('Try to engage more with the conversation');
    }
    
    if (currentMood === 'distress' || currentMood === 'anxiety') {
      recommendations.push('It might help to share what you\'re feeling right now');
    }

    return {
      currentMood,
      stressTrend,
      engagementLevel,
      recommendations,
    };
  }

  /**
   * Handle errors
   */
  private handleError(message: string, error?: unknown): void {
    console.error('[EmotionCapture]', message, error);

    const sessionError: SessionError = {
      code: SessionErrorCode.HUME_API_ERROR,
      message,
      details: error,
      timestamp: Date.now(),
    };

    this.callbacks.onError?.(sessionError);
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<EmotionCaptureConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Update canvas size if needed
    if (config.captureWidth || config.captureHeight) {
      this.canvas.width = this.config.captureWidth;
      this.canvas.height = this.config.captureHeight;
    }
  }

  /**
   * Check if capturing
   */
  public getIsCapturing(): boolean {
    return this.isCapturing;
  }

  /**
   * Get capture statistics
   */
  public getStats(): {
    isCapturing: boolean;
    frameCount: number;
    sessionDuration: number;
    historyLength: number;
  } {
    return {
      isCapturing: this.isCapturing,
      frameCount: this.frameCount,
      sessionDuration: this.isCapturing ? Date.now() - this.sessionStartTime : 0,
      historyLength: this.emotionHistory.length,
    };
  }

  /**
   * Cleanup resources
   */
  public dispose(): void {
    this.stop();
    this.videoElement = null;
    console.log('[EmotionCapture] Service disposed');
  }
}

export default EmotionCaptureService;
