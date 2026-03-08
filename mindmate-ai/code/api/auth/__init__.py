"""
MindMate AI - Authentication Module
Production-ready authentication system for MindMate AI.

This module provides:
- JWT token generation and validation
- Refresh token rotation
- Authentication middleware
- User registration and login endpoints
- Password reset flow
- Multi-factor authentication (MFA)
- OAuth integration (Google, Apple)

Usage:
    from mindmate_ai.auth import (
        JWTManager,
        JWTConfig,
        create_tokens,
        refresh_access_token,
        AuthMiddleware,
        get_current_auth,
        require_roles,
        require_permissions,
        MFAManager,
        OAuthManager,
        PasswordResetManager,
    )
"""

# JWT Module
from .jwt import (
    JWTManager,
    JWTConfig,
    TokenType,
    TokenPayload,
    create_tokens,
    refresh_access_token,
    decode_token_without_verification,
)

# Refresh Token Module
from .refresh_token import (
    RefreshTokenManager,
    RefreshTokenMetadata,
    TokenStatus,
    create_token_manager,
    RedisTokenStore,
    InMemoryTokenStore,
)

# Middleware Module
from .middleware import (
    AuthMiddleware,
    AuthContext,
    AuthError,
    get_current_auth,
    get_optional_auth,
    require_roles,
    require_permissions,
    require_mfa_verified,
    PermissionChecker,
    create_auth_middleware,
    get_auth_from_request,
    set_auth_on_request,
)

# MFA Module
from .mfa import (
    MFAManager,
    MFAMethod,
    MFASecret,
    TOTPGenerator,
    generate_totp_qr_code,
    create_mfa_manager,
)

# OAuth Module
from .oauth import (
    OAuthManager,
    OAuthProvider,
    OAuthConfig,
    OAuthUserInfo,
    GoogleOAuthProvider,
    AppleOAuthProvider,
    create_oauth_manager,
    create_google_config,
    create_apple_config,
)

# Password Reset Module
from .password_reset import (
    PasswordResetManager,
    PasswordValidator,
    PasswordPolicy,
    PasswordStrength,
    PasswordHistory,
    validate_password_strength,
    generate_secure_password,
    create_password_reset_manager,
)

# Endpoints (when using FastAPI)
from .endpoints import router as auth_router

__version__ = "1.0.0"
__author__ = "MindMate AI"

__all__ = [
    # JWT
    "JWTManager",
    "JWTConfig",
    "TokenType",
    "TokenPayload",
    "create_tokens",
    "refresh_access_token",
    "decode_token_without_verification",
    
    # Refresh Token
    "RefreshTokenManager",
    "RefreshTokenMetadata",
    "TokenStatus",
    "create_token_manager",
    "RedisTokenStore",
    "InMemoryTokenStore",
    
    # Middleware
    "AuthMiddleware",
    "AuthContext",
    "AuthError",
    "get_current_auth",
    "get_optional_auth",
    "require_roles",
    "require_permissions",
    "require_mfa_verified",
    "PermissionChecker",
    "create_auth_middleware",
    "get_auth_from_request",
    "set_auth_on_request",
    
    # MFA
    "MFAManager",
    "MFAMethod",
    "MFASecret",
    "TOTPGenerator",
    "generate_totp_qr_code",
    "create_mfa_manager",
    
    # OAuth
    "OAuthManager",
    "OAuthProvider",
    "OAuthConfig",
    "OAuthUserInfo",
    "GoogleOAuthProvider",
    "AppleOAuthProvider",
    "create_oauth_manager",
    "create_google_config",
    "create_apple_config",
    
    # Password Reset
    "PasswordResetManager",
    "PasswordValidator",
    "PasswordPolicy",
    "PasswordStrength",
    "PasswordHistory",
    "validate_password_strength",
    "generate_secure_password",
    "create_password_reset_manager",
    
    # Endpoints
    "auth_router",
]


def initialize_auth(
    secret_key: str,
    refresh_secret_key: Optional[str] = None,
    access_token_expire_minutes: int = 15,
    refresh_token_expire_days: int = 7,
    issuer: str = "mindmate-ai",
    audience: str = "mindmate-ai-api",
) -> None:
    """
    Initialize authentication module with configuration.
    
    Args:
        secret_key: Secret key for signing access tokens
        refresh_secret_key: Secret key for signing refresh tokens (defaults to secret_key)
        access_token_expire_minutes: Access token expiry in minutes
        refresh_token_expire_days: Refresh token expiry in days
        issuer: JWT issuer claim
        audience: JWT audience claim
    """
    JWTConfig.initialize(secret_key, refresh_secret_key)
    JWTConfig.ACCESS_TOKEN_EXPIRE_MINUTES = access_token_expire_minutes
    JWTConfig.REFRESH_TOKEN_EXPIRE_DAYS = refresh_token_expire_days
    JWTConfig.ISSUER = issuer
    JWTConfig.AUDIENCE = audience


def create_app_with_auth(
    app,
    secret_key: str,
    refresh_secret_key: Optional[str] = None,
    exclude_paths: Optional[list] = None,
) -> None:
    """
    Configure FastAPI/Starlette app with authentication.
    
    Args:
        app: FastAPI/Starlette application
        secret_key: Secret key for JWT signing
        refresh_secret_key: Secret key for refresh tokens
        exclude_paths: Paths to exclude from authentication
    """
    from fastapi import FastAPI
    
    # Initialize JWT config
    initialize_auth(secret_key, refresh_secret_key)
    
    # Add middleware
    middleware = create_auth_middleware(app, exclude_paths=exclude_paths)
    app.add_middleware(type(middleware))
    
    # Include auth router
    if isinstance(app, FastAPI):
        app.include_router(auth_router)


# Type hints for better IDE support
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from fastapi import FastAPI
