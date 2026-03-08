/**
 * Emotion Detection Service for MindMate AI Video Session
 * Handles real-time emotion detection from video frames and data transmission
 */

import { EventEmitter } from 'events';
import { webRTCService, EmotionData } from './webrtc.service';

// Emotion types
export type EmotionType = 
  | 'neutral' 
  | 'happy' 
  | 'sad' 
  | 'angry' 
  | 'fearful' 
  | 'disgusted' 
  | 'surprised';

// Emotion detection result
export interface EmotionDetectionResult {
  emotions: Record<EmotionType, number>;
  dominantEmotion: EmotionType;
  confidence: number;
  faceDetected: boolean;
  facePosition?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Service configuration
interface EmotionServiceConfig {
  detectionInterval: number; // ms
  confidenceThreshold: number;
  sendToServer: boolean;
  useCloudAPI: boolean;
  cloudAPIEndpoint?: string;
}

const DEFAULT_CONFIG: EmotionServiceConfig = {
  detectionInterval: 500, // 500ms = 2 FPS
  confidenceThreshold: 0.6,
  sendToServer: true,
  useCloudAPI: true,
  cloudAPIEndpoint: process.env.EMOTION_API_ENDPOINT || 'https://api.mindmate.ai/v1/emotion',
};

export class EmotionService extends EventEmitter {
  private config: EmotionServiceConfig;
  private isRunning: boolean = false;
  private detectionInterval: NodeJS.Timeout | null = null;
  private lastEmotionData: EmotionDetectionResult | null = null;
  private emotionHistory: EmotionDetectionResult[] = [];
  private readonly maxHistorySize: number = 60; // 30 seconds at 2 FPS

  constructor(config: Partial<EmotionServiceConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start emotion detection
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.emit('started');

    // Start detection loop
    this.detectionInterval = setInterval(() => {
      this.detectEmotion();
    }, this.config.detectionInterval);

    console.log('Emotion detection started');
  }

  /**
   * Stop emotion detection
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;

    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }

    this.emit('stopped');
    console.log('Emotion detection stopped');
  }

  /**
   * Main emotion detection method
   * Uses cloud API or local processing based on configuration
   */
  private async detectEmotion(): Promise<void> {
    try {
      let result: EmotionDetectionResult;

      if (this.config.useCloudAPI) {
        result = await this.detectEmotionCloud();
      } else {
        result = await this.detectEmotionLocal();
      }

      // Store in history
      this.addToHistory(result);

      // Update last emotion data
      this.lastEmotionData = result;

      // Emit detection result
      this.emit('emotionDetected', result);

      // Send to server if enabled and face detected
      if (this.config.sendToServer && result.faceDetected) {
        this.sendEmotionToServer(result);
      }

      // Emit dominant emotion change
      if (this.emotionHistory.length > 1) {
        const prevEmotion = this.emotionHistory[this.emotionHistory.length - 2]?.dominantEmotion;
        if (prevEmotion !== result.dominantEmotion) {
          this.emit('emotionChanged', {
            from: prevEmotion,
            to: result.dominantEmotion,
            confidence: result.confidence,
          });
        }
      }
    } catch (error) {
      console.error('Emotion detection error:', error);
      this.emit('detectionError', error);
    }
  }

  /**
   * Detect emotion using cloud API
   */
  private async detectEmotionCloud(): Promise<EmotionDetectionResult> {
    // In production, this would capture a frame and send to cloud API
    // For now, return simulated data for development
    
    // TODO: Implement actual frame capture and API call
    // const frame = await this.captureFrame();
    // const result = await this.callEmotionAPI(frame);
    
    return this.getSimulatedEmotionData();
  }

  /**
   * Detect emotion using local processing
   * (Would use TensorFlow Lite or similar on-device ML)
   */
  private async detectEmotionLocal(): Promise<EmotionDetectionResult> {
    // TODO: Implement local emotion detection using TensorFlow Lite
    // This would require loading a pre-trained model
    
    return this.getSimulatedEmotionData();
  }

  /**
   * Call emotion detection API
   */
  private async callEmotionAPI(frameData: string): Promise<EmotionDetectionResult> {
    const response = await fetch(this.config.cloudAPIEndpoint!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.EMOTION_API_KEY}`,
      },
      body: JSON.stringify({
        frame: frameData,
        timestamp: Date.now(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Emotion API error: ${response.status}`);
    }

