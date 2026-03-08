# MindMate AI - Security Architecture Specification

**Version:** 1.0.0  
**Classification:** CONFIDENTIAL - INTERNAL USE ONLY  
**Last Updated:** 2024  
**Owner:** Security & Privacy Architecture Team  
**Review Cycle:** Quarterly

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Security Architecture Overview](#2-security-architecture-overview)
3. [End-to-End Encryption](#3-end-to-end-encryption)
4. [At-Rest Encryption](#4-at-rest-encryption)
5. [Zero-Knowledge Architecture](#5-zero-knowledge-architecture)
6. [HIPAA Compliance](#6-hipaa-compliance)
7. [GDPR Compliance](#7-gdpr-compliance)
8. [Penetration Testing](#8-penetration-testing)
9. [Data Retention Policies](#9-data-retention-policies)
10. [Audit Logging](#10-audit-logging)
11. [Incident Response](#11-incident-response)
12. [Appendices](#12-appendices)

---

## 1. Executive Summary

MindMate AI is a mental health support platform that processes highly sensitive personal health information (PHI) and personally identifiable information (PII). This document establishes the comprehensive security architecture designed to protect user data while maintaining compliance with HIPAA, GDPR, and industry best practices.

### 1.1 Security Principles

| Principle | Description |
|-----------|-------------|
| **Defense in Depth** | Multiple layers of security controls |
| **Zero Trust** | Never trust, always verify |
| **Privacy by Design** | Privacy considerations built into every feature |
| **Least Privilege** | Minimum necessary access for all operations |
| **Encryption Everywhere** | Data encrypted in transit and at rest |

### 1.2 Compliance Scope

- **HIPAA**: Health Insurance Portability and Accountability Act
- **GDPR**: General Data Protection Regulation (EU)
- **CCPA**: California Consumer Privacy Act
- **SOC 2 Type II**: Service Organization Control
- **ISO 27001**: Information Security Management

---

## 2. Security Architecture Overview

### 2.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Web App    │  │ Mobile App  │  │  API Clients│  │ Partner Integrations│ │
│  │  (React)    │  │(React Native)│  │             │  │                     │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│         │                │                │                    │            │
│         └────────────────┴────────────────┴────────────────────┘            │
│                                    │                                        │
│                         TLS 1.3 + mTLS                                      │
└────────────────────────────────────┼────────────────────────────────────────┘
                                     │
┌────────────────────────────────────┼────────────────────────────────────────┐
│                         EDGE LAYER │                                       │
│  ┌─────────────────────────────────┴─────────────────────────────────────┐  │
│  │                    Cloudflare/AWS CloudFront                           │  │
│  │  - DDoS Protection  - WAF  - Rate Limiting  - Bot Management         │  │
│  └─────────────────────────────────┬─────────────────────────────────────┘  │
└────────────────────────────────────┼────────────────────────────────────────┘
                                     │
┌────────────────────────────────────┼────────────────────────────────────────┐
│                      GATEWAY LAYER │                                       │
│  ┌─────────────────────────────────┴─────────────────────────────────────┐  │
│  │                         API Gateway (Kong/AWS API GW)                  │  │
│  │  - Authentication  - Authorization  - Rate Limiting  - Logging        │  │
│  └─────────────────────────────────┬─────────────────────────────────────┘  │
└────────────────────────────────────┼────────────────────────────────────────┘
                                     │
┌────────────────────────────────────┼────────────────────────────────────────┐
│                    SERVICE LAYER   │                                       │
│  ┌─────────────┐  ┌─────────────┐  │  ┌─────────────┐  ┌─────────────────┐ │
│  │   Auth      │  │   Session   │  │  │   User      │  │   Analytics     │ │
│  │  Service    │  │  Service    │  │  │  Service    │  │   Service       │ │
│  └──────┬──────┘  └──────┬──────┘  │  └──────┬──────┘  └─────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  │  ┌─────────────┐                      │
│  │   AI/ML     │  │  Therapy    │  │  │  Billing    │                      │
│  │  Service    │  │  Service    │  │  │  Service    │                      │
│  └─────────────┘  └─────────────┘  │  └─────────────┘                      │
└────────────────────────────────────┼────────────────────────────────────────┘
                                     │
┌────────────────────────────────────┼────────────────────────────────────────┐
│                      DATA LAYER    │                                       │
│  ┌─────────────┐  ┌─────────────┐  │  ┌─────────────┐  ┌─────────────────┐ │
│  │ PostgreSQL  │  │    Redis    │  │  │   S3/MinIO  │  │ Elasticsearch   │ │
│  │ (Encrypted) │  │  (Encrypted)│  │  │  (Encrypted)│  │  (Encrypted)    │ │
│  └─────────────┘  └─────────────┘  │  └─────────────┘  └─────────────────┘ │
│  ┌─────────────────────────────────┴─────────────────────────────────────┐  │
│  │                    HashiCorp Vault (Key Management)                    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Security Zones

| Zone | Trust Level | Description |
|------|-------------|-------------|
| **Public** | Untrusted | Internet-facing, all traffic assumed malicious |
| **DMZ** | Low Trust | Edge services, WAF, DDoS protection |
| **Application** | Medium Trust | Microservices, business logic |
| **Data** | High Trust | Databases, caches, storage |
| **Vault** | Maximum Trust | Key management, secrets, HSM |

---

## 3. End-to-End Encryption

### 3.1 Encryption in Transit

#### 3.1.1 TLS Configuration

```yaml
# TLS 1.3 Configuration
tls:
  minimum_version: "1.3"
  allowed_ciphers:
    - TLS_AES_256_GCM_SHA384
    - TLS_CHACHA20_POLY1305_SHA256
    - TLS_AES_128_GCM_SHA256
  
  # Certificate Configuration
  certificates:
    provider: "Let's Encrypt / AWS ACM"
    auto_renewal: true
    renewal_days_before_expiry: 30
    key_type: "ECDSA P-384"
    
  # HSTS Configuration
  hsts:
    enabled: true
    max_age: 31536000  # 1 year
    include_subdomains: true
    preload: true
```

#### 3.1.2 Certificate Pinning (Mobile)

```typescript
// React Native Certificate Pinning
const pinningConfig = {
  'api.mindmate.ai': {
    includeSubdomains: true,
    pins: [
      'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=', // Primary
      'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=', // Backup
    ],
    expirationDate: '2025-12-31'
  }
};
```

#### 3.1.3 mTLS for Service-to-Service

```yaml
# Mutual TLS Configuration
mtls:
  enabled: true
  mode: strict  # Require client certificates
  
  certificate_authority:
    type: internal
    rotation_period: 90_days
    
  client_certificates:
    validity: 30_days
    auto_renewal: true
    key_size: 4096
    
  verification:
    verify_certificate_chain: true
    verify_hostname: true
    crl_check: true
    ocsp_check: true
```

### 3.2 Session Data Encryption

#### 3.2.1 Session Encryption Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SESSION ENCRYPTION FLOW                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Client                    Server                    Database    │
│    │                         │                          │        │
│    │  1. Generate Session Key │                          │        │
│    │◄─────────────────────────│                          │        │
│    │                         │                          │        │
│    │  2. Encrypt with Server  │                          │        │
│    │     Public Key           │                          │        │
│    │─────────────────────────►│                          │        │
│    │                         │                          │        │
│    │  3. Server decrypts,     │                          │        │
│    │     encrypts with DEK    │                          │        │
│    │                         │                          │        │
│    │                         │  4. Store encrypted      │        │
│    │                         │     session data         │        │
│    │                         │─────────────────────────►│        │
│    │                         │                          │        │
│    │  5. All session messages │                          │        │
│    │     encrypted with       │                          │        │
│    │     session key          │                          │        │
│    │◄────────────────────────►│                          │        │
│    │                         │                          │        │
└─────────────────────────────────────────────────────────────────┘
```

#### 3.2.2 Session Key Management

```python
# Session Encryption Implementation
import secrets
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2

class SessionEncryption:
    """
    End-to-end encryption for session data.
    Each session gets a unique encryption key.
    """
    
    def __init__(self, vault_client):
        self.vault = vault_client
        self.key_size = 32  # 256 bits
        
    def create_session(self, user_id: str, session_type: str) -> dict:
        """
        Create a new encrypted session.
        Returns session metadata including encrypted key reference.
        """
        # Generate unique session key
        session_key = secrets.token_bytes(self.key_size)
        
        # Generate session ID
        session_id = secrets.token_urlsafe(32)
        
        # Encrypt session key with DEK (Data Encryption Key)
        encrypted_key = self._encrypt_with_dek(session_key)
        
        # Store key in Vault with strict access controls
        key_path = f"session-keys/{user_id}/{session_id}"
        self.vault.store_key(
            path=key_path,
            key=encrypted_key,
            metadata={
                'user_id': user_id,
                'session_type': session_type,
                'created_at': datetime.utcnow().isoformat(),
                'expires_at': (datetime.utcnow() + timedelta(hours=1)).isoformat()
            },
            ttl=3600  # 1 hour
        )
        
        return {
            'session_id': session_id,
            'key_reference': key_path,
            'expires_at': (datetime.utcnow() + timedelta(hours=1)).isoformat()
        }
    
    def encrypt_message(self, session_id: str, plaintext: str) -> bytes:
        """Encrypt a session message."""
        # Retrieve and decrypt session key
        session_key = self._get_session_key(session_id)
        
        # Encrypt with AES-256-GCM
        f = Fernet(base64.urlsafe_b64encode(session_key))
        return f.encrypt(plaintext.encode())
    
    def decrypt_message(self, session_id: str, ciphertext: bytes) -> str:
        """Decrypt a session message."""
        session_key = self._get_session_key(session_id)
        
        f = Fernet(base64.urlsafe_b64encode(session_key))
        return f.decrypt(ciphertext).decode()
```

### 3.3 WebSocket Encryption

```javascript
// WebSocket E2E Encryption (Client-Side)
class SecureWebSocket {
  constructor(url, sessionKey) {
    this.ws = new WebSocket(url);
    this.sessionKey = sessionKey;
    this.messageCounter = 0;
  }
  
  async encryptMessage(plaintext) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    
    // Generate nonce for this message
    const nonce = crypto.getRandomValues(new Uint8Array(12));
    
    // Import session key
    const key = await crypto.subtle.importKey(
      'raw',
      this.sessionKey,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    
    // Encrypt
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce },
      key,
      data
    );
    
    // Combine nonce + ciphertext
    const combined = new Uint8Array(nonce.length + ciphertext.byteLength);
    combined.set(nonce);
    combined.set(new Uint8Array(ciphertext), nonce.length);
    
    return combined;
  }
  
  async decryptMessage(encryptedData) {
    const data = new Uint8Array(encryptedData);
    const nonce = data.slice(0, 12);
    const ciphertext = data.slice(12);
    
    const key = await crypto.subtle.importKey(
      'raw',
      this.sessionKey,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: nonce },
      key,
      ciphertext
    );
    
    return new TextDecoder().decode(decrypted);
  }
}
```

---

## 4. At-Rest Encryption

### 4.1 Database Encryption

#### 4.1.1 PostgreSQL Transparent Data Encryption (TDE)

```yaml
# PostgreSQL Encryption Configuration
postgresql:
  version: "15"
  
  encryption:
    # Enable TDE
    transparent_data_encryption:
      enabled: true
      provider: pgcrypto
      
    # Column-level encryption for PHI
    column_encryption:
      enabled: true
      algorithm: AES-256-GCM
      
    # Encrypted columns
    encrypted_columns:
      - table: users
        columns:
          - email
          - phone_number
          - date_of_birth
          
      - table: therapy_sessions
        columns:
          - session_transcript
          - notes
          - assessment_data
          
      - table: medical_history
        columns:
          - diagnosis
          - medications
          - treatment_notes
          
      - table: chat_messages
        columns:
          - message_content
          - metadata
    
    # Key management
    key_management:
      provider: hashicorp_vault
      key_rotation_period: 90_days
      auto_rotation: true
```

#### 4.1.2 Encryption Implementation

```sql
-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create encryption function with key derivation
CREATE OR REPLACE FUNCTION encrypt_phi(
    plaintext TEXT,
    user_id UUID
) RETURNS BYTEA AS $$
DECLARE
    dek BYTEA;
    encrypted BYTEA;
BEGIN
    -- Retrieve DEK from Vault (via FDW or API call)
    dek := vault.get_key('dek/' || user_id::TEXT);
    
    -- Encrypt with AES-256-GCM
    encrypted := pgp_sym_encrypt(
        plaintext,
        encode(dek, 'base64'),
        'cipher-algo=aes256, compress-algo=0'
    );
    
    RETURN encrypted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create decryption function
CREATE OR REPLACE FUNCTION decrypt_phi(
    ciphertext BYTEA,
    user_id UUID
) RETURNS TEXT AS $$
DECLARE
    dek BYTEA;
    decrypted TEXT;
BEGIN
    -- Retrieve DEK from Vault
    dek := vault.get_key('dek/' || user_id::TEXT);
    
    -- Decrypt
    decrypted := pgp_sym_decrypt(
        ciphertext,
        encode(dek, 'base64')
    );
    
    RETURN decrypted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example: Create table with encrypted columns
CREATE TABLE therapy_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    therapist_id UUID NOT NULL REFERENCES therapists(id),
    session_date TIMESTAMP NOT NULL,
    -- Encrypted columns
    session_transcript_encrypted BYTEA,
    notes_encrypted BYTEA,
    assessment_data_encrypted BYTEA,
    -- Non-sensitive metadata (unencrypted)
    duration_minutes INTEGER,
    session_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create view for authorized access
CREATE VIEW therapy_sessions_secure AS
SELECT
    id,
    user_id,
    therapist_id,
    session_date,
    decrypt_phi(session_transcript_encrypted, user_id) as session_transcript,
    decrypt_phi(notes_encrypted, user_id) as notes,
    decrypt_phi(assessment_data_encrypted, user_id) as assessment_data,
    duration_minutes,
    session_type,
    created_at,
    updated_at
FROM therapy_sessions;

-- Grant access only to specific roles
GRANT SELECT ON therapy_sessions_secure TO therapist_role;
GRANT SELECT (id, user_id, session_date, duration_minutes, session_type) 
    ON therapy_sessions TO analytics_role;
```

### 4.2 Redis Encryption

```yaml
# Redis Encryption Configuration
redis:
  version: "7.0"
  
  encryption:
    # Enable encryption at rest
    at_rest_encryption:
      enabled: true
      provider: aws_elasticache  # or redis-enterprise
      
    # Enable encryption in transit
    in_transit_encryption:
      enabled: true
      tls_version: "1.3"
      
    # Key rotation
    key_rotation:
      enabled: true
      period: 90_days
      
  # Encrypted data structures
  data_types:
    sessions:
      encryption: required
      ttl: 3600  # 1 hour
      
    cache:
      encryption: optional  # Non-sensitive data
      ttl: 300  # 5 minutes
```

### 4.3 Object Storage Encryption (S3/MinIO)

```yaml
# S3/MinIO Encryption Configuration
object_storage:
  provider: aws_s3  # or minio
  
  encryption:
    # Server-side encryption
    sse:
      enabled: true
      type: aws:kms  # or AES256
      
    # KMS Configuration
    kms:
      key_id: alias/mindmate-data-key
      key_rotation: true
      rotation_period: 365_days
      
    # Bucket policies
    buckets:
      user-data:
        encryption: required
        versioning: enabled
        mfa_delete: required
        
      session-recordings:
        encryption: required
        versioning: enabled
        lifecycle:
          transition_to_glacier: 90_days
          expiration: 2555_days  # 7 years (HIPAA)
          
      backups:
        encryption: required
        versioning: enabled
        cross_region_replication: true
        
      logs:
        encryption: required
        lifecycle:
          transition_to_glacier: 30_days
          expiration: 2555_days
```

#### 4.3.1 S3 Bucket Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyUnencryptedUploads",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::mindmate-user-data/*",
      "Condition": {
        "StringNotEquals": {
          "s3:x-amz-server-side-encryption": "aws:kms"
        }
      }
    },
    {
      "Sid": "DenyIncorrectKMSKey",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::mindmate-user-data/*",
      "Condition": {
        "StringNotEquals": {
          "s3:x-amz-server-side-encryption-aws-kms-key-id": "arn:aws:kms:us-east-1:123456789:key/mindmate-data-key"
        }
      }
    },
    {
      "Sid": "EnforceTLS",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": "arn:aws:s3:::mindmate-user-data/*",
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    }
  ]
}
```

### 4.4 Backup Encryption

```yaml
# Backup Encryption Configuration
backups:
  frequency:
    database: hourly
    filesystem: daily
    full_system: weekly
    
  encryption:
    algorithm: AES-256-GCM
    key_management: hashicorp_vault
    
    # Backup encryption process
    process:
      - Create backup
      - Compress with zstd
      - Encrypt with AES-256-GCM
      - Sign with HMAC-SHA256
      - Upload to encrypted storage
      - Verify integrity
      
  retention:
    hourly: 48_hours
    daily: 30_days
    weekly: 12_weeks
    monthly: 12_months
    yearly: 7_years
    
  # Offsite replication
  replication:
    enabled: true
    regions:
      - us-east-1
      - us-west-2
      - eu-west-1
```

---

## 5. Zero-Knowledge Architecture

### 5.1 Zero-Knowledge Design Principles

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ZERO-KNOWLEDGE ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         CLIENT-SIDE                                  │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐  │   │
│  │  │   Master    │  │   Data      │  │     Encryption Engine       │  │   │
│  │  │   Password  │──►│   Encryption│──►│  (AES-256-GCM in Browser)   │  │   │
│  │  │             │  │   Keys      │  │                             │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────────┘  │   │
│  │           │                                    │                    │   │
│  │           │ NEVER SENT TO SERVER              │                    │   │
│  │           ▼                                    ▼                    │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐│   │
│  │  │              ENCRYPTED DATA (Server Cannot Decrypt)              ││   │
│  │  └─────────────────────────────────────────────────────────────────┘│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    │ HTTPS (TLS 1.3)                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         SERVER-SIDE                                  │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐  │   │
│  │  │  Encrypted  │  │  Encrypted  │  │        Encrypted            │  │   │
│  │  │    Data     │  │    Keys     │  │         Logs                │  │   │
│  │  │   Storage   │  │   (Wrapped) │  │       (Metadata Only)       │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────────┘  │   │
│  │                                                                       │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │   │
│  │  │  NOTE: Server NEVER has access to unencrypted user data or keys │  │   │
│  │  └─────────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Client-Side Encryption Implementation

```typescript
// Zero-Knowledge Encryption Module
class ZeroKnowledgeEncryption {
  private masterKey: CryptoKey | null = null;
  private dataEncryptionKey: CryptoKey | null = null;
  
  /**
   * Derive encryption keys from master password
   * This happens entirely client-side
   */
  async initialize(masterPassword: string, salt: Uint8Array): Promise<void> {
    // Encode password
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(masterPassword);
    
    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordData,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    
    // Derive master key using PBKDF2 with 600,000 iterations (OWASP recommendation)
    this.masterKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 600000,
        hash: 'SHA-512'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['wrapKey', 'unwrapKey']
    );
    
    // Generate data encryption key
    this.dataEncryptionKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    
    // Wrap DEK with master key for secure storage
    const wrappedKey = await this.wrapDataKey();
    
    // Send wrapped key to server (server cannot unwrap without master key)
    await this.storeWrappedKey(wrappedKey);
  }
  
  /**
   * Encrypt sensitive data before sending to server
   */
  async encryptData(plaintext: string): Promise<EncryptedData> {
    if (!this.dataEncryptionKey) {
      throw new Error('Encryption not initialized');
    }
    
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    
    // Generate unique IV for each encryption
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt with AES-256-GCM
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.dataEncryptionKey,
      data
    );
    
    return {
      ciphertext: new Uint8Array(ciphertext),
      iv: iv,
      version: 1
    };
  }
  
  /**
   * Decrypt data retrieved from server
   */
  async decryptData(encryptedData: EncryptedData): Promise<string> {
    if (!this.dataEncryptionKey) {
      throw new Error('Encryption not initialized');
    }
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: encryptedData.iv },
      this.dataEncryptionKey,
      encryptedData.ciphertext
    );
    
    return new TextDecoder().decode(decrypted);
  }
  
  /**
   * Wrap data encryption key with master key
   */
  private async wrapDataKey(): Promise<ArrayBuffer> {
    if (!this.masterKey || !this.dataEncryptionKey) {
      throw new Error('Keys not initialized');
    }
    
    return await crypto.subtle.wrapKey(
      'raw',
      this.dataEncryptionKey,
      this.masterKey,
      'AES-KW'
    );
  }
}

// Usage in React component
const SecureJournalEntry: React.FC = () => {
  const [encryption, setEncryption] = useState<ZeroKnowledgeEncryption | null>(null);
  
  const handleSaveEntry = async (content: string) => {
    if (!encryption) return;
    
    // Encrypt on client before sending
    const encrypted = await encryption.encryptData(content);
    
    // Send encrypted data to server
    await api.saveJournalEntry({
      encryptedContent: Array.from(encrypted.ciphertext),
      iv: Array.from(encrypted.iv),
      version: encrypted.version
    });
  };
  
  const handleLoadEntry = async (entryId: string) => {
    if (!encryption) return;
    
    // Retrieve encrypted data from server
    const encryptedEntry = await api.getJournalEntry(entryId);
    
    // Decrypt on client
    const decrypted = await encryption.decryptData({
      ciphertext: new Uint8Array(encryptedEntry.encryptedContent),
      iv: new Uint8Array(encryptedEntry.iv),
      version: encryptedEntry.version
    });
    
    return decrypted;
  };
  
  return (...);
};
```

### 5.3 Zero-Knowledge Data Types

| Data Type | Encryption | Server Knowledge |
|-----------|------------|------------------|
| **Journal Entries** | Client-side AES-256-GCM | Only encrypted blob |
| **Therapy Notes** | Client-side AES-256-GCM | Only encrypted blob |
| **Mood Tracking** | Client-side AES-256-GCM | Only encrypted blob |
| **Personal Goals** | Client-side AES-256-GCM | Only encrypted blob |
| **Assessment Results** | Client-side AES-256-GCM | Only encrypted blob |
| **Session Transcripts** | Client-side AES-256-GCM | Only encrypted blob |
| **User Profile** | Server-side AES-256 | Basic metadata only |
| **Authentication** | Server-side | Credentials (hashed) |

### 5.4 Key Recovery Mechanisms

```typescript
// Zero-Knowledge Key Recovery
class KeyRecovery {
  /**
   * Generate recovery codes for account recovery
   * These are the ONLY way to recover encrypted data
   */
  async generateRecoveryCodes(): Promise<string[]> {
    const codes: string[] = [];
    
    for (let i = 0; i < 10; i++) {
      // Generate 24-character recovery code
      const code = this.generateSecureCode(24);
      codes.push(code);
    }
    
    // Store hashed codes on server (for verification only)
    const hashedCodes = await Promise.all(
      codes.map(code => this.hashRecoveryCode(code))
    );
    
    await api.storeRecoveryCodeHashes(hashedCodes);
    
    return codes;
  }
  
  /**
   * Recover account using recovery code
   */
  async recoverAccount(recoveryCode: string, newPassword: string): Promise<void> {
    // Verify recovery code
    const isValid = await api.verifyRecoveryCode(
      await this.hashRecoveryCode(recoveryCode)
    );
    
    if (!isValid) {
      throw new Error('Invalid recovery code');
    }
    
    // Retrieve encrypted key backup
    const keyBackup = await api.getKeyBackup(recoveryCode);
    
    // Decrypt key backup with recovery code
    const recoveryKey = await this.deriveKeyFromRecoveryCode(recoveryCode);
    const encryptedMasterKey = await this.decryptKeyBackup(keyBackup, recoveryKey);
    
    // Re-encrypt with new password
    await this.reencryptWithNewPassword(encryptedMasterKey, newPassword);
    
    // Invalidate used recovery code
    await api.invalidateRecoveryCode(recoveryCode);
  }
  
  /**
   * Social recovery (optional, user-configured)
   */
  async setupSocialRecovery(trustedContacts: string[], threshold: number): Promise<void> {
    // Split master key using Shamir's Secret Sharing
    const shares = this.splitSecret(this.masterKey, trustedContacts.length, threshold);
    
    // Encrypt each share with contact's public key
    for (let i = 0; i < trustedContacts.length; i++) {
      const contactPublicKey = await api.getContactPublicKey(trustedContacts[i]);
      const encryptedShare = await this.encryptShare(shares[i], contactPublicKey);
      
      await api.storeRecoveryShare(trustedContacts[i], encryptedShare);
    }
  }
}
```

---

## 6. HIPAA Compliance

### 6.1 HIPAA Requirements Mapping

| HIPAA Requirement | Implementation | Evidence |
|-------------------|----------------|----------|
| **Administrative Safeguards** | | |
| Security Management Process | Risk assessments, policies, procedures | § 164.308(a)(1) |
| Assigned Security Responsibilities | CISO, Security Team roles defined | § 164.308(a)(2) |
| Workforce Security | Background checks, access agreements | § 164.308(a)(3) |
| Information Access Management | Role-based access control (RBAC) | § 164.308(a)(4) |
| Security Awareness Training | Annual training, phishing simulations | § 164.308(a)(5) |
| Security Incident Procedures | Incident response plan, 24/7 monitoring | § 164.308(a)(6) |
| Contingency Plan | Disaster recovery, backup procedures | § 164.308(a)(7) |
| Evaluation | Annual security audits, penetration tests | § 164.308(a)(8) |
| Business Associate Agreements | Signed BAAs with all vendors | § 164.308(a)(9) |
| **Physical Safeguards** | | |
| Facility Access Controls | Badge access, visitor logs, CCTV | § 164.310(a)(1) |
| Workstation Use | Screen locks, clean desk policy | § 164.310(b) |
| Workstation Security | Encrypted drives, cable locks | § 164.310(c) |
| Device and Media Controls | Asset tracking, secure disposal | § 164.310(d) |
| **Technical Safeguards** | | |
| Access Control | Unique user IDs, auto logoff, encryption | § 164.312(a) |
| Audit Controls | Comprehensive audit logging | § 164.312(b) |
| Integrity | Digital signatures, checksums | § 164.312(c)(1) |
| Person/Entity Authentication | MFA, biometrics, certificates | § 164.312(d) |
| Transmission Security | TLS 1.3, VPN, encrypted email | § 164.312(e) |

### 6.2 HIPAA Data Handling Procedures

#### 6.2.1 PHI Identification and Classification

```yaml
# PHI Classification Schema
phi_classification:
  level_1_critical:
    description: "Direct identifiers - highest sensitivity"
    examples:
      - name
      - social_security_number
      - medical_record_number
      - health_plan_beneficiary_number
      - account_numbers
      - certificate/license_numbers
      - vehicle_identifiers
      - device_identifiers
      - biometric_identifiers
      - full_face_photos
    encryption: required
    access_control: strict
    logging: comprehensive
    
  level_2_high:
    description: "Indirect identifiers - high sensitivity"
    examples:
      - date_of_birth
      - dates_of_service
      - telephone_numbers
      - fax_numbers
      - email_addresses
      - geographic_data
      - ip_addresses
    encryption: required
    access_control: role_based
    logging: comprehensive
    
  level_3_medium:
    description: "Health information - medium sensitivity"
    examples:
      - diagnosis_codes
      - procedure_codes
      - medication_information
      - test_results
      - treatment_notes
      - mental_health_records
    encryption: required
    access_control: role_based
    logging: comprehensive
    
  level_4_low:
    description: "General health data - lower sensitivity"
    examples:
      - aggregated_statistics
      - anonymized_data
      - general_wellness_data
    encryption: recommended
    access_control: standard
    logging: standard
```

#### 6.2.2 PHI Access Procedures

```python
# HIPAA-Compliant PHI Access Control
from enum import Enum
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, List

class PHILevel(Enum):
    CRITICAL = 1
    HIGH = 2
    MEDIUM = 3
    LOW = 4

class AccessPurpose(Enum):
    TREATMENT = "treatment"
    PAYMENT = "payment"
    HEALTHCARE_OPERATIONS = "healthcare_operations"
    RESEARCH = "research"
    AUDIT = "audit"
    LEGAL = "legal"

@dataclass
class PHIAccessRequest:
    user_id: str
    user_role: str
    patient_id: str
    data_types: List[str]
    purpose: AccessPurpose
    minimum_necessary: bool
    request_timestamp: datetime

class HIPAAAccessControl:
    """
    Enforces HIPAA minimum necessary standard and access controls.
    """
    
    # Role-based access matrix
    ACCESS_MATRIX = {
        'therapist': {
            'treatment': ['level_1', 'level_2', 'level_3'],
            'payment': ['level_2', 'level_3'],
            'healthcare_operations': ['level_3', 'level_4'],
        },
        'nurse': {
            'treatment': ['level_2', 'level_3'],
            'healthcare_operations': ['level_3', 'level_4'],
        },
        'billing': {
            'payment': ['level_2', 'level_3'],
        },
        'admin': {
            'healthcare_operations': ['level_2', 'level_3', 'level_4'],
            'audit': ['level_1', 'level_2', 'level_3', 'level_4'],
        },
        'researcher': {
            'research': ['level_4'],  # Only anonymized data
        }
    }
    
    async def access_phi(self, request: PHIAccessRequest) -> Optional[dict]:
        """
        Grant or deny PHI access based on HIPAA requirements.
        """
        # 1. Verify user identity (authentication)
        if not await self.verify_identity(request.user_id):
            await self.log_access_denied(request, "Authentication failed")
            raise AuthenticationError("User authentication failed")
        
        # 2. Check authorization
        allowed_levels = self.ACCESS_MATRIX.get(request.user_role, {}).get(request.purpose.value, [])
        
        # 3. Apply minimum necessary standard
        if request.minimum_necessary:
            data = await self.get_minimum_necessary(
                request.patient_id,
                request.data_types,
                allowed_levels
            )
        else:
            data = await self.get_full_record(
                request.patient_id,
                allowed_levels
            )
        
        # 4. Log access (audit requirement)
        await self.log_phi_access(request, data)
        
        # 5. Notify patient if required
        if self.requires_patient_notification(request):
            await self.notify_patient(request)
        
        return data
    
    async def get_minimum_necessary(
        self,
        patient_id: str,
        data_types: List[str],
        allowed_levels: List[str]
    ) -> dict:
        """
        Apply minimum necessary standard - only return data required for purpose.
        """
        # Filter to only requested data types
        filtered_types = [dt for dt in data_types if self.get_phi_level(dt) in allowed_levels]
        
        # Query only necessary fields
        query = self.build_minimal_query(filtered_types)
        
        return await self.execute_query(query, patient_id)
    
    async def log_phi_access(self, request: PHIAccessRequest, data: dict) -> None:
        """
        Log all PHI access for HIPAA audit requirements.
        """
        audit_record = {
            'timestamp': datetime.utcnow().isoformat(),
            'user_id': request.user_id,
            'user_role': request.user_role,
            'patient_id': request.patient_id,
            'purpose': request.purpose.value,
            'data_types_accessed': list(data.keys()),
            'records_accessed': len(data),
            'access_granted': True,
            'session_id': await self.get_session_id(),
            'ip_address': await self.get_client_ip(),
            'user_agent': await self.get_user_agent()
        }
        
        await self.audit_logger.log(audit_record)
```

#### 6.2.3 HIPAA Breach Notification Procedures

```yaml
# HIPAA Breach Notification Procedures
breach_notification:
  discovery:
    timeline: "Without unreasonable delay, max 60 days"
    
  risk_assessment:
    factors:
      - nature_of_phi_involved
      - unauthorized_person_who_accessed
      - whether_phi_was_acquired_or_viewed
      - extent_to_which_risk_has_been_mitigated
    
  notification_requirements:
    individuals:
      timeline: "Within 60 days of discovery"
      method: "First-class mail or email (if consented)"
      content:
        - brief_description_of_breach
        - types_of_information_involved
        - steps_individuals_should_take
        - steps_we_are_taking
        - contact_information
        
    secretary_hhs:
      timeline: "Within 60 days of discovery"
      method: "HHS Breach Portal"
      threshold: "500+ individuals affected"
      
    media:
      timeline: "Within 60 days of discovery"
      threshold: "500+ residents of state/jurisdiction"
      
    business_associates:
      timeline: "Without unreasonable delay"
      method: "Direct notification"
      
  documentation:
    required:
      - risk_assessment_documentation
      - notification_copies
      - delayed_notification_justification
      - law_enforcement_delay_requests
    retention: "6 years"
```

### 6.3 HIPAA Business Associate Agreements

```yaml
# BAA Requirements Checklist
business_associate_agreement:
  required_provisions:
    - description_of_permitted_phi_uses
    - requirement_not_to_use_phi_outside_agreement
    - safeguards_requirement
    - reporting_security_incidents
    - reporting_impermissible_uses
    - disclosure_to_subcontractors
    - access_to_phi_provision
    - amendment_to_phi_provision
    - accounting_of_disclosures_provision
    - hhs_access_provision
    - return_or_destruction_of_phi
    - survival_of_obligations
    
  vendors_requiring_baa:
    - name: "AWS"
      service: "Cloud Infrastructure"
      baa_status: "signed"
      
    - name: "Google Cloud"
      service: "AI/ML Services"
      baa_status: "signed"
      
    - name: "Twilio"
      service: "SMS/Voice"
      baa_status: "signed"
      
    - name: "SendGrid"
      service: "Email"
      baa_status: "signed"
      
    - name: "DataDog"
      service: "Monitoring"
      baa_status: "signed"
```

---

## 7. GDPR Compliance

### 7.1 GDPR Rights Implementation

| GDPR Right | Implementation | Technical Controls |
|------------|----------------|-------------------|
| **Right to Access** | User dashboard, data export | API endpoints, encrypted exports |
| **Right to Rectification** | Edit profile, correction forms | Version control, audit trail |
| **Right to Erasure** | Account deletion, data purge | Automated deletion workflows |
| **Right to Restrict Processing** | Processing preferences | Feature flags, data masking |
| **Right to Data Portability** | JSON/CSV export | Standardized formats |
| **Right to Object** | Opt-out mechanisms | Consent management |
| **Right to Explanation** | AI decision logging | Model interpretability |

### 7.2 GDPR Data Deletion Flows

#### 7.2.1 Account Deletion Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    GDPR DATA DELETION WORKFLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐                                                         │
│  │  User Requests  │                                                         │
│  │   Deletion      │                                                         │
│  └────────┬────────┘                                                         │
│           │                                                                  │
│           ▼                                                                  │
│  ┌─────────────────┐     ┌─────────────────┐                                │
│  │  Identity       │────►│  Confirm        │                                │
│  │  Verification   │     │  Deletion       │                                │
│  │  (MFA Required) │     │  (30-day grace) │                                │
│  └─────────────────┘     └────────┬────────┘                                │
│                                   │                                          │
│           ┌───────────────────────┼───────────────────────┐                 │
│           │                       │                       │                 │
│           ▼                       ▼                       ▼                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │  Cancel         │    │  Grace Period   │    │  Immediate      │         │
│  │  Request        │    │  (30 days)      │    │  (If requested) │         │
│  │                 │    │                 │    │                 │         │
│  └─────────────────┘    └────────┬────────┘    └────────┬────────┘         │
│                                  │                      │                   │
│                                  ▼                      ▼                   │
│                         ┌─────────────────┐    ┌─────────────────┐         │
│                         │  User Confirms  │    │  Begin          │         │
│                         │  or Grace       │────►│  Deletion       │         │
│                         │  Expires        │    │  Process        │         │
│                         └─────────────────┘    └────────┬────────┘         │
│                                                         │                   │
│           ┌─────────────────────────────────────────────┼─────────────┐    │
│           │                                             │             │    │
│           ▼                                             ▼             ▼    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌────────┐ │
│  │  Database       │  │  Object         │  │  Search         │  │ Cache  │ │
│  │  Records        │  │  Storage        │  │  Indexes        │  │        │ │
│  │  (Pseudonymize) │  │  (Delete)       │  │  (Remove)       │  │ (Clear)│ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └────────┘ │
│           │                   │                   │              │          │
│           └───────────────────┴───────────────────┴──────────────┘          │
│                                   │                                          │
│                                   ▼                                          │
│                          ┌─────────────────┐                                 │
│                          │  Verify         │                                 │
│                          │  Deletion       │                                 │
│                          │  Complete       │                                 │
│                          └────────┬────────┘                                 │
│                                   │                                          │
│                                   ▼                                          │
│                          ┌─────────────────┐                                 │
│                          │  Notify User    │                                 │
│                          │  (Certificate)  │                                 │
│                          └─────────────────┘                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 7.2.2 Deletion Implementation

```python
# GDPR Data Deletion Service
from datetime import datetime, timedelta
from typing import List, Dict
import asyncio

class GDPRDeletionService:
    """
    Handles complete user data deletion per GDPR requirements.
    """
    
    def __init__(self):
        self.deletion_queue = []
        self.verification_service = DataDeletionVerifier()
        
    async def initiate_deletion(self, user_id: str, immediate: bool = False) -> dict:
        """
        Initiate GDPR deletion process for a user.
        """
        # 1. Verify user identity
        await self.verify_identity(user_id)
        
        # 2. Create deletion request record
        deletion_request = {
            'user_id': user_id,
            'requested_at': datetime.utcnow(),
            'scheduled_for': datetime.utcnow() + timedelta(days=30) if not immediate else datetime.utcnow(),
            'status': 'pending',
            'immediate': immediate
        }
        
        await self.store_deletion_request(deletion_request)
        
        # 3. If immediate, start deletion process
        if immediate:
            await self.execute_deletion(user_id)
        
        return {
            'request_id': deletion_request['id'],
            'scheduled_for': deletion_request['scheduled_for'],
            'can_cancel_until': deletion_request['scheduled_for'] - timedelta(days=1)
        }
    
    async def execute_deletion(self, user_id: str) -> dict:
        """
        Execute complete data deletion across all systems.
        """
        deletion_report = {
            'user_id': user_id,
            'started_at': datetime.utcnow(),
            'systems_processed': [],
            'errors': []
        }
        
        try:
            # 1. Database records - Pseudonymize (for legal requirements)
            db_result = await self.delete_database_records(user_id)
            deletion_report['systems_processed'].append({
                'system': 'database',
                'action': 'pseudonymized',
                'records_affected': db_result['count']
            })
            
            # 2. Object storage - Hard delete
            storage_result = await self.delete_object_storage(user_id)
            deletion_report['systems_processed'].append({
                'system': 'object_storage',
                'action': 'deleted',
                'objects_deleted': storage_result['count']
            })
            
            # 3. Search indexes - Remove
            search_result = await self.remove_search_indexes(user_id)
            deletion_report['systems_processed'].append({
                'system': 'search',
                'action': 'removed',
                'documents_removed': search_result['count']
            })
            
            # 4. Cache - Clear
            await self.clear_cache(user_id)
            deletion_report['systems_processed'].append({
                'system': 'cache',
                'action': 'cleared'
            })
            
            # 5. Backups - Mark for exclusion from restore
            await self.mark_backup_exclusion(user_id)
            deletion_report['systems_processed'].append({
                'system': 'backups',
                'action': 'marked_for_exclusion'
            })
            
            # 6. Analytics - Anonymize
            await self.anonymize_analytics(user_id)
            deletion_report['systems_processed'].append({
                'system': 'analytics',
                'action': 'anonymized'
            })
            
            # 7. Third-party integrations
            third_party_result = await self.notify_third_parties(user_id)
            deletion_report['systems_processed'].append({
                'system': 'third_party',
                'action': 'notified',
                'integrations': third_party_result['count']
            })
            
            # 8. Verify deletion
            verification = await self.verification_service.verify_deletion(user_id)
            deletion_report['verification'] = verification
            
            # 9. Generate deletion certificate
            certificate = await self.generate_deletion_certificate(user_id, deletion_report)
            
            deletion_report['completed_at'] = datetime.utcnow()
            deletion_report['certificate_id'] = certificate['id']
            
            # 10. Notify user
            await self.notify_user_of_completion(user_id, certificate)
            
        except Exception as e:
            deletion_report['errors'].append({
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            })
            # Log for manual review
            await self.escalate_for_manual_review(user_id, deletion_report)
        
        # Store deletion report
        await self.store_deletion_report(deletion_report)
        
        return deletion_report
    
    async def delete_database_records(self, user_id: str) -> dict:
        """
        Pseudonymize or delete database records.
        """
        # Get all tables with user data
        tables = await self.get_user_tables()
        
        total_affected = 0
        for table in tables:
            # Pseudonymize personal data
            affected = await self.pseudonymize_table(table, user_id)
            total_affected += affected
            
            # Delete from certain tables (non-legal requirement)
            if table in ['user_preferences', 'user_sessions', 'chat_history']:
                await self.hard_delete_from_table(table, user_id)
        
        return {'count': total_affected}
    
    async def pseudonymize_table(self, table: str, user_id: str) -> int:
        """
        Replace personal data with pseudonym while preserving referential integrity.
        """
        pseudonym = self.generate_pseudonym(user_id)
        
        query = f"""
        UPDATE {table}
        SET 
            user_id = :pseudonym,
            email = NULL,
            phone = NULL,
            name = 'DELETED_USER',
            personal_data = NULL
        WHERE user_id = :user_id
        """
        
        result = await self.db.execute(query, {
            'user_id': user_id,
            'pseudonym': pseudonym
        })
        
        return result.rowcount
    
    async def generate_deletion_certificate(self, user_id: str, report: dict) -> dict:
        """
        Generate cryptographic proof of deletion.
        """
        certificate = {
            'id': generate_uuid(),
            'user_id_hash': hash_user_id(user_id),  # One-way hash
            'deletion_date': datetime.utcnow().isoformat(),
            'systems_affected': len(report['systems_processed']),
            'verification_hash': self.generate_verification_hash(report),
            'retention_period': '7_years_legal_requirement'
        }
        
        # Sign certificate
        certificate['signature'] = await self.sign_certificate(certificate)
        
        return certificate
```

#### 7.2.3 Data Retention for Legal Requirements

```python
# Legal Hold and Retention Management
class LegalRetentionManager:
    """
    Manages data retention for legal/regulatory requirements
    while complying with GDPR deletion requests.
    """
    
    LEGAL_RETENTION_PERIODS = {
        'medical_records': timedelta(days=2555),  # 7 years (HIPAA)
        'financial_records': timedelta(days=2555),  # 7 years (IRS)
        'audit_logs': timedelta(days=2555),  # 7 years
        'consent_records': timedelta(days=3650),  # 10 years
        'legal_holds': 'indefinite_until_released',
    }
    
    async def apply_legal_hold(self, user_id: str, reason: str, legal_reference: str) -> dict:
        """
        Apply legal hold to prevent deletion.
        """
        hold = {
            'user_id': user_id,
            'applied_at': datetime.utcnow(),
            'reason': reason,
            'legal_reference': legal_reference,
            'applied_by': await self.get_current_user(),
            'expires_at': None,  # Indefinite until released
            'data_scope': 'all'  # Or specific data types
        }
        
        await self.store_legal_hold(hold)
        
        # Block any pending deletion requests
        await self.block_deletion_requests(user_id, hold['id'])
        
        return hold
    
    async def handle_deletion_with_legal_hold(self, user_id: str) -> dict:
        """
        Handle deletion request when legal hold exists.
        """
        holds = await self.get_active_legal_holds(user_id)
        
        if holds:
            # Cannot fully delete - apply partial deletion
            return await self.apply_partial_deletion(user_id, holds)
        
        # No holds - proceed with full deletion
        return await self.execute_full_deletion(user_id)
    
    async def apply_partial_deletion(self, user_id: str, holds: List[dict]) -> dict:
        """
        Delete non-hold data while preserving legally required data.
        """
        result = {
            'user_id': user_id,
            'deletion_type': 'partial',
            'legal_holds': [h['id'] for h in holds],
            'deleted_categories': [],
            'preserved_categories': []
        }
        
        # Delete non-essential data
        await self.delete_user_preferences(user_id)
        result['deleted_categories'].append('preferences')
        
        await self.delete_chat_history(user_id)
        result['deleted_categories'].append('chat_history')
        
        await self.delete_analytics_data(user_id)
        result['deleted_categories'].append('analytics')
        
        # Pseudonymize but preserve legally required data
        await self.pseudonymize_medical_records(user_id)
        result['preserved_categories'].append('medical_records')
        
        await self.pseudonymize_financial_records(user_id)
        result['preserved_categories'].append('financial_records')
        
        return result
```

### 7.3 Consent Management

```yaml
# GDPR Consent Management
consent_management:
  consent_types:
    essential:
      description: "Required for service operation"
      required: true
      revocable: false
      
    analytics:
      description: "Anonymous usage analytics"
      required: false
      revocable: true
      default: false
      
    marketing:
      description: "Marketing communications"
      required: false
      revocable: true
      default: false
      
    third_party_sharing:
      description: "Share data with partners"
      required: false
      revocable: true
      default: false
      
    ai_training:
      description: "Use data for AI model training"
      required: false
      revocable: true
      default: false
      
  consent_records:
    stored_attributes:
      - consent_type
      - granted_at
      - granted_via
      - ip_address
      - user_agent
      - version
      - withdrawal_record (if applicable)
      
    retention: "Duration of relationship + 10 years"
    
  withdrawal_process:
    - user_initiates_withdrawal
    - record_withdrawal_timestamp
    - stop_processing_immediately
    - delete_or_anonymize_data_as_appropriate
    - confirm_withdrawal_to_user
    - update_all_systems
```

---

## 8. Penetration Testing

### 8.1 Penetration Testing Checklist

#### 8.1.1 Pre-Engagement

```yaml
penetration_testing:
  pre_engagement:
    - item: "Define scope and objectives"
      status: required
      
    - item: "Identify in-scope systems"
      status: required
      examples:
        - web_applications
        - mobile_applications
        - apis
        - infrastructure
        - cloud_services
        - third_party_integrations
        
    - item: "Establish rules of engagement"
      status: required
      rules:
        - testing_windows
        - authorized_testing_methods
        - prohibited_activities
        - emergency_contacts
        - reporting_procedures
        
    - item: "Obtain written authorization"
      status: required
      
    - item: "Set up test environment"
      status: recommended
      
    - item: "Prepare incident response plan"
      status: required
```

#### 8.1.2 Web Application Testing

```yaml
web_application_testing:
  information_gathering:
    - technique: "Fingerprint web server and technologies"
      tools: [nmap, wappalyzer, builtwith]
      
    - technique: "Discover hidden files and directories"
      tools: [gobuster, dirb, ffuf]
      
    - technique: "Analyze client-side code"
      tools: [browser_dev_tools, jsdetox]
      
  authentication_testing:
    - test: "Brute force protection"
      methodology: "Attempt multiple failed logins"
      expected: "Account lockout after N attempts"
      
    - test: "Password policy enforcement"
      methodology: "Test weak passwords"
      expected: "Rejection of weak passwords"
      
    - test: "Session management"
      methodology: "Test session fixation, hijacking"
      expected: "Secure session handling"
      
    - test: "Multi-factor authentication"
      methodology: "Test MFA bypass techniques"
      expected: "Cannot bypass MFA"
      
    - test: "Password reset functionality"
      methodology: "Test reset token generation"
      expected: "Cryptographically secure tokens"
      
  authorization_testing:
    - test: "Horizontal privilege escalation"
      methodology: "Access other users' resources"
      expected: "403 Forbidden"
      
    - test: "Vertical privilege escalation"
      methodology: "Access admin functions as user"
      expected: "403 Forbidden"
      
    - test: "Insecure direct object references"
      methodology: "Modify IDs in requests"
      expected: "Proper authorization checks"
      
  input_validation_testing:
    - test: "SQL Injection"
      methodology: "Inject SQL in all input fields"
      tools: [sqlmap, manual testing]
      expected: "Parameterized queries prevent injection"
      
    - test: "Cross-Site Scripting (XSS)"
      methodology: "Inject JavaScript payloads"
      types: [reflected, stored, DOM-based]
      expected: "Output encoding prevents XSS"
      
    - test: "Command Injection"
      methodology: "Inject shell commands"
      expected: "No command execution"
      
    - test: "Path Traversal"
      methodology: "Access files outside web root"
      expected: "Input validation prevents traversal"
      
    - test: "XML External Entity (XXE)"
      methodology: "Inject XXE payloads"
      expected: "XML parser configured securely"
      
  business_logic_testing:
    - test: "Price manipulation"
      methodology: "Modify prices in requests"
      expected: "Server-side validation"
      
    - test: "Workflow bypass"
      methodology: "Skip required steps"
      expected: "Enforced workflow order"
      
    - test: "Race conditions"
      methodology: "Concurrent request testing"
      expected: "Proper locking mechanisms"
```

#### 8.1.3 API Testing

```yaml
api_testing:
  authentication:
    - test: "JWT security"
      checks:
        - algorithm_confusion
        - weak_signing_keys
        - token_expiration
        - refresh_token_rotation
        
    - test: "API key security"
      checks:
        - key_transmission
        - key_storage
        - key_rotation
        
  authorization:
    - test: "OAuth 2.0 implementation"
      checks:
        - proper_scope_enforcement
        - state_parameter_usage
        - pkce_implementation
        - token_binding
        
    - test: "RBAC enforcement"
      methodology: "Test endpoint access with different roles"
      
  input_validation:
    - test: "Mass assignment"
      methodology: "Send unexpected parameters"
      expected: "Whitelist parameter binding"
      
    - test: "Rate limiting"
      methodology: "Send excessive requests"
      expected: "429 Too Many Requests"
      
    - test: "Content-Type handling"
      methodology: "Test different content types"
      expected: "Proper validation"
      
  data_exposure:
    - test: "Sensitive data in responses"
      methodology: "Analyze all API responses"
      expected: "No sensitive data leakage"
      
    - test: "Error information disclosure"
      methodology: "Trigger errors"
      expected: "Generic error messages"
```

#### 8.1.4 Infrastructure Testing

```yaml
infrastructure_testing:
  network_security:
    - test: "Port scanning"
      tools: [nmap, masscan]
      expected: "Only necessary ports open"
      
    - test: "Service enumeration"
      tools: [nmap, amap]
      expected: "No unnecessary services"
      
    - test: "Vulnerability scanning"
      tools: [nessus, openvas, nmap scripts]
      
  cloud_security:
    - test: "S3 bucket permissions"
      tools: [awscli, pacu, scoutSuite]
      expected: "No public buckets with sensitive data"
      
    - test: "IAM policy review"
      methodology: "Analyze all IAM policies"
      expected: "Principle of least privilege"
      
    - test: "Security group rules"
      methodology: "Review all security groups"
      expected: "Minimal necessary access"
      
    - test: "CloudTrail/CloudWatch configuration"
      expected: "Comprehensive logging enabled"
      
  container_security:
    - test: "Image vulnerabilities"
      tools: [trivy, clair, snyk]
      
    - test: "Container runtime security"
      tools: [falco, sysdig]
      
    - test: "Kubernetes security"
      tools: [kube-bench, kube-hunter]
      checks:
        - rbac_configuration
        - network_policies
        - pod_security_policies
        - secrets_management
```

#### 8.1.5 Mobile Application Testing

```yaml
mobile_testing:
  static_analysis:
    - test: "Hardcoded secrets"
      tools: [mobSF, apktool, jadx]
      
    - test: "Insecure storage"
      methodology: "Analyze local data storage"
      expected: "Encrypted sensitive data"
      
    - test: "Code obfuscation"
      expected: "ProGuard/R8 enabled"
      
  dynamic_analysis:
    - test: "Certificate pinning"
      methodology: "Attempt MITM"
      expected: "Connection fails"
      
    - test: "Root/jailbreak detection"
      methodology: "Test on rooted device"
      expected: "App detects and responds"
      
    - test: "Runtime manipulation"
      tools: [frida, objection]
      expected: "Anti-tampering measures"
      
  network_security:
    - test: "Insecure communications"
      methodology: "Intercept traffic"
      expected: "All traffic encrypted"
      
    - test: "Deep link handling"
      methodology: "Test URL schemes"
      expected: "Proper validation"
```

### 8.2 Penetration Testing Schedule

```yaml
# Penetration Testing Calendar
pentest_schedule:
  continuous:
    - type: "Automated vulnerability scanning"
      frequency: daily
      tools: [snyk, dependabot, trivy]
      
    - type: "Dependency scanning"
      frequency: daily
      tools: [snyk, npm audit, safety]
      
    - type: "Static code analysis"
      frequency: per_commit
      tools: [sonarqube, semgrep, bandit]
      
  quarterly:
    - type: "Internal penetration test"
      scope: full_application
      team: internal_security_team
      
    - type: "Infrastructure assessment"
      scope: all_infrastructure
      team: internal_security_team
      
  annual:
    - type: "External penetration test"
      scope: full_application
      provider: third_party_vendor
      
    - type: "Red team exercise"
      scope: full_organization
      provider: third_party_vendor
      duration: 2_weeks
      
  on_demand:
    - trigger: "Major release"
    - trigger: "Security incident"
    - trigger: "Architecture change"
    - trigger: "Compliance requirement"
```

### 8.3 Vulnerability Management

```yaml
vulnerability_management:
  severity_levels:
    critical:
      cvss_score: "9.0-10.0"
      sla: "4 hours"
      response: immediate_fix_or_mitigation
      
    high:
      cvss_score: "7.0-8.9"
      sla: "24 hours"
      response: fix_within_24_hours
      
    medium:
      cvss_score: "4.0-6.9"
      sla: "7 days"
      response: fix_within_sprint
      
    low:
      cvss_score: "0.1-3.9"
      sla: "30 days"
      response: fix_as_scheduled
      
  workflow:
    - step: "Detection"
      sources: [pentest, scan, bug_bounty, manual]
      
    - step: "Triage"
      actions:
        - validate_vulnerability
        - assign_severity
        - determine_exploitability
        - assign_owner
        
    - step: "Remediation"
      actions:
        - develop_fix
        - test_fix
        - deploy_fix
        - verify_fix
        
    - step: "Documentation"
      actions:
        - record_in_vulnerability_db
        - update_security_metrics
        - lessons_learned
```

---

## 9. Data Retention Policies

### 9.1 Data Retention Matrix

| Data Category | Retention Period | Legal Basis | Destruction Method |
|---------------|------------------|-------------|-------------------|
| **User Account Data** | Account lifetime + 30 days | Contract | Cryptographic erasure |
| **Session Transcripts** | 7 years | HIPAA | Cryptographic erasure |
| **Therapy Notes** | 7 years | HIPAA | Cryptographic erasure |
| **Chat Messages** | 3 years | Business need | Cryptographic erasure |
| **Mood Tracking Data** | 3 years | Business need | Cryptographic erasure |
| **Assessment Results** | 7 years | HIPAA | Cryptographic erasure |
| **Payment Records** | 7 years | IRS | Cryptographic erasure |
| **Audit Logs** | 7 years | HIPAA/SOC2 | Cryptographic erasure |
| **Access Logs** | 1 year | Security | Deletion |
| **Error Logs** | 90 days | Debugging | Deletion |
| **Analytics Data** | 2 years | Business need | Anonymization |
| **Marketing Data** | Until consent withdrawn | Consent | Deletion |
| **Backup Data** | 30 days | Disaster recovery | Cryptographic erasure |
| **Deleted Account Data** | 30 days grace + immediate | GDPR | Cryptographic erasure |

### 9.2 Retention Policy Implementation

```python
# Data Retention Management Service
class DataRetentionManager:
    """
    Manages automated data retention and deletion.
    """
    
    RETENTION_POLICIES = {
        'session_transcripts': {
            'retention_days': 2555,  # 7 years
            'legal_basis': 'HIPAA',
            'destruction_method': 'cryptographic_erasure',
            'encryption_required': True
        },
        'therapy_notes': {
            'retention_days': 2555,
            'legal_basis': 'HIPAA',
            'destruction_method': 'cryptographic_erasure',
            'encryption_required': True
        },
        'chat_messages': {
            'retention_days': 1095,  # 3 years
            'legal_basis': 'business_need',
            'destruction_method': 'cryptographic_erasure',
            'encryption_required': True
        },
        'mood_tracking': {
            'retention_days': 1095,
            'legal_basis': 'business_need',
            'destruction_method': 'cryptographic_erasure',
            'encryption_required': True
        },
        'audit_logs': {
            'retention_days': 2555,
            'legal_basis': 'HIPAA_SOC2',
            'destruction_method': 'deletion',
            'encryption_required': True,
            'immutable': True
        },
        'analytics_data': {
            'retention_days': 730,  # 2 years
            'legal_basis': 'business_need',
            'destruction_method': 'anonymization',
            'encryption_required': False
        }
    }
    
    async def enforce_retention_policies(self):
        """
        Daily job to enforce data retention policies.
        """
        for data_type, policy in self.RETENTION_POLICIES.items():
            cutoff_date = datetime.utcnow() - timedelta(days=policy['retention_days'])
            
            # Find expired data
            expired_records = await self.find_expired_records(
                data_type, 
                cutoff_date
            )
            
            if expired_records:
                # Apply destruction method
                if policy['destruction_method'] == 'cryptographic_erasure':
                    await self.cryptographic_erasure(data_type, expired_records)
                elif policy['destruction_method'] == 'deletion':
                    await self.delete_records(data_type, expired_records)
                elif policy['destruction_method'] == 'anonymization':
                    await self.anonymize_records(data_type, expired_records)
                
                # Log destruction
                await self.log_data_destruction(
                    data_type,
                    len(expired_records),
                    policy['destruction_method']
                )
    
    async def cryptographic_erasure(self, data_type: str, records: List[dict]):
        """
        Destroy data by deleting encryption keys.
        More secure than overwriting for encrypted data.
        """
        for record in records:
            # Delete the encryption key from Vault
            await self.vault.delete_key(record['key_path'])
            
            # Mark record as destroyed
            await self.mark_destroyed(data_type, record['id'])
            
            # The encrypted data remains but is unrecoverable
            # Optionally overwrite with random data
            if self.should_overwrite():
                await self.overwrite_with_random(data_type, record['id'])
    
    async def anonymize_records(self, data_type: str, records: List[dict]):
        """
        Anonymize data for analytics retention.
        """
        for record in records:
            # Remove all PII
            anonymized = {
                'id': record['id'],
                'timestamp': record['timestamp'],
                'aggregated_metrics': record['aggregated_metrics'],
                'user_id': None,  # Remove link to user
                'session_id': hash_id(record['session_id'])  # One-way hash
            }
            
            await self.update_record(data_type, record['id'], anonymized)
```

### 9.3 Legal Hold Management

```python
class LegalHoldManager:
    """
    Manages legal holds that override standard retention policies.
    """
    
    async def create_legal_hold(
        self,
        name: str,
        description: str,
        scope: dict,
        authorized_by: str,
        legal_reference: str
    ) -> dict:
        """
        Create a legal hold to preserve data beyond retention period.
        """
        hold = {
            'id': generate_uuid(),
            'name': name,
            'description': description,
            'scope': scope,  # users, date ranges, data types
            'authorized_by': authorized_by,
            'legal_reference': legal_reference,
            'created_at': datetime.utcnow(),
            'status': 'active',
            'affected_records': await self.identify_affected_records(scope)
        }
        
        # Store hold
        await self.store_legal_hold(hold)
        
        # Suspend deletion for affected records
        await self.suspend_deletion(hold['id'], hold['affected_records'])
        
        # Notify relevant parties
        await self.notify_stakeholders(hold)
        
        return hold
    
    async def release_legal_hold(self, hold_id: str, released_by: str) -> dict:
        """
        Release a legal hold and resume normal retention.
        """
        hold = await self.get_legal_hold(hold_id)
        
        # Update hold status
        hold['status'] = 'released'
        hold['released_at'] = datetime.utcnow()
        hold['released_by'] = released_by
        
        await self.update_legal_hold(hold)
        
        # Resume deletion for records past retention
        await self.resume_deletion(hold_id)
        
        # Trigger immediate retention enforcement
        await self.retention_manager.enforce_retention_policies()
        
        return hold
```

---

## 10. Audit Logging

### 10.1 Audit Logging Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AUDIT LOGGING ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         APPLICATION LAYER                            │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │ Auth Events │  │ Data Access │  │ Admin Actions│  │ API Calls   │  │   │
│  │  │             │  │             │  │             │  │             │  │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │   │
│  │         └─────────────────┴─────────────────┴─────────────────┘       │   │
│  │                                    │                                  │   │
│  │                         ┌──────────┴──────────┐                      │   │
│  │                         │   Audit Logger SDK  │                      │   │
│  │                         │   (Structured Logs) │                      │   │
│  │                         └──────────┬──────────┘                      │   │
│  └────────────────────────────────────┼─────────────────────────────────┘   │
│                                       │                                      │
│  ┌────────────────────────────────────┼─────────────────────────────────┐   │
│  │                         STREAMING LAYER                              │   │
│  │  ┌─────────────────────────────────┴─────────────────────────────┐   │   │
│  │  │                    Apache Kafka / AWS Kinesis                    │   │   │
│  │  │              (Durable, Ordered, Partitioned Stream)              │   │   │
│  │  └─────────────────────────────────┬─────────────────────────────┘   │   │
│  └────────────────────────────────────┼─────────────────────────────────┘   │
│                                       │                                      │
│  ┌────────────────────────────────────┼─────────────────────────────────┐   │
│  │                         PROCESSING LAYER                             │   │
│  │  ┌─────────────────────────────────┴─────────────────────────────┐   │   │
│  │  │                    Apache Flink / AWS Lambda                     │   │   │
│  │  │  - Real-time alerting    - Pattern detection    - Enrichment   │   │   │
│  │  └─────────────────────────────────┬─────────────────────────────┘   │   │
│  └────────────────────────────────────┼─────────────────────────────────┘   │
│                                       │                                      │
│  ┌────────────────────────────────────┼─────────────────────────────────┐   │
│  │                         STORAGE LAYER                                │   │
│  │  ┌─────────────┐  ┌─────────────┐  │  ┌─────────────┐  ┌──────────┐ │   │
│  │  │  Hot Store  │  │  Warm Store │  │  │  Cold Store │  │  SIEM    │ │   │
│  │  │ (Elasticsearch)│ │ (S3/Glacier)│  │  │ (Glacier)   │  │ (Splunk) │ │   │
│  │  │  30 days    │  │  1 year     │  │  │  7 years    │  │  Realtime│ │   │
│  │  └─────────────┘  └─────────────┘  │  └─────────────┘  └──────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Audit Event Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "MindMate AI Audit Event",
  "type": "object",
  "required": [
    "event_id",
    "timestamp",
    "event_type",
    "severity",
    "actor",
    "resource",
    "action",
    "outcome"
  ],
  "properties": {
    "event_id": {
      "type": "string",
      "format": "uuid",
      "description": "Unique identifier for the event"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "ISO 8601 timestamp of the event"
    },
    "event_type": {
      "type": "string",
      "enum": [
        "authentication",
        "authorization",
        "data_access",
        "data_modification",
        "data_deletion",
        "admin_action",
        "system_event",
        "security_event"
      ]
    },
    "severity": {
      "type": "string",
      "enum": ["info", "low", "medium", "high", "critical"]
    },
    "actor": {
      "type": "object",
      "required": ["type"],
      "properties": {
        "type": {
          "type": "string",
          "enum": ["user", "system", "service", "admin"]
        },
        "id": {
          "type": "string",
          "description": "User or service ID"
        },
        "role": {
          "type": "string",
          "description": "Role of the actor"
        },
        "ip_address": {
          "type": "string",
          "format": "ipv4"
        },
        "user_agent": {
          "type": "string"
        },
        "session_id": {
          "type": "string"
        },
        "mfa_used": {
          "type": "boolean"
        }
      }
    },
    "resource": {
      "type": "object",
      "required": ["type"],
      "properties": {
        "type": {
          "type": "string",
          "enum": [
            "user_account",
            "therapy_session",
            "medical_record",
            "chat_message",
            "assessment",
            "payment_record",
            "system_config"
          ]
        },
        "id": {
          "type": "string",
          "description": "Resource identifier"
        },
        "owner_id": {
          "type": "string",
          "description": "Owner of the resource"
        },
        "phi_classification": {
          "type": "string",
          "enum": ["critical", "high", "medium", "low", "none"]
        }
      }
    },
    "action": {
      "type": "object",
      "required": ["name"],
      "properties": {
        "name": {
          "type": "string",
          "examples": ["login", "logout", "read", "create", "update", "delete"]
        },
        "method": {
          "type": "string",
          "examples": ["GET", "POST", "PUT", "DELETE"]
        },
        "endpoint": {
          "type": "string"
        },
        "parameters": {
          "type": "object",
          "description": "Action parameters (sanitized)"
        }
      }
    },
    "outcome": {
      "type": "string",
      "enum": ["success", "failure", "denied", "error"]
    },
    "reason": {
      "type": "string",
      "description": "Reason for failure or denial"
    },
    "metadata": {
      "type": "object",
      "properties": {
        "request_id": {
          "type": "string"
        },
        "correlation_id": {
          "type": "string"
        },
        "processing_time_ms": {
          "type": "number"
        },
        "geo_location": {
          "type": "object",
          "properties": {
            "country": { "type": "string" },
            "city": { "type": "string" },
            "coordinates": {
              "type": "object",
              "properties": {
                "lat": { "type": "number" },
                "lon": { "type": "number" }
              }
            }
          }
        }
      }
    },
    "integrity": {
      "type": "object",
      "properties": {
        "hash": {
          "type": "string",
          "description": "SHA-256 hash of the event"
        },
        "signature": {
          "type": "string",
          "description": "Digital signature of the event"
        }
      }
    }
  }
}
```

### 10.3 Audit Logger Implementation

```python
# Python Audit Logger
import hashlib
import hmac
import json
from datetime import datetime
from typing import Dict, Any, Optional
import asyncio

class AuditLogger:
    """
    HIPAA-compliant audit logger for all sensitive operations.
    """
    
    SENSITIVE_EVENTS = {
        'authentication': ['login', 'logout', 'password_change', 'mfa_enrollment'],
        'authorization': ['access_denied', 'privilege_escalation', 'role_change'],
        'data_access': ['phi_access', 'bulk_export', 'search'],
        'data_modification': ['phi_create', 'phi_update', 'phi_delete'],
        'admin_action': ['user_create', 'user_delete', 'config_change'],
        'security_event': ['suspicious_activity', 'breach_indicator', 'policy_violation']
    }
    
    def __init__(self, config: dict):
        self.kafka_producer = KafkaProducer(config['kafka'])
        self.signing_key = config['signing_key']
        self.service_name = config['service_name']
        
    async def log_event(
        self,
        event_type: str,
        severity: str,
        actor: dict,
        resource: dict,
        action: dict,
        outcome: str,
        reason: Optional[str] = None,
        metadata: Optional[dict] = None
    ) -> dict:
        """
        Log an audit event.
        """
        # Build event
        event = {
            'event_id': generate_uuid(),
            'timestamp': datetime.utcnow().isoformat(),
            'service': self.service_name,
            'event_type': event_type,
            'severity': severity,
            'actor': self._sanitize_actor(actor),
            'resource': self._sanitize_resource(resource),
            'action': self._sanitize_action(action),
            'outcome': outcome,
        }
        
        if reason:
            event['reason'] = reason
            
        if metadata:
            event['metadata'] = metadata
        
        # Add integrity protection
        event['integrity'] = self._sign_event(event)
        
        # Send to audit stream
        await self._send_to_audit_stream(event)
        
        # Real-time alerting for critical events
        if severity in ['high', 'critical']:
            await self._send_alert(event)
        
        return event
    
    def _sanitize_actor(self, actor: dict) -> dict:
        """Sanitize actor information for logging."""
        # Remove sensitive fields
        sanitized = {
            'type': actor.get('type'),
            'id': actor.get('id'),
            'role': actor.get('role'),
            'ip_address': self._anonymize_ip(actor.get('ip_address')),
            'session_id': hash_id(actor.get('session_id')) if actor.get('session_id') else None,
            'mfa_used': actor.get('mfa_used', False)
        }
        return {k: v for k, v in sanitized.items() if v is not None}
    
    def _sanitize_resource(self, resource: dict) -> dict:
        """Sanitize resource information for logging."""
        return {
            'type': resource.get('type'),
            'id': hash_id(resource.get('id')) if resource.get('id') else None,
            'owner_id': hash_id(resource.get('owner_id')) if resource.get('owner_id') else None,
            'phi_classification': resource.get('phi_classification')
        }
    
    def _sanitize_action(self, action: dict) -> dict:
        """Sanitize action parameters."""
        sanitized_params = {}
        if 'parameters' in action:
            for key, value in action['parameters'].items():
                # Mask sensitive parameters
                if self._is_sensitive_parameter(key):
                    sanitized_params[key] = '***REDACTED***'
                else:
                    sanitized_params[key] = value
        
        return {
            'name': action.get('name'),
            'method': action.get('method'),
            'endpoint': action.get('endpoint'),
            'parameters': sanitized_params if sanitized_params else None
        }
    
    def _sign_event(self, event: dict) -> dict:
        """Cryptographically sign the event for integrity."""
        event_string = json.dumps(event, sort_keys=True)
        event_hash = hashlib.sha256(event_string.encode()).hexdigest()
        
        signature = hmac.new(
            self.signing_key.encode(),
            event_hash.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return {
            'hash': event_hash,
            'signature': signature,
            'algorithm': 'HMAC-SHA256'
        }
    
    async def _send_to_audit_stream(self, event: dict):
        """Send event to Kafka for processing."""
        topic = f"audit.{event['event_type']}"
        await self.kafka_producer.send(topic, event)
    
    async def _send_alert(self, event: dict):
        """Send real-time alert for critical events."""
        alert = {
            'alert_type': 'audit_critical_event',
            'severity': event['severity'],
            'event': event,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        await self.kafka_producer.send('security.alerts', alert)

# Convenience methods for common events
    async def log_authentication(
        self,
        user_id: str,
        action: str,  # 'login', 'logout', 'failed_login'
        success: bool,
        ip_address: str,
        mfa_used: bool = False,
        failure_reason: Optional[str] = None
    ):
        """Log authentication event."""
        await self.log_event(
            event_type='authentication',
            severity='high' if not success else 'info',
            actor={
                'type': 'user',
                'id': user_id,
                'ip_address': ip_address,
                'mfa_used': mfa_used
            },
            resource={'type': 'user_account', 'id': user_id},
            action={'name': action},
            outcome='success' if success else 'failure',
            reason=failure_reason
        )
    
    async def log_phi_access(
        self,
        user_id: str,
        patient_id: str,
        data_type: str,
        access_purpose: str,
        records_accessed: int,
        ip_address: str
    ):
        """Log PHI access (HIPAA requirement)."""
        await self.log_event(
            event_type='data_access',
            severity='high',
            actor={
                'type': 'user',
                'id': user_id,
                'ip_address': ip_address
            },
            resource={
                'type': data_type,
                'owner_id': patient_id,
                'phi_classification': 'critical'
            },
            action={
                'name': 'phi_access',
                'parameters': {
                    'purpose': access_purpose,
                    'records_accessed': records_accessed
                }
            },
            outcome='success'
        )
```

### 10.4 Audit Log Retention and Access

```yaml
# Audit Log Management
audit_logs:
  retention:
    hot_storage:
      technology: elasticsearch
      retention: 30_days
      access: real_time_search
      
    warm_storage:
      technology: s3_standard
      retention: 335_days  # 11 months
      access: query_via_athena
      
    cold_storage:
      technology: glacier
      retention: 2555_days  # 7 years (HIPAA)
      access: retrieval_request_24h
      
  access_controls:
    who_can_access:
      - role: security_team
        access: read_all
        justification: security_monitoring
        
      - role: compliance_officer
        access: read_all
        justification: compliance_audits
        
      - role: system_admin
        access: read_system_only
        justification: troubleshooting
        
      - role: legal_team
        access: read_with_approval
        justification: legal_proceedings
        
    access_approval:
      required_for: [phi_related, user_identifiable]
      approver: ciso_or_ceo
      documentation: required
      
  integrity:
    signing: hmac_sha256
    verification: automatic
    tamper_detection: enabled
    
  backup:
    frequency: continuous_replication
    locations: [us_east, us_west, eu_west]
    encryption: aes_256
```

---

## 11. Incident Response

### 11.1 Incident Response Plan

```yaml
# Security Incident Response Plan
incident_response:
  phases:
    preparation:
      activities:
        - establish_incident_response_team
        - develop_policies_and_procedures
        - implement_monitoring_and_detection
        - conduct_training_and_exercises
        - establish_communication_channels
        
    identification:
      activities:
        - detect_security_event
        - assess_severity_and_scope
        - classify_incident_type
        - notify_incident_response_team
        - preserve_evidence
        
    containment:
      short_term:
        - isolate_affected_systems
        - block_malicious_ips
        - revoke_compromised_credentials
        - disable_compromised_accounts
        
      long_term:
        - implement_temporary_fixes
        - monitor_for_additional_activity
        - prepare_for_eradication
        
    eradication:
      activities:
        - remove_malware
        - patch_vulnerabilities
        - rebuild_compromised_systems
        - reset_compromised_credentials
        
    recovery:
      activities:
        - restore_from_backups
        - verify_system_integrity
        - return_to_normal_operations
        - enhanced_monitoring
        
    lessons_learned:
      activities:
        - conduct_post_incident_review
        - document_findings
        - update_policies_and_procedures
        - implement_improvements
        
  severity_levels:
    critical:
      definition: "Active breach of PHI or critical systems"
      response_time: "15 minutes"
      notification: [ciso, ceo, legal, board]
      
    high:
      definition: "Potential breach or significant security event"
      response_time: "1 hour"
      notification: [ciso, security_team, legal]
      
    medium:
      definition: "Security event with limited impact"
      response_time: "4 hours"
      notification: [security_team]
      
    low:
      definition: "Minor security issue or policy violation"
      response_time: "24 hours"
      notification: [security_team]
```

### 11.2 Incident Response Playbooks

```yaml
# Data Breach Response Playbook
playbook_data_breach:
  trigger: "Confirmed unauthorized access to PHI"
  
  immediate_actions:
    - action: "Activate incident response team"
      owner: "CISO"
      timeline: "0-15 minutes"
      
    - action: "Isolate affected systems"
      owner: "Security Team"
      timeline: "0-30 minutes"
      
    - action: "Preserve evidence"
      owner: "Forensics Team"
      timeline: "0-1 hour"
      
    - action: "Engage legal counsel"
      owner: "CISO"
      timeline: "0-1 hour"
      
  assessment:
    - action: "Determine scope of breach"
      questions:
        - "What data was accessed?"
        - "How many individuals affected?"
        - "When did breach occur?"
        - "How was access gained?"
        - "Is breach ongoing?"
        
    - action: "Conduct risk assessment"
      factors:
        - nature_of_phi_involved
        - unauthorized_person_who_accessed
        - whether_phi_was_acquired_or_viewed
        - extent_to_which_risk_has_been_mitigated
        
  notification:
    internal:
      - role: "Board of Directors"
        timeline: "Within 24 hours"
        
      - role: "Executive Team"
        timeline: "Within 4 hours"
        
      - role: "Legal Counsel"
        timeline: "Immediately"
        
    external:
      - entity: "Affected Individuals"
        timeline: "Within 60 days"
        method: "First-class mail"
        
      - entity: "HHS Secretary"
        timeline: "Within 60 days (if 500+ affected)"
        method: "HHS Breach Portal"
        
      - entity: "Media"
        timeline: "Within 60 days (if 500+ in state)"
        method: "Press release"
        
      - entity: "Law Enforcement"
        timeline: "As appropriate"
        method: "Direct contact"
        
  documentation:
    required:
      - incident_timeline
      - evidence_collected
      - actions_taken
      - notification_records
      - risk_assessment
      - remediation_actions
    retention: "6 years"
```

---

## 12. Appendices

### Appendix A: Cryptographic Standards

```yaml
cryptographic_standards:
  symmetric_encryption:
    algorithm: AES-256
    mode: GCM
    key_size: 256_bits
    iv_size: 96_bits
    tag_size: 128_bits
    
  asymmetric_encryption:
    algorithm: RSA-OAEP
    key_size: 4096_bits
    hash: SHA-256
    
  key_exchange:
    algorithm: ECDH
    curve: P-384
    
  digital_signatures:
    algorithm: ECDSA
    curve: P-384
    hash: SHA-384
    
  hashing:
    password_hashing: Argon2id
    general_hashing: SHA-256
    hmac: HMAC-SHA256
    
  random_number_generation:
    source: /dev/urandom (Linux)
    library: secrets (Python)
    csprng: OpenSSL
```

### Appendix B: Security Controls Checklist

```yaml
security_controls:
  network_security:
    - control: "Firewall"
      implementation: "AWS Security Groups + WAF"
      status: implemented
      
    - control: "DDoS Protection"
      implementation: "Cloudflare + AWS Shield"
      status: implemented
      
    - control: "Intrusion Detection"
      implementation: "AWS GuardDuty + Suricata"
      status: implemented
      
    - control: "Network Segmentation"
      implementation: "VPC + Subnets"
      status: implemented
      
  application_security:
    - control: "Input Validation"
      implementation: "Server-side validation + parameterized queries"
      status: implemented
      
    - control: "Output Encoding"
      implementation: "Context-aware encoding"
      status: implemented
      
    - control: "Authentication"
      implementation: "OAuth 2.0 + OIDC + MFA"
      status: implemented
      
    - control: "Authorization"
      implementation: "RBAC + ABAC"
      status: implemented
      
    - control: "Session Management"
      implementation: "Secure cookies + JWT"
      status: implemented
      
  data_security:
    - control: "Encryption at Rest"
      implementation: "AES-256-GCM"
      status: implemented
      
    - control: "Encryption in Transit"
      implementation: "TLS 1.3"
      status: implemented
      
    - control: "Key Management"
      implementation: "HashiCorp Vault + AWS KMS"
      status: implemented
      
    - control: "Data Masking"
      implementation: "Dynamic masking for non-prod"
      status: implemented
      
  monitoring_logging:
    - control: "Audit Logging"
      implementation: "Comprehensive event logging"
      status: implemented
      
    - control: "SIEM"
      implementation: "Splunk / ELK Stack"
      status: implemented
      
    - control: "Alerting"
      implementation: "PagerDuty + Slack"
      status: implemented
      
    - control: "Log Integrity"
      implementation: "Cryptographic signing"
      status: implemented
```

### Appendix C: Compliance Mapping

```yaml
compliance_mapping:
  hipaa:
    administrative_safeguards:
      - "164.308(a)(1) - Security Management Process"
      - "164.308(a)(2) - Assigned Security Responsibilities"
      - "164.308(a)(3) - Workforce Security"
      - "164.308(a)(4) - Information Access Management"
      - "164.308(a)(5) - Security Awareness and Training"
      - "164.308(a)(6) - Security Incident Procedures"
      - "164.308(a)(7) - Contingency Plan"
      - "164.308(a)(8) - Evaluation"
      
    physical_safeguards:
      - "164.310(a)(1) - Facility Access Controls"
      - "164.310(b) - Workstation Use"
      - "164.310(c) - Workstation Security"
      - "164.310(d) - Device and Media Controls"
      
    technical_safeguards:
      - "164.312(a) - Access Control"
      - "164.312(b) - Audit Controls"
      - "164.312(c)(1) - Integrity"
      - "164.312(d) - Person or Entity Authentication"
      - "164.312(e) - Transmission Security"
      
  gdpr:
    articles:
      - "Article 5 - Principles"
      - "Article 6 - Lawfulness of Processing"
      - "Article 7 - Conditions for Consent"
      - "Article 15 - Right of Access"
      - "Article 16 - Right to Rectification"
      - "Article 17 - Right to Erasure"
      - "Article 18 - Right to Restriction"
      - "Article 20 - Right to Portability"
      - "Article 25 - Data Protection by Design"
      - "Article 32 - Security of Processing"
      - "Article 33 - Breach Notification"
      - "Article 35 - DPIA"
      
  soc2:
    trust_service_criteria:
      - "CC6.1 - Logical Access Security"
      - "CC6.2 - Access Removal"
      - "CC6.3 - Access Changes"
      - "CC6.6 - Encryption"
      - "CC6.7 - Transmission Security"
      - "CC7.2 - System Monitoring"
      - "CC7.3 - Incident Detection"
```

### Appendix D: Contact Information

```yaml
security_contacts:
  internal:
    - role: "Chief Information Security Officer"
      name: "[REDACTED]"
      email: "security@mindmate.ai"
      phone: "[REDACTED]"
      
    - role: "Security Operations Center"
      email: "soc@mindmate.ai"
      phone: "[REDACTED]"
      
    - role: "Incident Response Team"
      email: "irt@mindmate.ai"
      phone: "[REDACTED]"
      
  external:
    - role: "Legal Counsel"
      firm: "[REDACTED]"
      contact: "[REDACTED]"
      
    - role: "Cyber Insurance"
      provider: "[REDACTED]"
      policy: "[REDACTED]"
      
    - role: "Forensics Firm"
      company: "[REDACTED]"
      contact: "[REDACTED]"
      
  regulatory:
    - agency: "HHS Office for Civil Rights"
      purpose: "HIPAA breach reporting"
      contact: "https://ocrportal.hhs.gov/ocr/smartscreen/main.jsf"
      
    - agency: "State Attorney General"
      purpose: "Breach notification"
      contact: "Varies by state"
```

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024 | Security Team | Initial release |

### Review Schedule

- **Quarterly Review**: Security architecture review
- **Annual Review**: Full document review and update
- **Event-Driven Review**: After security incidents or major changes

### Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| CISO | [REDACTED] | 2024 | ___________ |
| CTO | [REDACTED] | 2024 | ___________ |
| Legal Counsel | [REDACTED] | 2024 | ___________ |

---

**END OF DOCUMENT**

*This document contains confidential and proprietary information. Unauthorized distribution is strictly prohibited.*
