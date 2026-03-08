# MindMate AI - System Architecture Document

## Document Information
- **Version**: 1.0.0
- **Date**: 2024
- **Status**: Production-Ready
- **Classification**: Technical Architecture

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [System Architecture Diagram](#2-system-architecture-diagram)
3. [Frontend Clients](#3-frontend-clients)
4. [Backend Services](#4-backend-services)
5. [AI Pipeline](#5-ai-pipeline)
6. [Database Layer](#6-database-layer)
7. [Real-Time Infrastructure](#7-real-time-infrastructure)
8. [Third-Party Integrations](#8-third-party-integrations)
9. [Security Architecture](#9-security-architecture)
10. [Deployment Architecture](#10-deployment-architecture)
11. [Service Communication Matrix](#11-service-communication-matrix)

---

## 1. Architecture Overview

### 1.1 High-Level Design Principles

MindMate AI follows a **microservices architecture** with the following design principles:

| Principle | Implementation |
|-----------|----------------|
| **Scalability** | Horizontal scaling via Kubernetes, stateless services |
| **Resilience** | Circuit breakers, retry logic, graceful degradation |
| **Security** | Zero-trust architecture, end-to-end encryption |
| **Observability** | Distributed tracing, metrics, centralized logging |
| **Modularity** | Domain-driven design, service boundaries by capability |

### 1.2 Technology Stack Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TECHNOLOGY STACK                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Frontend      │ React Native, React Web, TypeScript, Redux Toolkit         │
│  Backend       │ Node.js (NestJS), Python (FastAPI), Go (Performance)       │
│  AI/ML         │ Python, PyTorch, TensorFlow, Transformers, LangChain       │
│  Database      │ PostgreSQL, MongoDB, Redis, Pinecone/Weaviate              │
│  Messaging     │ Apache Kafka, RabbitMQ, Redis Pub/Sub                      │
│  Infrastructure│ Kubernetes, Docker, Terraform, AWS/GCP                     │
│  Monitoring    │ Prometheus, Grafana, Jaeger, ELK Stack                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. System Architecture Diagram

### 2.1 Complete System Architecture (Text-Based Diagram)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    CLIENT LAYER                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                    │
│  │   iOS App    │  │ Android App  │  │   Web App    │  │  Admin Panel │                    │
│  │  (SwiftUI)   │  │   (Kotlin)   │  │   (React)    │  │   (React)    │                    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                    │
│         │                 │                 │                 │                            │
│         └─────────────────┴─────────────────┴─────────────────┘                            │
│                           │                                                                  │
│                    ┌──────┴──────┐                                                         │
│                    │  CDN/WAF    │  (CloudFlare/AWS CloudFront)                            │
│                    │  DDoS Prot  │                                                         │
│                    └──────┬──────┘                                                         │
└───────────────────────────┼─────────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────────────────────────────────────┐
│                           ▼                                                                  │
│                         API GATEWAY LAYER                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                          Kong/AWS API Gateway                                        │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐ │    │
│  │  │ Rate Limit  │  │   Auth      │  │   SSL/TLS   │  │  Request    │  │  CORS     │ │    │
│  │  │   (Redis)   │  │  (JWT/OAuth)│  │ Termination │  │  Routing    │  │  Config   │ │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘ │    │
│  └─────────────────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND SERVICES LAYER                                          │
│                                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                        CORE SERVICES (Kubernetes Cluster)                            │    │
│  │                                                                                      │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐  │    │
│  │  │  User Service   │  │  Chat Service   │  │ Journal Service │  │ Mood Service   │  │    │
│  │  │  (Node.js)      │  │  (Node.js)      │  │  (Node.js)      │  │ (Python/FastAPI)│  │    │
│  │  │                 │  │                 │  │                 │  │                │  │    │
│  │  │ • Auth/Identity │  │ • Conversations │  │ • Entries       │  │ • Tracking     │  │    │
│  │  │ • Profiles      │  │ • Sessions      │  │ • Templates     │  │ • Analysis     │  │    │
│  │  │ • Preferences   │  │ • History       │  │ • Insights      │  │ • Trends       │  │    │
│  │  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │    │
│  │           │                    │                    │                    │          │    │
│  │  ┌────────┴────────────────────┴────────────────────┴────────────────────┴────────┐  │    │
│  │  │                         SERVICE MESH (Istio/Linkerd)                           │  │    │
│  │  │              mTLS, Traffic Management, Observability, Circuit Breakers          │  │    │
│  │  └────────────────────────────────────────────────────────────────────────────────┘  │    │
│  │                                                                                      │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐  │    │
│  │  │ Content Service │  │  CBT Service    │  │ Crisis Service  │  │ Notification   │  │    │
│  │  │  (Node.js)      │  │ (Python/FastAPI)│  │  (Node.js)      │  │ Service        │  │    │
│  │  │                 │  │                 │  │                 │  │ (Node.js)      │  │    │
│  │  │ • Resources     │  │ • Exercises     │  │ • Detection     │  │ • Push         │  │    │
│  │  │ • Articles      │  │ • Techniques    │  │ • Escalation    │  │ • Email        │  │    │
│  │  │ • Media         │  │ • Progress      │  │ • Hotlines      │  │ • SMS          │  │    │
│  │  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │    │
│  │           │                    │                    │                    │          │    │
│  │  ┌────────┴────────────────────┴────────────────────┴────────────────────┴────────┐  │    │
│  │  │                              EVENT BUS (Apache Kafka)                          │  │    │
│  │  └────────────────────────────────────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                        SUPPORTING SERVICES                                           │    │
│  │                                                                                      │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐  │    │
│  │  │  Analytics      │  │  Billing        │  │  Admin          │  │  Config        │  │    │
│  │  │  Service        │  │  Service        │  │  Service        │  │  Service       │  │    │
│  │  │  (Go)           │  │  (Node.js)      │  │  (Node.js)      │  │  (Go)          │  │    │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  └────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              AI/ML PIPELINE LAYER                                            │
│                                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                        AI ORCHESTRATION (LangChain/LangGraph)                        │    │
│  │                                                                                      │    │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐    │    │
│  │  │                        LLM Gateway Service                                   │    │    │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │    │    │
│  │  │  │   OpenAI    │  │  Anthropic  │  │   Google    │  │    Open Source      │ │    │    │
│  │  │  │   GPT-4     │  │   Claude    │  │   Gemini    │  │    (Llama/Mistral)  │ │    │    │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │    │    │
│  │  │                              (Load Balancing & Fallback)                     │    │    │
│  │  └─────────────────────────────────────────────────────────────────────────────┘    │    │
│  │                                                                                      │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐  │    │
│  │  │  Intent         │  │  Sentiment      │  │  Crisis         │  │  RAG           │  │    │
│  │  │  Classifier     │  │  Analyzer       │  │  Detector       │  │  Pipeline      │  │    │
│  │  │  (BERT)         │  │  (RoBERTa)      │  │  (Fine-tuned)   │  │  (Embeddings)  │  │    │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  └────────────────┘  │    │
│  │                                                                                      │    │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐    │    │
│  │  │                        FINE-TUNED MODELS                                     │    │    │
│  │  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │    │    │
│  │  │  │  Therapeutic    │  │  CBT Assistant  │  │  Mindfulness Guide          │  │    │    │
│  │  │  │  Companion      │  │  Model          │  │  Model                      │  │    │    │
│  │  │  │  (LoRA)         │  │  (LoRA)         │  │  (LoRA)                     │  │    │    │
│  │  │  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘  │    │    │
│  │  └─────────────────────────────────────────────────────────────────────────────┘    │    │
│  │                                                                                      │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐  │    │
│  │  │  Model Registry │  │  Feature Store  │  │  Training       │  │  Evaluation    │  │    │
│  │  │  (MLflow)       │  │  (Feast)        │  │  Pipeline       │  │  Service       │  │    │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  └────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                                      │
│                                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                        PRIMARY DATABASES                                             │    │
│  │                                                                                      │    │
│  │  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────┐  │    │
│  │  │    PostgreSQL Cluster   │  │    MongoDB Cluster      │  │    Redis Cluster    │  │    │
│  │  │    (Primary DB)         │  │    (Document Store)     │  │    (Cache/Session)  │  │    │
│  │  │                         │  │                         │  │                     │  │    │
│  │  │ • Users                 │  │ • Chat Messages         │  │ • Sessions          │  │    │
│  │  │ • Profiles              │  │ • Journal Entries       │  │ • Rate Limits       │  │    │
│  │  │ • Subscriptions         │  │ • Content               │  │ • Real-time State   │  │    │
│  │  │ • Billing Records       │  │ • Analytics Events      │  │ • Pub/Sub           │  │    │
│  │  │                         │  │                         │  │                     │  │    │
│  │  │ [Master] ←──→ [Replica] │  │ [Primary] ←──→ [Second] │  │ [Cluster Mode]      │  │    │
│  │  │                         │  │                         │  │                     │  │    │
│  │  │  ┌─────────────────┐   │  │  ┌─────────────────┐   │  │  ┌─────────────┐   │  │    │
│  │  │  │  Read Replicas  │   │  │  │  Shard 1,2,3    │   │  │  │  Sentinel   │   │  │    │
│  │  │  │  (3x for scale) │   │  │  │  (Horizontal)   │   │  │  │  (HA)       │   │  │    │
│  │  │  └─────────────────┘   │  │  └─────────────────┘   │  │  └─────────────┘   │  │    │
│  │  └─────────────────────────┘  └─────────────────────────┘  └─────────────────────┘  │    │
│  │                                                                                      │    │
│  │  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────┐  │    │
│  │  │   Vector Database       │  │   Time-Series DB        │  │   Search Engine     │  │    │
│  │  │   (Pinecone/Weaviate)   │  │   (InfluxDB/Timescale)  │  │   (Elasticsearch)   │  │    │
│  │  │                         │  │                         │  │                     │  │    │
│  │  │ • Embeddings            │  │ • Mood Metrics          │  │ • Content Search    │  │    │
│  │  │ • RAG Context           │  │ • Usage Analytics       │  │ • User Search       │  │    │
│  │  │ • Semantic Search       │  │ • Performance Metrics   │  │ • Full-Text         │  │    │
│  │  └─────────────────────────┘  └─────────────────────────┘  └─────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                        DATA PIPELINE                                                 │    │
│  │                                                                                      │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐  │    │
│  │  │  Apache Kafka   │  │  Apache Spark   │  │  dbt            │  │  Airbyte       │  │    │
│  │  │  (Event Stream) │  │  (Processing)   │  │  (Transform)    │  │  (ELT)         │  │    │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  └────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                        DATA WAREHOUSE                                                │    │
│  │                                                                                      │    │
│  │  ┌─────────────────────────────────────────────────────────────────────────────────┐ │    │
│  │  │                        Snowflake / BigQuery / Redshift                           │ │    │
│  │  │  • Analytics Data  • BI Reporting  • ML Training Data  • Compliance Archive     │ │    │
│  │  └─────────────────────────────────────────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                         REAL-TIME INFRASTRUCTURE                                             │
│                                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                        WEBSOCKET LAYER                                               │    │
│  │                                                                                      │    │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐    │    │
│  │  │                        Socket.io Cluster (Redis Adapter)                     │    │    │
│  │  │                                                                              │    │    │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │    │    │
│  │  │  │  WS Node 1  │  │  WS Node 2  │  │  WS Node 3  │  │  WS Node N          │ │    │    │
│  │  │  │  (Pod)      │  │  (Pod)      │  │  (Pod)      │  │  (Auto-scale)       │ │    │    │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │    │    │
│  │  │                                                                              │    │    │
│  │  │  Connection Types:  Chat Messages  |  Typing Indicators  |  Presence        │    │    │
│  │  │                     Live Updates   |  Notifications    |  Real-time Sync    │    │    │
│  │  └─────────────────────────────────────────────────────────────────────────────┘    │    │
│  │                                                                                      │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐  │    │
│  │  │  Presence       │  │  Pub/Sub        │  │  Push           │  │  SMS Gateway   │  │    │
│  │  │  Service        │  │  Service        │  │  Gateway        │  │  Service       │  │    │
│  │  │  (Redis)        │  │  (Redis/Kafka)  │  │  (FCM/APNs)     │  │  (Twilio)      │  │    │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  └────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                         THIRD-PARTY INTEGRATIONS                                             │
│                                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                        AI/ML PROVIDERS                                               │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐ │    │
│  │  │   OpenAI    │  │  Anthropic  │  │   Google    │  │  Hugging Face               │ │    │
│  │  │   API       │  │   Claude    │  │   Gemini    │  │  Inference API              │ │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                        AUTHENTICATION                                                  │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐ │    │
│  │  │   Auth0     │  │   Firebase  │  │   Apple     │  │  Google OAuth               │ │    │
│  │  │             │  │   Auth      │  │   Sign In   │  │                             │ │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                        COMMUNICATION                                                   │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐ │    │
│  │  │   Twilio    │  │   SendGrid  │  │   OneSignal │  │  Firebase Cloud             │ │    │
│  │  │   SMS/Voice │  │   Email     │  │   Push      │  │  Messaging                  │ │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                        PAYMENT & SUBSCRIPTION                                        │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐ │    │
│  │  │   Stripe    │  │   RevenueCat│  │   Apple     │  │  Google Play                │ │    │
│  │  │   Payments  │  │   (Mobile)  │  │   App Store │  │  Billing                    │ │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                        MONITORING & ANALYTICS                                        │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐ │    │
│  │  │   Datadog   │  │   Amplitude │  │   Mixpanel  │  │  Sentry                     │ │    │
│  │  │   APM/Infra │  │   Product   │  │   Analytics │  │  Error Tracking             │ │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                        CRISIS & SAFETY                                               │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐ │    │
│  │  │   Crisis    │  │   NAMI      │  │   988       │  │  Local Emergency            │ │    │
│  │  │   Text Line │  │   Resources │  │   Lifeline  │  │  Services API               │ │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Frontend Clients

### 3.1 Mobile Applications

#### iOS Application
```yaml
Technology Stack:
  Framework: SwiftUI + UIKit (hybrid)
  State Management: Combine + Swift Concurrency
  Networking: Alamofire + URLSession
  Local Storage: Core Data + UserDefaults
  Security: Keychain, App Attest
  Analytics: Firebase Analytics

Architecture Pattern: MVVM-C (Model-View-ViewModel-Coordinator)

Key Modules:
  - AuthenticationModule: OAuth, Biometric auth, Session management
  - ChatModule: Real-time messaging, message rendering, voice input
  - JournalModule: Rich text editor, mood tracking, media attachments
  - ProfileModule: User settings, preferences, subscription management
  - ContentModule: Resource library, CBT exercises, mindfulness content
  - CrisisModule: Emergency resources, quick access hotlines

Responsibilities:
  - User interface and experience
  - Local data caching and offline support
  - Device-specific features (notifications, biometrics, haptics)
  - Real-time WebSocket connection management
  - End-to-end encryption for sensitive data
```

#### Android Application
```yaml
Technology Stack:
  Framework: Jetpack Compose + Kotlin
  State Management: Kotlin Flow + ViewModel
  Networking: Retrofit + OkHttp + Kotlin Serialization
  Local Storage: Room Database + DataStore
  Security: Android Keystore, SafetyNet
  Analytics: Firebase Analytics

Architecture Pattern: MVVM + Clean Architecture

Key Modules:
  - AuthenticationModule: OAuth, Biometric auth, Session management
  - ChatModule: Real-time messaging, message rendering, voice input
  - JournalModule: Rich text editor, mood tracking, media attachments
  - ProfileModule: User settings, preferences, subscription management
  - ContentModule: Resource library, CBT exercises, mindfulness content
  - CrisisModule: Emergency resources, quick access hotlines

Responsibilities:
  - User interface and experience
  - Local data caching and offline support
  - Device-specific features (notifications, biometrics, haptics)
  - Real-time WebSocket connection management
  - End-to-end encryption for sensitive data
```

### 3.2 Web Application

```yaml
Technology Stack:
  Framework: React 18 + TypeScript
  State Management: Redux Toolkit + RTK Query
  UI Components: Chakra UI / Tailwind CSS
  Forms: React Hook Form + Zod validation
  Real-time: Socket.io-client
  Build Tool: Vite

Architecture Pattern: Feature-based modular architecture

Key Modules:
  - auth/: Authentication flows, session management
  - chat/: Conversation interface, message history
  - journal/: Entry creation, mood visualization
  - insights/: Analytics dashboard, progress tracking
  - content/: Resource library, guided exercises
  - settings/: User preferences, account management

Responsibilities:
  - Cross-platform web experience
  - Progressive Web App (PWA) capabilities
  - Responsive design for all screen sizes
  - Accessibility compliance (WCAG 2.1 AA)
  - SEO optimization for public content
```

### 3.3 Admin Panel

```yaml
Technology Stack:
  Framework: React + TypeScript
  UI Framework: Ant Design / Material-UI
  Data Grid: AG Grid / TanStack Table
  Charts: Recharts / Chart.js
  State: Redux Toolkit

Key Modules:
  - UserManagement: User search, profile viewing, moderation
  - ContentManagement: CRUD for resources, articles, exercises
  - AnalyticsDashboard: Usage metrics, retention, engagement
  - SupportTools: User support, issue tracking, feedback
  - SystemHealth: Service monitoring, alerts, logs

Responsibilities:
  - Internal team operations
  - Content moderation and management
  - User support and issue resolution
  - System monitoring and alerting
  - Business intelligence and reporting
```

---

## 4. Backend Services

### 4.1 Core Services

#### User Service (Node.js/NestJS)
```yaml
Responsibilities:
  - User registration and authentication
  - Profile management and preferences
  - Identity verification
  - Session management
  - OAuth integration (Google, Apple)

APIs:
  POST   /api/v1/users/register
  POST   /api/v1/users/login
  POST   /api/v1/users/logout
  GET    /api/v1/users/profile
  PUT    /api/v1/users/profile
  DELETE /api/v1/users/account
  POST   /api/v1/users/verify-email
  POST   /api/v1/users/forgot-password

Database:
  - PostgreSQL: users, profiles, sessions tables
  - Redis: session cache, rate limiting

Communication:
  - Publishes: user.created, user.updated, user.deleted
  - Subscribes: subscription.updated, crisis.detected
```

#### Chat Service (Node.js/NestJS)
```yaml
Responsibilities:
  - Conversation management
  - Message history and retrieval
  - Session state management
  - Real-time message routing
  - AI conversation orchestration

APIs:
  POST   /api/v1/conversations
  GET    /api/v1/conversations
  GET    /api/v1/conversations/:id
  DELETE /api/v1/conversations/:id
  POST   /api/v1/conversations/:id/messages
  GET    /api/v1/conversations/:id/messages

Database:
  - MongoDB: conversations, messages
  - Redis: active sessions, typing indicators

Communication:
  - Publishes: message.sent, conversation.created
  - Subscribes: ai.response.ready, crisis.detected
  - WebSocket: Real-time message streaming
```

#### Journal Service (Node.js/NestJS)
```yaml
Responsibilities:
  - Journal entry CRUD operations
  - Mood tracking and visualization data
  - Entry templates and prompts
  - Media attachment management
  - Insights generation

APIs:
  POST   /api/v1/journal/entries
  GET    /api/v1/journal/entries
  GET    /api/v1/journal/entries/:id
  PUT    /api/v1/journal/entries/:id
  DELETE /api/v1/journal/entries/:id
  GET    /api/v1/journal/mood-history
  GET    /api/v1/journal/insights

Database:
  - MongoDB: journal_entries, mood_entries
  - PostgreSQL: templates, prompts

Communication:
  - Publishes: journal.entry.created, mood.tracked
  - Subscribes: user.created (for welcome prompts)
```

#### Mood Service (Python/FastAPI)
```yaml
Responsibilities:
  - Mood data processing and analysis
  - Trend detection and pattern recognition
  - Predictive analytics for mood changes
  - Correlation analysis (sleep, activity, mood)
  - Personalized insights generation

APIs:
  POST   /api/v1/mood/track
  GET    /api/v1/mood/history
  GET    /api/v1/mood/trends
  GET    /api/v1/mood/insights
  GET    /api/v1/mood/predictions

Database:
  - PostgreSQL: mood_metrics, correlations
  - Time-Series DB: high-frequency mood data

AI Integration:
  - Calls: Sentiment Analyzer, Trend Predictor

Communication:
  - Publishes: mood.insight.generated, trend.detected
  - Subscribes: mood.tracked, journal.entry.created
```

### 4.2 Specialized Services

#### Content Service (Node.js/NestJS)
```yaml
Responsibilities:
  - Content library management
  - Article and resource delivery
  - CBT exercise management
  - Media content delivery
  - Content personalization

APIs:
  GET    /api/v1/content/resources
  GET    /api/v1/content/resources/:id
  GET    /api/v1/content/exercises
  GET    /api/v1/content/exercises/:id
  POST   /api/v1/content/progress

Database:
  - MongoDB: content, exercises, media
  - PostgreSQL: categories, tags

Communication:
  - Publishes: content.viewed, exercise.completed
  - Subscribes: user.preferences.updated
```

#### CBT Service (Python/FastAPI)
```yaml
Responsibilities:
  - CBT exercise generation and guidance
  - Cognitive distortion identification
  - Thought record management
  - Progress tracking for CBT interventions
  - Personalized CBT recommendations

APIs:
  GET    /api/v1/cbt/exercises
  POST   /api/v1/cbt/exercises/:id/start
  POST   /api/v1/cbt/exercises/:id/complete
  GET    /api/v1/cbt/thought-records
  POST   /api/v1/cbt/thought-records

AI Integration:
  - Calls: CBT Assistant Model

Database:
  - MongoDB: cbt_sessions, thought_records
  - PostgreSQL: exercise_templates

Communication:
  - Publishes: cbt.exercise.completed, insight.generated
  - Subscribes: mood.tracked, chat.intent.cbt
```

#### Crisis Service (Node.js/NestJS)
```yaml
Responsibilities:
  - Crisis detection and escalation
  - Emergency resource provision
  - Hotline integration
  - Safety planning
  - Crisis intervention protocols

APIs:
  POST   /api/v1/crisis/alert
  GET    /api/v1/crisis/resources
  POST   /api/v1/crisis/safety-plan
  GET    /api/v1/crisis/safety-plan

AI Integration:
  - Calls: Crisis Detector Model

Database:
  - PostgreSQL: crisis_events, safety_plans
  - Redis: active crisis flags

Communication:
  - Publishes: crisis.detected, crisis.resolved
  - Subscribes: message.sent (for detection)
  - External: Crisis Text Line, 988 Lifeline
```

#### Notification Service (Node.js/NestJS)
```yaml
Responsibilities:
  - Push notification management
  - Email notification delivery
  - SMS notification delivery
  - Notification preference management
  - Delivery tracking and analytics

APIs:
  POST   /api/v1/notifications/send
  GET    /api/v1/notifications/preferences
  PUT    /api/v1/notifications/preferences
  POST   /api/v1/notifications/tokens

Integrations:
  - FCM (Firebase Cloud Messaging) - Android
  - APNs (Apple Push Notification service) - iOS
  - SendGrid - Email
  - Twilio - SMS

Communication:
  - Subscribes: All event types for notifications
```

### 4.3 Supporting Services

#### Analytics Service (Go)
```yaml
Responsibilities:
  - Event collection and processing
  - User behavior analytics
  - Feature usage tracking
  - A/B testing framework
  - Data pipeline orchestration

APIs:
  POST   /api/v1/analytics/events
  GET    /api/v1/analytics/metrics
  GET    /api/v1/analytics/reports

Database:
  - Kafka: Event streaming
  - Data Warehouse: Aggregated analytics

Communication:
  - Subscribes: All service events
```

#### Billing Service (Node.js/NestJS)
```yaml
Responsibilities:
  - Subscription management
  - Payment processing
  - Invoice generation
  - Plan management
  - Usage tracking

Integrations:
  - Stripe: Payment processing
  - RevenueCat: Mobile subscription management
  - Apple App Store: iOS subscriptions
  - Google Play: Android subscriptions

Database:
  - PostgreSQL: subscriptions, payments, invoices

Communication:
  - Publishes: subscription.created, payment.succeeded
  - Subscribes: user.created
```

---

## 5. AI Pipeline

### 5.1 LLM Gateway Service

```yaml
Purpose: Unified interface to multiple LLM providers with failover

Providers:
  - OpenAI GPT-4 (Primary)
  - Anthropic Claude (Secondary)
  - Google Gemini (Tertiary)
  - Open Source Models (Self-hosted)

Capabilities:
  - Load balancing across providers
  - Automatic failover on errors
  - Cost optimization (model selection)
  - Request/response caching
  - Token usage tracking

API:
  POST /api/v1/ai/chat/completions
  POST /api/v1/ai/embeddings
  GET  /api/v1/ai/models

Configuration:
  - Temperature: 0.7 (configurable per use case)
  - Max tokens: 4096
  - Timeout: 30s
  - Retry: 3 attempts with exponential backoff
```

### 5.2 AI Models

#### Intent Classifier (BERT-based)
```yaml
Purpose: Classify user intent from chat messages

Classes:
  - seeking_support: General emotional support
  - cbt_exercise: Request for CBT technique
  - mindfulness: Request for mindfulness guidance
  - crisis: Potential crisis situation
  - journal_prompt: Request for journaling help
  - resource_request: Looking for information
  - gratitude: Expressing thanks
  - small_talk: Casual conversation

Input: User message text
Output: Intent class + confidence score

Model: Fine-tuned DistilBERT
Latency: <100ms
```

#### Sentiment Analyzer (RoBERTa-based)
```yaml
Purpose: Analyze emotional tone of user messages

Dimensions:
  - Valence: Positive to Negative (-1 to 1)
  - Arousal: Calm to Excited (0 to 1)
  - Dominance: In-control to Overwhelmed (0 to 1)

Emotions Detected:
  - Joy, Sadness, Anger, Fear, Anxiety
  - Hope, Despair, Frustration, Calm

Input: User message text
Output: Sentiment scores + primary emotion

Model: Fine-tuned RoBERTa
Latency: <100ms
```

#### Crisis Detector (Fine-tuned Transformer)
```yaml
Purpose: Detect potential crisis situations requiring intervention

Risk Levels:
  - low: No concerning content
  - medium: Some concerning language, monitor
  - high: Significant risk indicators, alert
  - critical: Immediate risk, escalate immediately

Indicators:
  - Self-harm language
  - Suicidal ideation
  - Hopelessness expressions
  - Goodbye messages
  - Plan/intent language

Input: Conversation context (last N messages)
Output: Risk level + confidence + flagged phrases

Model: Fine-tuned BERT with crisis-specific data
Latency: <200ms
Thresholds: Configurable per deployment
```

#### RAG Pipeline (Retrieval-Augmented Generation)
```yaml
Purpose: Ground AI responses in verified therapeutic content

Components:
  - Embedding Model: text-embedding-3-large
  - Vector Store: Pinecone/Weaviate
  - Retriever: Semantic search + keyword boost
  - Reranker: Cross-encoder for relevance
  - Generator: GPT-4 with retrieved context

Knowledge Bases:
  - CBT techniques and exercises
  - Mindfulness practices
  - Mental health resources
  - Crisis intervention protocols
  - Therapeutic best practices

Process:
  1. Embed user query
  2. Retrieve top-k relevant documents
  3. Rerank by relevance
  4. Inject context into prompt
  5. Generate grounded response

Latency: 500ms - 2s (end-to-end)
```

### 5.3 Fine-Tuned Models

#### Therapeutic Companion Model (LoRA)
```yaml
Base Model: Llama 3 70B or GPT-4
Fine-tuning: LoRA (Low-Rank Adaptation)

Training Data:
  - Anonymized therapy conversations
  - CBT session transcripts
  - Crisis intervention dialogues
  - Empathetic response datasets

Specialization:
  - Empathetic, non-judgmental tone
  - Therapeutic communication patterns
  - Safety-conscious responses
  - Appropriate self-disclosure limits

Deployment:
  - Self-hosted on GPU cluster
  - vLLM for inference optimization
  - Quantization (AWQ/GPTQ) for efficiency
```

#### CBT Assistant Model
```yaml
Purpose: Guide users through CBT exercises

Capabilities:
  - Explain CBT concepts
  - Guide thought records
  - Identify cognitive distortions
  - Suggest behavioral experiments
  - Track CBT progress

Training:
  - CBT manuals and workbooks
  - Guided CBT session data
  - Cognitive distortion examples
```

#### Mindfulness Guide Model
```yaml
Purpose: Lead mindfulness and meditation sessions

Capabilities:
  - Guided meditations
  - Breathing exercises
  - Body scan instructions
  - Mindfulness explanations
  - Progress tracking

Training:
  - MBSR (Mindfulness-Based Stress Reduction) materials
  - Guided meditation scripts
  - Mindfulness course content
```

### 5.4 ML Infrastructure

```yaml
Model Registry: MLflow
  - Version control for models
  - Experiment tracking
  - Model staging (dev/staging/prod)

Feature Store: Feast
  - Centralized feature management
  - Online/offline feature serving
  - Feature versioning

Training Pipeline: Kubeflow/Apache Airflow
  - Automated retraining
  - A/B testing framework
  - Model evaluation

Inference Serving:
  - Triton Inference Server (NVIDIA)
  - TorchServe (PyTorch models)
  - vLLM (LLM serving)

Monitoring:
  - Drift detection
  - Performance metrics
  - Error tracking
```

---

## 6. Database Layer

### 6.1 Primary Databases

#### PostgreSQL Cluster
```yaml
Purpose: Relational data storage

Configuration:
  - Primary: 1 node (write operations)
  - Replicas: 3 nodes (read operations)
  - Connection Pooling: PgBouncer
  - Backup: Daily snapshots + WAL archiving

Schemas:
  users:
    - users (id, email, password_hash, created_at, updated_at)
    - profiles (user_id, display_name, avatar, preferences)
    - sessions (id, user_id, token, expires_at)
  
  billing:
    - subscriptions (id, user_id, plan, status, current_period_end)
    - payments (id, subscription_id, amount, status, receipt_url)
    - invoices (id, subscription_id, amount_due, status)
  
  analytics:
    - events (id, user_id, event_type, properties, timestamp)
    - metrics (id, name, value, timestamp)

Indexes:
  - users.email (unique)
  - sessions.token (unique)
  - events.user_id, events.timestamp (composite)
```

#### MongoDB Cluster
```yaml
Purpose: Document storage for flexible schemas

Configuration:
  - Sharding: Enabled (3 shards)
  - Replication: 3-node replica sets per shard
  - Storage Engine: WiredTiger

Collections:
  conversations:
    - _id, user_id, title, created_at, updated_at
    - messages: [ { role, content, timestamp, metadata } ]
    - indexes: user_id, updated_at
  
  journal_entries:
    - _id, user_id, content, mood_score, tags, created_at
    - media_attachments: [ { type, url, metadata } ]
    - indexes: user_id, created_at, mood_score
  
  content:
    - _id, type, title, content, tags, difficulty, duration
    - metadata: { author, source, citations }
    - indexes: type, tags, difficulty
  
  chat_messages:
    - _id, conversation_id, user_id, content, role, timestamp
    - ai_metadata: { model, tokens, latency }
    - indexes: conversation_id, timestamp
```

#### Redis Cluster
```yaml
Purpose: Caching, sessions, real-time state

Configuration:
  - Mode: Cluster (6 nodes, 3 masters + 3 replicas)
  - Persistence: AOF + RDB
  - Max Memory: 32GB per node

Data Structures:
  Strings:
    - session:{token} -> user_data (TTL: 7 days)
    - rate_limit:{user_id} -> count (TTL: 1 minute)
  
  Hashes:
    - user:{id}:preferences -> { key: value }
    - presence:{user_id} -> { status, last_seen }
  
  Lists:
    - notifications:{user_id} -> [ notification_objects ]
  
  Sets:
    - online_users -> [ user_ids ]
  
  Sorted Sets:
    - leaderboard:streaks -> { score: days, member: user_id }
  
  Pub/Sub:
    - chat:{conversation_id} (real-time messaging)
    - user:{user_id}:notifications (push notifications)
```

### 6.2 Specialized Databases

#### Vector Database (Pinecone/Weaviate)
```yaml
Purpose: Semantic search and RAG

Configuration:
  - Dimension: 1536 (OpenAI embeddings)
  - Metric: Cosine similarity
  - Index Type: HNSW (Hierarchical Navigable Small World)

Collections:
  therapeutic_content:
    - id, content, embedding, metadata
    - metadata: { type, category, source, tags }
  
  user_memories:
    - id, user_id, content, embedding, timestamp
    - For personalized context retrieval
```

#### Time-Series Database (InfluxDB/TimescaleDB)
```yaml
Purpose: High-frequency metrics and mood data

Data Points:
  - mood_scores: user_id, score, timestamp
  - app_usage: user_id, feature, duration, timestamp
  - ai_metrics: model, latency, tokens, timestamp

Retention:
  - Raw data: 30 days
  - Aggregated (hourly): 1 year
  - Aggregated (daily): Forever
```

#### Search Engine (Elasticsearch)
```yaml
Purpose: Full-text search across content

Indices:
  content:
    - title, body, tags, category
    - analyzers: Standard + Synonym
  
  users:
    - display_name, email (for admin search)
    - access control: admin only
```

### 6.3 Data Pipeline

```yaml
Event Streaming: Apache Kafka
  Topics:
    - user.events: User lifecycle events
    - chat.events: Message and conversation events
    - mood.events: Mood tracking events
    - analytics.events: All tracking events
    - ai.events: AI inference events
  
  Partitions: 12 per topic (scalable)
  Replication Factor: 3
  Retention: 7 days

Stream Processing: Apache Spark / Flink
  Jobs:
    - Real-time analytics aggregation
    - Event enrichment
    - Anomaly detection
    - Data quality checks

ETL/ELT: Airbyte + dbt
  Sources:
    - PostgreSQL (CDC)
    - MongoDB (CDC)
    - Kafka (streaming)
  
  Transformations:
    - dbt models for data warehouse
    - Business logic transformations
  
  Destinations:
    - Snowflake/BigQuery (Data Warehouse)
    - S3 (Data Lake)
```

---

## 7. Real-Time Infrastructure

### 7.1 WebSocket Architecture

```yaml
Technology: Socket.io with Redis Adapter

Architecture:
  ┌─────────────────────────────────────────────────────────────┐
  │                    Load Balancer (Layer 4)                   │
  │              (Sticky sessions based on client IP)            │
  └───────────────────────────┬─────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
  ┌─────▼─────┐         ┌─────▼─────┐         ┌─────▼─────┐
  │ WS Node 1 │◄───────►│ WS Node 2 │◄───────►│ WS Node 3 │
  │  (Pod)    │  Redis  │  (Pod)    │  Redis  │  (Pod)    │
  └─────┬─────┘  Pub/Sub └─────┬─────┘  Pub/Sub └─────┬─────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   Redis Cluster   │
                    │  (Adapter Store)  │
                    └───────────────────┘

Connection Types:
  - Authenticated: User sessions with JWT validation
  - Namespace: /chat, /notifications, /presence
  - Rooms: conversation:{id}, user:{id}

Events:
  Client → Server:
    - message:send
    - typing:start
    - typing:stop
    - presence:update
  
  Server → Client:
    - message:received
    - message:delivered
    - message:read
    - typing:indicator
    - notification:new
    - presence:update
```

### 7.2 Presence Service

```yaml
Purpose: Track user online status and availability

Implementation:
  - Redis Sorted Set: online_users (score: last_seen_timestamp)
  - Heartbeat: Every 30 seconds
  - Timeout: 2 minutes (mark offline)

APIs:
  - presence:update { status: 'online' | 'away' | 'offline' }
  - presence:get { user_ids: [] }

Events:
  - user:online
  - user:offline
  - user:away
```

### 7.3 Push Notification Gateway

```yaml
Android: Firebase Cloud Messaging (FCM)
  - Token registration
  - Topic subscriptions
  - Priority: high for chat, normal for others

iOS: Apple Push Notification service (APNs)
  - Token-based authentication (JWT)
  - Notification categories
  - Rich notifications with actions

Web: Push API + Service Workers
  - VAPID keys for authentication
  - Background sync

Notification Types:
  - chat:message - New message received
  - journal:reminder - Daily journal prompt
  - mood:check-in - Mood tracking reminder
  - content:recommendation - Personalized content
  - crisis:follow-up - Post-crisis check-in
  - subscription:alert - Billing notifications
```

---

## 8. Third-Party Integrations

### 8.1 AI/ML Providers

| Provider | Service | Use Case | Fallback |
|----------|---------|----------|----------|
| OpenAI | GPT-4, GPT-4-turbo | Primary LLM | Anthropic |
| Anthropic | Claude 3 Opus/Sonnet | Secondary LLM | OpenAI |
| Google | Gemini Pro/Ultra | Tertiary LLM | Self-hosted |
| Hugging Face | Inference API | Open source models | Self-hosted |
| Cohere | Embed v3 | Embeddings | OpenAI |
| Pinecone | Vector DB | Semantic search | Weaviate |

### 8.2 Authentication Providers

| Provider | Service | Use Case |
|----------|---------|----------|
| Auth0 | Identity Platform | Primary authentication |
| Firebase | Firebase Auth | Mobile authentication |
| Apple | Sign in with Apple | iOS social login |
| Google | Google OAuth 2.0 | Android/web social login |

### 8.3 Communication Providers

| Provider | Service | Use Case |
|----------|---------|----------|
| Twilio | SMS, Voice | SMS notifications, crisis calls |
| SendGrid | Email | Transactional emails, newsletters |
| OneSignal | Push Notifications | Cross-platform push |
| Firebase | FCM | Android push notifications |
| Apple | APNs | iOS push notifications |

### 8.4 Payment Providers

| Provider | Service | Use Case |
|----------|---------|----------|
| Stripe | Payment Processing | Web payments, subscriptions |
| RevenueCat | Mobile Subscriptions | Unified mobile billing |
| Apple | App Store | iOS in-app purchases |
| Google | Play Billing | Android in-app purchases |

### 8.5 Crisis & Safety Resources

| Resource | Integration | Use Case |
|----------|-------------|----------|
| Crisis Text Line | API + Hotline | 24/7 crisis support |
| 988 Suicide & Crisis Lifeline | Hotline | National crisis line |
| NAMI | Resource API | Mental health resources |
| Local Emergency Services | API | Location-based emergency |

### 8.6 Monitoring & Analytics

| Provider | Service | Use Case |
|----------|---------|----------|
| Datadog | APM, Infrastructure | Application monitoring |
| Sentry | Error Tracking | Exception monitoring |
| Amplitude | Product Analytics | User behavior analysis |
| Mixpanel | Analytics | Funnel analysis, retention |
| Google Analytics | Web Analytics | Website traffic |

---

## 9. Security Architecture

### 9.1 Authentication & Authorization

```yaml
Authentication:
  - JWT tokens with RS256 signing
  - Access token: 15 minutes
  - Refresh token: 7 days
  - Biometric authentication (mobile)
  - OAuth 2.0 / OpenID Connect

Authorization:
  - Role-Based Access Control (RBAC)
  - Resource-level permissions
  - Attribute-Based Access Control (ABAC) for sensitive data

Roles:
  - user: Standard application user
  - premium: Premium subscriber
  - moderator: Content moderator
  - admin: Full system access
  - support: Customer support access
```

### 9.2 Data Protection

```yaml
Encryption at Rest:
  - Database: AES-256 encryption
  - Files: Client-side encryption before upload
  - Backups: Encrypted with separate keys

Encryption in Transit:
  - TLS 1.3 for all communications
  - Certificate pinning (mobile apps)
  - mTLS for service-to-service

Field-Level Encryption:
  - Journal entries: User-specific keys
  - Chat messages: Encrypted in database
  - PII: Tokenized where possible

Key Management:
  - AWS KMS / Google Cloud KMS
  - Key rotation every 90 days
  - Separate keys per environment
```

### 9.3 Compliance

```yaml
HIPAA (Health Insurance Portability and Accountability Act):
  - Business Associate Agreements (BAAs) with vendors
  - Audit logging for all PHI access
  - Minimum necessary access principle
  - Data retention policies

GDPR (General Data Protection Regulation):
  - Right to access, rectification, erasure
  - Data portability
  - Consent management
  - Privacy by design

COPPA (Children's Online Privacy Protection Act):
  - Age verification
  - Parental consent for under 13
  - Limited data collection for minors

SOC 2 Type II:
  - Security controls
  - Availability monitoring
  - Processing integrity
  - Confidentiality
```

---

## 10. Deployment Architecture

### 10.1 Infrastructure

```yaml
Cloud Provider: AWS (Primary) / GCP (Disaster Recovery)

Regions:
  Primary: us-east-1 (N. Virginia)
  Secondary: us-west-2 (Oregon)
  DR: eu-west-1 (Ireland)

Compute:
  - Kubernetes (EKS/GKE)
  - Node pools: General, AI/GPU, Memory-optimized
  - Auto-scaling: HPA + Cluster Autoscaler

Networking:
  - VPC with private subnets
  - Application Load Balancers
  - CloudFront CDN
  - Route 53 DNS

Storage:
  - S3: File storage, backups
  - EBS: Database volumes
  - EFS: Shared file systems
```

### 10.2 Kubernetes Architecture

```yaml
Namespaces:
  - mindmate-production
  - mindmate-staging
  - mindmate-development
  - monitoring
  - ingress-nginx

Pod Distribution:
  ┌─────────────────────────────────────────────────────────────┐
  │                    Kubernetes Cluster                        │
  │                                                              │
  │  ┌───────────────────────────────────────────────────────┐  │
  │  │  Ingress Controller (nginx) - 3 replicas              │  │
  │  └───────────────────────────────────────────────────────┘  │
  │                                                              │
  │  ┌───────────────────────────────────────────────────────┐  │
  │  │  API Gateway (Kong) - 3 replicas                      │  │
  │  └───────────────────────────────────────────────────────┘  │
  │                                                              │
  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │  │
  │  │  User    │ │  Chat    │ │  Journal │ │  Mood    │       │  │
  │  │ Service  │ │ Service  │ │ Service  │ │ Service  │       │  │
  │  │  3 pods  │ │  5 pods  │ │  3 pods  │ │  3 pods  │       │  │
  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │  │
  │                                                              │  │
  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │  │
  │  │  Content │ │   CBT    │ │  Crisis  │ │  Notify  │       │  │
  │  │ Service  │ │ Service  │ │ Service  │ │ Service  │       │  │
  │  │  3 pods  │ │  3 pods  │ │  3 pods  │ │  3 pods  │       │  │
  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │  │
  │                                                              │  │
  │  ┌───────────────────────────────────────────────────────┐  │
  │  │  AI Pipeline (Python/FastAPI) - 5-20 pods (auto)      │  │
  │  │  GPU nodes for inference                              │  │
  │  └───────────────────────────────────────────────────────┘  │
  │                                                              │
  │  ┌───────────────────────────────────────────────────────┐  │
  │  │  WebSocket Servers (Socket.io) - 3-10 pods (auto)     │  │
  │  └───────────────────────────────────────────────────────┘  │
  │                                                              │
  └─────────────────────────────────────────────────────────────┘

Resource Limits:
  - General services: 500m CPU, 1Gi memory
  - AI services: 2000m CPU, 8Gi memory, 1 GPU
  - WebSocket: 1000m CPU, 2Gi memory
```

### 10.3 CI/CD Pipeline

```yaml
Source Control: GitHub

CI/CD Platform: GitHub Actions + ArgoCD

Pipeline Stages:
  1. Build:
     - Code checkout
     - Dependency installation
     - Unit tests
     - Linting and formatting
     - Security scanning (SAST)
  
  2. Test:
     - Integration tests
     - Contract tests
     - Performance tests
     - Security tests (DAST)
  
  3. Package:
     - Docker image build
     - Image scanning (Trivy)
     - Push to ECR
  
  4. Deploy:
     - ArgoCD sync to staging
     - Smoke tests
     - Manual approval (production)
     - ArgoCD sync to production
     - Canary deployment (10% → 50% → 100%)
     - Automated rollback on error

Environments:
  - Development: Auto-deploy from feature branches
  - Staging: Auto-deploy from main branch
  - Production: Manual approval + canary
```

---

## 11. Service Communication Matrix

### 11.1 Synchronous Communication (REST/gRPC)

| From Service | To Service | Protocol | Purpose |
|--------------|------------|----------|---------|
| API Gateway | All Services | HTTP/2 | Request routing |
| Chat Service | AI Pipeline | gRPC | LLM inference |
| Mood Service | AI Pipeline | HTTP | Sentiment analysis |
| Crisis Service | AI Pipeline | gRPC | Crisis detection |
| CBT Service | AI Pipeline | HTTP | Exercise generation |
| User Service | Notification | HTTP | Welcome notifications |
| All Services | Auth Service | gRPC | Token validation |

### 11.2 Asynchronous Communication (Events)

| Publisher | Event | Subscribers | Purpose |
|-----------|-------|-------------|---------|
| User Service | user.created | Notification, Analytics, Billing | Onboarding flow |
| User Service | user.deleted | All Services | Data cleanup |
| Chat Service | message.sent | Crisis, Analytics, AI | Process message |
| Chat Service | conversation.created | Analytics | Track engagement |
| AI Pipeline | ai.response.ready | Chat | Deliver response |
| AI Pipeline | crisis.detected | Crisis, Notification | Escalate crisis |
| Mood Service | mood.tracked | Analytics, Journal | Update insights |
| Journal Service | journal.entry.created | Mood, Analytics | Analyze entry |
| CBT Service | cbt.exercise.completed | Analytics, Notification | Progress update |
| Billing Service | subscription.created | User, Analytics | Activate premium |
| Billing Service | payment.failed | Notification, User | Alert user |

### 11.3 Real-Time Communication (WebSocket)

| Channel | Direction | Data | Purpose |
|---------|-----------|------|---------|
| chat:{id} | Bidirectional | Messages, typing | Live chat |
| user:{id}:notifications | Server→Client | Alerts, updates | Push notifications |
| presence | Bidirectional | Online status | User presence |
| system | Server→Client | Maintenance, updates | System messages |

---

## Appendix A: API Versioning Strategy

```yaml
Versioning: URL-based (/api/v1/, /api/v2/)

Deprecation Policy:
  - Announce deprecation: 6 months before
  - Sunset period: 3 months after new version
  - Force migration: After sunset

Backward Compatibility:
  - Additive changes only within version
  - No breaking changes in patch releases
  - Breaking changes require new version
```

## Appendix B: Error Handling Standards

```yaml
HTTP Status Codes:
  200: Success
  201: Created
  204: No Content
  400: Bad Request
  401: Unauthorized
  403: Forbidden
  404: Not Found
  409: Conflict
  422: Unprocessable Entity
  429: Too Many Requests
  500: Internal Server Error
  503: Service Unavailable

Error Response Format:
  {
    "error": {
      "code": "RESOURCE_NOT_FOUND",
      "message": "User not found",
      "details": { "userId": "123" },
      "requestId": "req_abc123",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  }
```

## Appendix C: Rate Limiting

```yaml
Tiers:
  Free:
    - Chat: 50 messages/day
    - Journal: Unlimited
    - Mood tracking: Unlimited
    - CBT exercises: 5/day
  
  Premium:
    - Chat: Unlimited
    - Journal: Unlimited
    - Mood tracking: Unlimited
    - CBT exercises: Unlimited

Implementation:
  - Redis-based token bucket
  - Headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
  - Response: 429 Too Many Requests
```

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024 | System Architecture Team | Initial release |

---

*This document is the authoritative source for MindMate AI system architecture. All implementation decisions should align with this architecture.*
