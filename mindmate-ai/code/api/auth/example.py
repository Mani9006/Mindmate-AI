"""
MindMate AI - Authentication Module Example
Complete example of using the authentication module in a FastAPI application.
"""

from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# Import auth module
from mindmate_ai.auth import (
    # JWT
    JWTManager,
    JWTConfig,
    create_tokens,
    refresh_access_token,
    TokenType,
    
    # Middleware
    AuthMiddleware,
    AuthContext,
    get_current_auth,
    require_roles,
    require_permissions,
    create_auth_middleware,
    
    # Endpoints
    auth_router,
    
    # MFA
    MFAManager,
    MFAMethod,
    
    # OAuth
    OAuthManager,
    OAuthProvider,
    create_google_config,
    create_apple_config,
    
    # Password
    PasswordValidator,
    validate_password_strength,
    
    # Token Management
    create_token_manager,
)


# ============================================================================
# Application Setup
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    print("Starting up...")
    
    # Initialize JWT configuration
    JWTConfig.initialize(
        secret_key="your-super-secret-key-change-in-production-min-32-chars",
        refresh_secret_key="your-refresh-secret-key-different-from-access"
    )
    
    # Configure token expiration
    JWTConfig.ACCESS_TOKEN_EXPIRE_MINUTES = 15
    JWTConfig.REFRESH_TOKEN_EXPIRE_DAYS = 7
    JWTConfig.ISSUER = "mindmate-ai"
    JWTConfig.AUDIENCE = "mindmate-ai-api"
    
    # Initialize token manager (use Redis in production)
    app.state.token_manager = create_token_manager(use_redis=False)
    
    # Initialize MFA manager
    app.state.mfa_manager = MFAManager()
    
    # Initialize OAuth manager
    app.state.oauth_manager = OAuthManager()
    
    # Register OAuth providers (configure with real credentials)
    # google_config = create_google_config(
    #     client_id="your-google-client-id",
    #     client_secret="your-google-client-secret",
    #     redirect_uri="http://localhost:8000/auth/google/callback"
    # )
    # app.state.oauth_manager.register_provider(OAuthProvider.GOOGLE, google_config)
    
    yield
    
    # Shutdown
    print("Shutting down...")


# Create FastAPI app
app = FastAPI(
    title="MindMate AI API",
    description="Production-ready authentication example",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add authentication middleware
auth_middleware = create_auth_middleware(
    app,
    exclude_paths=[
        "/docs",
        "/redoc",
        "/openapi.json",
        "/health",
        "/api/v1/auth/login",
        "/api/v1/auth/register",
        "/api/v1/auth/refresh",
        "/api/v1/auth/forgot-password",
        "/api/v1/auth/reset-password",
        "/api/v1/auth/verify-email",
        "/api/v1/auth/oauth",
    ],
    rate_limit_enabled=True,
    rate_limit_requests=100,
    rate_limit_window=60,
)

# Include auth router
app.include_router(auth_router)


# ============================================================================
# Health Check
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "mindmate-ai-auth",
        "version": "1.0.0"
    }


# ============================================================================
# Protected Routes Examples
# ============================================================================

@app.get("/api/v1/profile")
async def get_profile(auth: AuthContext = Depends(get_current_auth)):
    """
    Get current user profile.
    
    Requires valid JWT access token.
    """
    return {
        "user_id": auth.user_id,
        "roles": auth.roles,
        "permissions": auth.permissions,
        "session_id": auth.session_id,
        "device_id": auth.device_id,
        "token_expires": auth.token_exp.isoformat(),
    }


@app.get("/api/v1/admin/dashboard")
async def admin_dashboard(
    auth: AuthContext = Depends(require_roles(["admin"]))
):
    """
    Admin dashboard - requires admin role.
    """
    return {
        "message": "Welcome to the admin dashboard",
        "user_id": auth.user_id,
        "admin_level": "full"
    }


@app.get("/api/v1/moderator/content")
async def moderator_content(
    auth: AuthContext = Depends(require_roles(["admin", "moderator"]))
):
    """
    Moderator content - requires admin or moderator role.
    """
    return {
        "message": "Moderator content access granted",
        "user_id": auth.user_id,
        "role": auth.roles[0] if auth.roles else None
    }


@app.post("/api/v1/content")
async def create_content(
    content: dict,
    auth: AuthContext = Depends(require_permissions(["write:content"]))
):
    """
    Create content - requires write:content permission.
    """
    return {
        "message": "Content created successfully",
        "content_id": "content_123",
        "created_by": auth.user_id
    }


@app.get("/api/v1/sensitive-data")
async def get_sensitive_data(
    auth: AuthContext = Depends(require_permissions(
        ["read:sensitive", "read:classified"],
        all_required=False
    ))
):
    """
    Get sensitive data - requires either read:sensitive OR read:classified.
    """
    return {
        "data": "highly sensitive information",
        "access_granted_to": auth.user_id,
        "permission_used": "read:sensitive" if auth.has_permission("read:sensitive") else "read:classified"
    }


# ============================================================================
# Manual Permission Checking
# ============================================================================

@app.put("/api/v1/users/{user_id}")
async def update_user(
    user_id: str,
    user_data: dict,
    auth: AuthContext = Depends(get_current_auth)
):
    """
    Update user - demonstrates manual permission checking.
    
    Users can update their own profile, or admins can update any profile.
    """
    # Check if user is updating their own profile
    is_own_profile = auth.user_id == user_id
    
    # Check if user has admin permission
    is_admin = auth.has_role("admin") or auth.has_permission("write:any:user")
    
    if not (is_own_profile or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own profile"
        )
    
    return {
        "message": "User updated successfully",
        "user_id": user_id,
        "updated_by": auth.user_id,
        "data": user_data
    }


