# MindMate AI - Consolidated Architecture Document
## Single Source of Truth (Agent 100 - Master Consolidation)

**Version:** 1.0  
**Last Updated:** March 2025  
**Classification:** Architecture Blueprint - Implementation Ready

---

# EXECUTIVE SUMMARY

## Project Vision

MindMate AI is an AI-powered mental wellness companion that provides personalized emotional support through conversational AI, evidence-based techniques (CBT, DBT, mindfulness), and progress tracking. The platform positions itself as **wellness coaching** (not therapy) to ensure regulatory compliance while delivering meaningful mental health support.

## Key Differentiators

1. **Safety-First Design**: Multi-layer crisis detection with immediate escalation protocols
2. **True Personalization**: AI remembers context across sessions using RAG + memory systems
3. **Regulatory Compliance**: Designed from ground up for GDPR, HIPAA considerations, and FDA wellness guidelines
4. **Multi-Modal Experience**: Text, voice, and avatar-based interactions
5. **Evidence-Based**: Integrates validated screening tools (PHQ-9, GAD-7, C-SSRS)

## Target Market

- **Primary**: Adults 18-45 experiencing mild-to-moderate stress, anxiety, or seeking personal growth
- **Secondary**: Young adults (16+) with parental consent
- **Geographic**: Global launch with US, UK, EU, Canada, Australia priority

## Business Model

- **Freemium**: Free tier with daily session limits
- **Premium**: $12.99/month for unlimited sessions, advanced features
- **Enterprise**: B2B wellness program partnerships

---

# CONSOLIDATED ARCHITECTURE

## 1. SYSTEM ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Mobile App   │  │ Web App      │  │ Admin Panel  │  │ Landing Page │         │
│  │ (React Native│  │ (Next.js)    │  │ (Next.js)    │  │ (Next.js)    │         │
│  │  + Expo)     │  │              │  │              │  │              │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
└─────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┘
          │                 │                 │                 │
          └─────────────────┴────────┬────────┴─────────────────┘
                                     │
                    ┌────────────────▼────────────────┐
                    │      CDN / Load Balancer        │
                    │      (CloudFront + ALB)         │
                    └────────────────┬────────────────┘
                                     │
┌────────────────────────────────────┼─────────────────────────────────────────────┐
│                         API GATEWAY LAYER                                        │
│                    (AWS API Gateway + WAF)                                       │
└────────────────────────────────────┼─────────────────────────────────────────────┘
                                     │
┌────────────────────────────────────┼─────────────────────────────────────────────┐
│                         SERVICE LAYER (ECS Fargate)                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ API Gateway  │  │ AI Pipeline  │  │ WebSocket    │  │ Notification │         │
│  │ Service      │  │ Service      │  │ Service      │  │ Service      │         │
│  │ (Node.js)    │  │ (Python)     │  │ (Node.js)    │  │ (Node.js)    │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
└─────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┘
          │                 │                 │                 │
          └─────────────────┴────────┬────────┴─────────────────┘
                                     │
