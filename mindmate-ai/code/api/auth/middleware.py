"""
MindMate AI - Authentication Middleware
Production-ready middleware for FastAPI/Starlette with comprehensive auth features.
"""

import jwt
import re
import ipaddress
from typing import Optional, List, Dict, Any, Callable, Set
from dataclasses import dataclass
from enum import Enum
from functools import wraps
import logging
from datetime import datetime, timezone

# FastAPI/Starlette imports
from fastapi import Request, Response, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

# Import our JWT module
from .jwt import JWTManager, TokenType, JWTConfig

logger = logging.getLogger(__name__)


class AuthError(Enum):
    """Authentication error types."""
    MISSING_TOKEN = "missing_token"
    INVALID_TOKEN = "invalid_token"
    EXPIRED_TOKEN = "expired_token"
    REVOKED_TOKEN = "revoked_token"
    INSUFFICIENT_PERMISSIONS = "insufficient_permissions"
    INVALID_ISSUER = "invalid_issuer"
    INVALID_AUDIENCE = "invalid_audience"
    MFA_REQUIRED = "mfa_required"
    ACCOUNT_LOCKED = "account_locked"
    RATE_LIMITED = "rate_limited"


@dataclass
class AuthContext:
    """Authentication context for request."""
    user_id: str
    roles: List[str]
    permissions: List[str]
    session_id: Optional[str]
    device_id: Optional[str]
    token_jti: str
    token_exp: datetime
    is_authenticated: bool = True
    mfa_verified: bool = False
    custom_claims: Dict[str, Any] = None
    
    def has_role(self, role: str) -> bool:
        """Check if user has specific role."""
        return role in self.roles
    
    def has_permission(self, permission: str) -> bool:
        """Check if user has specific permission."""
        return permission in self.permissions
    
    def has_any_role(self, roles: List[str]) -> bool:
        """Check if user has any of the specified roles."""
        return any(r in self.roles for r in roles)
    
    def has_all_permissions(self, permissions: List[str]) -> bool:
        """Check if user has all specified permissions."""
        return all(p in self.permissions for p in permissions)


class RateLimiter:
    """Simple in-memory rate limiter."""
    
    def __init__(self):
        self._requests: Dict[str, List[datetime]] = {}
    
    def is_allowed(
        self,
        key: str,
        max_requests: int = 100,
        window_seconds: int = 60
    ) -> bool:
        """Check if request is within rate limit."""
        now = datetime.now(timezone.utc)
        window_start = now.timestamp() - window_seconds
        
        # Get existing requests for this key
        requests = self._requests.get(key, [])
        
        # Filter to only recent requests
        recent_requests = [
            r for r in requests
            if r.timestamp() > window_start
        ]
        
        # Check limit
        if len(recent_requests) >= max_requests:
            self._requests[key] = recent_requests
            return False
        
        # Add current request
        recent_requests.append(now)
        self._requests[key] = recent_requests
        
        return True


