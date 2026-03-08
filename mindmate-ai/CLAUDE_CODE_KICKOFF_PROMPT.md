# Claude Code Kickoff Prompt - MindMate AI
## Complete Context for Implementation

---

## YOUR ROLE

You are Claude Code, an expert software engineer tasked with implementing **MindMate AI** - a production-ready mental wellness companion application. You have access to comprehensive architecture documentation and must implement the system following best practices.

---

## PROJECT OVERVIEW

**MindMate AI** is an AI-powered mental wellness companion that provides:
- Conversational AI support using Claude
- Evidence-based techniques (CBT, mindfulness)
- Mood tracking and journaling
- Goal setting and progress tracking
- Crisis detection and safety protocols

**Legal Positioning**: Wellness coaching platform (NOT therapy) to ensure regulatory compliance.

---

## CRITICAL CONTEXT

### 1. Architecture Reference

**READ THIS FIRST**: `/mnt/okcomputer/output/mindmate-ai/CONSOLIDATED_ARCHITECTURE.md`

This is your single source of truth for:
- Technology stack decisions
- System architecture diagrams
- Database schema
- API design
- Security requirements
- Deployment architecture

### 2. Supporting Documentation

Key documents in `/mnt/okcomputer/output/mindmate-ai/`:

| Document | Path | Read When |
|----------|------|-----------|
| PRD | `product/PRD.md` | Understanding features |
| Crisis Flow | `product/crisis_flow.md` | Implementing safety |
| Onboarding | `product/onboarding_flow.md` | User onboarding |
| User Personas | `research/user_personas.md` | Understanding users |
| Legal Compliance | `research/legal_compliance.md` | Compliance requirements |
| Crisis Protocols | `research/crisis_protocols.md` | Safety procedures |
| Tech Stack | `technical/tech_stack.md` | Technology details |
| AI Pipeline | `technical/ai_pipeline.md` | AI implementation |
| Memory/RAG | `technical/memory_rag_system.md` | Memory system |
| Claude Integration | `technical/claude_integration.md` | Claude setup |
| Security | `technical/security_architecture.md` | Security requirements |
| DevOps | `technical/devops_infrastructure.md` | Infrastructure |
| Project Structure | `code/project_structure.md` | Code organization |
| Master Prompt | `prompts/master_therapist_prompt.md` | AI persona |

---

## TECHNOLOGY STACK (Non-Negotiable)

### Frontend
- **Mobile**: React Native + Expo (SDK 50)
- **Web**: Next.js 14 (App Router)
- **UI**: shadcn/ui + Radix UI + Tailwind CSS
- **State**: Zustand
- **Query**: TanStack Query v5
- **Forms**: React Hook Form + Zod

### Backend
- **API Gateway**: Node.js + Fastify/Express
- **AI Pipeline**: Python + FastAPI
- **WebSocket**: Node.js + Socket.io
- **Scheduler**: Node.js + Bull

### AI/ML
- **LLM**: Anthropic Claude 3.5 Sonnet
- **Embeddings**: OpenAI text-embedding-3-small
- **Vector DB**: Pinecone
- **RAG**: LangChain or custom implementation

### Infrastructure
- **Cloud**: AWS
- **Containers**: ECS Fargate
- **Database**: RDS PostgreSQL 15
- **Cache**: ElastiCache Redis 7
- **Storage**: S3 + CloudFront
- **IaC**: Terraform

---

## PROJECT STRUCTURE

Create a monorepo with this structure:

```
mindmate-ai/
├── apps/
│   ├── mobile/              # React Native (Expo)
│   ├── web/                 # Next.js web app
│   └── admin/               # Next.js admin dashboard
├── services/
│   ├── api/                 # Main API gateway (Node.js)
│   ├── ai-pipeline/         # AI service (Python)
│   ├── websocket/           # WebSocket server (Node.js)
│   └── scheduler/           # Job scheduler (Node.js)
├── packages/
│   ├── shared/              # Shared types & utilities
│   ├── ui/                  # Shared UI components
│   ├── config/              # Shared configuration
│   └── eslint-config/       # Shared ESLint config
├── infrastructure/
│   ├── terraform/           # Terraform modules
│   └── docker/              # Docker configurations
├── docs/                    # Documentation
└── scripts/                 # Build & utility scripts
```

Use **PNPM workspaces** + **Turborepo** for monorepo management.

---

## IMPLEMENTATION PHASES

### Phase 1: Foundation (Start Here)

**Goal**: Get a basic working system with auth and chat

**Tasks**:
1. Set up monorepo structure with PNPM + Turborepo
2. Configure TypeScript, ESLint, Prettier across all packages
3. Create shared packages (types, UI components, config)
4. Set up mobile app with Expo
5. Set up web app with Next.js
6. Create API gateway with authentication
7. Set up PostgreSQL database with initial schema
8. Implement basic user registration/login
9. Create basic chat interface
10. Integrate Claude API for conversations
11. Implement basic crisis keyword detection

