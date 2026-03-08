/**
 * Session WebSocket Handler - MindMate AI
 * Real-time bidirectional communication for therapy sessions
 */

const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const SessionService = require('../services/SessionService');
const { wsAuthenticate } = require('../middleware/auth');
const { wsValidators } = require('../utils/validators');
const { wsErrorHandler } = require('../middleware/errorHandler');

class SessionWebSocket {
  constructor(server, options = {}) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws/sessions',
      ...options 
    });
    
    this.sessionService = new SessionService(options.aiConfig);
    this.clients = new Map(); // Map of ws -> client info
    this.heartbeatInterval = options.heartbeatInterval || 30000;
    
    this.setupWebSocketServer();
    this.startHeartbeat();
  }

  /**
   * Setup WebSocket server event handlers
   */
  setupWebSocketServer() {
    this.wss.on('connection', async (ws, req) => {
      console.log('New WebSocket connection attempt');
      
      // Authenticate connection
      const user = await wsAuthenticate(ws, req);
      if (!user) {
        return; // Connection closed by authenticate
      }

      // Store client info
      this.clients.set(ws, {
        userId: user.userId,
        sessionId: null,
        isTyping: false,
        lastActivity: Date.now(),
        messageQueue: []
      });

      console.log(`WebSocket connected for user: ${user.userId}`);

      // Send connection success message
      this.send(ws, {
        type: 'connected',
        data: {
          userId: user.userId,
          timestamp: new Date().toISOString()
        }
      });

      // Setup message handler
      ws.on('message', (data) => this.handleMessage(ws, data));

      // Setup close handler
      ws.on('close', (code, reason) => this.handleClose(ws, code, reason));

      // Setup error handler
      ws.on('error', (error) => this.handleError(ws, error));

      // Setup pong handler for heartbeat
      ws.on('pong', () => {
        const client = this.clients.get(ws);
        if (client) {
          client.isAlive = true;
          client.lastActivity = Date.now();
        }
      });
    });

    this.wss.on('error', (error) => {
      console.error('WebSocket server error:', error);
    });
  }

  /**
   * Handle incoming WebSocket message
   */
  async handleMessage(ws, data) {
    const client = this.clients.get(ws);
    if (!client) return;

    client.lastActivity = Date.now();

    try {
      // Parse message
      let message;
      try {
        message = JSON.parse(data);
      } catch (parseError) {
        this.send(ws, {
          type: 'error',
          error: 'Invalid JSON format',
          code: 'INVALID_JSON'
        });
        return;
      }

      // Validate message
      const validation = wsValidators.validateMessage(message);
      if (!validation.valid) {
        this.send(ws, {
          type: 'error',
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validation.errors
        });
        return;
      }

      // Route message by type
      switch (message.type) {
        case 'join':
          await this.handleJoin(ws, client, message);
          break;
        
        case 'message':
          await this.handleChatMessage(ws, client, message);
          break;
        
        case 'typing':
          await this.handleTyping(ws, client, message);
          break;
        
        case 'ping':
          this.send(ws, { type: 'pong', timestamp: Date.now() });
          break;
        
        case 'reaction':
          await this.handleReaction(ws, client, message);
          break;
        
        case 'feedback':
          await this.handleFeedback(ws, client, message);
          break;
        
        default:
          this.send(ws, {
            type: 'error',
            error: `Unknown message type: ${message.type}`,
            code: 'UNKNOWN_TYPE'
          });
      }

    } catch (error) {
      wsErrorHandler(ws, error);
    }
  }

  /**
   * Handle session join
   */
  async handleJoin(ws, client, message) {
    const { sessionId } = message.data || {};

    if (!sessionId) {
      this.send(ws, {
        type: 'error',
        error: 'Session ID is required',
        code: 'MISSING_SESSION_ID'
      });
      return;
    }

    try {
      // Verify session exists and belongs to user
      const Session = require('../models/Session');
      const session = await Session.findById(sessionId);

      if (!session) {
        this.send(ws, {
          type: 'error',
          error: 'Session not found',
          code: 'SESSION_NOT_FOUND'
        });
        return;
      }

      if (session.userId !== client.userId) {
        this.send(ws, {
          type: 'error',
          error: 'Access denied',
          code: 'ACCESS_DENIED'
        });
        return;
      }

      // Update client session
      client.sessionId = sessionId;

      // Send session joined confirmation
      this.send(ws, {
        type: 'joined',
        data: {
          sessionId,
          status: session.status,
          transcriptLength: session.transcript.length
        }
      });

      // Send recent messages if any
      if (session.transcript.length > 0) {
        const recentMessages = session.transcript.slice(-10);
        this.send(ws, {
          type: 'history',
          data: {
            messages: recentMessages
          }
        });
      }

      console.log(`User ${client.userId} joined session ${sessionId}`);

    } catch (error) {
      this.send(ws, {
        type: 'error',
        error: 'Failed to join session',
        code: 'JOIN_FAILED'
      });
    }
  }

  /**
   * Handle chat message
   */
  async handleChatMessage(ws, client, message) {
    if (!client.sessionId) {
      this.send(ws, {
        type: 'error',
        error: 'Not joined to a session',
        code: 'NOT_JOINED'
      });
      return;
    }

    const { content, metadata = {} } = message.data || {};

    if (!content || !content.trim()) {
      this.send(ws, {
        type: 'error',
        error: 'Message content is required',
        code: 'EMPTY_MESSAGE'
      });
      return;
    }

    // Generate message ID
    const messageId = uuidv4();

    // Send acknowledgment
    this.send(ws, {
      type: 'ack',
      data: {
        messageId,
        status: 'received',
        timestamp: new Date().toISOString()
      }
    });

    // Broadcast typing indicator
    this.broadcastToSession(client.sessionId, {
      type: 'typing',
      data: {
        role: 'assistant',
        isTyping: true
      }
    }, ws);

    try {
      // Process message through service
      const result = await this.sessionService.sendMessage(
        client.sessionId,
        client.userId,
        content,
        metadata
      );

      // Send user message confirmation
      this.send(ws, {
        type: 'message_sent',
        data: {
          messageId,
          timestamp: new Date().toISOString()
        }
      });

      // Stop typing indicator
      this.broadcastToSession(client.sessionId, {
        type: 'typing',
        data: {
          role: 'assistant',
          isTyping: false
        }
      }, ws);

      // Send AI response
      this.send(ws, {
        type: 'message',
        data: {
          message: result.message,
          session: result.session
        }
      });

      // Broadcast to other connections for same session (if any)
      this.broadcastToSession(client.sessionId, {
        type: 'new_message',
        data: {
          sessionId: client.sessionId,
          message: result.message
        }
      }, ws);

    } catch (error) {
      // Stop typing indicator on error
      this.broadcastToSession(client.sessionId, {
        type: 'typing',
        data: {
          role: 'assistant',
          isTyping: false
        }
      }, ws);

      this.send(ws, {
        type: 'error',
        error: error.message || 'Failed to process message',
        code: error.code || 'MESSAGE_FAILED',
        originalMessageId: messageId
      });
    }
  }

  /**
   * Handle typing indicator
   */
  async handleTyping(ws, client, message) {
    if (!client.sessionId) return;

    const { isTyping } = message.data || {};
    client.isTyping = isTyping;

    // Broadcast typing status to session
    this.broadcastToSession(client.sessionId, {
      type: 'typing',
      data: {
        role: 'user',
        isTyping,
        userId: client.userId
      }
    }, ws);
  }

  /**
   * Handle message reaction
   */
  async handleReaction(ws, client, message) {
    if (!client.sessionId) {
      this.send(ws, {
        type: 'error',
        error: 'Not joined to a session',
        code: 'NOT_JOINED'
      });
      return;
    }

    const { messageId, reaction } = message.data || {};

    if (!messageId || !reaction) {
      this.send(ws, {
        type: 'error',
        error: 'Message ID and reaction are required',
        code: 'MISSING_DATA'
      });
      return;
    }

    // Store reaction (implementation depends on your data model)
    // For now, just broadcast it
    this.broadcastToSession(client.sessionId, {
      type: 'reaction',
      data: {
        messageId,
        reaction,
        userId: client.userId,
        timestamp: new Date().toISOString()
      }
    });

    this.send(ws, {
      type: 'reaction_confirmed',
      data: { messageId, reaction }
    });
  }

  /**
   * Handle session feedback
   */
  async handleFeedback(ws, client, message) {
    if (!client.sessionId) {
      this.send(ws, {
        type: 'error',
        error: 'Not joined to a session',
        code: 'NOT_JOINED'
      });
      return;
    }

    const { rating, comment, helpful } = message.data || {};

    try {
      const Session = require('../models/Session');
      const session = await Session.findById(client.sessionId);

      if (session) {
        if (!session.feedback) {
          session.feedback = [];
        }
        
        session.feedback.push({
          rating,
          comment,
          helpful,
          submittedAt: new Date()
        });

        await session.save();
      }

      this.send(ws, {
        type: 'feedback_confirmed',
        data: { received: true }
      });

    } catch (error) {
      this.send(ws, {
        type: 'error',
        error: 'Failed to save feedback',
        code: 'FEEDBACK_FAILED'
      });
    }
  }

  /**
   * Handle WebSocket close
   */
  handleClose(ws, code, reason) {
    const client = this.clients.get(ws);
    
    if (client) {
      console.log(`WebSocket closed for user ${client.userId}, session ${client.sessionId}, code: ${code}`);
      this.clients.delete(ws);
    }
  }

  /**
   * Handle WebSocket error
   */
  handleError(ws, error) {
    console.error('WebSocket error:', error);
    
    const client = this.clients.get(ws);
    if (client) {
      console.error(`Error for user ${client.userId}:`, error.message);
    }
  }

  /**
   * Send message to a specific WebSocket
   */
  send(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(data));
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
      }
    }
  }

  /**
   * Broadcast message to all clients in a session
   */
  broadcastToSession(sessionId, data, excludeWs = null) {
    this.clients.forEach((client, ws) => {
      if (client.sessionId === sessionId && ws !== excludeWs) {
        this.send(ws, data);
      }
    });
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(data, excludeWs = null) {
    this.wss.clients.forEach((ws) => {
      if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
        this.send(ws, data);
      }
    });
  }

  /**
   * Start heartbeat to detect dead connections
   */
  startHeartbeat() {
    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        const client = this.clients.get(ws);
        
        if (client) {
          if (client.isAlive === false) {
            console.log(`Terminating inactive connection for user ${client.userId}`);
            return ws.terminate();
          }
          
          client.isAlive = false;
          ws.ping();
        }
      });
    }, this.heartbeatInterval);
  }

  /**
   * Get connection statistics
   */
  getStats() {
    const stats = {
      totalConnections: this.wss.clients.size,
      activeSessions: new Set(),
      usersOnline: new Set()
    };

    this.clients.forEach((client) => {
      if (client.sessionId) {
        stats.activeSessions.add(client.sessionId);
      }
      stats.usersOnline.add(client.userId);
    });

    return {
      totalConnections: stats.totalConnections,
      activeSessions: stats.activeSessions.size,
      usersOnline: stats.usersOnline.size
    };
  }

  /**
   * Close all connections gracefully
   */
  async close() {
    return new Promise((resolve) => {
      // Notify all clients
      this.broadcast({
        type: 'server_shutdown',
        data: {
          message: 'Server is shutting down',
          reconnectIn: 5000
        }
      });

      // Close all connections
      this.wss.clients.forEach((ws) => {
        ws.close(1001, 'Server shutting down');
      });

      // Close server
      this.wss.close(() => {
        console.log('WebSocket server closed');
        resolve();
      });
    });
  }
}

module.exports = SessionWebSocket;
