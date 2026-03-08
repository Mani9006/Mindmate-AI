/**
 * Session Controller Tests - MindMate AI
 * Unit tests for session management endpoints
 */

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const SessionController = require('../controllers/SessionController');
const Session = require('../models/Session');

// Mock AI Client
jest.mock('../utils/aiClient');
const AIClient = require('../utils/aiClient');

// Test configuration
const TEST_JWT_SECRET = 'test-secret-key';
const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440001';

// Generate test token
const generateTestToken = (userId = TEST_USER_ID) => {
  return jwt.sign({ userId }, TEST_JWT_SECRET);
};

// Setup test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Mock auth middleware
  app.use((req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      try {
        const decoded = jwt.verify(token, TEST_JWT_SECRET);
        req.user = decoded;
      } catch (err) {
        // Invalid token, continue without user
      }
    }
    next();
  });

  const controller = new SessionController({
    provider: 'anthropic',
    apiKey: 'test-key'
  });

  // Mount routes
  app.post('/sessions/start', controller.startSession);
  app.post('/sessions/:id/message', controller.sendMessage);
  app.post('/sessions/:id/end', controller.endSession);
  app.get('/sessions', controller.listSessions);
  app.get('/sessions/:id', controller.getSession);
  app.get('/sessions/stats', controller.getUserStats);

  return app;
};