**Success Criteria**:
- User can register and log in
- User can have a basic chat with AI
- Crisis keywords trigger appropriate response
- Data persists to database

### Phase 2: Core Features

**Goal**: Add essential wellness features

**Tasks**:
1. Implement mood tracking
2. Create journal entry system
3. Add goal setting functionality
4. Build safety plan feature
5. Implement memory/RAG system with Pinecone
6. Add voice message support
7. Create progress dashboard
8. Implement guided exercises
9. Add notification system
10. Build profile settings

### Phase 3: Safety & Compliance

**Goal**: Ensure safety and regulatory compliance

**Tasks**:
1. Implement full crisis detection algorithm
2. Create crisis response flows
3. Add emergency contact system
4. Implement comprehensive safety plan
5. Add consent flows for GDPR
6. Create data export functionality
7. Implement account deletion
8. Add audit logging
9. Create privacy settings
10. Add terms of service acceptance

### Phase 4: Premium & Scale

**Goal**: Add monetization and scale

**Tasks**:
1. Implement Stripe subscription system
2. Create premium feature gates
3. Add usage limits for free tier
4. Build admin dashboard
5. Implement analytics
6. Add multi-language support
7. Create enterprise features
8. Optimize performance
9. Add advanced personalization
10. Implement A/B testing framework

---

## CRITICAL IMPLEMENTATION NOTES

### 1. Crisis Detection (MUST IMPLEMENT CORRECTLY)

```typescript
// Crisis detection is NON-NEGOTIABLE
// Implement multi-layer detection:

interface CrisisDetectionResult {
  score: number;        // 0-100
  tier: 1 | 2 | 3;      // 1=gentle, 2=direct, 3=crisis
  keywords: string[];
  sentiment: number;    // 0-100
  requiresIntervention: boolean;
}

// Keywords by severity
const CRITICAL_KEYWORDS = [
  'kill myself', 'suicide', 'end my life',
  'want to die', 'better off dead'
];

const HIGH_RISK_KEYWORDS = [
  'hopeless', 'worthless', 'burden',
  'can\'t go on', 'give up'
];

// Response thresholds
// < 25: Monitor
// 25-49: Gentle check-in
// 50-74: Direct assessment  
// >= 75: Full crisis protocol
```

### 2. AI Prompt Engineering

```typescript
// System prompt MUST include safety instructions
const SYSTEM_PROMPT = `You are MindMate, a compassionate wellness companion.

CRITICAL RULES:
1. You are NOT a therapist or medical professional
2. NEVER diagnose mental health conditions
3. NEVER prescribe medication
4. If user expresses suicidal thoughts, IMMEDIATELY provide crisis resources
5. Always encourage professional help for serious concerns
6. Use evidence-based techniques (CBT, mindfulness)
7. Be empathetic but maintain appropriate boundaries

CRISIS RESPONSE:
If user mentions suicide, self-harm, or being in danger:
- Immediately acknowledge their pain
- Ask directly about safety
- Provide 988 Suicide & Crisis Lifeline
- Encourage calling emergency services
- Stay with them until safety is confirmed

TONE:
- Warm, supportive, non-judgmental
- Use user's name occasionally
- Validate feelings before offering suggestions
- Keep responses concise (2-4 paragraphs max)`;
```

### 3. Database Schema Priorities

**Create these tables FIRST**:
1. `users` - User accounts
2. `user_profiles` - Extended user info
3. `conversations` - Chat sessions
4. `messages` - Individual messages
5. `mood_entries` - Mood tracking
6. `crisis_events` - Crisis detection log

### 4. API Security Requirements

```typescript
// ALL endpoints MUST:

// 1. Validate authentication
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  // Verify JWT
};

// 2. Rate limit
const rateLimit = {
  windowMs: 60 * 1000, // 1 minute
  max: 100 // requests per window
};

// 3. Validate input with Zod
const schema = z.object({
  content: z.string().min(1).max(4000)
});

// 4. Sanitize output
const sanitize = (content: string) => {
  // Remove potentially harmful content
  return DOMPurify.sanitize(content);
};
```

### 5. Environment Variables

```bash
# Required environment variables

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Redis
REDIS_URL=redis://host:6379

# AI APIs
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=...
PINECONE_INDEX_NAME=...

# Auth
JWT_SECRET=...
JWT_REFRESH_SECRET=...

# AWS (for deployment)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Other
NODE_ENV=development
PORT=8000
```

---

## CODING STANDARDS

### TypeScript
- Enable strict mode
- Use explicit return types on functions
- No `any` types (use `unknown` if needed)
- Use interfaces for object shapes
- Use type aliases for unions/intersections