@app.delete("/api/v1/users/{user_id}")
async def delete_user(
    user_id: str,
    auth: AuthContext = Depends(get_current_auth)
):
    """
    Delete user - only admins can delete users.
    """
    if not auth.has_role("admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete users"
        )
    
    # Prevent self-deletion
    if auth.user_id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account through this endpoint"
        )
    
    return {
        "message": "User deleted successfully",
        "deleted_user_id": user_id,
        "deleted_by": auth.user_id
    }


# ============================================================================
# Token Management Examples
# ============================================================================

@app.post("/api/v1/tokens/revoke-all")
async def revoke_all_tokens(
    auth: AuthContext = Depends(get_current_auth)
):
    """
    Revoke all tokens for current user.
    
    Useful for "Logout from all devices" functionality.
    """
    jwt_manager = JWTManager()
    
    # Revoke all JWT tokens
    revoked_count = jwt_manager.revoke_all_user_tokens(auth.user_id)
    
    # Revoke all refresh tokens
    token_manager = app.state.token_manager
    sessions_terminated = token_manager.revoke_all_user_tokens(
        auth.user_id,
        reason="user_revoke_all"
    )
    
    return {
        "message": "All tokens revoked successfully",
        "tokens_revoked": revoked_count,
        "sessions_terminated": sessions_terminated
    }


@app.get("/api/v1/tokens/info")
async def get_token_info(
    auth: AuthContext = Depends(get_current_auth)
):
    """
    Get information about the current token.
    """
    return {
        "user_id": auth.user_id,
        "roles": auth.roles,
        "permissions": auth.permissions,
        "session_id": auth.session_id,
        "device_id": auth.device_id,
        "token_jti": auth.token_jti,
        "token_expires": auth.token_exp.isoformat(),
        "is_expired": auth.token_exp < __import__('datetime').datetime.now(__import__('datetime').timezone.utc),
        "custom_claims": auth.custom_claims,
    }


# ============================================================================
# Session Management Examples
# ============================================================================

@app.get("/api/v1/sessions/active")
async def get_active_sessions(
    auth: AuthContext = Depends(get_current_auth)
):
    """
    Get all active sessions for the current user.
    """
    token_manager = app.state.token_manager
    sessions = token_manager.get_user_sessions(auth.user_id)
    
    return {
        "sessions": sessions,
        "current_session_id": auth.session_id
    }


@app.delete("/api/v1/sessions/{session_id}")
async def terminate_session(
    session_id: str,
    auth: AuthContext = Depends(get_current_auth)
):
    """
    Terminate a specific session.
    
    Users can only terminate their own sessions.
    """
    token_manager = app.state.token_manager
    
    # Get user's sessions
    sessions = token_manager.get_user_sessions(auth.user_id)
    
    # Check if session belongs to user
    session_exists = any(s['session_id'] == session_id for s in sessions)
    
    if not session_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Revoke the session
    success = token_manager.revoke_session(auth.user_id, session_id)
    
    if success:
        return {
            "message": "Session terminated successfully",
            "session_id": session_id
        }
    
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Failed to terminate session"
    )


# ============================================================================
# Password Validation Example
# ============================================================================

@app.post("/api/v1/password/validate")
async def validate_password(password: str, username: str = "", email: str = ""):
    """
    Validate password strength.
    
    Useful for client-side validation feedback.
    """
    result = validate_password_strength(password, username, email)
    
    return result


@app.post("/api/v1/password/generate")
async def generate_password(length: int = 16):
    """
    Generate a secure random password.
    """
    from mindmate_ai.auth import generate_secure_password
    
    password = generate_secure_password(length)
    
    # Validate the generated password
    validation = validate_password_strength(password)
    
    return {
        "password": password,
        "validation": validation
    }


# ============================================================================
# OAuth Callback Examples
# ============================================================================

@app.get("/auth/google/callback")
async def google_callback(
    code: str = None,
    error: str = None,
    state: str = None
):
    """
    Google OAuth callback handler.
    
    In production, exchange the code for tokens and create/login user.
    """
    if error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth error: {error}"
        )
    
    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Authorization code not provided"
        )
    
    oauth_manager = app.state.oauth_manager
    
    try:
        # Exchange code for user info
        user_info = await oauth_manager.exchange_code(OAuthProvider.GOOGLE, code)
        
        # Create or login user (implement your logic)
        # ...
        
        return {
            "message": "OAuth login successful",
            "email": user_info.email,
            "provider": user_info.provider
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth failed: {str(e)}"
        )


@app.post("/auth/apple/callback")
async def apple_callback(
    code: str = None,
    id_token: str = None,
    user: str = None,  # Apple sends user data as JSON string on first auth
    error: str = None
):
    """
    Apple OAuth callback handler.
    
    Apple uses POST for callbacks.
    """
    if error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth error: {error}"
        )
    
    oauth_manager = app.state.oauth_manager
    
    try:
        if id_token:
            # Verify ID token directly
            user_info = await oauth_manager.verify_id_token(
                OAuthProvider.APPLE,
                id_token
            )
        elif code:
            # Exchange code for tokens
            user_info = await oauth_manager.exchange_code(
                OAuthProvider.APPLE,
                code
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No token or code provided"
            )
        
        # Parse user name if available (first auth only)
        name_info = oauth_manager.parse_user_name_from_apple_callback(user)
        
        # Create or login user (implement your logic)
        # ...
        
        return {
            "message": "Apple login successful",
            "email": user_info.email,
            "first_name": name_info.get("first_name"),
            "last_name": name_info.get("last_name")
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth failed: {str(e)}"
        )


# ============================================================================
# Run the Application
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "example:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
