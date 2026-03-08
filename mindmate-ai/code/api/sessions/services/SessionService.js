/**
 * Session Service - MindMate AI
 * Business logic for session management
 */

const { v4: uuidv4 } = require('uuid');
const Session = require('../models/Session');
const AIClient = require('../utils/aiClient');
const {
  SessionNotFoundError,
  InvalidSessionStateError,
  AIError,
  ValidationAppError
} = require('../middleware/errorHandler');

class SessionService {
  constructor(aiConfig = {}) {
    this.aiClient = new AIClient(aiConfig);
  }

  /**
   * Create a new therapy session
   */
  async createSession(userId, options = {}) {
    const {
      therapyMode = 'general',
      language = 'en',
      aiPersona = 'empathetic',
      sessionGoals = [],
      maxDuration = 60,
      userContext = {},
      metadata = {}
    } = options;

    // Generate session ID
    const sessionId = uuidv4();

    // Generate system prompt for AI
    const systemPrompt = this.aiClient.generateSystemPrompt(
      { therapyMode, aiPersona, sessionGoals },
      userContext
    );

    // Create session document
    const session = new Session({
      _id: sessionId,
      userId,
      status: 'active',
      startedAt: new Date(),
      lastActivityAt: new Date(),
      config: {
        therapyMode,
        language,
        aiPersona,
        sessionGoals,
        maxDuration
      },
      aiContext: {
        systemPrompt,
        conversationHistory: [],
        userContext: {
          previousSessions: userContext.previousSessions || [],
          knownIssues: userContext.knownIssues || [],
          copingStrategies: userContext.copingStrategies || [],
          triggers: userContext.triggers || [],
          medications: userContext.medications || []
        },
        sessionInsights: {
          topicsDiscussed: [],
          techniquesUsed: [],
          progressIndicators: []
        }
      },
      transcript: [],
      metadata: {
        userAgent: metadata.userAgent,
        ipAddress: metadata.ipAddress,
        deviceType: metadata.deviceType || 'unknown',
        source: metadata.source || 'web'
      }
    });

    await session.save();

    // Add welcome message from AI
    const welcomeMessage = await this.generateWelcomeMessage(session);
    session.addMessage({
      id: uuidv4(),
      role: 'assistant',
      content: welcomeMessage,
      timestamp: new Date()
    });

    await session.save();

    return session;
  }

  /**
   * Generate welcome message based on session configuration
   */
  async generateWelcomeMessage(session) {
    const { therapyMode, aiPersona, sessionGoals } = session.config;
    
    const welcomeMessages = {
      cbt: "Hello! I'm here to help you work through your thoughts using Cognitive Behavioral Therapy techniques. Together, we can identify patterns and develop healthier ways of thinking. How are you feeling today?",
      
      dbt: "Welcome! I'm here to support you with DBT skills - whether it's mindfulness, managing intense emotions, or navigating relationships. What would you like to focus on today?",
      
      act: "Hello! I'm here to help you build psychological flexibility and live according to your values. Let's explore what matters most to you. How are you doing right now?",
      
      mindfulness: "Welcome to your mindfulness session. Let's take a moment to center ourselves. How are you feeling in this present moment?",
      
      crisis: "I'm here with you right now. You're not alone. Can you tell me what's happening and how you're feeling?",
      
      general: "Hello! I'm MindMate AI, and I'm here to listen and support you. This is a safe, judgment-free space. How are you doing today?"
    };

    let welcome = welcomeMessages[therapyMode] || welcomeMessages.general;

    // Add personalized touch if session goals are set
    if (sessionGoals && sessionGoals.length > 0) {
      welcome += ` I see you'd like to focus on ${sessionGoals[0].toLowerCase()}. `;
    }

    return welcome;
  }

  /**
   * Send message and get AI response
   */
  async sendMessage(sessionId, userId, messageContent, metadata = {}) {
    // Find and validate session
    const session = await Session.findById(sessionId);
    
    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }

    if (session.userId !== userId) {
      throw new ValidationAppError('You do not have permission to access this session');
    }

    if (session.status !== 'active') {
      throw new InvalidSessionStateError(session.status, 'active');
    }

