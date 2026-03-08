"""
MindMate AI - JWT Generation and Validation Module
Production-ready JWT implementation with access and refresh tokens.
"""

import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Tuple
from functools import wraps
import secrets
import hashlib
from dataclasses import dataclass
from enum import Enum


class TokenType(Enum):
    ACCESS = "access"
    REFRESH = "refresh"
    PASSWORD_RESET = "password_reset"
    EMAIL_VERIFICATION = "email_verification"
    MFA_SETUP = "mfa_setup"


@dataclass
class TokenPayload:
    """Standard token payload structure."""
    user_id: str
    token_type: TokenType
    jti: str  # JWT ID for token revocation
    iat: datetime
    exp: datetime
    roles: list = None
    permissions: list = None
    session_id: Optional[str] = None
    device_id: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "sub": self.user_id,
            "type": self.token_type.value,
            "jti": self.jti,
            "iat": self.iat,
            "exp": self.exp,
            "roles": self.roles or [],
            "permissions": self.permissions or [],
            "session_id": self.session_id,
            "device_id": self.device_id,
        }


class JWTConfig:
    """JWT Configuration settings."""
    SECRET_KEY: str = None
    REFRESH_SECRET_KEY: str = None
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15  # Short-lived access tokens
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 30
    EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS: int = 24
    MFA_SETUP_TOKEN_EXPIRE_MINUTES: int = 10
    ISSUER: str = "mindmate-ai"
    AUDIENCE: str = "mindmate-ai-api"
    
    @classmethod
    def initialize(cls, secret_key: str, refresh_secret_key: Optional[str] = None):
        cls.SECRET_KEY = secret_key
        cls.REFRESH_SECRET_KEY = refresh_secret_key or secret_key


