# MindMate AI - Authentication Module

Production-ready authentication system for MindMate AI with comprehensive security features.

## Features

- **JWT Token Management**: Access and refresh tokens with configurable expiration
- **Refresh Token Rotation**: Secure token rotation with family-based revocation
- **Authentication Middleware**: FastAPI/Starlette middleware with role/permission checking
- **User Registration**: Full registration flow with email verification
- **User Login**: Secure login with account lockout protection
- **Password Reset**: Complete password reset flow with rate limiting
- **Multi-Factor Authentication (MFA)**: TOTP, SMS, and Email-based MFA
- **OAuth Integration**: Google and Apple Sign-In support

## Installation

```bash
pip install pyjwt httpx argon2-cffi bcrypt redis
```

## Quick Start

### 1. Basic Setup

```python
from fastapi import FastAPI
from mindmate_ai.auth import (
    initialize_auth,
    create_auth_middleware,
    auth_router,
    JWTConfig,
)

app = FastAPI()

# Initialize JWT configuration
initialize_auth(
    secret_key="your-secret-key-here",
    refresh_secret_key="your-refresh-secret-key",
    access_token_expire_minutes=15,
    refresh_token_expire_days=7,
)

# Add authentication middleware
from starlette.middleware import Middleware
from starlette.middleware.base import BaseHTTPMiddleware

auth_middleware = create_auth_middleware(
    app,
    exclude_paths=["/health", "/docs"]
)
app.add_middleware(type(auth_middleware))

# Include auth endpoints
app.include_router(auth_router)
```

### 2. Environment Variables

```bash
# Required
JWT_SECRET_KEY=your-super-secret-key-min-32-chars

# Optional
JWT_REFRESH_SECRET_KEY=your-refresh-secret-key
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7
JWT_ISSUER=mindmate-ai
JWT_AUDIENCE=mindmate-ai-api

# OAuth (optional)
GOOGLE_OAUTH_ENABLED=true
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://yourapp.com/auth/callback

APPLE_OAUTH_ENABLED=true
APPLE_CLIENT_ID=your-apple-client-id
APPLE_TEAM_ID=your-team-id
APPLE_KEY_ID=your-key-id
APPLE_PRIVATE_KEY="-----BEGIN EC PRIVATE KEY-----\n..."

# Redis (optional, for production)
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

## Usage Examples

### JWT Token Operations

```python
from mindmate_ai.auth import (
    JWTManager,
    create_tokens,
    refresh_access_token,
    TokenType,
)

# Generate tokens for a user
tokens = create_tokens(
    user_id="user_123",
    roles=["user"],
    permissions=["read:profile"],
    session_id="session_456",
    device_id="device_789"
)

print(tokens)
# {
#     "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
#     "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
#     "token_type": "Bearer",
#     "expires_in": 900
# }

# Validate access token
jwt_manager = JWTManager()
payload = jwt_manager.validate_token(tokens["access_token"], TokenType.ACCESS)
print(payload["sub"])  # user_123

# Refresh tokens
new_tokens = refresh_access_token(tokens["refresh_token"])
```

### Protected Routes

```python
from fastapi import Depends, HTTPException
from mindmate_ai.auth import (
    get_current_auth,
    require_roles,
    require_permissions,
    AuthContext,
)

# Basic protected route
@app.get("/profile")
async def get_profile(auth: AuthContext = Depends(get_current_auth)):
    return {"user_id": auth.user_id, "email": auth.email}

# Role-based protection
@app.get("/admin")
async def admin_route(
    auth: AuthContext = Depends(require_roles(["admin"]))
):
    return {"message": "Admin access granted"}

# Permission-based protection
@app.get("/sensitive-data")
async def sensitive_data(
    auth: AuthContext = Depends(require_permissions(["read:sensitive"]))
):
    return {"data": "sensitive information"}

# Check permissions manually
@app.post("/resource/{resource_id}")
async def create_resource(
    resource_id: str,
    auth: AuthContext = Depends(get_current_auth)
):
    if not auth.has_permission(f"write:resource:{resource_id}"):
        raise HTTPException(status_code=403, detail="Permission denied")
    # ...
```

### User Registration

```python
from mindmate_ai.auth.endpoints import UserRegistrationRequest

# POST /api/v1/auth/register
{
    "email": "user@example.com",
    "password": "SecureP@ssw0rd123",
    "first_name": "John",
    "last_name": "Doe",
    "accept_terms": true
}

