# MindMate AI - MASTER INDEX
## Complete Handoff Document for Claude Code

**Version:** 1.0  
**Date:** March 2025  
**Total Files:** 516  
**Status:** Production-Ready Specification  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Complete File Index](#2-complete-file-index)
3. [File Summaries by Category](#3-file-summaries-by-category)
4. [Implementation Priority Order](#4-implementation-priority-order)
5. [Dependencies Map](#5-dependencies-map)
6. [Open Questions for Human Decisions](#6-open-questions-for-human-decisions)
7. [Recommended First Conversation with Claude Code](#7-recommended-first-conversation-with-claude-code)
8. [Quick Start Guide](#8-quick-start-guide)

---

## 1. Executive Summary

### Project Overview

**MindMate AI** is a comprehensive mental health therapy platform that combines AI-powered conversations with real-time emotional support. The platform provides:

- **24/7 AI-powered emotional support** using Claude API
- **Personalized mental wellness plans** based on user data
- **Evidence-based techniques** (CBT, mindfulness, mood tracking)
- **Crisis detection and intervention pathways**
- **Progress tracking and insights**
- **Multi-platform support** (iOS, Android, Web)

### Target Audience
- Primary: 18-45 years old, tech-savvy individuals seeking mental wellness support
- Secondary: Healthcare providers, organizations, family members

### MVP Timeline
- **12-week build plan** with 5.25 FTE team
- Target: 5,000 MAU at launch
- Platforms: iOS and Android (React Native)

### Technology Stack Summary

| Layer | Technology |
|-------|------------|
| Mobile | React Native + Expo |
| Web | Next.js 14 |
| API | Node.js + Fastify |
| AI Services | Python + FastAPI |
| Database | PostgreSQL (RDS) |
| Vector DB | Pinecone |
| Cache | Redis |
| AI Brain | Claude API (Anthropic) |
| Emotion | Hume AI |
| Voice | ElevenLabs |
| Cloud | AWS |

---

## 2. Complete File Index

### 2.1 Documentation Files (73 files)

```
/mnt/okcomputer/output/mindmate-ai/
├── product/
│   ├── PRD.md                                    # Main Product Requirements Document
│   ├── accessibility.md                          # Accessibility requirements
│   ├── admin_dashboard.md                        # Admin dashboard specifications
│   ├── avatar_character_design.md                # 7 AI avatar personalities
│   ├── crisis_flow.md                            # Crisis intervention flows
│   ├── daily_challenges_ux.md                    # Daily challenges feature
│   ├── gamification.md                           # Gamification system
│   ├── information_architecture.md               # App IA structure
│   ├── memory_personalization.md                 # Memory & personalization
│   ├── notification_system.md                    # Notification architecture
│   ├── onboarding_flow.md                        # User onboarding flow
│   ├── profile_settings.md                       # Profile management
│   ├── progress_dashboard.md                     # Progress tracking UI
│   ├── subscription_flows.md                     # Subscription/payment flows
│   └── video_session_ux.md                       # Video session interface
├── research/
│   ├── ai_tools_comparison.md                    # AI tool evaluation
│   ├── avatar_technology.md                      # Avatar tech research
│   ├── business_model.md                         # Business model analysis
│   ├── competitive_analysis.md                   # 10-competitor analysis
│   ├── crisis_protocols.md                       # Crisis handling protocols
│   ├── legal_compliance.md                       # Legal & compliance requirements
│   ├── market_opportunity.md                     # Market sizing & opportunity
│   ├── notification_strategy.md                  # Notification strategy
│   ├── therapy_techniques.md                     # Therapy modality research
│   └── user_personas.md                          # 6 user personas
├── technical/
│   ├── ai_pipeline.md                            # AI/ML pipeline architecture
│   ├── analytics_ml_pipeline.md                  # Analytics pipeline
│   ├── api_spec.yaml                             # OpenAPI specification
│   ├── auth_system.md                            # Authentication architecture
│   ├── avatar_integration.md                     # Avatar integration guide
│   ├── claude_integration.md                     # Claude API integration
│   ├── database_schema.sql                       # PostgreSQL schema
│   ├── devops_infrastructure.md                  # DevOps & infrastructure
│   ├── elevenlabs_integration.md                 # Voice synthesis integration
│   ├── hume_ai_integration.md                    # Emotion detection integration
│   ├── memory_rag_system.md                      # RAG memory system
│   ├── mobile_architecture.md                    # Mobile app architecture
│   ├── notification_system_architecture.md       # Notification system
│   ├── security_architecture.md                  # Security architecture
│   ├── system_architecture.md                    # Complete system architecture
│   ├── tech_stack.md                             # Technology stack decisions
│   ├── testing_strategy.md                       # Testing approach
│   ├── third_party_integrations.md               # Third-party integrations
│   ├── web_architecture.md                       # Web app architecture
│   └── webrtc_architecture.md                    # Video calling architecture
├── planning/
│   ├── ai_improvement_roadmap.md                 # AI roadmap
│   ├── budget_projections.md                     # Financial projections
│   ├── clinical_validation_plan.md               # Clinical validation
│   ├── ethics_safety_framework.md                # Ethics & safety
│   ├── global_expansion_plan.md                  # Global expansion
│   ├── integration_ecosystem.md                  # Integration ecosystem
│   ├── launch_strategy.md                        # Launch plan
│   ├── mvp_scope.md                              # MVP scope (12-week plan)
│   ├── pitch_deck_content.md                     # Investor pitch content
│   ├── risk_register.md                          # Risk management
│   ├── sprint_plan.md                            # Sprint planning
│   ├── team_hiring_plan.md                       # Team hiring roadmap
│   └── therapist_partnership_program.md          # Therapist partnerships
├── prompts/
│   ├── master_therapist_prompt.md                # Main AI therapist prompt
│   └── therapist_system_prompt.md                # System prompt template
└── content/
    ├── 365_daily_challenges.md                   # Daily challenges content
    ├── anxiety_response_scripts.md               # Anxiety response templates
    ├── app_store_marketing_copy.md               # App store copy
    ├── breathing_exercises.md                    # Breathing exercise scripts
    ├── cbt_dialogues.md                          # CBT dialogue templates
    ├── crisis_intervention_scripts.md            # Crisis intervention content
    ├── depression_response_scripts.md            # Depression response templates
    ├── email_sms_templates.md                    # Communication templates
    ├── faq_help_content.md                       # FAQ and help content
    ├── journaling_prompts.md                     # Journaling prompts library
    ├── legal_documents_draft.md                  # Legal document templates
    ├── meditation_scripts.md                     # Meditation scripts
    ├── microcopy.md                              # UI microcopy
    ├── onboarding_copy.md                        # Onboarding content
    ├── progress_report_templates.md              # Progress report templates
    ├── push_notifications.md                     # Push notification copy
    ├── session_opening_scripts.md                # Session opening templates
    ├── social_media_90_days.md                   # Social media content plan
    └── trauma_informed_scripts.md                # Trauma-informed content
```

### 2.2 Code Files (400+ files)

```
/mnt/okcomputer/output/mindmate-ai/code/
├── project_structure.md                        # Monorepo structure definition
├── admin/                                      # Admin dashboard (Next.js)
│   ├── README.md
│   ├── app/                                    # Next.js app router
│   ├── components/                             # React components
│   ├── data/                                   # Mock data
│   ├── hooks/                                  # Custom hooks
│   ├── lib/                                    # Utilities
│   ├── types/                                  # TypeScript types
│   └── config files (next.config.js, etc.)
├── ai-service/                                 # AI/ML service (Python)
│   ├── README.md
│   ├── main.py                                 # Service entry point
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── requirements.txt
│   ├── config/                                 # Configuration
│   ├── src/                                    # Source code
│   │   ├── chat_service.py
│   │   ├── claude_client.py
│   │   ├── emotion_handler.py
│   │   ├── memory_store.py
│   │   ├── models.py
│   │   ├── prompt_assembler.py
│   │   ├── response_parser.py
│   │   └── tts_service.py
│   └── tests/                                  # Test suite
├── analytics-service/                          # Analytics (TypeScript)
│   ├── README.md
│   ├── index.ts
│   ├── types.ts
│   ├── utils.ts
│   ├── milestone-detector.ts
│   ├── mood-trend-calculator.ts
│   ├── progress-score-calculator.ts
│   ├── task-completion-calculator.ts
│   ├── trigger-pattern-detector.ts
│   └── weekly-report-generator.ts
├── api/                                        # Backend API
│   ├── auth/                                   # Authentication (Python)
│   ├── billing/                                # Billing service (Python)
│   ├── sessions/                               # Session management (Node.js)
│   ├── users/                                  # User service (Python)
│   └── src/                                    # Main API (TypeScript)
│       ├── config/
│       ├── middleware/
│       ├── routes/
│       ├── validations/
│       └── utils/
├── crisis-service/                             # Crisis detection (Python)
│   ├── README.md
│   ├── service.py
│   ├── classifier.py
│   ├── orchestrator.py
│   ├── behavioral_triggers.py
│   ├── emotion_triggers.py
│   ├── keywords.py
│   ├── notifications.py
│   └── test_crisis_service.py
├── database/                                   # Database
│   ├── README.md
│   ├── schema.prisma
│   ├── run_migrations.sql
│   └── migrations/
├── memory-service/                             # Memory/RAG service (Python)
│   ├── README.md
│   ├── memory_service.py
│   ├── embedding_service.py
│   ├── pinecone_client.py
│   └── models.py
├── mobile/                                     # React Native app
│   ├── README.md
│   ├── App.tsx
│   ├── app.json
│   ├── src/
│   │   ├── components/
│   │   ├── screens/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── stores/
│   │   ├── types/
│   │   └── utils/
│   └── screens/                                # Feature screens
│       ├── Progress/
│       ├── VideoSession/
│       └── challenges/
├── notification-service/                       # Notifications (TypeScript)
│   ├── README.md
│   ├── Dockerfile
│   ├── src/
│   └── test/
└── web/                                        # Web app (Next.js)
    ├── README.md
    ├── app/
    ├── components/
    ├── hooks/
    ├── lib/
    ├── stores/
    └── types/
```

### 2.3 Infrastructure Files (15+ files)

```
/mnt/okcomputer/output/mindmate-ai/infrastructure/
└── terraform/
    ├── README.md
    ├── main.tf
    ├── variables.tf
    ├── outputs.tf
    ├── environments/
    │   ├── development.tfvars
    │   ├── staging.tfvars
    │   └── production.tfvars
    └── modules/
        ├── vpc/
        ├── eks/
        ├── rds/
        ├── redis/
        └── s3/
```

---

## 3. File Summaries by Category

### 3.1 Product Documentation (15 files)

| File | Summary |
|------|---------|
| **PRD.md** | Complete Product Requirements Document with vision, goals, 100 user stories, feature requirements for MVP and full product, success metrics, and out-of-scope items. The single source of truth for product definition. |
| **accessibility.md** | WCAG 2.1 AA compliance requirements, screen reader support, color contrast guidelines, and accessibility testing procedures. |
| **admin_dashboard.md** | Admin panel specifications for user management, content moderation, analytics viewing, crisis alerts, and system health monitoring. |
| **avatar_character_design.md** | 7 distinct AI avatar personalities (Empathetic Emma, Coach Carlos, Mindful Maria, etc.) with detailed prompts, voice characteristics, and use cases. |
| **crisis_flow.md** | Crisis detection workflows, escalation protocols, emergency resource integration, and safety planning features. |
| **daily_challenges_ux.md** | Daily wellness challenges feature design with gamification elements, streak tracking, and reward systems. |
| **gamification.md** | Achievement system, badges, streaks, progress levels, and engagement mechanics to motivate users. |
| **information_architecture.md** | App navigation structure, screen hierarchy, user flows, and content organization. |
| **memory_personalization.md** | Long-term memory system design using RAG, user preference storage, and personalization algorithms. |
| **notification_system.md** | Push notification architecture, scheduling, preference management, and delivery tracking. |
| **onboarding_flow.md** | 5-step onboarding: Welcome → Assessment → Goal Selection → Avatar Choice → First Chat. Includes PHQ-9 adaptation. |
| **profile_settings.md** | User profile management, privacy settings, account preferences, and data export features. |
| **progress_dashboard.md** | Progress tracking UI with mood trends, achievement display, streak visualization, and insights cards. |
| **subscription_flows.md** | Free/Premium tier feature differentiation, payment flows, and subscription management. |
| **video_session_ux.md** | Video calling interface design, emotion feedback display, session controls, and transcript overlay. |

### 3.2 Research Documentation (10 files)

| File | Summary |
|------|---------|
| **ai_tools_comparison.md** | Evaluation of AI tools including Claude vs GPT-4, Hume AI vs alternatives, ElevenLabs vs competitors with cost/benefit analysis. |
| **avatar_technology.md** | HeyGen vs D-ID vs Synthesia comparison for AI avatar generation with integration approaches. |
| **business_model.md** | Freemium model analysis, pricing strategies, unit economics, and revenue projections. |
| **competitive_analysis.md** | Deep analysis of 10 competitors (BetterHelp, Talkspace, Woebot, Replika, Calm, Headspace, Wysa, Youper, Cerebral, Spring Health) with feature gaps. |
| **crisis_protocols.md** | Crisis intervention best practices, legal requirements, escalation procedures, and safety guidelines. |
| **legal_compliance.md** | HIPAA considerations, GDPR compliance, data privacy requirements, and terms of service guidelines. |
| **market_opportunity.md** | TAM/SAM/SOM analysis, market trends, growth projections, and target demographics. |
| **notification_strategy.md** | Optimal notification timing, frequency guidelines, content best practices, and engagement optimization. |
| **therapy_techniques.md** | CBT, DBT, mindfulness, ACT, and other evidence-based therapy modalities for AI implementation. |
| **user_personas.md** | 6 detailed user personas: Stressed Sarah, Anxious Alex, Battling Brian, Mindful Maria, Caregiver Carlos, Teen Taylor. |

### 3.3 Technical Documentation (20 files)

| File | Summary |
|------|---------|
| **ai_pipeline.md** | AI/ML pipeline architecture with LLM Gateway, intent classification, sentiment analysis, crisis detection, and RAG system. |
| **analytics_ml_pipeline.md** | User behavior analytics, mood prediction models, and insight generation pipeline. |
| **api_spec.yaml** | OpenAPI 3.0 specification for all backend endpoints with request/response schemas. |
| **auth_system.md** | Authentication architecture using Clerk, JWT flow, MFA, OAuth integration, and session management. |
| **avatar_integration.md** | HeyGen API integration for AI avatar generation and video synthesis. |
| **claude_integration.md** | Claude API integration patterns, prompt engineering, context management, and fallback strategies. |
| **database_schema.sql** | Complete PostgreSQL schema with 20+ tables including users, sessions, messages, mood tracking, and crisis events. |
| **devops_infrastructure.md** | CI/CD pipelines, deployment strategies, monitoring setup, and infrastructure management. |
| **elevenlabs_integration.md** | Voice synthesis integration for AI therapist voice with emotional range control. |
| **hume_ai_integration.md** | Emotion detection integration for real-time voice/facial emotion analysis during sessions. |
| **memory_rag_system.md** | Retrieval-Augmented Generation system using Pinecone for long-term conversation memory. |
| **mobile_architecture.md** | React Native app architecture with navigation, state management, and native module integration. |
| **notification_system_architecture.md** | Push notification service architecture with FCM/APNs integration and delivery tracking. |
| **security_architecture.md** | Security layers: encryption, authentication, authorization, audit logging, and compliance controls. |
| **system_architecture.md** | Complete microservices architecture diagram with all services, databases, and third-party integrations. |
| **tech_stack.md** | Comprehensive technology stack decisions with alternatives considered and cost estimates. |
| **testing_strategy.md** | Unit, integration, E2E testing approach with Jest, React Testing Library, and Playwright. |
| **third_party_integrations.md** | All third-party service integrations: Stripe, Twilio, SendGrid, etc. |
| **web_architecture.md** | Next.js web app architecture with App Router, Server Components, and API routes. |
| **webrtc_architecture.md** | Video calling architecture using WebRTC with Daily.co or Twilio integration. |

### 3.4 Planning Documentation (13 files)

| File | Summary |
|------|---------|
| **ai_improvement_roadmap.md** | 18-month AI capability roadmap with model improvements and feature additions. |
| **budget_projections.md** | 3-year financial projections including development costs, operating expenses, and revenue forecasts. |
| **clinical_validation_plan.md** | Plan for clinical studies, IRB approval, outcome measurement, and peer-reviewed publications. |
| **ethics_safety_framework.md** | AI ethics guidelines, safety guardrails, bias mitigation, and responsible AI practices. |
| **global_expansion_plan.md** | International expansion strategy with localization, compliance, and market entry plans. |
| **integration_ecosystem.md** | EHR integrations, wearable device connections, and third-party app integrations. |
| **launch_strategy.md** | Go-to-market plan including beta testing, app store optimization, and marketing campaigns. |
| **mvp_scope.md** | **CRITICAL:** 12-week MVP build plan with week-by-week breakdown, team composition, and feature checklist. |
| **pitch_deck_content.md** | Investor presentation content with problem, solution, market, traction, and team slides. |
| **risk_register.md** | Identified risks with impact assessment, mitigation strategies, and contingency plans. |
| **sprint_plan.md** | Agile sprint planning with 2-week sprint structure and backlog organization. |
| **team_hiring_plan.md** | Hiring roadmap for engineering, product, design, and clinical advisory roles. |
| **therapist_partnership_program.md** | Program for integrating licensed therapists into the platform. |

### 3.5 Content Library (18 files)

| File | Summary |
|------|---------|
| **365_daily_challenges.md** | Full year of daily wellness challenges covering gratitude, mindfulness, connection, and self-care. |
| **anxiety_response_scripts.md** | Pre-written AI response templates for anxiety-related user messages. |
| **app_store_marketing_copy.md** | App store descriptions, screenshots copy, and feature highlights for iOS/Android stores. |
| **breathing_exercises.md** | 5+ breathing exercise scripts (box breathing, 4-7-8, etc.) with timing and instructions. |
| **cbt_dialogues.md** | CBT technique dialogues including thought records, cognitive restructuring, and behavioral activation. |
| **crisis_intervention_scripts.md** | Crisis response templates with escalation triggers and resource provision. |
| **depression_response_scripts.md** | AI response templates for depression-related conversations with appropriate tone and resources. |
| **email_sms_templates.md** | Welcome emails, verification messages, password reset, and marketing communications. |
| **faq_help_content.md** | Frequently asked questions and help articles for in-app support section. |
| **journaling_prompts.md** | 200+ journaling prompts organized by category (gratitude, reflection, growth, etc.). |
| **legal_documents_draft.md** | Terms of Service, Privacy Policy, HIPAA Notice, and Cookie Policy templates. |
| **meditation_scripts.md** | 5+ guided meditation scripts (5-10 minutes) for various purposes. |
| **microcopy.md** | UI button text, error messages, loading states, and toast notifications. |
| **onboarding_copy.md** | Welcome screens, assessment questions, and onboarding flow text. |
| **progress_report_templates.md** | Weekly wellness report templates with mood trends and insights. |
| **push_notifications.md** | Push notification copy for reminders, check-ins, and motivational messages. |
| **session_opening_scripts.md** | AI therapist opening messages for different session types. |
| **social_media_90_days.md** | 90-day social media content calendar for launch marketing. |
| **trauma_informed_scripts.md** | Trauma-informed response templates with sensitivity guidelines. |



### 3.6 Code Files Summary

#### AI Service (Python)
| File | Summary |
|------|---------|
| **main.py** | FastAPI application entry point with route registration and middleware setup. |
| **claude_client.py** | Claude API client with retry logic, token tracking, and response handling. |
| **chat_service.py** | Core chat orchestration service managing conversation flow and context. |
| **emotion_handler.py** | Emotion detection integration with Hume AI for real-time analysis. |
| **memory_store.py** | Conversation memory management with Pinecone vector database. |
| **prompt_assembler.py** | Dynamic prompt assembly with user context, history, and avatar personality. |
| **response_parser.py** | AI response parsing, validation, and safety filtering. |
| **tts_service.py** | Text-to-speech integration with ElevenLabs for voice responses. |

#### Crisis Service (Python)
| File | Summary |
|------|---------|
| **service.py** | Main crisis detection service with API endpoints. |
| **classifier.py** | Crisis risk classification model with low/medium/high/critical levels. |
| **orchestrator.py** | Crisis escalation orchestration with notification and resource provision. |
| **behavioral_triggers.py** | Behavioral pattern detection for crisis indicators. |
| **emotion_triggers.py** | Emotion-based crisis trigger detection. |
| **keywords.py** | Crisis keyword and phrase dictionaries. |
| **notifications.py** | Crisis alert notification system. |

#### Analytics Service (TypeScript)
| File | Summary |
|------|---------|
| **index.ts** | Service entry point and API route handlers. |
| **milestone-detector.ts** | User milestone detection (7-day streak, first chat, etc.). |
| **mood-trend-calculator.ts** | Mood trend analysis and pattern recognition. |
| **progress-score-calculator.ts** | Overall progress score calculation. |
| **task-completion-calculator.ts** | Task and exercise completion tracking. |
| **trigger-pattern-detector.ts** | Personal trigger pattern identification. |
| **weekly-report-generator.ts** | Automated weekly wellness report generation. |

#### Mobile App (React Native/TypeScript)
| File | Summary |
|------|---------|
| **App.tsx** | Main application entry point with navigation and providers. |
| **src/screens/auth/** | Authentication screens (Login, Register, ForgotPassword, Splash). |
| **src/screens/main/** | Main app screens (Home, Chat, MoodTracker, Profile, Settings, etc.). |
| **src/screens/onboarding/** | Onboarding flow screens. |
| **src/components/common/** | Shared UI components (Button, Input, TabBarIcon). |
| **src/hooks/** | Custom React hooks (useTheme, useCamera, useAudio, usePermissions). |
| **src/services/** | API clients and service integrations. |
| **src/stores/** | Zustand state management stores (authStore, userStore, sessionStore). |
| **screens/Progress/** | Progress dashboard components (charts, streak tracker, milestone celebrations). |
| **screens/VideoSession/** | Video calling screen with emotion indicators and session controls. |

#### Web App (Next.js/TypeScript)
| File | Summary |
|------|---------|
| **app/layout.tsx** | Root layout with providers and global styles. |
| **app/page.tsx** | Landing page with marketing content. |
| **app/(main)/** | Main application routes (dashboard, chat, journal, etc.). |
| **components/ui/** | shadcn/ui components (Button, Card, Dialog, etc.). |
| **components/features/** | Feature-specific components. |
| **hooks/** | Custom React hooks for web app. |
| **stores/** | Zustand state management for web. |

#### Admin Dashboard (Next.js/TypeScript)
| File | Summary |
|------|---------|
| **app/page.tsx** | Admin dashboard home with analytics overview. |
| **components/UserManagementTable.tsx** | User management interface with search and filters. |
| **components/CrisisAlertsPanel.tsx** | Real-time crisis alert monitoring. |
| **components/UsageAnalytics.tsx** | Platform usage analytics charts. |
| **components/SystemHealthMonitor.tsx** | Service health monitoring dashboard. |

---

## 4. Implementation Priority Order

### Phase 1: Foundation (Weeks 1-4) - START HERE

**Priority: CRITICAL - Build First**

| Order | Component | Files to Read | Why First |
|-------|-----------|---------------|-----------|
| 1 | **Project Setup** | `code/project_structure.md` | Monorepo structure, tooling, CI/CD |
| 2 | **Database** | `technical/database_schema.sql`, `database/schema.prisma` | Data foundation for all features |
| 3 | **Authentication** | `api/auth/`, `technical/auth_system.md` | User identity required for everything |
| 4 | **AI Service Core** | `ai-service/`, `technical/claude_integration.md` | Core AI capability |
| 5 | **Chat API** | `api/src/routes/messages/`, `api/sessions/` | Chat backend for mobile app |
| 6 | **Mobile App Shell** | `mobile/`, `technical/mobile_architecture.md` | React Native project setup |
| 7 | **Basic Chat UI** | `mobile/src/screens/main/SessionScreen.tsx` | Primary user interface |
| 8 | **Crisis Detection** | `crisis-service/`, `product/crisis_flow.md` | **SAFETY CRITICAL** |

### Phase 2: Core Features (Weeks 5-8)

**Priority: HIGH - Build Second**

| Order | Component | Files to Read | Dependencies |
|-------|-----------|---------------|--------------|
| 9 | **Onboarding Flow** | `product/onboarding_flow.md`, `mobile/src/screens/onboarding/` | Auth, AI Service |
| 10 | **Avatar System** | `product/avatar_character_design.md`, `ai-service/src/prompt_assembler.py` | AI Service |
| 11 | **Mood Tracking** | `product/progress_dashboard.md`, `api/src/routes/mood/` | Database, Auth |
| 12 | **Mood UI** | `mobile/src/screens/main/MoodTrackerScreen.tsx` | Mood API |
| 13 | **Breathing Exercises** | `content/breathing_exercises.md` | Content library |
| 14 | **CBT Exercises** | `content/cbt_dialogues.md` | Content library |
| 15 | **Guided Meditations** | `content/meditation_scripts.md` | Audio playback |
| 16 | **Progress Dashboard** | `mobile/screens/Progress/` | Mood data, analytics |

### Phase 3: Polish & Integration (Weeks 9-11)

**Priority: MEDIUM - Build Third**

| Order | Component | Files to Read | Dependencies |
|-------|-----------|---------------|--------------|
| 17 | **Notification System** | `notification-service/`, `product/notification_system.md` | All features |
| 18 | **Analytics Service** | `analytics-service/` | User data |
| 19 | **App Lock/Security** | `product/profile_settings.md` | Auth |
| 20 | **Content Recommendations** | `ai-service/src/prompt_assembler.py` | AI Service, Content |
| 21 | **Testing & QA** | `technical/testing_strategy.md` | All features |

### Phase 4: Launch (Week 12)

**Priority: LAUNCH - Final Steps**

| Order | Component | Files to Read | Dependencies |
|-------|-----------|---------------|--------------|
| 22 | **Beta Release** | `planning/launch_strategy.md` | All features |
| 23 | **App Store Submission** | `content/app_store_marketing_copy.md` | Beta feedback |
| 24 | **Monitoring Setup** | `infrastructure/terraform/` | Production deploy |

### Phase 5: Post-MVP (Future)

**Priority: LOW - Defer to Phase 2**

| Component | Files to Read | Why Deferred |
|-----------|---------------|--------------|
| Voice Conversations | `technical/elevenlabs_integration.md` | Adds 3-4 weeks complexity |
| Web Application | `web/`, `technical/web_architecture.md` | Mobile-first strategy |
| Video Sessions | `screens/VideoSession/`, `technical/webrtc_architecture.md` | Complex integration |
| Advanced Analytics | `analytics_ml_pipeline.md` | Requires data volume |
| Subscription/Premium | `product/subscription_flows.md` | Focus on acquisition first |
| Community Features | `product/gamification.md` | Moderation complexity |
| Professional Integration | `planning/therapist_partnership_program.md` | Separate product surface |

---

## 5. Dependencies Map

### 5.1 Read-First Dependencies

```
START HERE
    │
    ├───> code/project_structure.md (understand monorepo)
    │
    ├───> planning/mvp_scope.md (understand 12-week plan)
    │
    ├───> product/PRD.md (understand product vision)
    │
    └───> technical/tech_stack.md (understand technology choices)
            │
            ├───> technical/system_architecture.md
            │
            ├───> technical/database_schema.sql
            │
            └───> technical/claude_integration.md
                    │
                    ├───> prompts/master_therapist_prompt.md
                    │
                    └───> product/avatar_character_design.md
```

### 5.2 Feature Dependencies

| Feature | Depends On | Required For |
|---------|------------|--------------|
| **Authentication** | Database | All features |
| **Chat** | Auth, AI Service | Core experience |
| **Crisis Detection** | Chat | **SAFETY** |
| **Mood Tracking** | Auth, Database | Progress dashboard |
| **Avatar System** | AI Service | Personalization |
| **Content Library** | Database | CBT, meditation |
| **Notifications** | Auth, All features | Engagement |
| **Analytics** | All user data | Insights |
| **Progress Dashboard** | Mood, Analytics | User value |

### 5.3 Service Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Mobile App   │  │ Web App      │  │ Admin Panel  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼─────────────────┼─────────────────┼──────────────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────┐
│                      API GATEWAY                             │
│                    (Node.js/Fastify)                         │
└───────────────────────────┬─────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
┌─────────▼─────────┐ ┌─────▼──────┐ ┌───────▼────────┐
│   AI Service      │ │  Crisis    │ │  Notification  │
│   (Python)        │ │  Service   │ │  Service       │
└─────────┬─────────┘ └─────┬──────┘ └───────┬────────┘
          │                 │                 │
          │   ┌─────────────┼─────────────────┘
          │   │             │
┌─────────▼───▼─────┐ ┌─────▼──────┐ ┌───────▼────────┐
│   Memory/RAG      │ │ Analytics  │ │  Content       │
│   (Pinecone)      │ │ Service    │ │  Service       │
└───────────────────┘ └────────────┘ └────────────────┘
          │
┌─────────▼───────────────────────────────────────────────────┐
│                      DATA LAYER                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │PostgreSQL│  │ Pinecone │  │  Redis   │  │    S3    │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Open Questions for Human Decisions

### 6.1 Critical Decisions (Required Before Building)

| # | Question | Impact | Options |
|---|----------|--------|---------|
| 1 | **What is the actual team size and composition?** | Timeline, scope | 3 people? 5 people? 8 people? |
| 2 | **What is the budget for AI services (Claude, etc.)?** | Feature scope | $500/mo? $2,000/mo? Unlimited? |
| 3 | **Is HIPAA compliance required for MVP?** | Architecture, legal | Yes (adds 4-6 weeks) / No (Phase 2) |
| 4 | **What cloud provider should we use?** | Infrastructure | AWS (recommended) / GCP / Azure |
| 5 | **Do we have existing design assets?** | UI development | Figma files? / Need to create? |
| 6 | **What is the go-to-market timeline?** | MVP scope | 12 weeks? 16 weeks? 24 weeks? |
| 7 | **Is anonymous usage truly required?** | Auth architecture | Yes (more complex) / No (simpler) |
| 8 | **What regions/countries for launch?** | Crisis resources, compliance | US only? / US + Canada? / Global? |

### 6.2 Technical Decisions

| # | Question | Impact | Recommendation |
|---|----------|--------|----------------|
| 9 | **Should we use Expo for React Native?** | Development speed | Yes (recommended for MVP) |
| 10 | **Should we use Prisma or raw SQL?** | Database access | Prisma (type-safe, faster) |
| 11 | **Should we use a monorepo tool?** | Code organization | Yes - Turborepo recommended |
| 12 | **Should we self-host AI or use APIs?** | Cost, complexity | APIs for MVP (faster) |
| 13 | **What testing level is required?** | Quality vs speed | Unit + Integration (E2E Phase 2) |

### 6.3 Product Decisions

| # | Question | Impact | Default |
|---|----------|--------|---------|
| 14 | **Should we include all 7 avatars in MVP?** | Scope | Yes (low engineering cost) |
| 15 | **Should we include voice in MVP?** | Timeline | No (defer to Phase 2) |
| 16 | **Should we include video sessions in MVP?** | Timeline | No (defer to Phase 2) |
| 17 | **What content should be premium vs free?** | Business model | All free for MVP |
| 18 | **Should we include community features?** | Scope, safety | No (defer to Phase 3) |

### 6.4 Business Decisions

| # | Question | Impact | Default |
|---|----------|--------|---------|
| 19 | **What is the pricing model?** | Revenue | Free for MVP, premium later |
| 20 | **Do we need insurance integration?** | Partnerships | No for MVP |
| 21 | **What is the marketing budget?** | User acquisition | TBD based on funding |
| 22 | **Do we need clinical advisors?** | Credibility | Yes (advisory board) |

---

## 7. Recommended First Conversation with Claude Code

### Suggested Opening Prompt

```
I'm building MindMate AI, a mental health therapy app. I have a complete 
specification with 516 files in /mnt/okcomputer/output/mindmate-ai/

Please read these critical files in order:
1. /mnt/okcomputer/output/mindmate-ai/planning/mvp_scope.md - 12-week plan
2. /mnt/okcomputer/output/mindmate-ai/product/PRD.md - Product requirements
3. /mnt/okcomputer/output/mindmate-ai/technical/tech_stack.md - Technology choices
4. /mnt/okcomputer/output/mindmate-ai/code/project_structure.md - Monorepo structure

Then help me answer these questions:
- What team size do I need for the 12-week MVP?
- What should I build in Week 1?
- What are the biggest technical risks?
- What decisions do I need to make before starting?

Let's start by setting up the project repository structure.
```

### Key Points to Emphasize

1. **Safety First:** Crisis detection is non-negotiable - must be operational before any user testing
2. **MVP Scope:** 12 weeks is aggressive - be prepared to cut features if needed
3. **AI Costs:** Claude API will be a significant monthly cost - budget accordingly
4. **React Native:** Single codebase for iOS/Android is critical for timeline
5. **Testing:** Beta testing should start by Week 10 for 2-week feedback cycle

### Files to Have Claude Code Read First

1. `planning/mvp_scope.md` - Understand the 12-week timeline
2. `product/PRD.md` - Understand the product vision
3. `technical/tech_stack.md` - Understand technology decisions
4. `code/project_structure.md` - Understand monorepo setup
5. `technical/database_schema.sql` - Understand data model
6. `product/crisis_flow.md` - Understand safety requirements

---

## 8. Quick Start Guide

### For Claude Code: Week 1 Tasks

```bash
# 1. Read the specification
Read: /mnt/okcomputer/output/mindmate-ai/planning/mvp_scope.md
Read: /mnt/okcomputer/output/mindmate-ai/code/project_structure.md

# 2. Set up monorepo structure
Create: mindmate-ai/ (root)
  ├── apps/
  │   ├── mobile/ (React Native + Expo)
  │   └── web/ (Next.js - Phase 2)
  ├── services/
  │   ├── api/ (Node.js/Fastify)
  │   ├── ai-service/ (Python/FastAPI)
  │   └── crisis-service/ (Python)
  ├── packages/
  │   └── shared/ (types, utils)
  └── infrastructure/
      └── terraform/

# 3. Initialize projects
- Mobile: npx create-expo-app apps/mobile --template blank-typescript
- API: mkdir services/api && npm init -y
- AI Service: mkdir services/ai-service

# 4. Set up database
- Create PostgreSQL schema from database_schema.sql
- Set up Prisma ORM

# 5. Implement authentication
- Set up Clerk or custom auth
- Create login/register endpoints
- Create auth screens in mobile app

# 6. Integrate Claude API
- Set up AI service with FastAPI
- Create basic chat endpoint
- Test AI responses
```

### Critical Path for Week 1

| Day | Task | Output |
|-----|------|--------|
| 1 | Read specs, set up repos | GitHub repos created |
| 2 | Database setup | PostgreSQL running locally |
| 3 | Auth service | Login/register API working |
| 4 | Mobile app shell | React Native app builds |
| 5 | AI service setup | Claude API integrated |

### Success Criteria for Week 1

- [ ] Repository structure created
- [ ] Database schema applied
- [ ] Authentication flow working
- [ ] Mobile app builds successfully
- [ ] Basic chat with AI functional
- [ ] Crisis detection keywords loaded

---

## Appendix A: File Count Summary

| Category | Count |
|----------|-------|
| Documentation (MD) | 73 |
| Code (TS/TSX/JS/JSX) | ~250 |
| Code (Python) | ~80 |
| Config (JSON/YAML/TF) | ~60 |
| SQL/Prisma | ~15 |
| Tests | ~40 |
| **Total** | **~518** |

## Appendix B: Key Metrics to Track

| Metric | MVP Target | Measurement |
|--------|------------|-------------|
| Downloads | 5,000 | App store analytics |
| Monthly Active Users | 2,500 | Backend analytics |
| Day-1 Retention | 50% | Cohort analysis |
| Day-7 Retention | 25% | Cohort analysis |
| App Store Rating | 4.0+ | App store reviews |
| Crisis Interventions | 100% appropriate | Crisis log review |

## Appendix C: Contact & Support

This MASTER_INDEX.md was compiled by **Agent 99** as the final deliverable from the 100-agent MindMate AI specification team.

For questions about:
- **Product:** Refer to PRD.md and individual product docs
- **Technical:** Refer to tech_stack.md and system_architecture.md
- **Timeline:** Refer to mvp_scope.md
- **Content:** Refer to content/ folder

---

*This document is the single source of truth for Claude Code to begin building MindMate AI. All 516 files in the output folder support this implementation guide.*

**END OF MASTER INDEX**