class JWTManager:
    """
    Production-ready JWT Manager for MindMate AI.
    Handles token generation, validation, and rotation.
    """
    
    _instance = None
    _revoked_tokens: set = set()  # In production, use Redis
    _active_refresh_tokens: Dict[str, Dict[str, Any]] = {}  # user_id -> token data
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    @staticmethod
    def _generate_jti() -> str:
        """Generate unique JWT ID."""
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def _hash_token(token: str) -> str:
        """Hash token for storage comparison."""
        return hashlib.sha256(token.encode()).hexdigest()
    
    @classmethod
    def generate_access_token(
        cls,
        user_id: str,
        roles: Optional[list] = None,
        permissions: Optional[list] = None,
        session_id: Optional[str] = None,
        device_id: Optional[str] = None,
        custom_claims: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Generate a short-lived access token.
        
        Args:
            user_id: Unique user identifier
            roles: User roles list
            permissions: User permissions list
            session_id: Session identifier for tracking
            device_id: Device identifier
            custom_claims: Additional custom claims
            
        Returns:
            JWT access token string
        """
        now = datetime.now(timezone.utc)
        exp = now + timedelta(minutes=JWTConfig.ACCESS_TOKEN_EXPIRE_MINUTES)
        jti = cls._generate_jti()
        
        payload = {
            "sub": user_id,
            "type": TokenType.ACCESS.value,
            "jti": jti,
            "iat": now,
            "exp": exp,
            "iss": JWTConfig.ISSUER,
            "aud": JWTConfig.AUDIENCE,
            "roles": roles or [],
            "permissions": permissions or [],
            "session_id": session_id,
            "device_id": device_id,
        }
        
        if custom_claims:
            payload.update(custom_claims)
        
        token = jwt.encode(
            payload,
            JWTConfig.SECRET_KEY,
            algorithm=JWTConfig.ALGORITHM
        )
        
        return token
    
    @classmethod
    def generate_refresh_token(
        cls,
        user_id: str,
        session_id: Optional[str] = None,
        device_id: Optional[str] = None,
        rotation_count: int = 0
    ) -> Tuple[str, str]:
        """
        Generate a long-lived refresh token with rotation support.
        
        Args:
            user_id: Unique user identifier
            session_id: Session identifier
            device_id: Device identifier
            rotation_count: Number of times this token has been rotated
            
        Returns:
            Tuple of (token, token_family_id)
        """
        now = datetime.now(timezone.utc)
        exp = now + timedelta(days=JWTConfig.REFRESH_TOKEN_EXPIRE_DAYS)
        jti = cls._generate_jti()
        token_family_id = secrets.token_urlsafe(16)
        
        payload = {
            "sub": user_id,
            "type": TokenType.REFRESH.value,
            "jti": jti,
            "iat": now,
            "exp": exp,
            "iss": JWTConfig.ISSUER,
            "aud": JWTConfig.AUDIENCE,
            "session_id": session_id,
            "device_id": device_id,
            "token_family_id": token_family_id,
            "rotation_count": rotation_count,
        }
        
        token = jwt.encode(
            payload,
            JWTConfig.REFRESH_SECRET_KEY,
            algorithm=JWTConfig.ALGORITHM
        )
        
        # Store token metadata
        cls._active_refresh_tokens[jti] = {
            "user_id": user_id,
            "token_family_id": token_family_id,
            "rotation_count": rotation_count,
            "created_at": now,
            "expires_at": exp,
            "session_id": session_id,
            "device_id": device_id,
            "revoked": False,
        }
        
        return token, token_family_id
    
    @classmethod
    def generate_password_reset_token(cls, user_id: str) -> str:
        """Generate password reset token."""
        now = datetime.now(timezone.utc)
        exp = now + timedelta(minutes=JWTConfig.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES)
        jti = cls._generate_jti()
        
        payload = {
            "sub": user_id,
            "type": TokenType.PASSWORD_RESET.value,
            "jti": jti,
            "iat": now,
            "exp": exp,
            "iss": JWTConfig.ISSUER,
            "aud": JWTConfig.AUDIENCE,
        }
        
        return jwt.encode(
            payload,
            JWTConfig.SECRET_KEY,
            algorithm=JWTConfig.ALGORITHM
        )
    
    @classmethod
    def generate_email_verification_token(cls, user_id: str, email: str) -> str:
        """Generate email verification token."""
        now = datetime.now(timezone.utc)
        exp = now + timedelta(hours=JWTConfig.EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS)
        jti = cls._generate_jti()
        
        payload = {
            "sub": user_id,
            "type": TokenType.EMAIL_VERIFICATION.value,
            "jti": jti,
            "iat": now,
            "exp": exp,
            "iss": JWTConfig.ISSUER,
            "aud": JWTConfig.AUDIENCE,
            "email": email,
        }
        
        return jwt.encode(
            payload,
            JWTConfig.SECRET_KEY,
            algorithm=JWTConfig.ALGORITHM
        )
    
    @classmethod
    def generate_mfa_setup_token(cls, user_id: str, mfa_method: str) -> str:
        """Generate MFA setup verification token."""
        now = datetime.now(timezone.utc)
        exp = now + timedelta(minutes=JWTConfig.MFA_SETUP_TOKEN_EXPIRE_MINUTES)
        jti = cls._generate_jti()
        
        payload = {
            "sub": user_id,
            "type": TokenType.MFA_SETUP.value,
            "jti": jti,
            "iat": now,
            "exp": exp,
            "iss": JWTConfig.ISSUER,
            "aud": JWTConfig.AUDIENCE,
            "mfa_method": mfa_method,
        }
        
        return jwt.encode(
            payload,
            JWTConfig.SECRET_KEY,
            algorithm=JWTConfig.ALGORITHM
        )
    
    @classmethod
    def validate_token(
        cls,
        token: str,
        token_type: TokenType = TokenType.ACCESS,
        verify_exp: bool = True
    ) -> Dict[str, Any]:
        """
        Validate and decode a JWT token.
        
        Args:
            token: JWT token string
            token_type: Expected token type
            verify_exp: Whether to verify expiration
            
        Returns:
            Decoded token payload
            
        Raises:
            jwt.ExpiredSignatureError: Token has expired
            jwt.InvalidTokenError: Token is invalid
            ValueError: Token type mismatch or revoked
        """
        secret = (
            JWTConfig.REFRESH_SECRET_KEY 
            if token_type == TokenType.REFRESH 
            else JWTConfig.SECRET_KEY
        )
        
        try:
            payload = jwt.decode(
                token,
                secret,
                algorithms=[JWTConfig.ALGORITHM],
                audience=JWTConfig.AUDIENCE,
                issuer=JWTConfig.ISSUER,
                options={"verify_exp": verify_exp}
            )
        except jwt.ExpiredSignatureError:
            raise jwt.ExpiredSignatureError("Token has expired")
        except jwt.InvalidAudienceError:
            raise jwt.InvalidTokenError("Invalid token audience")
        except jwt.InvalidIssuerError:
            raise jwt.InvalidTokenError("Invalid token issuer")
        except jwt.InvalidTokenError as e:
            raise jwt.InvalidTokenError(f"Invalid token: {str(e)}")
        
        # Verify token type
        if payload.get("type") != token_type.value:
            raise ValueError(f"Invalid token type. Expected {token_type.value}")
        
        # Check if token is revoked
        jti = payload.get("jti")
        if jti and jti in cls._revoked_tokens:
            raise ValueError("Token has been revoked")
        
        # For refresh tokens, check rotation status
        if token_type == TokenType.REFRESH:
            token_meta = cls._active_refresh_tokens.get(jti)
            if token_meta and token_meta.get("revoked"):
                raise ValueError("Refresh token has been revoked")
        
        return payload
    
    @classmethod
    def rotate_refresh_token(
        cls,
        refresh_token: str
    ) -> Tuple[str, str, str]:
        """
        Rotate a refresh token (Token Rotation Pattern).
        
        Args:
            refresh_token: Current refresh token
            
        Returns:
            Tuple of (new_access_token, new_refresh_token, token_family_id)
            
        Raises:
            ValueError: If token is invalid or revoked
        """
        # Validate current refresh token
        payload = cls.validate_token(refresh_token, TokenType.REFRESH)
        
        jti = payload.get("jti")
        user_id = payload.get("sub")
        session_id = payload.get("session_id")
        device_id = payload.get("device_id")
        token_family_id = payload.get("token_family_id")
        rotation_count = payload.get("rotation_count", 0)
        
        # Check for token reuse (potential attack)
        token_meta = cls._active_refresh_tokens.get(jti)
        if token_meta and token_meta.get("revoked"):
            # Token reuse detected - revoke entire token family
            cls._revoke_token_family(token_family_id)
            raise ValueError(
                "Token reuse detected. All tokens in this family have been revoked. "
                "Please re-authenticate."
            )
        
        # Revoke old token
        cls.revoke_token(jti)
        if jti in cls._active_refresh_tokens:
            cls._active_refresh_tokens[jti]["revoked"] = True
        
        # Generate new tokens
        new_access_token = cls.generate_access_token(
            user_id=user_id,
            session_id=session_id,
            device_id=device_id
        )
        
        new_refresh_token, _ = cls.generate_refresh_token(
            user_id=user_id,
            session_id=session_id,
            device_id=device_id,
            rotation_count=rotation_count + 1
        )
        
        return new_access_token, new_refresh_token, token_family_id
    
    @classmethod
    def revoke_token(cls, jti: str) -> bool:
        """
        Revoke a token by its JTI.
        
        Args:
            jti: JWT ID to revoke
            
        Returns:
            True if revoked successfully
        """
        cls._revoked_tokens.add(jti)
        
        # Also mark in refresh token store
        if jti in cls._active_refresh_tokens:
            cls._active_refresh_tokens[jti]["revoked"] = True
        
        return True
    
    @classmethod
    def _revoke_token_family(cls, token_family_id: str) -> None:
        """Revoke all tokens in a token family (for breach detection)."""
        for jti, meta in cls._active_refresh_tokens.items():
            if meta.get("token_family_id") == token_family_id:
                meta["revoked"] = True
                cls._revoked_tokens.add(jti)
    
    @classmethod
    def revoke_all_user_tokens(cls, user_id: str) -> int:
        """
        Revoke all tokens for a specific user.
        
        Args:
            user_id: User ID to revoke tokens for
            
        Returns:
            Number of tokens revoked
        """
        revoked_count = 0
        for jti, meta in list(cls._active_refresh_tokens.items()):
            if meta.get("user_id") == user_id:
                meta["revoked"] = True
                cls._revoked_tokens.add(jti)
                revoked_count += 1
        
        return revoked_count
    
    @classmethod
    def get_token_expiry(cls, token: str) -> Optional[datetime]:
        """Get token expiration time without validation."""
        try:
            payload = jwt.decode(
                token,
                options={"verify_signature": False},
                algorithms=[JWTConfig.ALGORITHM]
            )
            exp_timestamp = payload.get("exp")
            if exp_timestamp:
                return datetime.fromtimestamp(exp_timestamp, tz=timezone.utc)
        except jwt.InvalidTokenError:
            pass
        return None
    
    @classmethod
    def is_token_expired(cls, token: str) -> bool:
        """Check if a token is expired without full validation."""
        expiry = cls.get_token_expiry(token)
        if expiry:
            return datetime.now(timezone.utc) > expiry
        return True


# Convenience functions for common operations
def create_tokens(
    user_id: str,
    roles: Optional[list] = None,
    permissions: Optional[list] = None,
    session_id: Optional[str] = None,
    device_id: Optional[str] = None
) -> Dict[str, str]:
    """
    Create both access and refresh tokens for a user.
    
    Returns:
        Dict with access_token, refresh_token, token_type, expires_in
    """
    jwt_manager = JWTManager()
    
    access_token = jwt_manager.generate_access_token(
        user_id=user_id,
        roles=roles,
        permissions=permissions,
        session_id=session_id,
        device_id=device_id
    )
    
    refresh_token, _ = jwt_manager.generate_refresh_token(
        user_id=user_id,
        session_id=session_id,
        device_id=device_id
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "Bearer",
        "expires_in": JWTConfig.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


def refresh_access_token(refresh_token: str) -> Dict[str, str]:
    """
    Refresh access token using refresh token.
    
    Returns:
        Dict with new access_token, refresh_token, token_type, expires_in
    """
    jwt_manager = JWTManager()
    
    access_token, new_refresh_token, _ = jwt_manager.rotate_refresh_token(refresh_token)
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "Bearer",
        "expires_in": JWTConfig.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


def decode_token_without_verification(token: str) -> Optional[Dict[str, Any]]:
    """Decode token without signature verification (for debugging)."""
    try:
        return jwt.decode(
            token,
            options={"verify_signature": False},
            algorithms=[JWTConfig.ALGORITHM]
        )
    except jwt.InvalidTokenError:
        return None