describe('SessionController', () => {
  let app;
  let mockAIClient;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/mindmate_test');
    app = createTestApp();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear test data
    await Session.deleteMany({});
    
    // Setup AI client mock
    mockAIClient = {
      generateSystemPrompt: jest.fn().mockReturnValue('Test system prompt'),
      sendMessage: jest.fn().mockResolvedValue({
        id: 'msg-test-123',
        role: 'assistant',
        content: 'This is a test AI response',
        timestamp: new Date(),
        metadata: {
          responseTimeMs: 500,
          tokensUsed: { total: 100 },
          modelVersion: 'test-model'
        }
      }),
      detectEmotion: jest.fn().mockResolvedValue({ emotion: 'neutral', confidence: 0.8 }),
      detectCrisis: jest.fn().mockResolvedValue({ isCrisis: false, confidence: 0.1 }),
      generateSessionSummary: jest.fn().mockResolvedValue({
        keyPoints: ['Test point 1'],
        rawSummary: 'Test summary'
      })
    };
    
    AIClient.mockImplementation(() => mockAIClient);
  });

  describe('POST /sessions/start', () => {
    it('should create a new session successfully', async () => {
      const token = generateTestToken();
      
      const response = await request(app)
        .post('/sessions/start')
        .set('Authorization', `Bearer ${token}`)
        .send({
          therapyMode: 'cbt',
          sessionGoals: ['manage anxiety']
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.session).toBeDefined();
      expect(response.body.data.session.status).toBe('active');
      expect(response.body.data.session.config.therapyMode).toBe('cbt');
      expect(response.body.data.session.welcomeMessage).toBeDefined();
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .post('/sessions/start')
        .send({ therapyMode: 'cbt' });

      expect(response.status).toBe(401);
    });

    it('should prevent multiple active sessions', async () => {
      const token = generateTestToken();
      
      // Create first session
      await request(app)
        .post('/sessions/start')
        .set('Authorization', `Bearer ${token}`)
        .send({ therapyMode: 'general' });

      // Try to create second session
      const response = await request(app)
        .post('/sessions/start')
        .set('Authorization', `Bearer ${token}`)
        .send({ therapyMode: 'general' });

      expect(response.status).toBe(409);
      expect(response.body.code).toBe('ACTIVE_SESSION_EXISTS');
    });

    it('should validate therapy mode', async () => {
      const token = generateTestToken();
      
      const response = await request(app)
        .post('/sessions/start')
        .set('Authorization', `Bearer ${token}`)
        .send({ therapyMode: 'invalid-mode' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /sessions/:id/message', () => {
    let sessionId;

    beforeEach(async () => {
      const token = generateTestToken();
      
      // Create a session first
      const createResponse = await request(app)
        .post('/sessions/start')
        .set('Authorization', `Bearer ${token}`)
        .send({ therapyMode: 'general' });
      
      sessionId = createResponse.body.data.session.id;
    });

    it('should send message and receive AI response', async () => {
      const token = generateTestToken();
      
      const response = await request(app)
        .post(`/sessions/${sessionId}/message`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Hello, I am feeling anxious' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBeDefined();
      expect(response.body.data.message.role).toBe('assistant');
      expect(response.body.data.session).toBeDefined();
    });

    it('should reject empty messages', async () => {
      const token = generateTestToken();
      
      const response = await request(app)
        .post(`/sessions/${sessionId}/message`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: '' });

      expect(response.status).toBe(400);
    });

    it('should reject messages to non-existent session', async () => {
      const token = generateTestToken();
      const fakeId = '550e8400-e29b-41d4-a716-446655440999';
      
      const response = await request(app)
        .post(`/sessions/${fakeId}/message`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Hello' });

      expect(response.status).toBe(404);
    });

    it('should detect crisis keywords', async () => {
      mockAIClient.detectCrisis.mockResolvedValue({
        isCrisis: true,
        confidence: 0.9,
        urgency: 'high'
      });

      const token = generateTestToken();
      
      const response = await request(app)
        .post(`/sessions/${sessionId}/message`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'I want to hurt myself' });

      expect(response.status).toBe(200);
      expect(response.body.data.session.flags.isCrisis).toBe(true);
    });
  });

  describe('POST /sessions/:id/end', () => {
    let sessionId;

    beforeEach(async () => {
      const token = generateTestToken();
      
      const createResponse = await request(app)
        .post('/sessions/start')
        .set('Authorization', `Bearer ${token}`)
        .send({ therapyMode: 'general' });
      
      sessionId = createResponse.body.data.session.id;

      // Add some messages
      await request(app)
        .post(`/sessions/${sessionId}/message`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Hello' });
    });

    it('should end session and generate summary', async () => {
      const token = generateTestToken();
      
      const response = await request(app)
        .post(`/sessions/${sessionId}/end`)
        .set('Authorization', `Bearer ${token}`)
        .send({ generateSummary: true });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.session.status).toBe('ended');
      expect(response.body.data.session.endedAt).toBeDefined();
      expect(response.body.data.session.summary).toBeDefined();
    });

    it('should end session without summary', async () => {
      const token = generateTestToken();
      
      const response = await request(app)
        .post(`/sessions/${sessionId}/end`)
        .set('Authorization', `Bearer ${token}`)
        .send({ generateSummary: false });

      expect(response.status).toBe(200);
      expect(response.body.data.session.summary).toBeNull();
    });
  });

  describe('GET /sessions', () => {
    beforeEach(async () => {
      const token = generateTestToken();
      
      // Create multiple sessions
      for (let i = 0; i < 3; i++) {
        const response = await request(app)
          .post('/sessions/start')
          .set('Authorization', `Bearer ${token}`)
          .send({ therapyMode: 'general' });
        
        // End the session
        await request(app)
          .post(`/sessions/${response.body.data.session.id}/end`)
          .set('Authorization', `Bearer ${token}`)
          .send({ generateSummary: false });
      }
    });

    it('should list user sessions', async () => {
      const token = generateTestToken();
      
      const response = await request(app)
        .get('/sessions')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sessions).toBeDefined();
      expect(response.body.data.sessions.length).toBeGreaterThan(0);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should support pagination', async () => {
      const token = generateTestToken();
      
      const response = await request(app)
        .get('/sessions?limit=2&offset=0')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.sessions.length).toBeLessThanOrEqual(2);
    });

    it('should filter by status', async () => {
      const token = generateTestToken();
      
      const response = await request(app)
        .get('/sessions?status=ended')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.sessions.every(s => s.status === 'ended')).toBe(true);
    });
  });

  describe('GET /sessions/:id', () => {
    let sessionId;

    beforeEach(async () => {
      const token = generateTestToken();
      
      const createResponse = await request(app)
        .post('/sessions/start')
        .set('Authorization', `Bearer ${token}`)
        .send({ therapyMode: 'general' });
      
      sessionId = createResponse.body.data.session.id;
    });

    it('should get session details with transcript', async () => {
      const token = generateTestToken();
      
      const response = await request(app)
        .get(`/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.session).toBeDefined();
      expect(response.body.data.session.transcript).toBeDefined();
    });

    it('should get session without transcript', async () => {
      const token = generateTestToken();
      
      const response = await request(app)
        .get(`/sessions/${sessionId}?includeTranscript=false`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.session.transcript).toBeUndefined();
    });

    it('should reject access to other user session', async () => {
      const otherUserToken = generateTestToken('other-user-id');
      
      const response = await request(app)
        .get(`/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /sessions/stats', () => {
    beforeEach(async () => {
      const token = generateTestToken();
      
      // Create and end some sessions
      for (let i = 0; i < 2; i++) {
        const response = await request(app)
          .post('/sessions/start')
          .set('Authorization', `Bearer ${token}`)
          .send({ therapyMode: 'cbt' });
        
        await request(app)
          .post(`/sessions/${response.body.data.session.id}/end`)
          .set('Authorization', `Bearer ${token}`)
          .send({ generateSummary: false });
      }
    });

    it('should return user session statistics', async () => {
      const token = generateTestToken();
      
      const response = await request(app)
        .get('/sessions/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toBeDefined();
      expect(response.body.data.stats.totalSessions).toBeGreaterThan(0);
    });
  });
});