class AuthMiddleware(BaseHTTPMiddleware):
    """
    Production-ready authentication middleware.
    
    Features:
    - JWT token validation
    - Role-based access control
    - Permission-based access control
    - Rate limiting
    - IP whitelisting/blacklisting
    - Request logging
    """
    
    def __init__(
        self,
        app: ASGIApp,
        jwt_manager: Optional[JWTManager] = None,
        exclude_paths: Optional[List[str]] = None,
        require_auth_paths: Optional[List[str]] = None,
        rate_limit_enabled: bool = True,
        rate_limit_requests: int = 100,
        rate_limit_window: int = 60,
        ip_whitelist: Optional[List[str]] = None,
        ip_blacklist: Optional[List[str]] = None,
        custom_auth_header: str = "Authorization",
    ):
        super().__init__(app)
        self.jwt_manager = jwt_manager or JWTManager()
        self.exclude_paths = set(exclude_paths or [])
        self.require_auth_paths = set(require_auth_paths or ["/api"])
        self.rate_limit_enabled = rate_limit_enabled
        self.rate_limit_requests = rate_limit_requests
        self.rate_limit_window = rate_limit_window
        self.ip_whitelist = set(ip_whitelist or [])
        self.ip_blacklist = set(ip_blacklist or [])
        self.custom_auth_header = custom_auth_header
        self.rate_limiter = RateLimiter()
    
    def _is_path_excluded(self, path: str) -> bool:
        """Check if path is excluded from auth."""
        for excluded in self.exclude_paths:
            if path.startswith(excluded) or re.match(excluded, path):
                return True
        return False
    
    def _is_path_protected(self, path: str) -> bool:
        """Check if path requires authentication."""
        for protected in self.require_auth_paths:
            if path.startswith(protected) or re.match(protected, path):
                return True
        return False
    
    def _check_ip_restrictions(self, client_ip: str) -> bool:
        """Check if IP is allowed."""
        # Check blacklist first
        for blocked in self.ip_blacklist:
            if self._ip_matches(client_ip, blocked):
                return False
        
        # If whitelist exists, IP must be in it
        if self.ip_whitelist:
            for allowed in self.ip_whitelist:
                if self._ip_matches(client_ip, allowed):
                    return True
            return False
        
        return True
    
    def _ip_matches(self, ip: str, pattern: str) -> bool:
        """Check if IP matches pattern (supports CIDR)."""
        try:
            if "/" in pattern:
                return ipaddress.ip_address(ip) in ipaddress.ip_network(pattern)
            return ip == pattern
        except ValueError:
            return ip == pattern
    
    def _extract_token(self, request: Request) -> Optional[str]:
        """Extract JWT token from request."""
        # Check Authorization header
        auth_header = request.headers.get(self.custom_auth_header)
        if auth_header:
            parts = auth_header.split()
            if len(parts) == 2 and parts[0].lower() == "bearer":
                return parts[1]
            # Support token without Bearer prefix
            return auth_header
        
        # Check query parameter (for WebSocket connections)
        token = request.query_params.get("token")
        if token:
            return token
        
        # Check cookie
        token = request.cookies.get("access_token")
        if token:
            return token
        
        return None
    
    async def dispatch(self, request: Request, call_next) -> Response:
        """Process request through middleware."""
        path = request.url.path
        client_ip = request.client.host if request.client else "unknown"
        
        # Check IP restrictions
        if not self._check_ip_restrictions(client_ip):
            logger.warning(f"Blocked request from blacklisted IP: {client_ip}")
            return Response(
                content='{"detail": "Access denied"}',
                status_code=403,
                media_type="application/json"
            )
        
        # Check rate limiting
        if self.rate_limit_enabled:
            rate_key = f"{client_ip}:{path}"
            if not self.rate_limiter.is_allowed(
                rate_key,
                self.rate_limit_requests,
                self.rate_limit_window
            ):
                return Response(
                    content='{"detail": "Rate limit exceeded"}',
                    status_code=429,
                    media_type="application/json"
                )
        
        # Skip auth for excluded paths
        if self._is_path_excluded(path):
            request.state.auth = None
            return await call_next(request)
        
        # Extract and validate token for protected paths
        if self._is_path_protected(path):
            token = self._extract_token(request)
            
            if not token:
                return Response(
                    content='{"detail": "Authentication required"}',
                    status_code=401,
                    media_type="application/json"
                )
            
            try:
                payload = self.jwt_manager.validate_token(token, TokenType.ACCESS)
                
                # Create auth context
                auth_context = AuthContext(
                    user_id=payload.get("sub"),
                    roles=payload.get("roles", []),
                    permissions=payload.get("permissions", []),
                    session_id=payload.get("session_id"),
                    device_id=payload.get("device_id"),
                    token_jti=payload.get("jti"),
                    token_exp=datetime.fromtimestamp(payload.get("exp"), tz=timezone.utc),
                    mfa_verified=payload.get("mfa_verified", False),
                    custom_claims={k: v for k, v in payload.items() 
                                   if k not in ["sub", "type", "jti", "iat", "exp", 
                                               "iss", "aud", "roles", "permissions",
                                               "session_id", "device_id", "mfa_verified"]}
                )
                
                request.state.auth = auth_context
                
            except jwt.ExpiredSignatureError:
                return Response(
                    content='{"detail": "Token has expired"}',
                    status_code=401,
                    media_type="application/json"
                )
            except jwt.InvalidTokenError as e:
                logger.warning(f"Invalid token from {client_ip}: {e}")
                return Response(
                    content=f'"detail": "Invalid token: {str(e)}"',
                    status_code=401,
                    media_type="application/json"
                )
            except ValueError as e:
                return Response(
                    content=f'"detail": "{str(e)}"',
                    status_code=401,
                    media_type="application/json"
                )
        
        return await call_next(request)


# Security scheme for FastAPI docs
security_scheme = HTTPBearer(
    scheme_name="JWT",
    description="Enter JWT Bearer token",
    auto_error=False
)


