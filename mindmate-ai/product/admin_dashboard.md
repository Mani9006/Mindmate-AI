# MindMate AI - Admin & Therapist Oversight Dashboard

## Document Information
- **Version**: 1.0.0
- **Status**: Production Ready
- **Last Updated**: 2024
- **Classification**: Internal Documentation
- **Audience**: Engineering Team, Product Team, Clinical Oversight Team

---

## Table of Contents

1. [Overview](#overview)
2. [User Roles & Permissions](#user-roles--permissions)
3. [Dashboard Architecture](#dashboard-architecture)
4. [Therapist Supervisor Dashboard](#therapist-supervisor-dashboard)
5. [Admin Panel](#admin-panel)
6. [Therapist Review Workflow](#therapist-review-workflow)
7. [Crisis Management System](#crisis-management-system)
8. [Analytics & Reporting](#analytics--reporting)
9. [Technical Specifications](#technical-specifications)
10. [Security & Compliance](#security--compliance)

---

## Overview

The MindMate AI Admin & Therapist Oversight Dashboard is a comprehensive web-based interface designed to provide licensed therapist supervisors and administrators with complete visibility into AI-assisted therapy sessions, user management, crisis interventions, and system analytics.

### Purpose

- Enable human oversight of AI therapy sessions
- Facilitate crisis intervention workflows
- Provide clinical supervision capabilities
- Ensure regulatory compliance (HIPAA, state licensing requirements)
- Monitor system health and usage patterns

### Key Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Session Review | Review flagged AI sessions with full context | Critical |
| Crisis Alerts | Real-time notifications for high-risk situations | Critical |
| Therapist Override | Human therapists can override AI recommendations | Critical |
| User Management | Manage user accounts, permissions, and access | High |
| Analytics Dashboard | Usage metrics, outcome tracking, system performance | High |
| Audit Logging | Complete audit trail of all actions | Critical |

---

## User Roles & Permissions

### Role Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPER ADMIN                              │
│         (Full system access, user management)               │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌─────────────────┐ ┌─────────────┐ ┌─────────────────┐
│ CLINICAL ADMIN  │ │  THERAPIST  │ │  AUDIT ADMIN    │
│ (Crisis mgmt,   │ │ SUPERVISOR  │ │ (Compliance,    │
│  clinical       │ │ (Session    │ │  reporting,     │
│  oversight)     │ │  review)    │ │  read-only)     │
└─────────────────┘ └─────────────┘ └─────────────────┘
                         │
                         ▼
                ┌─────────────────┐
                │ REVIEWER        │
                │ (Assigned cases │
                │  only)          │
                └─────────────────┘
```

### Permission Matrix

| Permission | Super Admin | Clinical Admin | Therapist Supervisor | Audit Admin | Reviewer |
|------------|:-----------:|:--------------:|:--------------------:|:-----------:|:--------:|
| View All Sessions | ✅ | ✅ | ✅ | ✅ | ❌ |
| View Assigned Sessions | ✅ | ✅ | ✅ | ✅ | ✅ |
| Override AI Recommendations | ✅ | ✅ | ✅ | ❌ | ❌ |
| Add Clinical Notes | ✅ | ✅ | ✅ | ❌ | ✅ |
| Manage Crisis Alerts | ✅ | ✅ | ❌ | ❌ | ❌ |
| Escalate to Emergency Services | ✅ | ✅ | ❌ | ❌ | ❌ |
| User Management | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Analytics | ✅ | ✅ | ✅ | ✅ | ❌ |
| Export Reports | ✅ | ✅ | ✅ | ✅ | ❌ |
| System Configuration | ✅ | ❌ | ❌ | ❌ | ❌ |
| Audit Log Access | ✅ | ❌ | ❌ | ✅ | ❌ |

### Role Definitions

#### Super Admin
- **Responsibilities**: System-wide administration, user management, configuration
- **Access Level**: Full access to all features and data
- **Requirements**: Platform administrator, background check required

#### Clinical Admin
- **Responsibilities**: Clinical oversight, crisis management, quality assurance
- **Access Level**: All clinical data, crisis intervention tools
- **Requirements**: Licensed mental health professional (LCSW, LMFT, LPC, Psychologist)

#### Therapist Supervisor
- **Responsibilities**: Review flagged sessions, provide clinical oversight
- **Access Level**: Assigned sessions, review tools, override capabilities
- **Requirements**: Licensed therapist with supervisory credentials

#### Audit Admin
- **Responsibilities**: Compliance monitoring, report generation, audit reviews
- **Access Level**: Read-only access to all data, reporting tools
- **Requirements**: Compliance officer, HIPAA training certified

#### Reviewer
- **Responsibilities**: Review assigned flagged sessions
- **Access Level**: Only explicitly assigned cases
- **Requirements**: Licensed mental health professional

---

## Dashboard Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Web App    │  │  Mobile App  │  │  API Clients │              │
│  │  (React)     │  │  (React      │  │              │              │
│  │              │  │   Native)    │  │              │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
└─────────┼─────────────────┼─────────────────┼──────────────────────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────────┐
│                      API GATEWAY                                     │
│         (Authentication, Rate Limiting, Routing)                     │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  ADMIN SERVICE  │ │ THERAPIST       │ │ ANALYTICS       │
│  (User mgmt,    │ │ SERVICE         │ │ SERVICE         │
│   config)       │ │ (Session review,│ │ (Metrics,       │
│                 │ │  workflows)     │ │  reporting)     │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                      DATA LAYER                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ PostgreSQL   │  │    Redis     │  │ Elasticsearch│              │
│  │ (Primary DB) │  │   (Cache,    │  │  (Search,    │              │
│  │              │  │   Sessions)  │  │   Analytics) │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | React 18 + TypeScript | Dashboard UI |
| State Management | Redux Toolkit + RTK Query | Global state, API caching |
| UI Components | Chakra UI + Custom Components | Consistent design system |
| Charts | Recharts + D3.js | Data visualization |
| Real-time | Socket.io | Live updates, notifications |
| Backend API | Node.js + Express | RESTful API |
| Database | PostgreSQL 15 | Primary data store |
| Cache | Redis 7 | Session cache, real-time data |
| Search | Elasticsearch 8 | Full-text search, analytics |
| Message Queue | RabbitMQ | Async processing |

---

## Therapist Supervisor Dashboard

### Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  MINDMATE AI                                    [🔔] [👤] [⚙️] [🚪] │
│  THERAPIST SUPERVISOR DASHBOARD                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  CRISIS ALERTS BANNER                                       │   │
│  │  ⚠️ 3 Active Crisis Alerts - Immediate Attention Required   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │  SESSIONS   │  │  PENDING    │  │  OVERDUE    │  │  REVIEWED  │ │
│  │  TO REVIEW  │  │  REVIEWS    │  │  REVIEWS    │  │  TODAY     │ │
│  │             │  │             │  │             │  │            │ │
│  │    24       │  │     8       │  │     3       │  │    12      │ │
│  │  +5 today   │  │  High Risk  │  │  >24 hours  │  │  4 pending │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  SESSIONS REQUIRING REVIEW                                  │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │  [Filter ▼] [Risk: All ▼] [Status: All ▼]    [🔍 Search]   │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │  ⚠️ │ User ID    │ Risk │ Flag Reason        │ Time │ Action │   │
│  │  ───┼────────────┼──────┼────────────────────┼──────┼─────── │   │
│  │  🔴 │ USER-7842  │ HIGH │ Suicidal ideation  │ 2m   │ Review │   │
│  │  🟠 │ USER-6291  │ MED  │ Self-harm mention  │ 15m  │ Review │   │
│  │  🟠 │ USER-4532  │ MED  │ Crisis keywords    │ 1h   │ Review │   │
│  │  🟡 │ USER-9821  │ LOW  │ AI uncertainty     │ 3h   │ Review │   │
│  │  🟡 │ USER-1129  │ LOW  │ User request       │ 5h   │ Review │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────┐  ┌─────────────────────────────────┐  │
│  │  RECENT ACTIVITY        │  │  MY PERFORMANCE                 │  │
│  │                         │  │                                 │  │
│  │  • Reviewed USER-4451   │  │  Reviews Today: 12              │  │
│  │  • Added note to        │  │  Avg Review Time: 8 min         │  │
│  │    USER-3321            │  │  Accuracy Score: 98%            │  │
│  │  • Escalated USER-2298  │  │  Response Time: <15 min         │  │
│  │  • Override on USER-1102│  │                                 │  │
│  │                         │  │  [View Full Report]             │  │
│  └─────────────────────────┘  └─────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Components

#### 1. Crisis Alerts Banner
- **Purpose**: Immediate visibility of active crisis situations
- **Behavior**: 
  - Auto-refreshes every 30 seconds
  - Clicking expands to show all active alerts
  - Audio notification for new high-risk alerts
- **Display Rules**:
  - Red: Active crisis requiring immediate action
  - Orange: Elevated risk, review within 1 hour
  - Yellow: Moderate risk, review within 4 hours

#### 2. Quick Stats Cards
- **Sessions to Review**: Total flagged sessions awaiting review
- **Pending Reviews**: High-risk items requiring attention
- **Overdue Reviews**: Items past SLA threshold
- **Reviewed Today**: Personal performance metric

#### 3. Sessions Table
**Columns**:
| Column | Description | Sortable |
|--------|-------------|----------|
| Risk Indicator | Visual severity indicator | ✅ |
| User ID | Anonymized user identifier | ✅ |
| Risk Level | HIGH / MEDIUM / LOW | ✅ |
| Flag Reason | Why session was flagged | ✅ |
| Time Since | How long ago flag was raised | ✅ |
| Action | Review button | ❌ |

**Filtering Options**:
- Risk Level (All, High, Medium, Low)
- Status (All, Unassigned, Assigned to Me, Reviewed)
- Flag Type (Crisis, Quality, User Request, AI Uncertainty)
- Time Range (Last Hour, Today, Last 7 Days, Custom)

#### 4. Session Detail View

```
┌─────────────────────────────────────────────────────────────────────┐
│  SESSION REVIEW: USER-7842                    [Assign] [Escalate]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  SESSION CONTEXT                                              │   │
│  │  Risk Level: 🔴 HIGH    Flagged: 2 minutes ago              │   │
│  │  Flag Reason: Suicidal ideation detected                    │   │
│  │  AI Confidence: 87%    User Consent: ✅ Verified            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  CONVERSATION HISTORY                                         │   │
│  │                                                               │   │
│  │  [14:32] User: "I've been feeling really hopeless lately"   │   │
│  │  [14:33] AI: "I'm sorry to hear that..."                    │   │
│  │  [14:35] User: "I don't see the point in continuing"        │   │
│  │  [14:36] AI: "It sounds like you're going through..."       │   │
│  │  [14:38] User: "I've been thinking about ending it all"     │   │
│  │            ▲▲▲ FLAGGED: Suicidal ideation detected          │   │
│  │  [14:39] AI: "I'm really concerned about what you're..."    │   │
│  │            Safety protocol activated                        │   │
│  │                                                               │   │
│  │  [Show Full Transcript] [Download]                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  AI ANALYSIS                                                  │   │
│  │                                                               │   │
│  │  Risk Assessment: HIGH                                        │   │
│  │  Recommended Action: Immediate human intervention             │   │
│  │  Suggested Resources: Crisis hotline, Emergency services      │   │
│  │  Safety Plan: Not established                                 │   │
│  │                                                               │   │
│  │  [View Full AI Report]                                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  THERAPIST ACTIONS                                            │   │
│  │                                                               │   │
│  │  Clinical Notes:                                              │   │
│  │  ┌─────────────────────────────────────────────────────────┐ │   │
│  │  │                                                         │ │   │
│  │  │                                                         │ │   │
│  │  └─────────────────────────────────────────────────────────┘ │   │
│  │                                                               │   │
│  │  Override AI Recommendation:                                  │   │
│  │  ○ Agree with AI    ○ Modify Risk Level    ○ Disagree       │   │
│  │                                                               │   │
│  │  If modifying:                                                │   │
│  │  New Risk Level: [CRITICAL ▼]                                 │   │
│  │  Override Reason: [Required field ▼]                          │   │
│  │                                                               │   │
│  │  Recommended Actions:                                         │   │
│  │  ☑ Contact user immediately                                   │   │
│  │  ☐ Escalate to crisis team                                    │   │
│  │  ☑ Provide crisis resources                                   │   │
│  │  ☐ Schedule follow-up                                         │   │
│  │  ☐ Other: _______________                                     │   │
│  │                                                               │   │
│  │  [Submit Review] [Save Draft] [Request Second Opinion]        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Admin Panel

### Navigation Structure

```
Admin Panel
│
├── Dashboard
│   └── Overview & Quick Actions
│
├── User Management
│   ├── All Users
│   ├── Therapists
│   ├── Admins
│   ├── Pending Approvals
│   └── Access Logs
│
├── Crisis Management
│   ├── Active Alerts
│   ├── Alert History
│   ├── Escalation Log
│   └── Crisis Protocols
│
├── Session Flags
│   ├── Flagged Sessions
│   ├── Flag Rules
│   ├── Auto-Response Settings
│   └── Review Queue
│
├── Analytics
│   ├── Usage Overview
│   ├── Session Metrics
│   ├── Outcome Reports
│   ├── Therapist Performance
│   └── System Health
│
├── Configuration
│   ├── System Settings
│   ├── AI Parameters
│   ├── Notification Settings
│   └── Integration Settings
│
└── Audit & Compliance
    ├── Audit Logs
    ├── Compliance Reports
    ├── Data Export
    └── Security Events
```

### 1. User Management

#### User List View

```
┌─────────────────────────────────────────────────────────────────────┐
│  USER MANAGEMENT                                  [+ Add User]      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [All ▼] [Status: All ▼] [Role: All ▼]              [🔍 Search]     │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Name           │ Role      │ Status  │ Last Active │ Actions│   │
│  │  ───────────────┼───────────┼─────────┼─────────────┼─────── │   │
│  │  Dr. Sarah Chen │ Clin Admin│ Active  │ 2 min ago   │ [⋯]   │   │
│  │  Mark Johnson   │ Therapist │ Active  │ 15 min ago  │ [⋯]   │   │
│  │  Lisa Park      │ Reviewer  │ Away    │ 2 hours ago │ [⋯]   │   │
│  │  James Wilson   │ Therapist │ Pending │ -           │ [⋯]   │   │
│  │  Amy Roberts    │ Audit     │ Active  │ 1 day ago   │ [⋯]   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Showing 1-5 of 47 users                              [1] [2] [3]   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### User Detail Modal

```
┌─────────────────────────────────────────────────────────────────────┐
│  USER DETAILS: Dr. Sarah Chen                         [✕] [Edit]    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────────────────────────────┐  │
│  │                 │  │  PROFILE INFORMATION                    │  │
│  │    [Avatar]     │  │                                         │  │
│  │                 │  │  Name: Dr. Sarah Chen                   │  │
│  │  Status: ●      │  │  Email: sarah.chen@mindmate.ai          │  │
│  │  Active         │  │  Phone: +1 (555) 123-4567               │  │
│  │                 │  │  Role: Clinical Administrator           │  │
│  │  [Change Photo] │  │  License: LCSW-12345 (CA)               │  │
│  │                 │  │  Department: Crisis Response            │  │
│  └─────────────────┘  │  Supervisor: N/A                        │  │
│                       │                                         │  │
│                       │  PERMISSIONS                            │  │
│                       │  ☑ View All Sessions                    │  │
│                       │  ☑ Override AI Recommendations          │  │
│                       │  ☑ Manage Crisis Alerts                 │  │
│                       │  ☑ Escalate to Emergency Services       │  │
│                       │  ☑ View Analytics                       │  │
│                       │  ☐ User Management                      │  │
│                       │  ☐ System Configuration                 │  │
│                       │                                         │  │
│                       │  ACTIVITY SUMMARY                       │  │
│                       │  Sessions Reviewed (30d): 156           │  │
│                       │  Avg Review Time: 6.5 min               │  │
│                       │  Crisis Interventions: 12               │  │
│                       │  Last Login: Today, 9:42 AM             │  │
│                       │                                         │  │
│                       │  [View Full Activity Log] [Reset Password]│  │
│                       └─────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Add User Flow

```
Step 1: Basic Information
┌─────────────────────────────────────────────────────────────────────┐
│  ADD NEW USER                                          [Cancel]     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Step 1 of 3                                                        │
│  [●────○────○]                                                      │
│                                                                     │
│  Full Name *                                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Email Address *                                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Phone Number                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Role *                                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Select Role...                                    [▼]      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Department                                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│                              [Continue →]                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

Step 2: Credentials & License
┌─────────────────────────────────────────────────────────────────────┐
│  ADD NEW USER                                          [Cancel]     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Step 2 of 3                                                        │
│  [●────●────○]                                                      │
│                                                                     │
│  License Type *                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Select License Type...                            [▼]      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  License Number *                                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  License State *                                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Select State...                                   [▼]      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  License Expiration Date *                                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  [📅 MM/DD/YYYY]                                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Upload License Document                                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  [📎 Choose File]  No file selected                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  [← Back]                    [Continue →]                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

Step 3: Permissions & Review
┌─────────────────────────────────────────────────────────────────────┐
│  ADD NEW USER                                          [Cancel]     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Step 3 of 3                                                        │
│  [●────●────●]                                                      │
│                                                                     │
│  REVIEW INFORMATION                                                 │
│                                                                     │
│  Name: Dr. Michael Torres                                           │
│  Email: michael.torres@mindmate.ai                                  │
│  Role: Therapist Supervisor                                         │
│  License: LCSW-98765 (NY)                                           │
│                                                                     │
│  PERMISSIONS                                                        │
│  ☑ View All Sessions                                                │
│  ☑ Override AI Recommendations                                      │
│  ☑ Add Clinical Notes                                               │
│  ☐ Manage Crisis Alerts                                             │
│  ☐ Escalate to Emergency Services                                   │
│  ☑ View Analytics                                                   │
│                                                                     │
│  [Edit Permissions]                                                 │
│                                                                     │
│  An invitation email will be sent to the user with setup            │
│  instructions.                                                      │
│                                                                     │
│  [← Back]                    [Create User ✓]                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2. Crisis Management

#### Active Crisis Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│  CRISIS MANAGEMENT                    [Crisis Protocols] [History]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  🚨 ACTIVE CRISIS ALERTS: 3                                 │   │
│  │  Next review due in: 4 minutes                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  ALERT #1 - CRITICAL                                        │   │
│  │  User: USER-7842    Raised: 2 min ago    Status: UNASSIGNED │   │
│  │  Reason: Active suicidal ideation with plan                 │   │
│  │  AI Confidence: 94%                                         │   │
│  │                                                             │   │
│  │  [Assign to Me] [Assign to...] [View Details] [Escalate]    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  ALERT #2 - HIGH                                            │   │
│  │  User: USER-6291    Raised: 15 min ago   Status: ASSIGNED   │   │
│  │  Assigned to: Dr. Sarah Chen                                │   │
│  │  Reason: Self-harm mention                                  │   │
│  │                                                             │   │
│  │  [View Details] [Reassign] [Mark Resolved]                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  ALERT #3 - HIGH                                            │   │
│  │  User: USER-4532    Raised: 1 hour ago   Status: ESCALATED  │   │
│  │  Escalated to: Crisis Team Lead                             │   │
│  │  Reason: Crisis keywords detected                           │   │
│  │                                                             │   │
│  │  [View Details] [View Escalation]                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  RECENTLY RESOLVED (Last 24 hours)                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  User-4451  │ Resolved 30 min ago │ Dr. Mark Johnson        │   │
│  │  User-3321  │ Resolved 2 hours ago│ Dr. Sarah Chen          │   │
│  │  User-2298  │ Resolved 5 hours ago│ Crisis Team             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Crisis Escalation Flow

```
CRISIS ESCALATION WORKFLOW
═══════════════════════════════════════════════════════════════════════

┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   CRISIS    │────▶│   LEVEL 1   │────▶│   LEVEL 2   │────▶│   LEVEL 3   │
│  DETECTED   │     │  AI + Auto  │     │  Therapist  │     │  Emergency  │
│             │     │  Response   │     │  Review     │     │  Services   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ AI flags    │     │ Safety      │     │ Licensed    │     │ 911 /       │
│ session     │     │ resources   │     │ therapist   │     │ Crisis      │
│ based on    │     │ provided    │     │ reviews     │     │ hotline     │
│ risk model  │     │ immediately │     │ within 15   │     │ direct      │
│             │     │             │     │ minutes     │     │ contact     │
│ < 1 second  │     │ < 5 seconds │     │ < 15 min    │     │ < 5 min     │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘

ESCALATION TRIGGERS:
────────────────────
• Level 1 → Level 2: High confidence crisis detection (>85%)
• Level 2 → Level 3: Therapist determines imminent danger
• Level 1 → Level 3: Critical keywords ("going to kill myself", "have a plan")
• Auto-Level 3: User explicitly requests emergency help
```

### 3. Session Flags

#### Flag Rules Configuration

```
┌─────────────────────────────────────────────────────────────────────┐
│  SESSION FLAG RULES                           [+ Create Rule]       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ACTIVE RULES                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Rule Name          │ Trigger │ Action    │ Status  │ Edit  │   │
│  │  ───────────────────┼─────────┼───────────┼─────────┼────── │   │
│  │  Suicidal Ideation  │ AI 90%+ │ Alert+Esc │ Active  │ [✎]   │   │
│  │  Self-Harm Keywords │ Keyword │ Alert     │ Active  │ [✎]   │   │
│  │  Crisis Language    │ Pattern │ Alert     │ Active  │ [✎]   │   │
│  │  AI Uncertainty     │ Conf<50%│ Queue     │ Active  │ [✎]   │   │
│  │  User Request       │ Manual  │ Queue     │ Active  │ [✎]   │   │
│  │  Quality Check      │ Random  │ Queue     │ Active  │ [✎]   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  RULE DETAILS: Suicidal Ideation                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Description: Detects expressions of suicidal thoughts      │   │
│  │                                                             │   │
│  │  Trigger Conditions:                                        │   │
│  │  • AI confidence ≥ 90% for suicidal ideation                │   │
│  │  • OR keyword match: "kill myself", "end it all", etc.      │   │
│  │  • OR pattern: "no point in living" + negative emotion      │   │
│  │                                                             │   │
│  │  Actions:                                                   │   │
│  │  ☑ Create crisis alert (HIGH priority)                      │   │
│  │  ☑ Notify on-call therapist                                 │   │
│  │  ☑ Provide safety resources to user                         │   │
│  │  ☑ Escalate to crisis team if unassigned > 10 min           │   │
│  │                                                             │   │
│  │  Auto-Response Message:                                     │   │
│  │  "I'm really concerned about what you're sharing..."        │   │
│  │                                                             │   │
│  │  [Edit Rule] [Disable] [View History]                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4. Usage Analytics

#### Analytics Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│  ANALYTICS DASHBOARD            [Last 30 Days ▼] [Export Report]    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  KEY METRICS                                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │  TOTAL      │  │  ACTIVE     │  │  AVG SESSION│  │  CRISIS    │ │
│  │  SESSIONS   │  │  USERS      │  │  DURATION   │  │  ALERTS    │ │
│  │             │  │             │  │             │  │            │ │
│  │   12,847    │  │    3,421    │  │   18.5 min  │  │    156     │ │
│  │  +23% ▲     │  │  +15% ▲     │  │  +2.3 min ▲ │  │   -8% ▼    │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
│                                                                     │
│  SESSION VOLUME OVER TIME                                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │    500 ┤                              ╭─╮                  │   │
│  │        │           ╭─╮    ╭─╮    ╭──╯ │    ╭─╮            │   │
│  │    400 ┤      ╭──╯ │ ╰──╯ │ ╰──╯      ╰──╯ │             │   │
│  │        │ ╭──╯      │                      │               │   │
│  │    300 ┤─╯         │                      │               │   │
│  │        │           │                      │               │   │
│  │    200 ┤           │                      │               │   │
│  │        │           │                      │               │   │
│  │    100 ┤           │                      │               │   │
│  │        └───────────┴──────────────────────┴───────────────│   │
│  │          Week 1   Week 2   Week 3   Week 4                │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  RISK DISTRIBUTION                    SESSION OUTCOMES              │
│  ┌─────────────────────────┐          ┌─────────────────────────┐  │
│  │                         │          │                         │  │
│  │      ╭────╮             │          │    ╭────────╮           │  │
│  │     ╱  5%  ╲   HIGH     │          │   ╱   78%   ╲  Positive │  │
│  │    ╱  CRISIS ╲          │          │  ╱  Resolved  ╲         │  │
│  │   ╱───────────╲         │          │ ╱─────────────╲        │  │
│  │  │    15%      │ MEDIUM  │          │ │    15%       │Escalated│  │
│  │  │   ELEVATED  │         │          │ │   Referred   │       │  │
│  │   ╲───────────╱         │          │  ╲─────────────╱        │  │
│  │    ╲   80%   ╱  LOW     │          │   ╲    7%    ╱  Ongoing │  │
│  │     ╲ NORMAL╱           │          │    ╲────────╱           │  │
│  │      ╰────╯             │          │                         │  │
│  └─────────────────────────┘          └─────────────────────────┘  │
│                                                                     │
│  THERAPIST PERFORMANCE                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Therapist        │ Reviews │ Avg Time │ Accuracy │ Status   │   │
│  │  ─────────────────┼─────────┼──────────┼──────────┼───────── │   │
│  │  Dr. Sarah Chen   │   156   │  6.5 min │   98%    │ ⭐ Top   │   │
│  │  Mark Johnson     │   142   │  8.2 min │   95%    │ Good     │   │
│  │  Lisa Park        │    89   │  7.1 min │   97%    │ Good     │   │
│  │  James Wilson     │    67   │  12 min  │   88%    │ ⚠️ Review │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Therapist Review Workflow

### Complete Review Process Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    THERAPIST REVIEW WORKFLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

PHASE 1: NOTIFICATION & ASSIGNMENT
═══════════════════════════════════════════════════════════════════════════════

     ┌──────────────┐
     │  SESSION     │
     │  FLAGGED     │
     └──────┬───────┘
            │
            ▼
     ┌──────────────┐
     │  AI ANALYSIS │────────────────┐
     │  COMPLETED   │                │
     └──────┬───────┘                │
            │                        │
            ▼                        ▼
     ┌──────────────┐        ┌──────────────┐
     │  CRISIS      │        │  STANDARD    │
     │  DETECTED?   │        │  QUEUE       │
     └──────┬───────┘        └──────┬───────┘
            │                       │
         YES│                    NO │
            ▼                       ▼
     ┌──────────────┐        ┌──────────────┐
     │  IMMEDIATE   │        │  PRIORITY    │
     │  ALERT       │        │  ASSIGNMENT  │
     │  (< 1 min)   │        │  (FIFO +     │
     └──────┬───────┘        │   expertise) │
            │                └──────┬───────┘
            │                       │
            └───────────┬───────────┘
                        ▼
                 ┌──────────────┐
                 │  THERAPIST   │
                 │  NOTIFIED    │
                 │  (Push +     │
                 │   Email)     │
                 └──────┬───────┘
                        │
                        ▼
                 ┌──────────────┐
                 │  THERAPIST   │
                 │  ACCEPTS     │
                 │  ASSIGNMENT  │
                 └──────────────┘

PHASE 2: REVIEW & ASSESSMENT
═══════════════════════════════════════════════════════════════════════════════

     ┌──────────────┐
     │  REVIEWER    │
     │  OPENS       │
     │  SESSION     │
     └──────┬───────┘
            │
            ▼
     ┌─────────────────────────────────────────────────────────────┐
     │  REVIEW INTERFACE LOADS:                                    │
     │  • Full conversation transcript                             │
     │  • AI risk assessment & confidence score                    │
     │  • User profile & history                                   │
     │  • Previous sessions (if any)                               │
     │  • Safety plan status                                       │
     └──────┬───────────────────────────────────────────────────────┘
            │
            ▼
     ┌──────────────┐
     │  THERAPIST   │
     │  READS       │
     │  SESSION     │
     └──────┬───────┘
            │
            ▼
     ┌─────────────────────────────────────────────────────────────┐
     │  ASSESSMENT QUESTIONS (Internal):                           │
     │  • Is AI risk assessment accurate?                          │
     │  • Are there signs missed by AI?                            │
     │  • Is immediate intervention needed?                        │
     │  • What is appropriate next step?                           │
     └──────┬───────────────────────────────────────────────────────┘
            │
            ▼
     ┌──────────────┐
     │  THERAPIST   │
     │  DOCUMENTS   │
     │  FINDINGS     │
     └──────────────┘

PHASE 3: DECISION & ACTION
═══════════════════════════════════════════════════════════════════════════════

     ┌──────────────┐
     │  THERAPIST   │
     │  MAKES       │
     │  DECISION    │
     └──────┬───────┘
            │
            ├───▶ AGREE WITH AI ─────────────────────────┐
            │                                             │
            ├───▶ MODIFY RISK LEVEL ─────────────────────┤
            │    (Higher or Lower)                        │
            │                                             │
            └───▶ DISAGREE WITH AI ──────────────────────┤
                 (Provide reasoning)                      │
                                                          │
                                                          ▼
     ┌─────────────────────────────────────────────────────────────┐
     │  SELECT ACTIONS:                                            │
     │                                                             │
     │  [✓] Contact user directly (if appropriate)                 │
     │  [✓] Provide additional resources                           │
     │  [✓] Escalate to crisis team                                │
     │  [✓] Update safety plan                                     │
     │  [✓] Schedule follow-up session                             │
     │  [✓] Flag for quality review                                │
     │  [✓] Other: _______________                                 │
     │                                                             │
     │  CLINICAL NOTES:                                            │
     │  ┌─────────────────────────────────────────────────────┐   │
     │  │                                                     │   │
     │  │  [Required - minimum 50 characters]                 │   │
     │  │                                                     │   │
     │  └─────────────────────────────────────────────────────┘   │
     │                                                             │
     │  [Submit Review] [Save Draft] [Request Second Opinion]      │
     └─────────────────────────────────────────────────────────────┘

PHASE 4: FOLLOW-UP & DOCUMENTATION
═══════════════════════════════════════════════════════════════════════════════

     ┌──────────────┐
     │  REVIEW      │
     │  SUBMITTED   │
     └──────┬───────┘
            │
            ▼
     ┌──────────────┐
     │  SYSTEM      │
     │  PROCESSES   │
     │  ACTIONS     │
     └──────┬───────┘
            │
            ├───▶ Update user record
            ├───▶ Log all actions to audit trail
            ├───▶ Execute selected actions
            ├───▶ Notify relevant parties
            └───▶ Update AI training data (anonymized)
                        │
                        ▼
                 ┌──────────────┐
                 │  CASE        │
                 │  CLOSED      │
                 │  (or queued  │
                 │  for follow-up)
                 └──────┬───────┘
                        │
                        ▼
                 ┌──────────────┐
                 │  AVAILABLE   │
                 │  FOR AUDIT   │
                 │  & REPORTING │
                 └──────────────┘
```

### Review Interface Components

#### Clinical Notes Template

```markdown
## Clinical Review Template

### Session Information
- **Session ID**: [Auto-populated]
- **User ID**: [Anonymized]
- **Review Date**: [Timestamp]
- **Reviewer**: [Therapist name]

### Risk Assessment
- **AI Risk Level**: [High/Medium/Low]
- **AI Confidence**: [Percentage]
- **Therapist Risk Level**: [Critical/High/Medium/Low/None]
- **Risk Modification Reason**: [If different from AI]

### Clinical Observations
[Free text area for clinical notes]

### Actions Taken
- [ ] Contacted user
- [ ] Updated safety plan
- [ ] Provided resources
- [ ] Escalated to crisis team
- [ ] Scheduled follow-up
- [ ] Other: ___________

### Recommendations
[Follow-up recommendations]

### Supervisor Review Required
- [ ] Yes - Complex case
- [ ] Yes - Disagreement with AI
- [ ] No
```

#### Override Decision Tree

```
OVERRIDE DECISION TREE
═══════════════════════════════════════════════════════════════════════════════

                    ┌─────────────────┐
                    │  THERAPIST      │
                    │  REVIEWS AI     │
                    │  ASSESSMENT     │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        ┌─────────┐    ┌─────────┐    ┌─────────┐
        │  AGREE  │    │ MODIFY  │    │DISAGREE │
        │         │    │  RISK   │    │         │
        └────┬────┘    └────┬────┘    └────┬────┘
             │              │              │
             ▼              ▼              ▼
    ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
    │ Confirm AI     │ │ Select new     │ │ Provide        │
    │ assessment     │ │ risk level:    │ │ detailed       │
    │                │ │ • Critical     │ │ reasoning:     │
    │ Document       │ │ • High         │ │ • False        │
    │ agreement      │ │ • Medium       │ │   positive     │
    │                │ │ • Low          │ │ • Context      │
    │ [Submit]       │ │ • None         │ │   missing      │
    │                │ │                │ │ • Other        │
    │                │ │ Document       │ │                │
    │                │ │ reason for     │ │ [Submit for    │
    │                │ │ change         │ │  supervisor    │
    │                │ │                │ │  review]       │
    │                │ │ [Submit]       │ │                │
    └────────────────┘ └────────────────┘ └────────────────┘
```

---

## Crisis Management System

### Crisis Detection & Response Protocol

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CRISIS MANAGEMENT PROTOCOL                               │
└─────────────────────────────────────────────────────────────────────────────┘

DETECTION LAYERS
═══════════════════════════════════════════════════════════════════════════════

Layer 1: AI Pattern Recognition
├── Natural Language Processing
│   ├── Sentiment analysis
│   ├── Intent classification
│   └── Entity extraction (self-harm, suicide keywords)
├── Behavioral Patterns
│   ├── Message frequency changes
│   ├── Response time patterns
│   └── Conversation flow analysis
└── Risk Scoring Model
    ├── Machine learning classifier
    ├── Confidence threshold: 85%
    └── Multi-class: None/Low/Medium/High/Critical

Layer 2: Keyword & Pattern Matching
├── Critical Keywords (Immediate escalation)
│   ├── "kill myself", "end my life"
│   ├── "suicide", "suicidal"
│   └── "don't want to live"
├── Elevated Keywords (High priority queue)
│   ├── "self-harm", "cutting"
│   ├── "hopeless", "worthless"
│   └── "no point", "give up"
└── Contextual Patterns
    ├── Plan + Method + Timeline
    ├── Goodbye messages
    └── Giving away possessions

Layer 3: Human Review Triggers
├── AI uncertainty (confidence < 50%)
├── User explicitly requests help
├── Prolonged negative sentiment
└── Random quality sampling

RESPONSE PROTOCOLS
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│ CRITICAL (Confidence > 90% + Plan detected)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ Timeline: < 1 minute to human notification                                  │
│                                                                             │
│ Actions:                                                                    │
│ 1. AI immediately provides safety resources                                 │
│ 2. Crisis alert created (CRITICAL priority)                                 │
│ 3. All on-call therapists notified (push + SMS + email)                     │
│ 4. Session flagged for immediate review                                     │
│ 5. If unassigned > 5 min → Auto-escalate to crisis lead                     │
│ 6. If unassigned > 10 min → Consider emergency services contact             │
│                                                                             │
│ AI Response: "I'm really concerned about you. Your safety is important..."  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ HIGH (Confidence 75-90% OR Elevated keywords)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ Timeline: < 5 minutes to human notification                                 │
│                                                                             │
│ Actions:                                                                    │
│ 1. AI provides supportive response + resources                              │
│ 2. Crisis alert created (HIGH priority)                                     │
│ 3. Available therapists notified                                            │
│ 4. Session queued for review within 15 minutes                              │
│ 5. If unassigned > 15 min → Escalate to supervisor                          │
│                                                                             │
│ AI Response: "It sounds like you're going through a really difficult..."    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ MEDIUM (Confidence 50-75% OR Contextual concerns)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ Timeline: < 30 minutes to human review                                      │
│                                                                             │
│ Actions:                                                                    │
│ 1. AI provides empathetic response                                          │
│ 2. Session flagged for review                                               │
│ 3. Added to therapist queue                                                 │
│ 4. Review within 1 hour                                                     │
│                                                                             │
│ AI Response: "I hear that you're struggling. Would you like to talk..."     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Crisis Alert Lifecycle

```
CRISIS ALERT STATES
═══════════════════════════════════════════════════════════════════════════════

    ┌─────────────┐
    │   CREATED   │◄─────────────────────────────────────────┐
    │  (System)   │                                          │
    └──────┬──────┘                                          │
           │                                                 │
           │ Auto-assign or manual assign                    │
           ▼                                                 │
    ┌─────────────┐     Timeout: 10 min                     │
    │  ASSIGNED   │─────────────────────────────────────────┤
    │ (Therapist) │     (if no response)                    │
    └──────┬──────┘                                          │
           │                                                 │
           │ Therapist reviews and takes action              │
           │                                                 │
           ├───▶ Contact user ──────────────────────────────┤
           │                                                 │
           ├───▶ Escalate to crisis team ───────────────────┤
           │                                                 │
           ├───▶ Contact emergency services ────────────────┤
           │                                                 │
           ▼                                                 │
    ┌─────────────┐                                          │
    │  IN PROGRESS│                                          │
    │  (Active    │                                          │
    │   response) │                                          │
    └──────┬──────┘                                          │
           │                                                 │
           │ Crisis resolved or stabilized                   │
           ▼                                                 │
    ┌─────────────┐                                          │
    │  RESOLVED   │                                          │
    │ (Documented │                                          │
    │  closure)   │                                          │
    └──────┬──────┘                                          │
           │                                                 │
           │ Follow-up scheduled or case closed              │
           ▼                                                 │
    ┌─────────────┐                                          │
    │   CLOSED    │──────────────────────────────────────────┘
    │  (Archived) │  (if re-escalation needed)
    └─────────────┘
```

---

## Analytics & Reporting

### Key Performance Indicators (KPIs)

#### Clinical KPIs

| KPI | Definition | Target | Measurement |
|-----|------------|--------|-------------|
| Crisis Response Time | Time from flag to therapist assignment | < 5 min | Average |
| Review Completion Rate | % of flagged sessions reviewed within SLA | > 95% | Daily |
| AI Accuracy | % of AI risk assessments matching therapist | > 90% | Monthly |
| Override Rate | % of reviews where AI is overridden | 5-15% | Monthly |
| User Safety Incidents | Number of adverse events | 0 | Monthly |
| Follow-up Compliance | % of recommended follow-ups completed | > 80% | Weekly |

#### Operational KPIs

| KPI | Definition | Target | Measurement |
|-----|------------|--------|-------------|
| System Uptime | % of time system is available | > 99.9% | Monthly |
| Session Completion Rate | % of sessions completed without error | > 98% | Daily |
| Average Session Duration | Mean length of therapy sessions | 15-25 min | Weekly |
| Active Users | Number of unique users per period | Growth | Monthly |
| Therapist Utilization | % of therapist time on reviews | 60-80% | Weekly |
| Queue Depth | Average number of pending reviews | < 20 | Real-time |

### Report Types

#### 1. Daily Operations Report

```
DAILY OPERATIONS REPORT - [Date]
═══════════════════════════════════════════════════════════════════════════════

EXECUTIVE SUMMARY
─────────────────
• Total Sessions: 428 (+12% vs yesterday)
• Active Users: 156 (+5% vs yesterday)
• Crisis Alerts: 3 (all resolved)
• Pending Reviews: 8 (within SLA)
• System Uptime: 100%

CRISIS SUMMARY
──────────────
Alert #1: USER-7842 - Resolved by Dr. Chen (12 min response)
Alert #2: USER-6291 - Resolved by Dr. Johnson (8 min response)
Alert #3: USER-4532 - Escalated to crisis team, resolved (45 min)

THERAPIST ACTIVITY
──────────────────
Dr. Sarah Chen:     12 reviews, avg 6.2 min, 100% on-time
Mark Johnson:       10 reviews, avg 7.5 min, 100% on-time
Lisa Park:           8 reviews, avg 8.1 min, 100% on-time

SYSTEM HEALTH
─────────────
• API Response Time: 45ms (p95)
• Database Performance: Normal
• AI Model Performance: 94% accuracy
• No incidents reported
```

#### 2. Weekly Clinical Quality Report

```
WEEKLY CLINICAL QUALITY REPORT - Week of [Date]
═══════════════════════════════════════════════════════════════════════════════

RISK DISTRIBUTION
─────────────────
┌────────────────────────────────────────────────────────┐
│ Crisis:    23 sessions (2.1%)  ███                    │
│ High:      89 sessions (8.2%)  ██████████             │
│ Medium:   234 sessions (21.5%) ████████████████████   │
│ Low:      741 sessions (68.2%) ██████████████████████ │
│ Total:   1,087 sessions                               │
└────────────────────────────────────────────────────────┘

AI PERFORMANCE METRICS
──────────────────────
• Overall Accuracy: 92.3%
• True Positives:  104/112 (92.9%)
• False Positives:  18/975 (1.8%)
• False Negatives:   8/112 (7.1%)
• Sensitivity: 92.9%
• Specificity: 98.2%

THERAPIST OVERRIDE ANALYSIS
───────────────────────────
Total Overrides: 47 (4.3% of reviews)
- Risk Level Increased: 12 (25.5%)
- Risk Level Decreased: 28 (59.6%)
- Other Modifications:   7 (14.9%)

Top Override Reasons:
1. Context not captured by AI (34%)
2. User history consideration (28%)
3. Clinical judgment (23%)
4. False positive detection (15%)

OUTCOME TRACKING
────────────────
• Sessions with follow-up: 234 (67% of flagged)
• User-reported improvement: 78%
• Re-escalation rate: 4.2%
• No adverse events reported
```

#### 3. Monthly Compliance Report

```
MONTHLY COMPLIANCE REPORT - [Month/Year]
═══════════════════════════════════════════════════════════════════════════════

REGULATORY COMPLIANCE
─────────────────────
┌────────────────────────────────────────────────────────────────┐
│ Requirement              │ Status    │ Evidence                │
├──────────────────────────┼───────────┼─────────────────────────┤
│ HIPAA Compliance         │ ✅ PASS   │ Audit log complete      │
│ Data Encryption          │ ✅ PASS   │ AES-256 verified        │
│ Access Controls          │ ✅ PASS   │ Role-based verified     │
│ Audit Logging            │ ✅ PASS   │ 100% coverage           │
│ Incident Response        │ ✅ PASS   │ < 1 hour avg response   │
│ Therapist Licensing      │ ✅ PASS   │ All licenses current    │
│ Crisis Protocol Adherence│ ✅ PASS   │ 98.5% SLA compliance    │
└────────────────────────────────────────────────────────────────┘

SECURITY EVENTS
───────────────
• Failed Login Attempts: 23 (all blocked)
• Suspicious Activity Flags: 2 (investigated, cleared)
• Data Access Violations: 0
• Reported Incidents: 0

AUDIT TRAIL SUMMARY
───────────────────
• Total Actions Logged: 45,678
• Review Actions: 1,234
• Crisis Interventions: 89
• User Management: 45
• System Configuration: 12
• Data Exports: 3 (authorized)

RECOMMENDATIONS
───────────────
1. Continue monthly license verification
2. Update crisis protocol documentation
3. Schedule quarterly security review
4. Enhance AI training with recent override data
```

---

## Technical Specifications

### API Endpoints

#### Session Review API

```yaml
# Get flagged sessions
GET /api/v1/sessions/flagged
Parameters:
  - risk_level: high|medium|low
  - status: unassigned|assigned|reviewed
  - assigned_to: therapist_id
  - limit: integer (default: 20)
  - offset: integer (default: 0)
Response:
  - sessions: array
  - total_count: integer
  - pagination: object

# Get session details
GET /api/v1/sessions/{session_id}
Response:
  - session: object
  - transcript: array
  - ai_analysis: object
  - user_context: object
  - review_history: array

# Submit review
POST /api/v1/sessions/{session_id}/review
Body:
  - risk_level: critical|high|medium|low|none
  - override_reason: string (if different from AI)
  - clinical_notes: string (required, min 50 chars)
  - actions_taken: array
  - follow_up_required: boolean
  - follow_up_date: datetime (if required)
Response:
  - review_id: string
  - status: success
  - next_steps: array

# Override AI recommendation
POST /api/v1/sessions/{session_id}/override
Body:
  - original_risk: string
  - new_risk: string
  - override_reason: string (enum)
  - detailed_reason: string
  - supervisor_consulted: boolean
Response:
  - override_id: string
  - requires_supervisor_review: boolean
```

#### Crisis Management API

```yaml
# Get active crisis alerts
GET /api/v1/crisis/alerts
Parameters:
  - status: active|assigned|escalated|resolved
  - priority: critical|high|medium
  - limit: integer
Response:
  - alerts: array
  - summary: object

# Create crisis alert (internal)
POST /api/v1/crisis/alerts
Body:
  - session_id: string
  - user_id: string
  - risk_level: string
  - detection_method: string
  - confidence: number
  - trigger_content: string
Response:
  - alert_id: string
  - notification_sent: boolean

# Assign alert to therapist
POST /api/v1/crisis/alerts/{alert_id}/assign
Body:
  - therapist_id: string
Response:
  - assignment_id: string
  - sla_deadline: datetime

# Escalate alert
POST /api/v1/crisis/alerts/{alert_id}/escalate
Body:
  - escalation_level: integer (1-3)
  - reason: string
  - notify_emergency: boolean
Response:
  - escalation_id: string
  - notified_parties: array

# Resolve alert
POST /api/v1/crisis/alerts/{alert_id}/resolve
Body:
  - resolution_type: string
  - resolution_notes: string
  - follow_up_required: boolean
Response:
  - status: resolved
  - follow_up_scheduled: boolean
```

#### User Management API

```yaml
# Get users
GET /api/v1/admin/users
Parameters:
  - role: string
  - status: active|inactive|pending
  - search: string
  - limit: integer
  - offset: integer
Response:
  - users: array
  - total_count: integer

# Create user
POST /api/v1/admin/users
Body:
  - email: string
  - name: string
  - role: string
  - license_info: object
  - permissions: array
Response:
  - user_id: string
  - invitation_sent: boolean

# Update user
PUT /api/v1/admin/users/{user_id}
Body:
  - name: string (optional)
  - role: string (optional)
  - status: string (optional)
  - permissions: array (optional)
Response:
  - updated: boolean
  - changes: array

# Get user activity
GET /api/v1/admin/users/{user_id}/activity
Parameters:
  - start_date: date
  - end_date: date
  - action_type: string
Response:
  - activities: array
  - summary: object
```

### Database Schema (Key Tables)

```sql
-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    ai_risk_level VARCHAR(20),
    ai_confidence DECIMAL(5,2),
    final_risk_level VARCHAR(20),
    flagged_at TIMESTAMP,
    flag_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Session reviews table
CREATE TABLE session_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id),
    reviewer_id UUID NOT NULL REFERENCES therapists(id),
    assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMP,
    ai_risk_level VARCHAR(20),
    therapist_risk_level VARCHAR(20),
    override_reason VARCHAR(50),
    override_details TEXT,
    clinical_notes TEXT NOT NULL,
    actions_taken JSONB,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Crisis alerts table
CREATE TABLE crisis_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id),
    user_id UUID NOT NULL REFERENCES users(id),
    risk_level VARCHAR(20) NOT NULL,
    detection_method VARCHAR(50) NOT NULL,
    confidence DECIMAL(5,2),
    trigger_content TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    assigned_to UUID REFERENCES therapists(id),
    assigned_at TIMESTAMP,
    escalated_at TIMESTAMP,
    escalated_to UUID REFERENCES therapists(id),
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Audit log table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Therapists table
CREATE TABLE therapists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    license_number VARCHAR(50) NOT NULL,
    license_state VARCHAR(2) NOT NULL,
    license_type VARCHAR(50) NOT NULL,
    license_expires DATE NOT NULL,
    supervisor_id UUID REFERENCES therapists(id),
    is_supervisor BOOLEAN DEFAULT FALSE,
    specialties TEXT[],
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Security & Compliance

### HIPAA Compliance Checklist

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| Access Controls | Role-based authentication, MFA | ✅ |
| Audit Controls | Comprehensive logging, immutable audit trail | ✅ |
| Integrity Controls | Data validation, checksums, versioning | ✅ |
| Transmission Security | TLS 1.3, end-to-end encryption | ✅ |
| Data Encryption at Rest | AES-256 encryption | ✅ |
| Business Associate Agreements | Signed with all vendors | ✅ |
| Security Risk Assessment | Annual third-party audit | ✅ |
| Incident Response Plan | Documented, tested quarterly | ✅ |
| Employee Training | Annual HIPAA training required | ✅ |
| Data Backup & Recovery | Daily backups, tested restoration | ✅ |

### Security Measures

#### Authentication
- Multi-factor authentication (MFA) required for all users
- Session timeout after 15 minutes of inactivity
- Password complexity requirements (12+ chars, mixed case, symbols)
- Account lockout after 5 failed attempts
- Single sign-on (SSO) support for enterprise customers

#### Authorization
- Role-based access control (RBAC)
- Principle of least privilege
- Regular access reviews (quarterly)
- Just-in-time access for sensitive operations

#### Data Protection
- All PHI encrypted at rest and in transit
- Field-level encryption for sensitive data
- Automatic data masking in non-production environments
- Secure key management with HSM

#### Monitoring & Alerting
- Real-time security event monitoring
- Anomaly detection for unusual access patterns
- Automated alerts for suspicious activity
- 24/7 security operations center (SOC)

### Audit Requirements

All actions in the system are logged with:
- Timestamp (UTC)
- User ID
- Action type
- Resource affected
- IP address
- User agent
- Before/after values (for changes)
- Session ID

**Retention**: 7 years (per HIPAA requirements)

---

## Appendix

### A. Glossary

| Term | Definition |
|------|------------|
| PHI | Protected Health Information |
| SLA | Service Level Agreement |
| AI Confidence | Model's certainty in its prediction (0-100%) |
| Crisis Alert | Notification of potential imminent harm |
| Override | Therapist changing AI's recommendation |
| Flagged Session | Session marked for human review |
| Risk Level | Classification: None, Low, Medium, High, Critical |

### B. Emergency Contacts

| Role | Contact | Escalation Time |
|------|---------|-----------------|
| On-Call Therapist | oncall@mindmate.ai | Immediate |
| Crisis Team Lead | crisis@mindmate.ai | 5 minutes |
| Clinical Director | clinical@mindmate.ai | 15 minutes |
| Emergency Services | 911 | As needed |
| National Suicide Prevention | 988 | User referral |

### C. Related Documentation

- MindMate AI - System Architecture
- MindMate AI - API Documentation
- MindMate AI - Security Policy
- MindMate AI - Incident Response Plan
- MindMate AI - Clinical Protocols

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024 | Agent 25 | Initial release |

---

*This document is confidential and proprietary to MindMate AI. Unauthorized distribution is prohibited.*