### React
- Use functional components
- Use hooks (no class components)
- Use custom hooks for reusable logic
- Use React.memo for expensive renders
- Use useCallback for function props

### API Design
- Use RESTful conventions
- Version APIs (`/api/v1/`)
- Use consistent response format:
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}
```

### Error Handling
```typescript
// Always wrap in try-catch
try {
  const result = await someOperation();
  return { success: true, data: result };
} catch (error) {
  logger.error('Operation failed', { error, context });
  return {
    success: false,
    error: {
      code: 'OPERATION_FAILED',
      message: 'Unable to complete operation'
    }
  };
}
```

### Testing
- Unit tests for business logic
- Integration tests for APIs
- E2E tests for critical user flows
- Minimum 70% code coverage

---

## COMMON PATTERNS

### Repository Pattern (Database)
```typescript
// services/api/src/repositories/UserRepository.ts
export class UserRepository {
  async findById(id: string): Promise<User | null> {
    return db.query('SELECT * FROM users WHERE id = $1', [id]);
  }
  
  async create(data: CreateUserInput): Promise<User> {
    return db.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *',
      [data.email, data.passwordHash]
    );
  }
}
```

### Service Pattern (Business Logic)
```typescript
// services/api/src/services/ChatService.ts
export class ChatService {
  constructor(
    private conversationRepo: ConversationRepository,
    private aiPipeline: AIPipelineClient,
    private crisisDetector: CrisisDetector
  ) {}
  
  async sendMessage(userId: string, content: string): Promise<Message> {
    // 1. Check for crisis
    const crisisCheck = await this.crisisDetector.analyze(content);
    
    // 2. Get AI response
    const aiResponse = await this.aiPipeline.generateResponse({
      userId,
      message: content,
      crisisContext: crisisCheck
    });
    
    // 3. Save to database
    return this.conversationRepo.saveMessage({
      userId,
      content,
      response: aiResponse,
      crisisDetected: crisisCheck.requiresIntervention
    });
  }
}
```

### Hook Pattern (React)
```typescript
// apps/mobile/src/hooks/useChat.ts
export const useChat = (conversationId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const sendMessage = useCallback(async (content: string) => {
    setIsLoading(true);
    try {
      const response = await api.post(`/conversations/${conversationId}/messages`, {
        content
      });
      setMessages(prev => [...prev, response.data]);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);
  
  return { messages, sendMessage, isLoading };
};
```

---

## DEPLOYMENT NOTES

### Local Development
```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your values

# 3. Start database
docker-compose up -d postgres redis

# 4. Run migrations
pnpm db:migrate

# 5. Start development
pnpm dev
```

### Docker
```dockerfile
# Example API Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 8000
CMD ["pnpm", "start"]
```

### AWS Deployment
- Use ECS Fargate for containers
- Use RDS for PostgreSQL
- Use ElastiCache for Redis
- Use S3 for file storage
- Use CloudFront for CDN
- Use Route 53 for DNS
- Use Terraform for infrastructure

---

## TROUBLESHOOTING

### Common Issues

**Issue**: Claude API rate limits  
**Solution**: Implement request queuing and exponential backoff

**Issue**: WebSocket connections dropping  
**Solution**: Implement heartbeat/ping-pong, auto-reconnect

**Issue**: Database connection pool exhaustion  
**Solution**: Increase pool size, implement connection retry

**Issue**: Memory/RAG retrieval slow  
**Solution**: Add caching layer, optimize vector queries

**Issue**: Crisis detection false positives  
**Solution**: Tune thresholds, add context analysis

---

## CHECKLIST FOR EACH FEATURE

Before marking a feature complete:

- [ ] Code follows project structure
- [ ] TypeScript types are defined
- [ ] Error handling is implemented
- [ ] Unit tests are written
- [ ] API documentation is updated
- [ ] Security review is done
- [ ] Performance is acceptable
- [ ] Accessibility is considered
- [ ] Mobile responsiveness works
- [ ] Crisis safety is verified (if applicable)

---

## GETTING STARTED

1. **Read the consolidated architecture**: `/mnt/okcomputer/output/mindmate-ai/CONSOLIDATED_ARCHITECTURE.md`

2. **Set up your development environment**:
   - Node.js 20+
   - Python 3.11+
   - PNPM 8+
   - Docker

3. **Create the project structure** as defined above

4. **Start with Phase 1** (Foundation)

5. **Ask questions** if anything is unclear

---

## REMEMBER

- **Safety first**: Crisis detection is non-negotiable
- **Compliance matters**: Follow GDPR, consider HIPAA
- **User privacy**: Encrypt everything, minimize data collection
- **Test thoroughly**: Especially crisis scenarios
- **Document as you go**: Keep code and docs in sync
- **Performance matters**: Users expect fast responses
- **Accessibility**: Design for all users

---

**Let's build MindMate AI!**
