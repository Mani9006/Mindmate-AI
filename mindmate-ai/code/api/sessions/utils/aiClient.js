/**
 * AI Client Utility - MindMate AI
 * Handles communication with AI models (Claude, OpenAI, etc.)
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class AIClient {
  constructor(config = {}) {
    this.provider = config.provider || process.env.AI_PROVIDER || 'anthropic';
    this.apiKey = config.apiKey || process.env.AI_API_KEY;
    this.model = config.model || process.env.AI_MODEL || 'claude-3-sonnet-20240229';
    this.baseUrl = config.baseUrl || this.getDefaultBaseUrl();
    this.maxRetries = config.maxRetries || 3;
    this.timeout = config.timeout || 30000;
    
    if (!this.apiKey) {
      throw new Error('AI API key is required');
    }
  }

  getDefaultBaseUrl() {
    switch (this.provider) {
      case 'anthropic':
        return 'https://api.anthropic.com/v1';
      case 'openai':
        return 'https://api.openai.com/v1';
      case 'azure':
        return process.env.AZURE_OPENAI_ENDPOINT;
      default:
        throw new Error(`Unsupported AI provider: ${this.provider}`);
    }
  }

  /**
   * Generate system prompt based on therapy mode and user context
   */
  generateSystemPrompt(config, userContext = {}) {
    const { therapyMode = 'general', aiPersona = 'empathetic', sessionGoals = [] } = config;
    
    const basePrompts = {
      cbt: `You are a supportive CBT (Cognitive Behavioral Therapy) therapist. Help the user identify negative thought patterns, challenge cognitive distortions, and develop healthier thinking habits. Use Socratic questioning and evidence-based techniques.`,
      
      dbt: `You are a DBT (Dialectical Behavior Therapy) therapist. Help the user develop mindfulness, distress tolerance, emotional regulation, and interpersonal effectiveness skills. Balance acceptance and change strategies.`,
      
      act: `You are an ACT (Acceptance and Commitment Therapy) therapist. Help the user accept difficult emotions, clarify their values, and take committed action. Focus on psychological flexibility.`,
      
      mindfulness: `You are a mindfulness and meditation guide. Help the user develop present-moment awareness, reduce stress through breathing exercises and meditation techniques.`,
      
      crisis: `You are a crisis counselor providing immediate support. Prioritize safety, validate feelings, and help the user access resources. Be calm, supportive, and direct about seeking professional help when needed.`,
      
      general: `You are MindMate AI, an empathetic and supportive mental wellness companion. Provide a safe, non-judgmental space for the user to express themselves. Offer evidence-based coping strategies while maintaining appropriate boundaries. You are not a replacement for professional mental health care.`
    };

    const personaInstructions = {
      empathetic: `Speak with warmth, compassion, and genuine care. Use reflective listening and validate emotions.`,
      professional: `Maintain a professional, clinical tone while remaining accessible. Use appropriate therapeutic terminology.`,
      casual: `Be friendly and conversational, like talking to a supportive friend. Keep language simple and relatable.`,
      directive: `Be more structured and goal-oriented. Provide clear guidance and actionable steps.`
    };

    let prompt = basePrompts[therapyMode] || basePrompts.general;
    prompt += `\n\n${personaInstructions[aiPersona] || personaInstructions.empathetic}`;

    // Add session goals if specified
    if (sessionGoals.length > 0) {
      prompt += `\n\nSession Goals:\n${sessionGoals.map(g => `- ${g}`).join('\n')}`;
    }

    // Add user context if available
    if (userContext.knownIssues?.length > 0) {
      prompt += `\n\nKnown Areas of Concern: ${userContext.knownIssues.join(', ')}`;
    }

    if (userContext.copingStrategies?.length > 0) {
      prompt += `\n\nPreviously Helpful Strategies: ${userContext.copingStrategies.join(', ')}`;
    }

    // Add safety guidelines
    prompt += `\n\nIMPORTANT GUIDELINES:\n`;
    prompt += `- If the user expresses thoughts of self-harm or suicide, prioritize their safety. Express concern, validate their pain, and strongly encourage them to contact emergency services (988 Suicide & Crisis Lifeline) or go to the nearest emergency room.\n`;
    prompt += `- Do not diagnose medical or mental health conditions.\n`;
    prompt += `- Maintain appropriate boundaries - you are an AI companion, not a licensed therapist.\n`;
    prompt += `- Respect user privacy and confidentiality.\n`;
    prompt += `- Be culturally sensitive and inclusive.\n`;
    prompt += `- Keep responses concise (2-4 paragraphs) unless the user requests detailed information.`;

    return prompt;
  }

  /**
   * Format messages for the AI provider
   */
  formatMessages(systemPrompt, conversationHistory, newMessage) {
    const messages = [];

    switch (this.provider) {
      case 'anthropic':
        // Anthropic format
        messages.push({ role: 'user', content: newMessage.content });
        return {
          system: systemPrompt,
          messages: [...conversationHistory.filter(m => m.role !== 'system'), ...messages]
        };

      case 'openai':
      case 'azure':
        // OpenAI format
        messages.push({ role: 'system', content: systemPrompt });
        conversationHistory.forEach(msg => {
          if (msg.role !== 'system') {
            messages.push({ role: msg.role, content: msg.content });
          }
        });
        messages.push({ role: 'user', content: newMessage.content });
        return { messages };

      default:
        throw new Error(`Unsupported provider: ${this.provider}`);
    }
  }

  /**
   * Send message to AI and get response
   */
  async sendMessage(options) {
    const { systemPrompt, conversationHistory, message, temperature = 0.7, maxTokens = 1000 } = options;
    
    const startTime = Date.now();
    let lastError;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const formattedMessages = this.formatMessages(systemPrompt, conversationHistory, message);
        
        const response = await this.makeRequest({
          ...formattedMessages,
          temperature,
          max_tokens: maxTokens
        });

        const responseTime = Date.now() - startTime;
        
        return {
          id: uuidv4(),
          role: 'assistant',
          content: response.content,
          timestamp: new Date(),
          metadata: {
            responseTimeMs: responseTime,
            tokensUsed: response.tokensUsed,
            modelVersion: this.model
          }
        };

      } catch (error) {
        lastError = error;
        
        // Don't retry on client errors (4xx)
        if (error.response?.status >= 400 && error.response?.status < 500) {
          throw error;
        }
        
        // Exponential backoff
        if (attempt < this.maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000;
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Make the actual API request
   */
  async makeRequest(payload) {
    const headers = this.getHeaders();
    
    const response = await axios.post(
      `${this.baseUrl}${this.getEndpoint()}`,
      this.formatPayload(payload),
      { headers, timeout: this.timeout }
    );

    return this.parseResponse(response.data);
  }

  getHeaders() {
    switch (this.provider) {
      case 'anthropic':
        return {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        };
      case 'openai':
        return {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        };
      case 'azure':
        return {
          'Content-Type': 'application/json',
          'api-key': this.apiKey
        };
      default:
        throw new Error(`Unsupported provider: ${this.provider}`);
    }
  }

  getEndpoint() {
    switch (this.provider) {
      case 'anthropic':
        return '/messages';
      case 'openai':
      case 'azure':
        return '/chat/completions';
      default:
        throw new Error(`Unsupported provider: ${this.provider}`);
    }
  }

  formatPayload(payload) {
    switch (this.provider) {
      case 'anthropic':
        return {
          model: this.model,
          max_tokens: payload.max_tokens,
          temperature: payload.temperature,
          system: payload.system,
          messages: payload.messages
        };
      case 'openai':
      case 'azure':
        return {
          model: this.model,
          messages: payload.messages,
          temperature: payload.temperature,
          max_tokens: payload.max_tokens
        };
      default:
        throw new Error(`Unsupported provider: ${this.provider}`);
    }
  }

  parseResponse(data) {
    switch (this.provider) {
      case 'anthropic':
        return {
          content: data.content[0]?.text || '',
          tokensUsed: {
            input: data.usage?.input_tokens || 0,
            output: data.usage?.output_tokens || 0,
            total: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
          }
        };
      case 'openai':
      case 'azure':
        return {
          content: data.choices[0]?.message?.content || '',
          tokensUsed: {
            input: data.usage?.prompt_tokens || 0,
            output: data.usage?.completion_tokens || 0,
            total: data.usage?.total_tokens || 0
          }
        };
      default:
        throw new Error(`Unsupported provider: ${this.provider}`);
    }
  }

  /**
   * Generate session summary
   */
  async generateSessionSummary(session) {
    const transcript = session.transcript
      .map(m => `${m.role}: ${m.content}`)
      .join('\n\n');

    const summaryPrompt = `Please provide a comprehensive summary of this therapy session. Analyze the following transcript and return a structured summary in JSON format.

Transcript:
${transcript}

Please provide a JSON response with the following structure:
{
  "keyPoints": ["point 1", "point 2", ...],
  "emotionalJourney": [
    {"timestamp": "ISO date", "emotion": "emotion name", "intensity": 1-10}
  ],
  "techniquesIntroduced": [
    {"name": "technique name", "description": "brief description", "effectiveness": 1-5}
  ],
  "actionItems": [
    {"description": "action item", "priority": "low|medium|high", "completed": false}
  ],
  "insights": ["insight 1", "insight 2", ...],
  "progressAssessment": "regressed|stable|improved|significantly_improved",
  "recommendedFollowUp": "description of recommended follow-up",
  "rawSummary": "2-3 paragraph narrative summary"
}`;

    try {
      const response = await this.sendMessage({
        systemPrompt: 'You are an expert mental health summarization AI. Analyze therapy session transcripts and provide structured, objective summaries.',
        conversationHistory: [],
        message: { content: summaryPrompt },
        temperature: 0.3,
        maxTokens: 2000
      });

      // Parse JSON from response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return { rawSummary: response.content };
    } catch (error) {
      console.error('Failed to generate summary:', error);
      return { rawSummary: 'Summary generation failed. Please review transcript manually.' };
    }
  }

  /**
   * Detect emotional content in message
   */
  async detectEmotion(message) {
    const emotionPrompt = `Analyze the emotional content of this message and respond with ONLY a JSON object in this exact format: {"emotion": "emotion_name", "confidence": 0.0-1.0}

Emotions to choose from: neutral, happy, sad, anxious, angry, fearful, surprised, disgusted

Message: "${message}"`;

    try {
      const response = await this.sendMessage({
        systemPrompt: 'You are an emotion detection AI. Analyze text and identify the primary emotion.',
        conversationHistory: [],
        message: { content: emotionPrompt },
        temperature: 0.1,
        maxTokens: 100
      });

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return { emotion: 'neutral', confidence: 0.5 };
    } catch (error) {
      console.error('Emotion detection failed:', error);
      return { emotion: 'neutral', confidence: 0.5 };
    }
  }

  /**
   * Check for crisis indicators
   */
  async detectCrisis(message) {
    const crisisKeywords = [
      'suicide', 'kill myself', 'end my life', 'want to die', 'better off dead',
      'hurt myself', 'self-harm', 'cutting myself', 'overdose',
      'no reason to live', 'can\'t go on', 'ending it all'
    ];

    const lowerMessage = message.toLowerCase();
    const hasCrisisKeyword = crisisKeywords.some(keyword => 
      lowerMessage.includes(keyword)
    );

    if (!hasCrisisKeyword) {
      return { isCrisis: false, confidence: 0 };
    }

    // Use AI for more nuanced analysis
    const crisisPrompt = `Analyze this message for crisis indicators (suicidal ideation, self-harm intent). Respond with ONLY a JSON object: {"isCrisis": true/false, "confidence": 0.0-1.0, "urgency": "low|medium|high"}

Message: "${message}"`;

    try {
      const response = await this.sendMessage({
        systemPrompt: 'You are a crisis detection AI. Identify signs of suicidal ideation or self-harm.',
        conversationHistory: [],
        message: { content: crisisPrompt },
        temperature: 0.1,
        maxTokens: 100
      });

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Crisis detection failed:', error);
    }

    return { isCrisis: hasCrisisKeyword, confidence: 0.7, urgency: 'high' };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = AIClient;