┌────────────────────────────────────┼─────────────────────────────────────────────┐
│                         DATA LAYER                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ PostgreSQL   │  │ Redis        │  │ Pinecone     │  │ S3 Storage   │         │
│  │ (RDS)        │  │ (ElastiCache)│  │ (Vector DB)  │  │ (Audio/Assets│         │
│  │              │  │              │  │              │  │              │         │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────────────────────┘
                                     │
┌────────────────────────────────────┼─────────────────────────────────────────────┐
│                      EXTERNAL INTEGRATIONS                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Anthropic    │  │ Stripe       │  │ SendGrid     │  │ Analytics    │         │
│  │ Claude API   │  │ Payments     │  │ Email/SMS    │  │ (Segment)    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. TECHNOLOGY STACK

### Frontend

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Mobile | React Native + Expo | SDK 50 | Cross-platform mobile app |
| Web | Next.js | 14.x | Web application (App Router) |
| Admin | Next.js | 14.x | Admin dashboard |
| UI Components | shadcn/ui + Radix | Latest | Accessible component library |
| Styling | Tailwind CSS | 3.x | Utility-first CSS |
| State | Zustand | 4.x | Global state management |
| Query | TanStack Query | 5.x | Server state management |
| Forms | React Hook Form + Zod | Latest | Form handling & validation |
| Animation | Framer Motion | 11.x | UI animations |

### Backend

| Service | Technology | Purpose |
|---------|------------|---------|
| API Gateway | Node.js + Express/Fastify | REST API, auth, routing |
| AI Pipeline | Python + FastAPI | Claude integration, RAG, memory |
| WebSocket | Node.js + Socket.io | Real-time chat |
| Scheduler | Node.js + Bull | Background jobs |

### AI/ML Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| LLM | Anthropic Claude 3.5 Sonnet | Conversational AI |
| Embeddings | OpenAI text-embedding-3-small | Vector search |
| Vector DB | Pinecone | Semantic memory retrieval |
| RAG Framework | LangChain/LlamaIndex | Context assembly |

### Infrastructure

| Component | Technology | Purpose |
|-----------|------------|---------|
| Cloud | AWS | Primary infrastructure |
| Containers | ECS Fargate | Serverless containers |
| Database | RDS PostgreSQL 15 | Primary data store |
| Cache | ElastiCache Redis 7 | Session & rate limiting |
| Storage | S3 + CloudFront | Assets & audio files |
| Queue | SQS | Async job processing |
| Secrets | AWS Secrets Manager | Credential management |
| IaC | Terraform | Infrastructure as code |

---

## 3. PROJECT STRUCTURE (Monorepo)

```
mindmate-ai/
├── apps/
│   ├── mobile/                 # React Native (Expo)
│   │   ├── src/
│   │   │   ├── components/     # React components
│   │   │   ├── screens/        # Screen components
│   │   │   ├── navigation/     # Navigation setup
│   │   │   ├── hooks/          # Custom hooks
│   │   │   ├── store/          # Zustand stores
│   │   │   ├── api/            # API clients
│   │   │   ├── services/       # Business logic
│   │   │   ├── utils/          # Utilities
│   │   │   └── types/          # TypeScript types
│   │   ├── app.json            # Expo config
│   │   └── package.json
│   │
│   ├── web/                    # Next.js web app
│   │   ├── src/
│   │   │   ├── app/            # App Router
│   │   │   ├── components/     # React components
│   │   │   ├── hooks/          # Custom hooks
│   │   │   ├── lib/            # Library configs
│   │   │   ├── store/          # Zustand stores
│   │   │   └── types/          # TypeScript types
│   │   └── package.json
│   │
│   └── admin/                  # Next.js admin dashboard
│       └── src/
│
├── services/
│   ├── api/                    # Main API gateway (Node.js)
│   │   ├── src/
│   │   │   ├── routes/         # API routes
│   │   │   ├── middleware/     # Auth, validation
│   │   │   ├── controllers/    # Request handlers
│   │   │   ├── models/         # Database models
│   │   │   └── utils/          # Utilities
│   │   └── package.json
│   │
│   ├── ai-pipeline/            # AI service (Python)
│   │   ├── src/
│   │   │   ├── prompts/        # LLM prompts
│   │   │   ├── rag/            # RAG implementation
│   │   │   ├── memory/         # Memory management
│   │   │   ├── crisis/         # Crisis detection
│   │   │   └── utils/          # Utilities
│   │   └── requirements.txt
│   │
│   ├── websocket/              # WebSocket server (Node.js)
│   └── scheduler/              # Job scheduler (Node.js)
│
├── packages/
│   ├── shared/                 # Shared types & utilities
│   ├── ui/                     # Shared UI components
│   ├── config/                 # Shared configuration
│   └── eslint-config/          # Shared ESLint config
│
├── infrastructure/
│   ├── terraform/              # Terraform modules
│   ├── docker/                 # Docker configurations
│   └── kubernetes/             # K8s manifests (future)
│
├── docs/                       # Documentation
├── scripts/                    # Build & utility scripts
├── package.json                # Root package.json
├── pnpm-workspace.yaml         # PNPM workspace config
├── turbo.json                  # Turborepo config
└── README.md
```

---

## 4. DATABASE SCHEMA (Core Tables)

```sql
-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_active_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    subscription_tier VARCHAR(20) DEFAULT 'free',
    subscription_expires_at TIMESTAMP
);

-- User Profiles
CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    avatar_id VARCHAR(50) DEFAULT 'luna',
    avatar_name VARCHAR(100),
    voice_preference VARCHAR(50),
    theme VARCHAR(20) DEFAULT 'light',
    onboarding_completed BOOLEAN DEFAULT false,
    phq9_score INTEGER,
    gad7_score INTEGER,
    crisis_flag BOOLEAN DEFAULT false,
    safety_plan JSONB
);

-- Conversations
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_archived BOOLEAN DEFAULT false,
    metadata JSONB
);

-- Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    sentiment_score FLOAT,
    crisis_detected BOOLEAN DEFAULT false,
    audio_url VARCHAR(500),
    metadata JSONB
);

-- Mood Entries
CREATE TABLE mood_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    mood_score INTEGER NOT NULL CHECK (mood_score BETWEEN 1 AND 10),
    emotions TEXT[],
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Journal Entries
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    content TEXT NOT NULL,
    mood_score INTEGER,
    tags TEXT[],
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Goals
CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    target_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    progress INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Memory Vectors (Reference to Pinecone)
CREATE TABLE memory_vectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    pinecone_id VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    memory_type VARCHAR(50), -- 'fact', 'preference', 'event', 'insight'
    importance_score FLOAT,
    created_at TIMESTAMP DEFAULT NOW(),
    last_accessed_at TIMESTAMP
);

-- Crisis Events
CREATE TABLE crisis_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    detected_at TIMESTAMP DEFAULT NOW(),
    severity VARCHAR(20) NOT NULL, -- 'low', 'moderate', 'high', 'critical'
    triggers TEXT[],
    response_actions JSONB,
    resolved_at TIMESTAMP,
    resolution_notes TEXT
);

-- Subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(100),
    stripe_customer_id VARCHAR(100),
    tier VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    canceled_at TIMESTAMP
);
```

---

## 5. AI PIPELINE ARCHITECTURE

### 5.1 Conversation Flow

```
User Message
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Crisis Detection (Parallel)                         │
│  • Keyword matching (critical, high-risk, elevated)          │
│  • Sentiment analysis (0-100 score)                          │
│  • Behavioral pattern analysis                               │
│  • Context multiplier (time, history)                        │
└──────────────────────────┬────────────────────────────────────┘
                           │
           ┌───────────────┴───────────────┐
           │                               │
           ▼                               ▼
    Crisis Detected                  No Crisis
           │                               │
           ▼                               ▼
    ┌──────────────┐              ┌──────────────┐
    │ Activate     │              │ Continue to  │
    │ Crisis Flow  │              │ Normal Flow  │
    └──────────────┘              └──────┬───────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Context Assembly (RAG)                              │
│  • Retrieve relevant memories from Pinecone                  │
│  • Fetch recent conversation history                         │
│  • Get user profile & preferences                            │
│  • Load appropriate therapeutic prompt                       │
└──────────────────────────┬────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Prompt Construction                                 │
│  • System prompt (therapeutic persona + safety rules)        │
│  • User context (memories, preferences)                      │
│  • Conversation history (last N messages)                    │
│  • Current message                                           │
└──────────────────────────┬────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: Claude API Call                                     │
│  • Model: claude-3-5-sonnet-20241022                         │
│  • Temperature: 0.7                                          │
│  • Max tokens: 4096                                          │
│  • System prompt + messages array                            │
└──────────────────────────┬────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 5: Response Processing                                 │
│  • Extract key memories for storage                          │
│  • Generate embeddings for new memories                      │
│  • Store in Pinecone                                         │
│  • Save to conversation history                              │
└──────────────────────────┬────────────────────────────────────┘
                           │
                           ▼
                    Response to User
```

### 5.2 Memory System

```
New Memory Detected
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Memory Extraction                                   │
│  • Use LLM to identify key facts, preferences, insights      │
│  • Categorize: fact, preference, event, insight, goal        │
│  • Assign importance score (1-10)                            │
└──────────────────────────┬────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Embedding Generation                                │
│  • Generate vector using OpenAI embeddings API               │
│  • 1536-dimensional vector                                   │
└──────────────────────────┬────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Storage                                             │
│  • Store in Pinecone with metadata:                          │
│    - user_id, content, memory_type, importance, timestamp    │
│  • Store reference in PostgreSQL                             │
└──────────────────────────┬────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: Retrieval (During Conversations)                    │
│  • Embed user message                                        │
│  • Query Pinecone with user_id filter                        │
│  • Return top-k most similar memories                        │
│  • Include recent memories (time-based)                      │
│  • Include high-importance memories                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. CRISIS DETECTION & RESPONSE

### 6.1 Detection Algorithm

```python
# Crisis Confidence Score Calculation
def calculate_crisis_score(message, user_history, context):
    # Layer 1: Keyword Detection (40% weight)
    keyword_score = detect_crisis_keywords(message)
    
    # Layer 2: Sentiment Analysis (30% weight)
    sentiment_score = analyze_sentiment(message)
    
    # Layer 3: Behavioral Patterns (20% weight)
    behavioral_score = analyze_behavior(user_history)
    
    # Layer 4: Context Multipliers (10% weight)
    context_multiplier = calculate_context(context)
    
    # Final Score (0-100)
    crisis_score = (
        keyword_score * 0.4 +
        sentiment_score * 0.3 +
        behavioral_score * 0.2 +
        context_multiplier * 0.1
    )
    
    return crisis_score

# Thresholds
# < 25: Monitor and log
# 25-49: Gentle wellness check
# 50-74: Direct assessment
# >= 75: Full crisis protocol
```

### 6.2 Crisis Keywords

**CRITICAL (Immediate Escalation):**
- "I'm going to kill myself"
- "I want to die"
- "suicide", "kill myself", "end my life"
- "better off dead", "no reason to live"
- "hurt myself", "self-harm", "cutting myself"

**HIGH-RISK (Immediate Assessment):**
- "can't go on", "give up", "hopeless"
- "worthless", "burden", "nothing matters"
- "tired of fighting", "escape the pain"

**ELEVATED (Contextual Assessment):**
- "depressed", "anxiety attack", "panic attack"
- "dark thoughts", "losing control"

### 6.3 Response Protocol

| Score | Tier | Response |
|-------|------|----------|
| < 25 | Monitor | Log and continue normal conversation |
| 25-49 | Gentle Check-In | "I notice you might be going through something difficult..." |
| 50-74 | Direct Assessment | "I'm concerned about you. Are you safe right now?" |
| 75-100 | Crisis Protocol | Immediate resources, safety assessment, possible emergency contact |

### 6.4 Crisis Resources (Always Available)

```
🆘 IMMEDIATE HELP - AVAILABLE 24/7

📞 988 Suicide & Crisis Lifeline
   Call or text 988

💬 Crisis Text Line
   Text HOME to 741741

🏥 Emergency Services
   Call 911 (US) or your local emergency number

🌐 International Resources
   https://findahelpline.com
```

---

## 7. API DESIGN (Core Endpoints)

### Authentication

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
```

### Users

```
GET    /api/v1/users/me
PUT    /api/v1/users/me
DELETE /api/v1/users/me
GET    /api/v1/users/me/profile
PUT    /api/v1/users/me/profile
```

### Conversations

```
GET    /api/v1/conversations
POST   /api/v1/conversations
GET    /api/v1/conversations/:id
DELETE /api/v1/conversations/:id
GET    /api/v1/conversations/:id/messages
POST   /api/v1/conversations/:id/messages
POST   /api/v1/conversations/:id/feedback
```

### Chat (WebSocket for real-time)

```
WS     /ws/chat

// Events:
// - connection
// - message:send
// - message:receive
// - typing:start
// - typing:stop
// - error
```

### Mood & Journal

```
GET    /api/v1/mood-entries
POST   /api/v1/mood-entries
GET    /api/v1/journal-entries
POST   /api/v1/journal-entries
GET    /api/v1/journal-entries/:id
PUT    /api/v1/journal-entries/:id
DELETE /api/v1/journal-entries/:id
```

### Goals

```
GET    /api/v1/goals
POST   /api/v1/goals
GET    /api/v1/goals/:id
PUT    /api/v1/goals/:id
DELETE /api/v1/goals/:id
POST   /api/v1/goals/:id/progress
```

### Safety

```
GET    /api/v1/safety-plan
PUT    /api/v1/safety-plan
GET    /api/v1/crisis-resources
POST   /api/v1/crisis-events
```

### Subscriptions

```
GET    /api/v1/subscriptions
POST   /api/v1/subscriptions
GET    /api/v1/subscriptions/current
POST   /api/v1/subscriptions/cancel
POST   /api/v1/subscriptions/upgrade
POST   /api/v1/webhooks/stripe
```

---

## 8. SECURITY ARCHITECTURE

### 8.1 Authentication & Authorization

- **JWT Tokens**: Access token (15 min expiry) + Refresh token (7 days)
- **Password Hashing**: bcrypt with salt rounds 12
- **MFA**: Optional TOTP for sensitive operations
- **OAuth**: Google, Apple sign-in support

### 8.2 Data Protection

| Layer | Implementation |
|-------|----------------|
| Encryption at Rest | AES-256 (AWS KMS) |
| Encryption in Transit | TLS 1.3 |
| Database | RDS encryption enabled |
| Secrets | AWS Secrets Manager |
| API Keys | Environment variables only |

### 8.3 API Security

- Rate limiting: 100 requests/minute per user
- CORS: Whitelist allowed origins
- Input validation: Zod schemas
- SQL injection prevention: Parameterized queries
- XSS prevention: Output encoding

### 8.4 Privacy Compliance

**GDPR:**
- Explicit consent for health data processing
- Right to access, rectification, erasure
- Data portability (JSON export)
- Privacy by design

**HIPAA (if applicable):**
- Business Associate Agreements with vendors
- Audit logging
- Access controls
- Breach notification procedures

---

## 9. DEPLOYMENT ARCHITECTURE

### 9.1 AWS Infrastructure

```
┌─────────────────────────────────────────────────────────────────┐
│                         VPC (10.0.0.0/16)                        │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Public Subnets                        │    │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │    │
│  │  │   ALB       │    │   NAT GW    │    │  Bastion    │  │    │
│  │  │  (HTTPS)    │    │             │    │   Host      │  │    │
│  │  └─────────────┘    └─────────────┘    └─────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   Private Subnets                        │    │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │    │
│  │  │  ECS Tasks  │    │  ECS Tasks  │    │   Lambda    │  │    │
│  │  │  (API)      │    │  (AI)       │    │  (Jobs)     │  │    │
│  │  └─────────────┘    └─────────────┘    └─────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  Database Subnets                        │    │
│  │  ┌─────────────┐    ┌─────────────┐                     │    │
│  │  │  RDS        │    │ ElastiCache │                     │    │
│  │  │ PostgreSQL  │    │   Redis     │                     │    │
│  │  └─────────────┘    └─────────────┘                     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  VPC Endpoints                           │    │
│  │  • S3 Gateway                                            │    │
│  │  • ECR Interface                                         │    │
│  │  • CloudWatch Logs                                       │    │
│  │  • Secrets Manager                                       │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Environment Configuration

| Environment | URL | Purpose |
|-------------|-----|---------|
| Development | localhost | Local development |
| Staging | staging.mindmate.ai | Pre-production testing |
| Production | mindmate.ai | Live application |

### 9.3 CI/CD Pipeline

```
Git Push
    │
    ▼
GitHub Actions
    │
    ├───▶ Lint & Type Check
    │
    ├───▶ Unit Tests
    │
    ├───▶ Build Docker Images
    │
    ├───▶ Push to ECR
    │
    └───▶ Deploy to ECS
              │
              ├───▶ Staging (auto)
              │
              └───▶ Production (manual approval)
```

---

## 10. MONITORING & OBSERVABILITY

### 10.1 Logging

- **Application Logs**: CloudWatch Logs
- **Audit Logs**: Separate CloudWatch group for security events
- **Retention**: 30 days (production), 7 days (staging)

### 10.2 Metrics

| Metric | Tool | Alert Threshold |
|--------|------|-----------------|
| API Latency | CloudWatch | p99 > 500ms |
| Error Rate | CloudWatch | > 1% |
| CPU Usage | CloudWatch | > 80% |
| Memory Usage | CloudWatch | > 80% |
| Database Connections | CloudWatch | > 80% of max |

### 10.3 Alerting

- **PagerDuty**: Critical alerts (production down)
- **Slack**: Warning alerts (elevated error rates)
- **Email**: Daily summaries

### 10.4 Tracing

- **AWS X-Ray**: Distributed tracing
- **OpenTelemetry**: Custom spans for AI pipeline

---

## 11. CONFLICTS RESOLVED

### 11.1 Technology Choices

| Area | Conflict | Resolution |
|------|----------|------------|
| Mobile Framework | React Native vs Flutter | React Native + Expo (better ecosystem, faster development) |
| State Management | Redux vs Zustand | Zustand (simpler, less boilerplate) |
| Backend Language | Node vs Python | Both - Node for API, Python for AI |
| Vector DB | Pinecone vs Weaviate | Pinecone (managed, scales well) |

### 11.2 Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Microservices vs Monolith | Microservices for AI pipeline separation |
| REST vs GraphQL | REST for simplicity, WebSocket for real-time |
| Serverless vs Containers | ECS Fargate (balance of control and ops) |
| Multi-tenant vs Single-tenant | Multi-tenant (cost efficiency) |

### 11.3 Legal Positioning

| Aspect | Decision |
|--------|----------|
| Service Type | Wellness coaching (NOT therapy) |
| HIPAA Required | Only if integrating with covered entities |
| GDPR Required | Yes, for EU/UK users |
| FDA Regulation | Avoid by staying in wellness category |

---

## 12. IMPLEMENTATION PHASES

### Phase 1: MVP (Weeks 1-8)
- [ ] Project setup (monorepo, CI/CD)
- [ ] User authentication
- [ ] Basic chat with Claude
- [ ] Crisis detection
- [ ] Mood tracking
- [ ] Mobile app (core features)

### Phase 2: Core Features (Weeks 9-16)
- [ ] Memory/RAG system
- [ ] Voice conversations
- [ ] Journal entries
- [ ] Goal setting
- [ ] Safety plan
- [ ] Web app

### Phase 3: Premium Features (Weeks 17-24)
- [ ] Subscription system
- [ ] Advanced analytics
- [ ] Guided exercises
- [ ] Progress dashboard
- [ ] Admin panel

### Phase 4: Scale & Optimize (Weeks 25-32)
- [ ] Performance optimization
- [ ] Advanced personalization
- [ ] Multi-language support
- [ ] Enterprise features

---

## 13. KEY DOCUMENTS REFERENCE

| Document | Location | Purpose |
|----------|----------|---------|
| PRD | `/product/PRD.md` | Full product requirements |
| Crisis Protocols | `/research/crisis_protocols.md` | Safety procedures |
| Legal Compliance | `/research/legal_compliance.md` | Regulatory guidance |
| User Personas | `/research/user_personas.md` | Target users |
| Tech Stack | `/technical/tech_stack.md` | Technology choices |
| System Architecture | `/technical/system_architecture.md` | Architecture details |
| AI Pipeline | `/technical/ai_pipeline.md` | AI implementation |
| API Design | `/technical/api_design.md` | API specifications |
| Project Structure | `/code/project_structure.md` | Code organization |

---

## 14. APPENDIX

### 14.1 Key Metrics (Success Criteria)

| Metric | Target |
|--------|--------|
| Daily Active Users (Month 6) | 10,000 |
| Session Completion Rate | > 80% |
| Crisis Detection Accuracy | > 95% |
| User Retention (Day 30) | > 40% |
| Net Promoter Score | > 50 |
| API Response Time (p99) | < 500ms |
| System Uptime | 99.9% |

### 14.2 Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Regulatory changes | Medium | High | Legal monitoring, flexible architecture |
| AI safety incidents | Low | Critical | Robust crisis detection, human oversight |
| Data breach | Low | Critical | Encryption, access controls, audits |
| Competition | High | Medium | Differentiation, rapid iteration |
| Technical debt | Medium | Medium | Code reviews, refactoring sprints |

---

**END OF CONSOLIDATED ARCHITECTURE DOCUMENT**

This document represents the single source of truth for MindMate AI architecture. All implementation decisions should reference this document.