# Response
{
    "user_id": "usr_abc123",
    "email": "user@example.com",
    "message": "Registration successful. Please check your email.",
    "email_verification_sent": true,
    "requires_email_verification": true
}
```

### User Login

```python
# POST /api/v1/auth/login
{
    "email": "user@example.com",
    "password": "SecureP@ssw0rd123",
    "device_id": "device_123",
    "device_info": {
        "type": "mobile",
        "os": "iOS 16",
        "app_version": "1.0.0"
    }
}

# Response (without MFA)
{
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "token_type": "Bearer",
    "expires_in": 900,
    "user_id": "usr_abc123",
    "email": "user@example.com",
    "roles": ["user"],
    "mfa_required": false
}

# Response (with MFA required)
{
    "access_token": "",
    "refresh_token": "",
    "token_type": "Bearer",
    "expires_in": 0,
    "user_id": "usr_abc123",
    "email": "user@example.com",
    "roles": ["user"],
    "mfa_required": true,
    "mfa_methods": ["totp", "email"]
}
```

### Password Reset

```python
# Request password reset
# POST /api/v1/auth/forgot-password
{
    "email": "user@example.com"
}

# Response (always success to prevent email enumeration)
{
    "message": "If an account exists with this email, you will receive password reset instructions."
}

# Reset password with token
# POST /api/v1/auth/reset-password
{
    "token": "reset_token_from_email",
    "new_password": "NewSecureP@ssw0rd456",
    "confirm_password": "NewSecureP@ssw0rd456"
}

# Response
{
    "message": "Password reset successful. Please log in with your new password."
}
```

### Multi-Factor Authentication (MFA)

#### Setup TOTP (Authenticator App)

```python
# POST /api/v1/auth/mfa/setup (requires authentication)
{
    "method": "totp"
}

# Response
{
    "method": "totp",
    "secret": "JBSWY3DPEHPK3PXP",
    "qr_code_uri": "otpauth://totp/MindMate%20AI:user_id?secret=JBSWY3DPEHPK3PXP&issuer=MindMate%20AI",
    "backup_codes": ["ABCD-1234", "EFGH-5678", "..."],
    "message": "Scan the QR code with your authenticator app and verify with a code."
}

# Verify setup
# POST /api/v1/auth/mfa/verify
{
    "method": "totp",
    "code": "123456"
}

# Response
{
    "verified": true,
    "message": "MFA setup successful"
}
```

#### Login with MFA

```python
# POST /api/v1/auth/login
{
    "email": "user@example.com",
    "password": "SecureP@ssw0rd123",
    "mfa_code": "123456"
}
```

### OAuth Login

#### Google Sign-In

```python
# 1. Get authorization URL
# GET /api/v1/auth/oauth/google/url?redirect_uri=https://yourapp.com/callback

# Response
{
    "authorization_url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=..."
}

# 2. Exchange code for tokens (after user authenticates)
# POST /api/v1/auth/oauth/login
{
    "provider": "google",
    "code": "authorization_code_from_callback",
    "device_id": "device_123",
    "device_info": {"type": "web"}
}

# Response
{
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "token_type": "Bearer",
    "expires_in": 900,
    "user_id": "usr_abc123",
    "email": "user@gmail.com",
    "is_new_user": false,
    "roles": ["user"]
}
```

#### Apple Sign-In

```python
# 1. Get authorization URL
# GET /api/v1/auth/oauth/apple/url?redirect_uri=https://yourapp.com/callback

# 2. Exchange code for tokens
# POST /api/v1/auth/oauth/login
{
    "provider": "apple",
    "code": "authorization_code_from_callback",
    "device_id": "device_123"
}
```

### Session Management

```python
# Get active sessions (requires authentication)
# GET /api/v1/auth/sessions

# Response
{
    "sessions": [
        {
            "session_id": "sess_abc123",
            "device_id": "device_456",
            "device_info": {"type": "mobile", "os": "iOS 16"},
            "ip_address": "192.168.1.1",
            "created_at": "2024-01-15T10:30:00+00:00",
            "expires_at": "2024-01-22T10:30:00+00:00"
        }
    ]
}

# Revoke specific session
# DELETE /api/v1/auth/sessions/{session_id}

