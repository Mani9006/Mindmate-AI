# MindMate AI - Session Management API

Complete session management backend for MindMate AI therapy chat application.

## Features

- **Session Lifecycle Management**: Create, manage, and end therapy sessions
- **AI-Powered Conversations**: Integration with Claude/OpenAI for therapeutic responses
- **Real-time Communication**: WebSocket support for live chat
- **Session Summaries**: Automatic generation of session summaries using AI
- **Crisis Detection**: Automatic detection of crisis indicators with safety resources
- **Emotion Tracking**: AI-powered emotion detection in user messages
- **Rate Limiting**: Prevent abuse with configurable rate limits
- **Comprehensive Metrics**: Track engagement, duration, and session statistics

## Installation

```bash
npm install @mindmate-ai/sessions
```

## Quick Start

```javascript
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const { initialize } = require('@mindmate-ai/sessions');

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Initialize session management
const sessions = initialize({
  app,
  server,
  aiConfig: {
    provider: 'anthropic', // or 'openai'
    apiKey: process.env.AI_API_KEY,
    model: 'claude-3-sonnet-20240229'
  },
  apiPrefix: '/api/v1'
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## API Endpoints

### Session Lifecycle

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/sessions/start` | Create a new therapy session |
| POST | `/api/v1/sessions/:id/message` | Send a message and get AI response |
| POST | `/api/v1/sessions/:id/end` | End session and generate summary |

### Session Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/sessions` | List user's sessions |
| GET | `/api/v1/sessions/stats` | Get user session statistics |
| GET | `/api/v1/sessions/:id` | Get session details |
| POST | `/api/v1/sessions/:id/pause` | Pause active session |
| POST | `/api/v1/sessions/:id/resume` | Resume paused session |
| POST | `/api/v1/sessions/:id/archive` | Archive ended session |
| DELETE | `/api/v1/sessions/:id` | Delete session (soft) |

### Session Interactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/sessions/:id/feedback` | Submit session feedback |
| GET | `/api/v1/sessions/:id/export` | Export session data |

## WebSocket Events

Connect to `ws://your-server/ws/sessions`

### Client → Server

| Event | Description |
|-------|-------------|
| `join` | Join a session |
| `message` | Send a chat message |
| `typing` | Send typing indicator |
| `reaction` | React to a message |
| `feedback` | Submit feedback |
| `ping` | Keep connection alive |

### Server → Client

| Event | Description |
|-------|-------------|
| `connected` | Connection established |
| `joined` | Successfully joined session |
| `message` | New message from AI |
| `typing` | Typing indicator update |
| `history` | Recent message history |
| `error` | Error notification |

## Request/Response Examples

### Start Session

**Request:**
```json
POST /api/v1/sessions/start
Authorization: Bearer <token>
Content-Type: application/json

{
  "therapyMode": "cbt",
  "aiPersona": "empathetic",
  "sessionGoals": ["manage anxiety", "improve sleep"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "active",
      "startedAt": "2024-01-15T10:30:00.000Z",
      "config": {
        "therapyMode": "cbt",
        "aiPersona": "empathetic"
      },
      "welcomeMessage": {
        "id": "msg-123",
        "role": "assistant",
        "content": "Hello! I'm here to help...",
        "timestamp": "2024-01-15T10:30:01.000Z"
      }
    }
  }
}
```

### Send Message

**Request:**
```json
POST /api/v1/sessions/:id/message
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "I've been feeling anxious lately"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": {
      "id": "msg-456",
      "role": "assistant",
      "content": "I hear that you've been feeling anxious...",
      "timestamp": "2024-01-15T10:35:00.000Z",
      "metadata": {
        "responseTimeMs": 1250,
        "tokensUsed": {
          "total": 150
        }
      }
    },
    "session": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "active",
      "flags": {
        "isCrisis": false
      }
    }
  }
}
```

### End Session

**Request:**
```json
POST /api/v1/sessions/:id/end
Authorization: Bearer <token>
Content-Type: application/json

{
  "generateSummary": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "ended",
      "startedAt": "2024-01-15T10:30:00.000Z",
      "endedAt": "2024-01-15T11:00:00.000Z",
      "durationMinutes": 30,
      "messageCount": {
        "total": 24,
        "user": 12,
        "assistant": 12
      },
      "summary": {
        "generatedAt": "2024-01-15T11:00:05.000Z",
        "keyPoints": ["Discussed anxiety triggers", "Practiced breathing exercise"],
        "progressAssessment": "improved",
        "actionItems": [
          {
            "description": "Practice deep breathing daily",
            "priority": "high",
            "completed": false
          }
        ]
      }
    }
  }
}
```

## Configuration Options

### AI Configuration

```javascript
{
  provider: 'anthropic', // 'anthropic', 'openai', or 'azure'
  apiKey: 'your-api-key',
  model: 'claude-3-sonnet-20240229',
  maxRetries: 3,
  timeout: 30000
}
```

### Therapy Modes

- `general` - General supportive conversation
- `cbt` - Cognitive Behavioral Therapy
- `dbt` - Dialectical Behavior Therapy
- `act` - Acceptance and Commitment Therapy
- `mindfulness` - Mindfulness and meditation
- `crisis` - Crisis support mode

### AI Personas

- `empathetic` - Warm, compassionate, validating
- `professional` - Clinical, evidence-based
- `casual` - Friendly, conversational
- `directive` - Structured, goal-oriented

## Environment Variables

```bash
# Required
MONGODB_URI=mongodb://localhost:27017/mindmate
JWT_SECRET=your-secret-key
AI_API_KEY=your-ai-api-key

# Optional
AI_PROVIDER=anthropic
AI_MODEL=claude-3-sonnet-20240229
API_PREFIX=/api/v1
NODE_ENV=production
```

## Error Codes

| Code | Description |
|------|-------------|
| `SESSION_NOT_FOUND` | Session does not exist |
| `INVALID_SESSION_STATE` | Session in wrong state for operation |
| `ACTIVE_SESSION_EXISTS` | User already has active session |
| `AI_SERVICE_ERROR` | AI service unavailable |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `VALIDATION_ERROR` | Input validation failed |

## License

MIT