    // Check if session has exceeded max duration
    const sessionDuration = Math.floor((Date.now() - session.startedAt) / 60000);
    if (sessionDuration > session.config.maxDuration) {
      session.status = 'ended';
      session.endedAt = new Date();
      await session.save();
      throw new InvalidSessionStateError('ended', 'active');
    }

    // Detect emotion and crisis in user message
    const [emotionResult, crisisResult] = await Promise.all([
      this.aiClient.detectEmotion(messageContent),
      this.aiClient.detectCrisis(messageContent)
    ]);

    // Handle crisis detection
    if (crisisResult.isCrisis && crisisResult.confidence > 0.6) {
      session.flags.isCrisis = true;
      session.flags.crisisDetectedAt = new Date();
      session.flags.requiresFollowUp = true;
    }

    // Add user message to transcript
    const userMessage = session.addMessage({
      id: uuidv4(),
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
      metadata: {
        emotionDetected: emotionResult.emotion,
        emotionConfidence: emotionResult.confidence,
        ...metadata
      }
    });

    // Get AI response
    const startTime = Date.now();
    
    try {
      const aiResponse = await this.aiClient.sendMessage({
        systemPrompt: session.aiContext.systemPrompt,
        conversationHistory: session.aiContext.conversationHistory.slice(0, -1), // Exclude the message we just added
        message: { content: messageContent },
        temperature: 0.7,
        maxTokens: 1000
      });

      const responseTime = Date.now() - startTime;

      // Add AI response to transcript
      const assistantMessage = session.addMessage({
        id: aiResponse.id,
        role: 'assistant',
        content: aiResponse.content,
        timestamp: aiResponse.timestamp,
        metadata: {
          responseTimeMs: responseTime,
          tokensUsed: aiResponse.metadata.tokensUsed,
          modelVersion: aiResponse.metadata.modelVersion
        }
      });

      // Update metrics
      session.metrics.averageResponseTimeMs = 
        (session.metrics.averageResponseTimeMs * (session.metrics.messageCount.assistant - 1) + responseTime) / 
        session.metrics.messageCount.assistant;
      
      session.metrics.totalTokensUsed += aiResponse.metadata.tokensUsed?.total || 0;
      
      // Calculate engagement score
      session.metrics.userEngagementScore = this.calculateEngagementScore(session);

      // Update session insights
      this.updateSessionInsights(session, messageContent, aiResponse.content);

      await session.save();

      // If crisis detected, append crisis resources to response
      let responseContent = aiResponse.content;
      if (crisisResult.isCrisis && crisisResult.confidence > 0.6) {
        responseContent += this.getCrisisResources();
      }

      return {
        message: {
          id: assistantMessage.id,
          role: 'assistant',
          content: responseContent,
          timestamp: assistantMessage.timestamp,
          metadata: assistantMessage.metadata
        },
        session: {
          id: session._id,
          status: session.status,
          flags: session.flags,
          metrics: {
            messageCount: session.metrics.messageCount,
            durationMinutes: sessionDuration
          }
        }
      };

    } catch (error) {
      console.error('AI response error:', error);
      throw new AIError('Failed to get AI response', error);
    }
  }

  /**
   * Get crisis resources message
   */
  getCrisisResources() {
    return `

---

**If you're in immediate danger or having thoughts of harming yourself, please reach out for help:**

- **988 Suicide & Crisis Lifeline** (US): Call or text 988
- **Crisis Text Line**: Text HOME to 741741
- **Emergency Services**: Call 911 (US) or your local emergency number
- **International Resources**: [findahelpline.com](https://findahelpline.com)

You don't have to go through this alone. Help is available 24/7.`;
  }

  /**
   * Calculate user engagement score
   */
  calculateEngagementScore(session) {
    const messageCount = session.metrics.messageCount.user;
    const avgMessageLength = session.transcript
      .filter(m => m.role === 'user')
      .reduce((sum, m) => sum + m.content.length, 0) / (messageCount || 1);
    
    const timeSinceStart = (Date.now() - session.startedAt) / 60000;
    const messageFrequency = messageCount / (timeSinceStart || 1);

    // Score based on message count, length, and frequency
    let score = Math.min(messageCount * 5, 40); // Up to 40 points for message count
    score += Math.min(avgMessageLength / 10, 30); // Up to 30 points for message length
    score += Math.min(messageFrequency * 10, 30); // Up to 30 points for frequency

    return Math.min(Math.round(score), 100);
  }

  /**
   * Update session insights based on conversation
   */
  updateSessionInsights(session, userMessage, aiResponse) {
    const insights = session.aiContext.sessionInsights;
    
    // Simple keyword-based topic detection (can be enhanced with NLP)
    const topicKeywords = {
      anxiety: ['anxious', 'worried', 'nervous', 'panic', 'stress'],
      depression: ['sad', 'depressed', 'hopeless', 'empty', 'numb'],
      relationships: ['relationship', 'partner', 'family', 'friend', 'conflict'],
      work: ['work', 'job', 'career', 'boss', 'coworker'],
      sleep: ['sleep', 'insomnia', 'tired', 'exhausted'],
      trauma: ['trauma', 'ptsd', 'flashback', 'nightmare'],
      selfesteem: ['worthless', 'inadequate', 'failure', 'confidence']
    };

    const lowerMessage = userMessage.toLowerCase();
    
    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some(kw => lowerMessage.includes(kw)) && !insights.topicsDiscussed.includes(topic)) {
        insights.topicsDiscussed.push(topic);
      }
    });

    // Detect techniques mentioned by AI
    const techniquePatterns = [
      { name: 'Deep Breathing', pattern: /breath|breathe|breathing/i },
      { name: 'Grounding', pattern: /ground|grounding|5-4-3-2-1/i },
      { name: 'Cognitive Restructuring', pattern: /thought|thinking pattern|cognitive/i },
      { name: 'Mindfulness', pattern: /mindful|present moment|awareness/i },
      { name: 'Progressive Muscle Relaxation', pattern: /muscle|relax|tension/i },
      { name: 'Journaling', pattern: /journal|write|writing/i }
    ];

    techniquePatterns.forEach(technique => {
      if (technique.pattern.test(aiResponse) && !insights.techniquesUsed.includes(technique.name)) {
        insights.techniquesUsed.push(technique.name);
      }
    });
  }

  /**
   * End a session and optionally generate summary
   */
  async endSession(sessionId, userId, options = {}) {
    const { generateSummary = true } = options;

    const session = await Session.findById(sessionId);
    
    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }

    if (session.userId !== userId) {
      throw new ValidationAppError('You do not have permission to access this session');
    }

    if (session.status === 'ended' || session.status === 'archived') {
      return session; // Already ended
    }

    // Update session status
    session.status = 'ended';
    session.endedAt = new Date();
    session.metrics.durationMinutes = Math.floor(
      (session.endedAt - session.startedAt) / 60000
    );

    // Add closing message
    const closingMessage = this.generateClosingMessage(session);
    session.addMessage({
      id: uuidv4(),
      role: 'assistant',
      content: closingMessage,
      timestamp: new Date()
    });

    // Generate summary if requested
    if (generateSummary && session.transcript.length > 2) {
      try {
        const summaryData = await this.aiClient.generateSessionSummary(session);
        session.summary = {
          generatedAt: new Date(),
          ...summaryData
        };
      } catch (error) {
        console.error('Summary generation failed:', error);
        session.summary = {
          generatedAt: new Date(),
          rawSummary: 'Summary generation failed. Please review transcript manually.'
        };
      }
    }

    await session.save();

    return session;
  }

  /**
   * Generate closing message for session
   */
  generateClosingMessage(session) {
    const duration = session.metrics.durationMinutes;
    const messageCount = session.metrics.messageCount.total;

    let closing = "Thank you for sharing with me today. ";
    
    if (duration < 10) {
      closing += "I know this was a brief session, but every step toward self-care matters. ";
    } else {
      closing += "I appreciate the time you spent opening up. ";
    }

    closing += "Remember, the insights and techniques we discussed are tools you can use whenever you need them. ";
    
    if (session.flags.requiresFollowUp) {
      closing += "Given some of what you shared, I encourage you to reach out to a mental health professional for additional support. ";
    }

    closing += "Take care of yourself, and remember that I'm here whenever you'd like to talk again.";

    return closing;
  }

  /**
   * Get session by ID with optional transcript
   */
  async getSession(sessionId, userId, options = {}) {
    const { includeTranscript = true } = options;

    const session = await Session.findById(sessionId);
    
    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }

    if (session.userId !== userId) {
      throw new ValidationAppError('You do not have permission to access this session');
    }

    // Return session with or without full transcript
    if (!includeTranscript) {
      const sessionObj = session.toObject();
      delete sessionObj.transcript;
      delete sessionObj.aiContext.conversationHistory;
      return sessionObj;
    }

    return session;
  }

  /**
   * List sessions for a user
   */
  async listSessions(userId, options = {}) {
    const {
      limit = 20,
      offset = 0,
      status,
      startDate,
      endDate
    } = options;

    const query = { userId };

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.startedAt = {};
      if (startDate) query.startedAt.$gte = new Date(startDate);
      if (endDate) query.startedAt.$lte = new Date(endDate);
    }

    const sessions = await Session.find(query)
      .sort({ startedAt: -1 })
      .skip(offset)
      .limit(limit)
      .select('-transcript -aiContext.conversationHistory');

    const total = await Session.countDocuments(query);

    return {
      sessions: sessions.map(s => s.toSummary()),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + sessions.length < total
      }
    };
  }

  /**
   * Get user's session statistics
   */
  async getUserStats(userId) {
    const stats = await Session.getUserSessionStats(userId);
    
    // Get additional insights
    const recentSessions = await Session.find({ userId })
      .sort({ startedAt: -1 })
      .limit(5)
      .select('config.therapyMode metrics flags summary.progressAssessment');

    const preferredModes = recentSessions.reduce((acc, s) => {
      acc[s.config.therapyMode] = (acc[s.config.therapyMode] || 0) + 1;
      return acc;
    }, {});

    return {
      ...stats,
      preferredTherapyMode: Object.entries(preferredModes)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'general',
      recentProgress: recentSessions.map(s => ({
        sessionId: s._id,
        progress: s.summary?.progressAssessment || 'stable'
      })),
      crisisSessionsCount: recentSessions.filter(s => s.flags.isCrisis).length
    };
  }

  /**
   * Pause an active session
   */
  async pauseSession(sessionId, userId) {
    const session = await Session.findById(sessionId);
    
    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }

    if (session.userId !== userId) {
      throw new ValidationAppError('You do not have permission to access this session');
    }

    if (session.status !== 'active') {
      throw new InvalidSessionStateError(session.status, 'active');
    }

    session.status = 'paused';
    await session.save();

    return session;
  }

  /**
   * Resume a paused session
   */
  async resumeSession(sessionId, userId) {
    const session = await Session.findById(sessionId);
    
    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }

    if (session.userId !== userId) {
      throw new ValidationAppError('You do not have permission to access this session');
    }

    if (session.status !== 'paused') {
      throw new InvalidSessionStateError(session.status, 'paused');
    }

    session.status = 'active';
    session.lastActivityAt = new Date();
    await session.save();

    return session;
  }

  /**
   * Archive an ended session
   */
  async archiveSession(sessionId, userId) {
    const session = await Session.findById(sessionId);
    
    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }

    if (session.userId !== userId) {
      throw new ValidationAppError('You do not have permission to access this session');
    }

    if (session.status !== 'ended') {
      throw new InvalidSessionStateError(session.status, 'ended');
    }

    session.status = 'archived';
    await session.save();

    return session;
  }

  /**
   * Delete a session (soft delete by archiving)
   */
  async deleteSession(sessionId, userId) {
    const session = await Session.findById(sessionId);
    
    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }

    if (session.userId !== userId) {
      throw new ValidationAppError('You do not have permission to access this session');
    }

    // Soft delete by marking as private and archiving
    session.flags.isPrivate = true;
    session.status = 'archived';
    await session.save();

    return { deleted: true };
  }
}

module.exports = SessionService;