async def get_current_auth(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme)
) -> AuthContext:
    """
    Dependency to get current authentication context.
    
    Usage:
        @app.get("/protected")
        async def protected_route(auth: AuthContext = Depends(get_current_auth)):
            return {"user_id": auth.user_id}
    """
    # Check if middleware already processed auth
    auth = getattr(request.state, "auth", None)
    if auth:
        return auth
    
    # If not, validate token from credentials
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    jwt_manager = JWTManager()
    
    try:
        payload = jwt_manager.validate_token(token, TokenType.ACCESS)
        
        return AuthContext(
            user_id=payload.get("sub"),
            roles=payload.get("roles", []),
            permissions=payload.get("permissions", []),
            session_id=payload.get("session_id"),
            device_id=payload.get("device_id"),
            token_jti=payload.get("jti"),
            token_exp=datetime.fromtimestamp(payload.get("exp"), tz=timezone.utc),
            mfa_verified=payload.get("mfa_verified", False),
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_optional_auth(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme)
) -> Optional[AuthContext]:
    """Get optional authentication context (returns None if not authenticated)."""
    try:
        return await get_current_auth(request, credentials)
    except HTTPException:
        return None


def require_roles(required_roles: List[str]):
    """
    Decorator/dependency factory to require specific roles.
    
    Usage:
        @app.get("/admin")
        async def admin_route(
            auth: AuthContext = Depends(require_roles(["admin"]))
        ):
            return {"message": "Admin access granted"}
    """
    async def role_checker(
        auth: AuthContext = Depends(get_current_auth)
    ) -> AuthContext:
        if not auth.has_any_role(required_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Required roles: {', '.join(required_roles)}"
            )
        return auth
    return role_checker


def require_permissions(required_permissions: List[str], all_required: bool = True):
    """
    Decorator/dependency factory to require specific permissions.
    
    Usage:
        @app.get("/data")
        async def data_route(
            auth: AuthContext = Depends(require_permissions(["read:data"]))
        ):
            return {"data": "sensitive"}
    """
    async def permission_checker(
        auth: AuthContext = Depends(get_current_auth)
    ) -> AuthContext:
        if all_required:
            if not auth.has_all_permissions(required_permissions):
                missing = [p for p in required_permissions if not auth.has_permission(p)]
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Missing permissions: {', '.join(missing)}"
                )
        else:
            if not any(auth.has_permission(p) for p in required_permissions):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Need one of: {', '.join(required_permissions)}"
                )
        return auth
    return permission_checker


def require_mfa_verified():
    """Require MFA to be verified for the current session."""
    async def mfa_checker(
        auth: AuthContext = Depends(get_current_auth)
    ) -> AuthContext:
        if not auth.mfa_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="MFA verification required",
                headers={"X-MFA-Required": "true"},
            )
        return auth
    return mfa_checker


class PermissionChecker:
    """Advanced permission checking with resource-level permissions."""
    
    def __init__(self, auth: AuthContext):
        self.auth = auth
    
    def can(self, action: str, resource: str, resource_id: Optional[str] = None) -> bool:
        """
        Check if user can perform action on resource.
        
        Supports patterns like:
        - can("read", "users") - global permission
        - can("read", "users", "123") - resource-specific permission
        """
        # Check global permission
        global_perm = f"{action}:{resource}"
        if self.auth.has_permission(global_perm):
            return True
        
        # Check resource-specific permission
        if resource_id:
            specific_perm = f"{action}:{resource}:{resource_id}"
            if self.auth.has_permission(specific_perm):
                return True
        
        # Check wildcard permissions
        wildcard_perm = f"{action}:*"
        if self.auth.has_permission(wildcard_perm):
            return True
        
        # Check admin override
        if self.auth.has_permission("*:*") or self.auth.has_role("admin"):
            return True
        
        return False
    
    def authorize(
        self,
        action: str,
        resource: str,
        resource_id: Optional[str] = None
    ) -> None:
        """Authorize action or raise exception."""
        if not self.can(action, resource, resource_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Cannot {action} {resource}" + (f" {resource_id}" if resource_id else "")
            )


def create_auth_middleware(
    app: ASGIApp,
    exclude_paths: Optional[List[str]] = None,
    **kwargs
) -> AuthMiddleware:
    """Factory function to create auth middleware with common settings."""
    default_excluded = [
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
    ]
    
    exclude_paths = list(set(default_excluded + (exclude_paths or [])))
    
    return AuthMiddleware(
        app=app,
        exclude_paths=exclude_paths,
        **kwargs
    )


# Request context helper
def get_auth_from_request(request: Request) -> Optional[AuthContext]:
    """Get auth context from request state."""
    return getattr(request.state, "auth", None)


def set_auth_on_request(request: Request, auth: AuthContext) -> None:
    """Set auth context on request state."""
    request.state.auth = auth