    const data = await response.json();
    return this.parseEmotionResult(data);
  }

  /**
   * Parse emotion API response
   */
  private parseEmotionResult(data: any): EmotionDetectionResult {
    const emotions: Record<EmotionType, number> = {
      neutral: data.emotions.neutral || 0,
      happy: data.emotions.happy || 0,
      sad: data.emotions.sad || 0,
      angry: data.emotions.angry || 0,
      fearful: data.emotions.fearful || 0,
      disgusted: data.emotions.disgusted || 0,
      surprised: data.emotions.surprised || 0,
    };

    // Find dominant emotion
    const dominantEmotion = Object.entries(emotions)
      .reduce((a, b) => emotions[a[0] as EmotionType] > emotions[b[0] as EmotionType] ? a : b)[0] as EmotionType;

    return {
      emotions,
      dominantEmotion,
      confidence: Math.max(...Object.values(emotions)),
      faceDetected: data.faceDetected || true,
      facePosition: data.facePosition,
    };
  }

  /**
   * Send emotion data to server via WebRTC data channel
   */
  private sendEmotionToServer(result: EmotionDetectionResult): void {
    const emotionData: EmotionData = {
      timestamp: Date.now(),
      emotions: result.emotions,
      dominantEmotion: result.dominantEmotion,
      confidence: result.confidence,
    };

    const sent = webRTCService.sendEmotionData(emotionData);
    
    if (sent) {
      this.emit('emotionSent', emotionData);
    }
  }

  /**
   * Add emotion result to history
   */
  private addToHistory(result: EmotionDetectionResult): void {
    this.emotionHistory.push(result);
    
    // Keep history within limit
    if (this.emotionHistory.length > this.maxHistorySize) {
      this.emotionHistory.shift();
    }
  }

  /**
   * Get simulated emotion data for development/testing
   */
  private getSimulatedEmotionData(): EmotionDetectionResult {
    // Simulate realistic emotion distribution
    const baseEmotions: Record<EmotionType, number> = {
      neutral: 0.4 + Math.random() * 0.3,
      happy: Math.random() * 0.3,
      sad: Math.random() * 0.15,
      angry: Math.random() * 0.1,
      fearful: Math.random() * 0.1,
      disgusted: Math.random() * 0.05,
      surprised: Math.random() * 0.15,
    };

    // Normalize to sum to 1
    const sum = Object.values(baseEmotions).reduce((a, b) => a + b, 0);
    const emotions: Record<EmotionType, number> = {
      neutral: baseEmotions.neutral / sum,
      happy: baseEmotions.happy / sum,
      sad: baseEmotions.sad / sum,
      angry: baseEmotions.angry / sum,
      fearful: baseEmotions.fearful / sum,
      disgusted: baseEmotions.disgusted / sum,
      surprised: baseEmotions.surprised / sum,
    };

    // Find dominant emotion
    const dominantEmotion = Object.entries(emotions)
      .reduce((a, b) => emotions[a[0] as EmotionType] > emotions[b[0] as EmotionType] ? a : b)[0] as EmotionType;

    return {
      emotions,
      dominantEmotion,
      confidence: emotions[dominantEmotion],
      faceDetected: Math.random() > 0.1, // 90% face detection rate
      facePosition: {
        x: 0.3 + Math.random() * 0.4,
        y: 0.2 + Math.random() * 0.4,
        width: 0.2 + Math.random() * 0.1,
        height: 0.25 + Math.random() * 0.1,
      },
    };
  }

  /**
   * Get current emotion data
   */
  getCurrentEmotion(): EmotionDetectionResult | null {
    return this.lastEmotionData;
  }

  /**
   * Get emotion history
   */
  getEmotionHistory(): EmotionDetectionResult[] {
    return [...this.emotionHistory];
  }

  /**
   * Get emotion statistics over time
   */
  getEmotionStats(): {
    averageEmotions: Record<EmotionType, number>;
    dominantEmotionCounts: Record<EmotionType, number>;
    emotionChanges: number;
  } {
    if (this.emotionHistory.length === 0) {
      return {
        averageEmotions: {
          neutral: 0, happy: 0, sad: 0, angry: 0,
          fearful: 0, disgusted: 0, surprised: 0,
        },
        dominantEmotionCounts: {
          neutral: 0, happy: 0, sad: 0, angry: 0,
          fearful: 0, disgusted: 0, surprised: 0,
        },
        emotionChanges: 0,
      };
    }

    // Calculate average emotions
    const sumEmotions: Record<EmotionType, number> = {
      neutral: 0, happy: 0, sad: 0, angry: 0,
      fearful: 0, disgusted: 0, surprised: 0,
    };

    const dominantCounts: Record<EmotionType, number> = {
      neutral: 0, happy: 0, sad: 0, angry: 0,
      fearful: 0, disgusted: 0, surprised: 0,
    };

    let emotionChanges = 0;
    let prevEmotion: EmotionType | null = null;

    for (const result of this.emotionHistory) {
      (Object.keys(result.emotions) as EmotionType[]).forEach((emotion) => {
        sumEmotions[emotion] += result.emotions[emotion];
      });

      dominantCounts[result.dominantEmotion]++;

      if (prevEmotion && prevEmotion !== result.dominantEmotion) {
        emotionChanges++;
      }
      prevEmotion = result.dominantEmotion;
    }

    const count = this.emotionHistory.length;
    const averageEmotions: Record<EmotionType, number> = {
      neutral: sumEmotions.neutral / count,
      happy: sumEmotions.happy / count,
      sad: sumEmotions.sad / count,
      angry: sumEmotions.angry / count,
      fearful: sumEmotions.fearful / count,
      disgusted: sumEmotions.disgusted / count,
      surprised: sumEmotions.surprised / count,
    };

    return {
      averageEmotions,
      dominantEmotionCounts: dominantCounts,
      emotionChanges,
    };
  }

  /**
   * Update service configuration
   */
  updateConfig(newConfig: Partial<EmotionServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart if interval changed and running
    if (newConfig.detectionInterval && this.isRunning) {
      this.stop();
      this.start();
    }
  }

  /**
   * Check if service is running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Clear emotion history
   */
  clearHistory(): void {
    this.emotionHistory = [];
    this.lastEmotionData = null;
  }
}

// Export singleton instance
export const emotionService = new EmotionService();
export default emotionService;
