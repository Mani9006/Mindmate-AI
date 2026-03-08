/**
 * Session Model - MindMate AI
 * Manages therapy session data, transcripts, and metadata
 */

const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    emotionDetected: {
      type: String,
      enum: ['neutral', 'happy', 'sad', 'anxious', 'angry', 'fearful', 'surprised', 'disgusted', null],
      default: null
    },
    emotionConfidence: {
      type: Number,
      min: 0,
      max: 1,
      default: null
    },
    responseTimeMs: {
      type: Number,
      default: null
    },
    tokensUsed: {
      prompt: { type: Number, default: 0 },
      completion: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    modelVersion: {
      type: String,
      default: null
    }
  }
}, { _id: false });

const SessionSchema = new mongoose.Schema({
  // Session Identification
  _id: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  
  // Session Status
  status: {
    type: String,
    enum: ['active', 'paused', 'ended', 'archived'],
    default: 'active',
    index: true
  },
  
  // Timestamps
  startedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  endedAt: {
    type: Date,
    default: null
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  },
  
  // Session Configuration
  config: {
    therapyMode: {
      type: String,
      enum: ['cbt', 'dbt', 'act', 'general', 'crisis', 'mindfulness'],
      default: 'general'
    },
    language: {
      type: String,
      default: 'en'
    },
    aiPersona: {
      type: String,
      enum: ['empathetic', 'professional', 'casual', 'directive'],
      default: 'empathetic'
    },
    sessionGoals: [{
      type: String
    }],
    maxDuration: {
      type: Number, // in minutes
      default: 60
    }
  },
  
  // AI Context
  aiContext: {
    systemPrompt: {
      type: String,
      required: true
    },
    conversationHistory: [MessageSchema],
    userContext: {
      previousSessions: [{
        sessionId: String,
        date: Date,
        summary: String
      }],
      knownIssues: [String],
      copingStrategies: [String],
      triggers: [String],
      medications: [{
        name: String,
        dosage: String,
        frequency: String
      }]
    },
    sessionInsights: {
      topicsDiscussed: [String],
      techniquesUsed: [String],
      progressIndicators: [String]
    }
  },
  
  // Transcript
  transcript: [MessageSchema],
  
  // Session Summary (generated on end)
  summary: {
    generatedAt: {
      type: Date,
      default: null
    },
    keyPoints: [{
      type: String
    }],
    emotionalJourney: [{
      timestamp: Date,
      emotion: String,
      intensity: Number
    }],
    techniquesIntroduced: [{
      name: String,
      description: String,
      effectiveness: {
        type: Number,
        min: 1,
        max: 5
      }
    }],
    actionItems: [{
      description: String,
      priority: {
        type: String,
        enum: ['low', 'medium', 'high']
      },
      completed: {
        type: Boolean,
        default: false
      }
    }],
    insights: [{
      type: String
    }],
    progressAssessment: {
      type: String,
      enum: ['regressed', 'stable', 'improved', 'significantly_improved'],
      default: 'stable'
    },
    recommendedFollowUp: {
      type: String,
      default: null
    },
    rawSummary: {
      type: String,
      default: null
    }
  },
  
  // Metrics
  metrics: {
    messageCount: {
      user: { type: Number, default: 0 },
      assistant: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    durationMinutes: {
      type: Number,
      default: 0
    },
    averageResponseTimeMs: {
      type: Number,
      default: 0
    },
    totalTokensUsed: {
      type: Number,
      default: 0
    },
    userEngagementScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  
  // Flags
  flags: {
    isCrisis: {
      type: Boolean,
      default: false
    },
    crisisDetectedAt: {
      type: Date,
      default: null
    },
    requiresFollowUp: {
      type: Boolean,
      default: false
    },
    isPrivate: {
      type: Boolean,
      default: false
    },
    exportedAt: {
      type: Date,
      default: null
    }
  },
  
  // Metadata
  metadata: {
    userAgent: String,
    ipAddress: String,
    deviceType: {
      type: String,
      enum: ['mobile', 'tablet', 'desktop', 'unknown'],
      default: 'unknown'
    },
    source: {
      type: String,
      enum: ['web', 'mobile_app', 'api', 'widget'],
      default: 'web'
    }
  }
}, {
  timestamps: true,
  collection: 'sessions'
});

// Indexes for common queries
SessionSchema.index({ userId: 1, startedAt: -1 });
SessionSchema.index({ userId: 1, status: 1 });
SessionSchema.index({ status: 1, lastActivityAt: -1 });
SessionSchema.index({ 'flags.isCrisis': 1 });

// Virtual for session duration
SessionSchema.virtual('currentDurationMinutes').get(function() {
  const end = this.endedAt || new Date();
  return Math.floor((end - this.startedAt) / 60000);
});

// Pre-save middleware to update lastActivityAt
SessionSchema.pre('save', function(next) {
  if (this.isModified('transcript')) {
    this.lastActivityAt = new Date();
    this.metrics.messageCount.total = this.transcript.length;
    this.metrics.messageCount.user = this.transcript.filter(m => m.role === 'user').length;
    this.metrics.messageCount.assistant = this.transcript.filter(m => m.role === 'assistant').length;
  }
  next();
});

// Instance Methods
SessionSchema.methods.addMessage = function(message) {
  const msg = {
    id: message.id || require('crypto').randomUUID(),
    role: message.role,
    content: message.content,
    timestamp: message.timestamp || new Date(),
    metadata: message.metadata || {}
  };
  
  this.transcript.push(msg);
  this.aiContext.conversationHistory.push(msg);
  this.lastActivityAt = new Date();
  
  return msg;
};

SessionSchema.methods.endSession = function(summary = null) {
  this.status = 'ended';
  this.endedAt = new Date();
  
  if (summary) {
    this.summary = { ...this.summary, ...summary };
  }
  
  // Calculate final metrics
  this.metrics.durationMinutes = this.currentDurationMinutes;
  
  return this;
};

SessionSchema.methods.getRecentContext = function(messageCount = 10) {
  return this.aiContext.conversationHistory.slice(-messageCount);
};

SessionSchema.methods.toSummary = function() {
  return {
    id: this._id,
    userId: this.userId,
    status: this.status,
    startedAt: this.startedAt,
    endedAt: this.endedAt,
    durationMinutes: this.metrics.durationMinutes,
    messageCount: this.metrics.messageCount.total,
    therapyMode: this.config.therapyMode,
    hasSummary: !!this.summary.generatedAt
  };
};

// Static Methods
SessionSchema.statics.findActiveByUser = function(userId) {
  return this.findOne({ userId, status: 'active' }).sort({ startedAt: -1 });
};

SessionSchema.statics.findByUser = function(userId, options = {}) {
  const { limit = 20, offset = 0, status } = options;
  const query = { userId };
  if (status) query.status = status;
  
  return this.find(query)
    .sort({ startedAt: -1 })
    .skip(offset)
    .limit(limit);
};

SessionSchema.statics.getUserSessionStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        totalDuration: { $sum: '$metrics.durationMinutes' },
        totalMessages: { $sum: '$metrics.messageCount.total' },
        avgDuration: { $avg: '$metrics.durationMinutes' },
        crisisCount: { 
          $sum: { $cond: ['$flags.isCrisis', 1, 0] }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalSessions: 0,
    totalDuration: 0,
    totalMessages: 0,
    avgDuration: 0,
    crisisCount: 0
  };
};

module.exports = mongoose.model('Session', SessionSchema);