# Logout
# POST /api/v1/auth/logout
{
    "logout_all_devices": false
}
```

## Advanced Configuration

### Custom Password Policy

```python
from mindmate_ai.auth import PasswordPolicy, PasswordValidator

policy = PasswordPolicy(
    min_length=16,
    require_uppercase=True,
    require_lowercase=True,
    require_digits=True,
    require_special=True,
    prevent_common_passwords=True,
    password_history_count=10
)

validator = PasswordValidator(policy)
result = validator.validate("MyP@ssw0rd123")
print(result)
# {
#     "valid": true,
#     "strength": "STRONG",
#     "strength_score": 4,
#     "errors": [],
#     "suggestions": []
# }
```

### Redis Token Storage (Production)

```python
from mindmate_ai.auth import create_token_manager

# Configure Redis token manager
token_manager = create_token_manager(
    use_redis=True,
    redis_config={
        "host": "redis.example.com",
        "port": 6379,
        "password": "your-redis-password",
        "ssl": True,
        "key_prefix": "mindmate:auth:"
    }
)

# Now tokens are stored in Redis with automatic expiration
```

### Custom OAuth Configuration

```python
from mindmate_ai.auth import (
    OAuthManager,
    create_google_config,
    create_apple_config,
)

# Create OAuth manager
oauth_manager = OAuthManager()

# Register Google
google_config = create_google_config(
    client_id="your-google-client-id",
    client_secret="your-google-client-secret",
    redirect_uri="https://yourapp.com/auth/google/callback"
)
oauth_manager.register_provider(OAuthProvider.GOOGLE, google_config)

# Register Apple
apple_config = create_apple_config(
    client_id="your-apple-client-id",
    redirect_uri="https://yourapp.com/auth/apple/callback"
)
oauth_manager.register_provider(
    OAuthProvider.APPLE,
    apple_config,
    team_id="your-team-id",
    key_id="your-key-id",
    private_key="""-----BEGIN EC PRIVATE KEY-----
...
-----END EC PRIVATE KEY-----"""
)
```

## Security Best Practices

1. **Always use HTTPS in production**
2. **Store secrets securely** (AWS Secrets Manager, HashiCorp Vault, etc.)
3. **Use different secrets for access and refresh tokens**
4. **Enable Redis for token storage in production**
5. **Configure appropriate CORS origins**
6. **Set up rate limiting**
7. **Monitor for suspicious activity**
8. **Regularly rotate JWT secrets**
9. **Use strong password policies**
10. **Enable MFA for sensitive accounts**

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/auth/register` | Register new user | No |
| POST | `/api/v1/auth/login` | User login | No |
| POST | `/api/v1/auth/refresh` | Refresh tokens | No |
| POST | `/api/v1/auth/logout` | Logout | Yes |
| POST | `/api/v1/auth/forgot-password` | Request password reset | No |
| POST | `/api/v1/auth/reset-password` | Reset password | No |
| POST | `/api/v1/auth/change-password` | Change password | Yes |
| POST | `/api/v1/auth/mfa/setup` | Setup MFA | Yes |
| POST | `/api/v1/auth/mfa/verify` | Verify MFA setup | Yes |
| POST | `/api/v1/auth/mfa/disable` | Disable MFA | Yes |
| POST | `/api/v1/auth/oauth/login` | OAuth login | No |
| GET | `/api/v1/auth/oauth/{provider}/url` | Get OAuth URL | No |
| GET | `/api/v1/auth/sessions` | List sessions | Yes |
| DELETE | `/api/v1/auth/sessions/{id}` | Revoke session | Yes |
| GET | `/api/v1/auth/verify-email` | Verify email | No |
| POST | `/api/v1/auth/resend-verification` | Resend verification | No |

## Testing

```python
import pytest
from fastapi.testclient import TestClient
from mindmate_ai.auth import initialize_auth

# Setup test client
@pytest.fixture
def client():
    from fastapi import FastAPI
    from mindmate_ai.auth import auth_router, create_auth_middleware
    
    app = FastAPI()
    initialize_auth("test-secret-key")
    app.include_router(auth_router)
    
    return TestClient(app)

def test_register(client):
    response = client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "password": "TestP@ssw0rd123",
        "first_name": "Test",
        "last_name": "User",
        "accept_terms": True
    })
    assert response.status_code == 201
    assert "user_id" in response.json()

def test_login(client):
    response = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "TestP@ssw0rd123"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()
```

## License

MIT License - MindMate AI
