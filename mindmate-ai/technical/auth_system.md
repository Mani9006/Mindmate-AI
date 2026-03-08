# MindMate AI - Authentication & Authorization System

## Table of Contents
1. [System Overview](#system-overview)
2. [Authentication Architecture](#authentication-architecture)
3. [Session Management](#session-management)
4. [Device Management](#device-management)
5. [Authorization & RBAC](#authorization--rbac)
6. [Emergency Access System](#emergency-access-system)
7. [Security Implementation](#security-implementation)
8. [API Reference](#api-reference)

---

## System Overview

### Design Principles
- **Zero-Trust Security**: Verify every request, every time
- **Privacy-First**: Minimal data collection, encryption at rest and in transit
- **Crisis-Ready**: Emergency access without compromising security
- **Compliance**: HIPAA, GDPR, SOC2 ready

### Technology Stack
| Component | Technology |
|-----------|------------|
| Authentication | OAuth 2.0 + OpenID Connect |
| Token Format | JWT (RS256) |
| Session Store | Redis Cluster |
| MFA | TOTP (RFC 6238) + WebAuthn |
| Password Hashing | Argon2id |
| Encryption | AES-256-GCM |

---

## Authentication Architecture

### 1. Sign Up Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│  API Gateway │────▶│ Auth Service│────▶│  User DB    │
└─────────────┘     └──────────────┘     └─────────────┘     └─────────────┘
                                                           │
                                                           ▼
                                                    ┌─────────────┐
                                                    │ Email/SMS   │
                                                    │ Verification│
                                                    └─────────────┘
```

#### Registration Endpoint
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "Jane",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-01",
  "phoneNumber": "+1234567890",
  "consent": {
    "termsOfService": true,
    "privacyPolicy": true,
    "dataProcessing": true,
    "crisisIntervention": true
  },
  "emergencyContact": {
    "name": "Emergency Contact",
    "relationship": "family",
    "phone": "+1987654321",
    "email": "emergency@example.com"
  }
}
```

#### Registration Response
```json
{
  "success": true,
  "data": {
    "userId": "usr_abc123xyz",
    "email": "user@example.com",
    "status": "pending_verification",
    "verificationToken": "vrf_xyz789",
    "expiresAt": "2024-01-15T10:30:00Z"
  },
  "message": "Registration successful. Please verify your email."
}
```

#### Password Requirements
```typescript
interface PasswordPolicy {
  minLength: 12;
  maxLength: 128;
  requireUppercase: true;
  requireLowercase: true;
  requireNumbers: true;
  requireSpecialChars: true;
  preventCommonPasswords: true;
  preventUserInfo: true;
  maxAgeDays: 90; // Force password change
  historyCount: 5; // Prevent reuse of last 5 passwords
}
```

#### Email Verification Flow
```typescript
// Verification token: 6-digit code + secure token
interface VerificationConfig {
  codeLength: 6;
  tokenExpiry: 3600; // 1 hour
  maxAttempts: 3;
  cooldownPeriod: 300; // 5 minutes
}

POST /api/v1/auth/verify-email
{
  "email": "user@example.com",
  "code": "123456",
  "token": "vrf_xyz789"
}
```

### 2. Login Flow

#### Standard Login
```http
POST /api/v1/auth/login
Content-Type: application/json
X-Device-ID: device_abc123
X-Device-Fingerprint: fp_sha256_hash

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "rememberMe": false
}
```

#### Login Response States

**Success (No MFA Required)**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIs...",
    "refreshToken": "rft_abc123xyz",
    "expiresIn": 900,
    "tokenType": "Bearer",
    "user": {
      "id": "usr_abc123",
      "email": "user@example.com",
      "role": "user",
      "mfaEnabled": false
    }
  }
}
```

**MFA Required**
```json
{
  "success": true,
  "data": {
    "mfaRequired": true,
    "mfaToken": "mfa_temp_xyz789",
    "mfaMethods": ["totp", "sms", "email"],
    "expiresIn": 300
  }
}
```

**Suspicious Activity Detected**
```json
{
  "success": false,
  "error": {
    "code": "SUSPICIOUS_ACTIVITY",
    "message": "Unusual login detected. Verification required.",
    "requiresVerification": true,
    "verificationMethod": "email"
  }
}
```

### 3. Multi-Factor Authentication (MFA)

#### MFA Configuration
```typescript
interface MFAConfig {
  methods: {
    totp: {
      enabled: boolean;
      issuer: "MindMate AI";
      algorithm: "SHA1";
      digits: 6;
      period: 30;
    };
    sms: {
      enabled: boolean;
      codeLength: 6;
      expiry: 300;
      maxAttempts: 3;
    };
    email: {
      enabled: boolean;
      codeLength: 6;
      expiry: 600;
      maxAttempts: 3;
    };
    webauthn: {
      enabled: boolean;
      authenticatorAttachment: "platform" | "cross-platform";
      userVerification: "required";
    };
    backupCodes: {
      enabled: boolean;
      count: 10;
      singleUse: true;
    };
  };
  enforcement: {
    admin: "required";
    therapist: "required";
    premium: "optional";
    user: "optional";
  };
}
```

#### TOTP Setup Flow
```http
POST /api/v1/auth/mfa/totp/setup
Authorization: Bearer {access_token}

Response:
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP", // Base32 encoded
    "qrCode": "data:image/png;base64,...",
    "manualEntryKey": "JBSW Y3DP EHPK 3PXP",
    "backupCodes": ["12345678", "87654321", ...]
  }
}
```

#### MFA Verification
```http
POST /api/v1/auth/mfa/verify
Content-Type: application/json

{
  "mfaToken": "mfa_temp_xyz789",
  "method": "totp",
  "code": "123456"
}
```

#### WebAuthn Registration
```typescript
// Challenge generation
POST /api/v1/auth/mfa/webauthn/register/start
Response: {
  "challenge": "base64_challenge",
  "rp": {
    "name": "MindMate AI",
    "id": "mindmate.ai"
  },
  "user": {
    "id": "base64_user_id",
    "name": "user@example.com",
    "displayName": "Jane Doe"
  },
  "pubKeyCredParams": [{"alg": -7, "type": "public-key"}],
  "authenticatorSelection": {
    "authenticatorAttachment": "platform",
    "userVerification": "required"
  }
}

// Complete registration
POST /api/v1/auth/mfa/webauthn/register/complete
{
  "id": "credential_id",
  "rawId": "base64_raw_id",
  "type": "public-key",
  "response": {
    "clientDataJSON": "base64_client_data",
    "attestationObject": "base64_attestation"
  }
}
```

### 4. Social Login (OAuth 2.0)

#### Supported Providers
| Provider | Scopes | Use Case |
|----------|--------|----------|
| Google | email, profile | General users |
| Apple | email, name | iOS users, privacy-focused |
| Microsoft | openid, email, profile | Enterprise/Healthcare |

#### OAuth Flow
```
┌─────────┐                                    ┌─────────────┐
│ Client  │──(1) Authorization Request────────▶│   Google    │
└─────────┘                                    └─────────────┘
     │                                                │
     │◀────────(2) Authorization Code + ID Token────│
     │                                                │
     │──(3) Exchange Code + Verify Token────────────▶│ MindMate API
     │                                                │
     │◀────────(4) MindMate Tokens───────────────────│
```

#### Social Login Endpoint
```http
POST /api/v1/auth/social/{provider}
Content-Type: application/json

{
  "code": "google_auth_code",
  "redirectUri": "https://app.mindmate.ai/auth/callback",
  "state": "csrf_protection_state",
  "codeVerifier": "pkce_verifier" // For PKCE
}
```

#### Account Linking
```http
POST /api/v1/auth/social/link
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "provider": "google",
  "code": "google_auth_code"
}
```

---

## Session Management

### 1. JWT Token Architecture

#### Token Types
```typescript
interface TokenArchitecture {
  accessToken: {
    type: "JWT";
    algorithm: "RS256";
    expiry: "15m"; // Short-lived
    contains: ["userId", "role", "permissions", "sessionId"];
  };
  refreshToken: {
    type: "Opaque";
    format: "rft_{uuid}";
    expiry: "7d"; // Rotating
    storage: "Redis";
    family: true; // Token family for rotation
  };
  idToken: {
    type: "JWT";
    contains: ["userId", "email", "profile"];
    expiry: "1h";
  };
}
```

#### Access Token Claims
```json
{
  "sub": "usr_abc123xyz",
  "email": "user@example.com",
  "role": "premium_user",
  "permissions": [
    "chat:read",
    "chat:write",
    "journal:read",
    "journal:write",
    "crisis:access"
  ],
  "sessionId": "sess_xyz789",
  "deviceId": "dev_abc456",
  "iat": 1705312800,
  "exp": 1705313700,
  "iss": "https://auth.mindmate.ai",
  "aud": "https://api.mindmate.ai"
}
```

### 2. Token Rotation

```typescript
interface TokenRotation {
  strategy: "detect-reuse";
  gracePeriod: 30; // seconds
  onReuseDetection: {
    action: "revoke_family";
    notifyUser: true;
    requireReauthentication: true;
  };
}

// Refresh flow
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "rft_old_token",
  "deviceId": "dev_abc456"
}

Response:
{
  "accessToken": "new_jwt_token",
  "refreshToken": "rft_new_token", // Rotated
  "expiresIn": 900
}
```

### 3. Session Lifecycle

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Active  │───▶│  Idle    │───▶│ Expired  │───▶│ Revoked  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
     │               │               │               │
     │               │               │               │
     ▼               ▼               ▼               ▼
  15min TTL      30min idle      7 days max     Manual/Security
```

#### Session States
```typescript
enum SessionStatus {
  ACTIVE = "active",      // Normal operation
  IDLE = "idle",          // No activity, extendable
  EXPIRED = "expired",    // TTL exceeded
  REVOKED = "revoked",    // Manual logout/security
  SUSPENDED = "suspended" // Suspicious activity
}

interface Session {
  id: string;
  userId: string;
  deviceId: string;
  status: SessionStatus;
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
  mfaVerified: boolean;
}
```

### 4. Logout & Session Termination

```http
// Single session logout
POST /api/v1/auth/logout
Authorization: Bearer {access_token}

// Global logout - all devices
POST /api/v1/auth/logout/all
Authorization: Bearer {access_token}

// Revoke specific session (admin/self)
DELETE /api/v1/auth/sessions/{sessionId}
Authorization: Bearer {access_token}
```

---

## Device Management

### 1. Device Registration

```typescript
interface Device {
  id: string;
  userId: string;
  name: string;
  type: "mobile" | "tablet" | "desktop" | "web";
  platform: "ios" | "android" | "windows" | "macos" | "linux" | "web";
  fingerprint: string; // Hashed device fingerprint
  publicKey?: string; // For E2E encryption
  trusted: boolean;
  lastUsedAt: Date;
  registeredAt: Date;
  capabilities: {
    biometrics: boolean;
    webauthn: boolean;
    pushNotifications: boolean;
  };
}
```

#### Device Fingerprinting
```typescript
interface DeviceFingerprint {
  components: {
    userAgent: string;
    screenResolution: string;
    timezone: string;
    languages: string[];
    canvas: string; // Canvas fingerprint hash
    webgl: string;  // WebGL fingerprint hash
    fonts: string[];
    plugins: string[];
  };
  hash: string; // SHA-256 of combined components
}
```

### 2. Device Trust Levels

| Level | Description | Actions Required |
|-------|-------------|------------------|
| `untrusted` | New/unknown device | Email verification + MFA |
| `basic` | Verified once | MFA for sensitive actions |
| `trusted` | 30+ days old, regular use | Standard MFA rules |
| `highly_trusted` | 90+ days, biometrics enabled | Reduced friction |

### 3. Device Management API

```http
// List devices
GET /api/v1/devices
Authorization: Bearer {access_token}

Response:
{
  "devices": [
    {
      "id": "dev_abc123",
      "name": "iPhone 15 Pro",
      "type": "mobile",
      "platform": "ios",
      "trusted": true,
      "current": true,
      "lastUsedAt": "2024-01-15T10:30:00Z",
      "location": "San Francisco, CA"
    }
  ]
}

// Trust device
POST /api/v1/devices/{deviceId}/trust
Authorization: Bearer {access_token}

// Revoke device
DELETE /api/v1/devices/{deviceId}
Authorization: Bearer {access_token}
```

### 4. New Device Detection

```typescript
interface NewDeviceAlert {
  trigger: {
    unknownFingerprint: true;
    newLocation: boolean;
    unusualTime: boolean;
  };
  response: {
    requireEmailVerification: true;
    requireMFA: true;
    notifyUser: {
      email: true;
      push: true;
    };
    allowRememberDevice: true;
  };
}
```

---

## Authorization & RBAC

### 1. Role Hierarchy

```
                    ┌─────────────┐
                    │    Admin    │
                    │  (System)   │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │   Admin     │ │  Therapist  │ │   User      │
    │  (Platform) │ │ Supervisor  │ │  (Default)  │
    └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
           │               │               │
           │               │               ▼
           │               │        ┌─────────────┐
           │               │        │   Premium   │
           │               │        │    User     │
           │               │        └─────────────┘
           │               │
           ▼               ▼
    ┌─────────────┐ ┌─────────────┐
    │  Support    │ │  Therapist  │
    │   Agent     │ │             │
    └─────────────┘ └─────────────┘
```

### 2. Role Definitions

```typescript
interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  inherits?: string[];
  constraints?: RoleConstraints;
}

const ROLES: Record<string, Role> = {
  user: {
    id: "role_user",
    name: "user",
    description: "Standard user with basic access",
    permissions: [
      "chat:read", "chat:write",
      "journal:read", "journal:write",
      "mood:read", "mood:write",
      "profile:read", "profile:write",
      "crisis:access"
    ]
  },
  
  premium_user: {
    id: "role_premium",
    name: "premium_user",
    description: "Premium subscriber with enhanced features",
    inherits: ["user"],
    permissions: [
      "therapy:schedule",
      "therapy:video",
      "analytics:read",
      "export:data",
      "priority:support"
    ]
  },
  
  therapist: {
    id: "role_therapist",
    name: "therapist",
    description: "Licensed mental health professional",
    permissions: [
      "patients:read", "patients:write",
      "sessions:read", "sessions:write",
      "notes:read", "notes:write",
      "crisis:respond",
      "prescriptions:read"
    ],
    constraints: {
      requireLicense: true,
      licenseVerification: "required",
      maxPatients: 50
    }
  },
  
  therapist_supervisor: {
    id: "role_supervisor",
    name: "therapist_supervisor",
    description: "Senior therapist with oversight responsibilities",
    inherits: ["therapist"],
    permissions: [
      "therapists:read", "therapists:write",
      "cases:supervise",
      "quality:review",
      "crisis:escalate",
      "reports:generate"
    ]
  },
  
  admin: {
    id: "role_admin",
    name: "admin",
    description: "Platform administrator",
    permissions: [
      "users:read", "users:write", "users:delete",
      "roles:manage",
      "system:configure",
      "analytics:full",
      "audit:read",
      "billing:manage",
      "content:moderate"
    ],
    constraints: {
      requireMFA: true,
      ipWhitelist: true,
      sessionTimeout: 3600
    }
  },
  
  support_agent: {
    id: "role_support",
    name: "support_agent",
    description: "Customer support representative",
    permissions: [
      "users:read",
      "tickets:read", "tickets:write",
      "chat:support",
      "billing:read"
    ],
    constraints: {
      noPIIAccess: true,
      sessionRecording: true
    }
  }
};
```

### 3. Permission System

```typescript
// Permission format: resource:action[:scope]
type Permission = 
  // Chat permissions
  | "chat:read" | "chat:write" | "chat:delete"
  | "chat:read:own" | "chat:read:assigned"
  
  // Journal permissions
  | "journal:read" | "journal:write" | "journal:delete"
  | "journal:read:own" | "journal:read:patient"
  
  // Crisis permissions
  | "crisis:access" | "crisis:respond" | "crisis:escalate"
  | "crisis:override"
  
  // User management
  | "users:read" | "users:write" | "users:delete"
  | "users:read:own" | "users:read:patient"
  
  // Emergency access
  | "emergency:alert" | "emergency:access" | "emergency:override";

// Permission check
interface PermissionCheck {
  user: User;
  permission: Permission;
  resource?: string;
  context?: {
    patientId?: string;
    crisisLevel?: number;
  };
}
```

### 4. Access Control Middleware

```typescript
// Express middleware example
const requirePermission = (permission: Permission) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    const resource = req.params.id;
    
    const hasPermission = await authService.checkPermission({
      user,
      permission,
      resource,
      context: req.context
    });
    
    if (!hasPermission) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Insufficient permissions"
      });
    }
    
    next();
  };
};

// Usage
app.get('/api/journal/:id', 
  authenticate,
  requirePermission('journal:read'),
  journalController.getEntry
);
```

### 5. Attribute-Based Access Control (ABAC)

```typescript
interface ABACPolicy {
  subject: {
    role: string;
    mfaVerified: boolean;
    trustLevel: string;
    licenseStatus?: string;
  };
  resource: {
    type: string;
    ownerId: string;
    sensitivity: "low" | "medium" | "high" | "critical";
    crisisRelated: boolean;
  };
  action: string;
  environment: {
    timeOfDay: string;
    ipReputation: string;
    deviceTrusted: boolean;
  };
}

// Example policy
const crisisAccessPolicy: ABACPolicy = {
  rules: [
    {
      if: {
        "resource.crisisRelated": true,
        "subject.role": ["therapist", "therapist_supervisor"],
        "resource.sensitivity": "critical"
      },
      then: {
        allow: true,
        require: ["mfaVerified", "licenseActive"],
        audit: true
      }
    }
  ]
};
```

---

## Emergency Access System

### 1. Overview

The Emergency Access System allows designated emergency contacts to receive crisis alerts and limited access to user information during mental health emergencies.

### 2. Emergency Contact Configuration

```typescript
interface EmergencyContact {
  id: string;
  userId: string;
  name: string;
  relationship: 
    | "spouse" | "partner" | "parent" | "sibling" 
    | "child" | "friend" | "therapist" | "other";
  priority: 1 | 2 | 3; // 1 = primary
  contactMethods: {
    phone: {
      number: string;
      verified: boolean;
      canReceiveSMS: boolean;
    };
    email: {
      address: string;
      verified: boolean;
    };
  };
  accessLevel: "alert_only" | "limited_info" | "full_access";
  accessPermissions: {
    canViewLocation: boolean;
    canViewRecentActivity: boolean;
    canContactTherapist: boolean;
    canAccessJournal: boolean;
    canTriggerWellnessCheck: boolean;
  };
  availability: {
    timezone: string;
    preferredHours: string;
    alwaysAvailable: boolean;
  };
  verificationStatus: "pending" | "verified" | "declined";
  verifiedAt?: Date;
}
```

### 3. Crisis Detection & Alert Flow

```
┌─────────────────┐
│  Crisis Detected│
│  (AI/ML Model)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Risk Assessment│────▶│  Immediate Help │
│  (Severity 1-5) │     │  Resources      │
└────────┬────────┘     └─────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│Level 4│ │Level 5│
│High   │ │Critical
└───┬───┘ └───┬───┘
    │         │
    ▼         ▼
┌─────────────────┐
│ Emergency Alert │
│   Triggered     │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────────┐
│User   │ │Emergency  │
│Notified│ │Contacts   │
└───────┘ └─────┬─────┘
                │
        ┌───────┼───────┐
        ▼       ▼       ▼
   ┌────────┐┌────────┐┌────────┐
   │ Primary││Secondary││Tertiary│
   │Contact ││Contact ││Contact │
   └───┬────┘└────┬───┘└───┬────┘
       │          │        │
       ▼          ▼        ▼
   ┌─────────────────────────────┐
   │   Crisis Dashboard Access   │
   └─────────────────────────────┘
```

### 4. Crisis Levels

| Level | Description | Response | Emergency Contact Alert |
|-------|-------------|----------|------------------------|
| 1 | Mild distress | In-app resources | No |
| 2 | Moderate concern | Coping suggestions | No |
| 3 | Significant concern | Therapist notification | Optional |
| 4 | High risk | Immediate alerts + contacts | Yes - Primary |
| 5 | Critical/Emergency | All contacts + authorities | Yes - All |

### 5. Emergency Alert API

```http
// Trigger emergency alert (internal)
POST /api/v1/internal/crisis/alert
X-Internal-Key: {service_key}
Content-Type: application/json

{
  "userId": "usr_abc123",
  "crisisLevel": 4,
  "trigger": {
    "type": "ai_detection",
    "confidence": 0.92,
    "keywords": ["suicide", "end it all"],
    "context": "User expressed suicidal ideation"
  },
  "location": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "accuracy": 10
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Alert Notification Format
```json
{
  "alertId": "alt_emergency_123",
  "type": "CRISIS_ALERT",
  "severity": "HIGH",
  "user": {
    "id": "usr_abc123",
    "name": "Jane Doe",
    "age": 28,
    "location": "San Francisco, CA"
  },
  "situation": {
    "summary": "User expressed suicidal ideation",
    "trigger": "AI detection - 92% confidence",
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "actions": {
    "canViewLocation": true,
    "canViewRecentActivity": true,
    "canContactTherapist": true,
    "canTriggerWellnessCheck": true
  },
  "dashboardUrl": "https://emergency.mindmate.ai/alert/alt_emergency_123",
  "expiresAt": "2024-01-15T11:30:00Z"
}
```

### 6. Emergency Contact Dashboard

```http
// Emergency contact authentication
POST /api/v1/emergency/auth
Content-Type: application/json

{
  "alertToken": "emt_alert_token_xyz", // From SMS/Email
  "contactId": "emc_abc123",
  "verificationCode": "123456"
}

Response:
{
  "accessToken": "eyJhbGciOiJSUzI1NiIs...",
  "expiresIn": 3600,
  "permissions": ["location:view", "activity:view", "therapist:contact"]
}
```

#### Dashboard Endpoints
```http
// Get crisis details (emergency contact)
GET /api/v1/emergency/alerts/{alertId}
Authorization: Bearer {emergency_access_token}

Response:
{
  "alert": {
    "id": "alt_emergency_123",
    "status": "active",
    "user": {
      "name": "Jane Doe",
      "age": 28,
      "location": {
        "current": "San Francisco, CA",
        "lastUpdated": "2024-01-15T10:25:00Z"
      }
    },
    "situation": {
      "summary": "Expressed suicidal ideation",
      "context": "User mentioned feeling hopeless"
    },
    "recentActivity": [
      {
        "type": "chat",
        "timestamp": "2024-01-15T10:28:00Z",
        "summary": "Discussed feelings of hopelessness"
      }
    ],
    "therapist": {
      "name": "Dr. Smith",
      "contact": "+1-555-0123"
    }
  }
}

// Trigger wellness check
POST /api/v1/emergency/wellness-check
Authorization: Bearer {emergency_access_token}
{
  "alertId": "alt_emergency_123",
  "requestType": "welfare_check",
  "notes": "Please check on Jane at her home address"
}

// Contact user's therapist
POST /api/v1/emergency/contact-therapist
Authorization: Bearer {emergency_access_token}
{
  "alertId": "alt_emergency_123",
  "message": "I'm Jane's emergency contact. She's in crisis."
}
```

### 7. Emergency Access Audit

```typescript
interface EmergencyAccessAudit {
  id: string;
  alertId: string;
  contactId: string;
  action: string;
  resource: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  success: boolean;
}

// All emergency access is logged
// Logs retained for 7 years per HIPAA
// User can view who accessed their data and when
```

### 8. Emergency Access Revocation

```typescript
// User can revoke emergency contact access
POST /api/v1/emergency/contacts/{contactId}/revoke
Authorization: Bearer {access_token}

// Immediate effect
// All active alerts to this contact are cancelled
// Contact loses dashboard access immediately
```

---

## Security Implementation

### 1. Password Security

```typescript
// Argon2id configuration
const argon2Config = {
  type: argon2id,
  memoryCost: 65536,    // 64 MB
  timeCost: 3,          // 3 iterations
  parallelism: 4,       // 4 parallel threads
  hashLength: 32,       // 256-bit output
  saltLength: 16        // 128-bit salt
};

// Password hash format: $argon2id$v=19$m=65536,t=3,p=4$...
```

### 2. Rate Limiting

```typescript
interface RateLimitConfig {
  endpoints: {
    login: {
      window: 900,      // 15 minutes
      max: 5,           // 5 attempts
      blockDuration: 3600 // 1 hour block
    };
    register: {
      window: 3600,     // 1 hour
      max: 3,           // 3 accounts per IP
    };
    mfa: {
      window: 300,      // 5 minutes
      max: 3,           // 3 attempts
    };
    passwordReset: {
      window: 86400,    // 24 hours
      max: 3,           // 3 requests
    };
  };
}
```

### 3. Security Headers

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(self), microphone=(self), camera=(self)
```

### 4. Encryption Standards

| Data Type | At Rest | In Transit |
|-----------|---------|------------|
| Passwords | Argon2id | N/A |
| PII | AES-256-GCM | TLS 1.3 |
| Chat Messages | AES-256-GCM | TLS 1.3 |
| Journal Entries | AES-256-GCM | TLS 1.3 |
| Session Tokens | Redis encrypted | TLS 1.3 |
| Backup Codes | bcrypt | N/A |

### 5. Audit Logging

```typescript
interface AuditEvent {
  id: string;
  timestamp: Date;
  eventType: 
    | "login" | "logout" | "mfa_verification"
    | "password_change" | "email_change" | "phone_change"
    | "device_add" | "device_remove" | "device_trust"
    | "emergency_access" | "crisis_alert" | "data_export"
    | "permission_change" | "role_change";
  userId: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  deviceId: string;
  success: boolean;
  details: Record<string, unknown>;
  riskScore: number;
}
```

---

## API Reference

### Authentication Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/v1/auth/register` | POST | User registration | No |
| `/api/v1/auth/verify-email` | POST | Email verification | No |
| `/api/v1/auth/login` | POST | User login | No |
| `/api/v1/auth/logout` | POST | Logout current session | Yes |
| `/api/v1/auth/logout/all` | POST | Logout all sessions | Yes |
| `/api/v1/auth/refresh` | POST | Refresh access token | No |
| `/api/v1/auth/password-reset` | POST | Request password reset | No |
| `/api/v1/auth/password-reset/confirm` | POST | Confirm password reset | No |
| `/api/v1/auth/change-password` | POST | Change password | Yes |

### MFA Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/v1/auth/mfa/setup` | POST | Setup MFA method | Yes |
| `/api/v1/auth/mfa/verify` | POST | Verify MFA code | No (temp token) |
| `/api/v1/auth/mfa/disable` | POST | Disable MFA | Yes + MFA |
| `/api/v1/auth/mfa/backup-codes` | GET | Generate backup codes | Yes + MFA |
| `/api/v1/auth/mfa/webauthn/register/start` | POST | Start WebAuthn registration | Yes |
| `/api/v1/auth/mfa/webauthn/register/complete` | POST | Complete WebAuthn registration | Yes |

### Social Login Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/v1/auth/social/google` | POST | Google OAuth login | No |
| `/api/v1/auth/social/apple` | POST | Apple OAuth login | No |
| `/api/v1/auth/social/microsoft` | POST | Microsoft OAuth login | No |
| `/api/v1/auth/social/link` | POST | Link social account | Yes |
| `/api/v1/auth/social/unlink` | POST | Unlink social account | Yes |

### Device Management Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/v1/devices` | GET | List devices | Yes |
| `/api/v1/devices/{id}` | GET | Get device details | Yes |
| `/api/v1/devices/{id}/trust` | POST | Trust device | Yes + MFA |
| `/api/v1/devices/{id}` | DELETE | Revoke device | Yes |

### Session Management Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/v1/sessions` | GET | List active sessions | Yes |
| `/api/v1/sessions/{id}` | DELETE | Revoke session | Yes |

### Emergency Access Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/v1/emergency/contacts` | GET | List emergency contacts | Yes |
| `/api/v1/emergency/contacts` | POST | Add emergency contact | Yes |
| `/api/v1/emergency/contacts/{id}` | PUT | Update emergency contact | Yes |
| `/api/v1/emergency/contacts/{id}` | DELETE | Remove emergency contact | Yes |
| `/api/v1/emergency/contacts/{id}/verify` | POST | Verify contact | No (token) |
| `/api/v1/emergency/auth` | POST | Emergency contact login | No (alert token) |
| `/api/v1/emergency/alerts/{id}` | GET | Get alert details | Emergency Token |
| `/api/v1/emergency/wellness-check` | POST | Request wellness check | Emergency Token |

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    date_of_birth DATE,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_methods JSONB DEFAULT '[]',
    role_id UUID REFERENCES roles(id),
    status VARCHAR(20) DEFAULT 'active',
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    last_login_at TIMESTAMP,
    password_changed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Sessions Table
```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id),
    refresh_token_hash VARCHAR(255) NOT NULL,
    token_family UUID NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    ip_address INET,
    user_agent TEXT,
    mfa_verified BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    last_activity_at TIMESTAMP DEFAULT NOW()
);
```

### Devices Table
```sql
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100),
    type VARCHAR(20) NOT NULL,
    platform VARCHAR(20) NOT NULL,
    fingerprint_hash VARCHAR(64) NOT NULL,
    public_key TEXT,
    trusted BOOLEAN DEFAULT FALSE,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Emergency Contacts Table
```sql
CREATE TABLE emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    priority INTEGER DEFAULT 2,
    phone_number VARCHAR(20),
    phone_verified BOOLEAN DEFAULT FALSE,
    email VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    access_level VARCHAR(20) DEFAULT 'alert_only',
    access_permissions JSONB DEFAULT '{}',
    verification_status VARCHAR(20) DEFAULT 'pending',
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Crisis Alerts Table
```sql
CREATE TABLE crisis_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    crisis_level INTEGER NOT NULL,
    trigger_type VARCHAR(50) NOT NULL,
    trigger_confidence DECIMAL(3,2),
    context TEXT,
    location JSONB,
    status VARCHAR(20) DEFAULT 'active',
    notified_contacts JSONB DEFAULT '[]',
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_CREDENTIALS` | 401 | Email or password incorrect |
| `ACCOUNT_LOCKED` | 403 | Account temporarily locked |
| `EMAIL_NOT_VERIFIED` | 403 | Email verification required |
| `MFA_REQUIRED` | 401 | Multi-factor authentication required |
| `MFA_INVALID` | 401 | Invalid MFA code |
| `SESSION_EXPIRED` | 401 | Session has expired |
| `TOKEN_REVOKED` | 401 | Token has been revoked |
| `DEVICE_NOT_TRUSTED` | 403 | Device verification required |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INSUFFICIENT_PERMISSIONS` | 403 | User lacks required permissions |
| `EMERGENCY_ACCESS_EXPIRED` | 401 | Emergency access token expired |
| `CRISIS_ALERT_NOT_FOUND` | 404 | Crisis alert not found |

---

## Environment Variables

```bash
# JWT Configuration
JWT_PRIVATE_KEY_PATH=/secrets/jwt-private.pem
JWT_PUBLIC_KEY_PATH=/secrets/jwt-public.pem
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d
JWT_ISSUER=https://auth.mindmate.ai
JWT_AUDIENCE=https://api.mindmate.ai

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/mindmate
REDIS_URL=redis://localhost:6379/0

# OAuth Providers
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
APPLE_CLIENT_ID=xxx
APPLE_PRIVATE_KEY=xxx
MICROSOFT_CLIENT_ID=xxx
MICROSOFT_CLIENT_SECRET=xxx

# Security
ARGON2_MEMORY_COST=65536
ARGON2_TIME_COST=3
ARGON2_PARALLELISM=4
BCRYPT_ROUNDS=12
RATE_LIMIT_ENABLED=true

# MFA
TOTP_ISSUER=MindMate AI
TOTP_DIGITS=6
TOTP_PERIOD=30

# Emergency
EMERGENCY_TOKEN_EXPIRY=1h
CRISIS_ALERT_COOLDOWN=5m
```

---

## Compliance Notes

### HIPAA Compliance
- All PHI encrypted at rest and in transit
- Access logging with 6-year retention
- Role-based access controls
- Emergency access audit trails
- Business Associate Agreements with all third parties

### GDPR Compliance
- Right to access: `/api/v1/user/data-export`
- Right to erasure: `/api/v1/user/delete`
- Consent management for all data processing
- Data minimization in authentication
- Privacy by design in all auth flows

---

*Document Version: 1.0*
*Last Updated: January 2024*
*Owner: Security & Platform Team*
