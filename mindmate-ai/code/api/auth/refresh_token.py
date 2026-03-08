"""
MindMate AI - Refresh Token Rotation System
Production-ready refresh token management with Redis backend support.
"""

import redis
import json
import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class TokenStatus(Enum):
    ACTIVE = "active"
    REVOKED = "revoked"
    EXPIRED = "expired"
    ROTATED = "rotated"
    COMPROMISED = "compromised"


@dataclass
class RefreshTokenMetadata:
    """Metadata for refresh token tracking."""
    jti: str
    user_id: str
    token_family_id: str
    rotation_count: int
    created_at: str
    expires_at: str
    session_id: Optional[str]
    device_id: Optional[str]
    device_info: Optional[Dict[str, Any]]
    ip_address: Optional[str]
    status: str = TokenStatus.ACTIVE.value
    rotated_to_jti: Optional[str] = None
    revoked_at: Optional[str] = None
    revoked_reason: Optional[str] = None
    last_used_at: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "RefreshTokenMetadata":
        return cls(**data)


class RedisTokenStore:
    """Redis-based token storage for production environments."""
    
    def __init__(
        self,
        host: str = "localhost",
        port: int = 6379,
        db: int = 0,
        password: Optional[str] = None,
        ssl: bool = False,
        key_prefix: str = "mindmate:auth:"
    ):
        self.key_prefix = key_prefix
        self._redis = redis.Redis(
            host=host,
            port=port,
            db=db,
            password=password,
            ssl=ssl,
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5,
            health_check_interval=30,
        )
        
        # Test connection
        try:
            self._redis.ping()
        except redis.ConnectionError as e:
            logger.error(f"Redis connection failed: {e}")
            raise
    
    def _key(self, suffix: str) -> str:
        """Generate prefixed Redis key."""
        return f"{self.key_prefix}{suffix}"
    
    def store_token(self, metadata: RefreshTokenMetadata) -> bool:
        """Store token metadata in Redis."""
        key = self._key(f"refresh_token:{metadata.jti}")
        data = json.dumps(metadata.to_dict())
        
        # Calculate TTL
        expires_at = datetime.fromisoformat(metadata.expires_at)
        ttl = int((expires_at - datetime.now(timezone.utc)).total_seconds())
        
        if ttl > 0:
            self._redis.setex(key, ttl, data)
            
            # Also add to user's token set
            user_key = self._key(f"user_tokens:{metadata.user_id}")
            self._redis.sadd(user_key, metadata.jti)
            
            # Add to token family
            family_key = self._key(f"token_family:{metadata.token_family_id}")
            self._redis.sadd(family_key, metadata.jti)
            
            return True
        return False
    
    def get_token(self, jti: str) -> Optional[RefreshTokenMetadata]:
        """Retrieve token metadata from Redis."""
        key = self._key(f"refresh_token:{jti}")
        data = self._redis.get(key)
        
        if data:
            return RefreshTokenMetadata.from_dict(json.loads(data))
        return None
    
    def update_token(self, jti: str, updates: Dict[str, Any]) -> bool:
        """Update token metadata."""
        metadata = self.get_token(jti)
        if not metadata:
            return False
        
        for key, value in updates.items():
            setattr(metadata, key, value)
        
        return self.store_token(metadata)
    
    def revoke_token(
        self,
        jti: str,
        reason: str = "manual_revoke",
        revoke_family: bool = False
    ) -> bool:
        """Revoke a token and optionally its entire family."""
        metadata = self.get_token(jti)
        if not metadata:
            return False
        
        if revoke_family:
            return self._revoke_token_family(metadata.token_family_id, reason)
        
        metadata.status = TokenStatus.REVOKED.value
        metadata.revoked_at = datetime.now(timezone.utc).isoformat()
        metadata.revoked_reason = reason
        
        # Add to revoked set with longer TTL for audit
        revoked_key = self._key(f"revoked_tokens")
        self._redis.sadd(revoked_key, jti)
        
        return self.store_token(metadata)
    
    def _revoke_token_family(self, family_id: str, reason: str) -> bool:
        """Revoke all tokens in a family."""
        family_key = self._key(f"token_family:{family_id}")
        jtis = self._redis.smembers(family_key)
        
        for jti in jtis:
            metadata = self.get_token(jti)
            if metadata and metadata.status == TokenStatus.ACTIVE.value:
                metadata.status = TokenStatus.COMPROMISED.value
                metadata.revoked_at = datetime.now(timezone.utc).isoformat()
                metadata.revoked_reason = reason
                self.store_token(metadata)
        
        return True
    
    def revoke_all_user_tokens(self, user_id: str, reason: str = "user_logout") -> int:
        """Revoke all tokens for a user."""
        user_key = self._key(f"user_tokens:{user_id}")
        jtis = self._redis.smembers(user_key)
        
        revoked_count = 0
        for jti in jtis:
            if self.revoke_token(jti, reason):
                revoked_count += 1
        
        return revoked_count
    
    def is_token_revoked(self, jti: str) -> bool:
        """Check if a token is revoked."""
        revoked_key = self._key("revoked_tokens")
        return self._redis.sismember(revoked_key, jti)
    
    def get_user_tokens(self, user_id: str) -> List[RefreshTokenMetadata]:
        """Get all tokens for a user."""
        user_key = self._key(f"user_tokens:{user_id}")
        jtis = self._redis.smembers(user_key)
        
        tokens = []
        for jti in jtis:
            metadata = self.get_token(jti)
            if metadata:
                tokens.append(metadata)
        
        return tokens
    
    def get_active_user_sessions(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all active sessions for a user."""
        tokens = self.get_user_tokens(user_id)
        sessions = []
        
        for token in tokens:
            if token.status == TokenStatus.ACTIVE.value:
                sessions.append({
                    "session_id": token.session_id,
                    "device_id": token.device_id,
                    "device_info": token.device_info,
                    "ip_address": token.ip_address,
                    "created_at": token.created_at,
                    "expires_at": token.expires_at,
                    "jti": token.jti,
                })
        
        return sessions
    
    def cleanup_expired_tokens(self) -> int:
        """Clean up expired tokens (run periodically)."""
        # Redis handles expiration automatically with TTL
        # This method can be used for additional cleanup
        return 0


class InMemoryTokenStore:
    """In-memory token store for development/testing."""
    
    def __init__(self):
        self._tokens: Dict[str, RefreshTokenMetadata] = {}
        self._user_tokens: Dict[str, set] = {}
        self._token_families: Dict[str, set] = {}
        self._revoked_tokens: set = set()
    
    def store_token(self, metadata: RefreshTokenMetadata) -> bool:
        self._tokens[metadata.jti] = metadata
        
        if metadata.user_id not in self._user_tokens:
            self._user_tokens[metadata.user_id] = set()
        self._user_tokens[metadata.user_id].add(metadata.jti)
        
        if metadata.token_family_id not in self._token_families:
            self._token_families[metadata.token_family_id] = set()
        self._token_families[metadata.token_family_id].add(metadata.jti)
        
        return True
    
    def get_token(self, jti: str) -> Optional[RefreshTokenMetadata]:
        metadata = self._tokens.get(jti)
        if metadata:
            # Check expiration
            expires_at = datetime.fromisoformat(metadata.expires_at)
            if datetime.now(timezone.utc) > expires_at:
                metadata.status = TokenStatus.EXPIRED.value
        return metadata
    
    def update_token(self, jti: str, updates: Dict[str, Any]) -> bool:
        metadata = self.get_token(jti)
        if not metadata:
            return False
        
        for key, value in updates.items():
            setattr(metadata, key, value)
        
        return True
    
    def revoke_token(
        self,
        jti: str,
        reason: str = "manual_revoke",
        revoke_family: bool = False
    ) -> bool:
        metadata = self.get_token(jti)
        if not metadata:
            return False
        
        if revoke_family:
            return self._revoke_token_family(metadata.token_family_id, reason)
        
        metadata.status = TokenStatus.REVOKED.value
        metadata.revoked_at = datetime.now(timezone.utc).isoformat()
        metadata.revoked_reason = reason
        self._revoked_tokens.add(jti)
        
        return True
    
    def _revoke_token_family(self, family_id: str, reason: str) -> bool:
        jtis = self._token_families.get(family_id, set())
        for jti in jtis:
            metadata = self._tokens.get(jti)
            if metadata and metadata.status == TokenStatus.ACTIVE.value:
                metadata.status = TokenStatus.COMPROMISED.value
                metadata.revoked_at = datetime.now(timezone.utc).isoformat()
                metadata.revoked_reason = reason
                self._revoked_tokens.add(jti)
        return True
    
    def revoke_all_user_tokens(self, user_id: str, reason: str = "user_logout") -> int:
        jtis = self._user_tokens.get(user_id, set()).copy()
        revoked_count = 0
        for jti in jtis:
            if self.revoke_token(jti, reason):
                revoked_count += 1
        return revoked_count
    
    def is_token_revoked(self, jti: str) -> bool:
        return jti in self._revoked_tokens
    
    def get_user_tokens(self, user_id: str) -> List[RefreshTokenMetadata]:
        jtis = self._user_tokens.get(user_id, set())
        return [self.get_token(jti) for jti in jtis if self.get_token(jti)]
    
    def get_active_user_sessions(self, user_id: str) -> List[Dict[str, Any]]:
        tokens = self.get_user_tokens(user_id)
        return [
            {
                "session_id": t.session_id,
                "device_id": t.device_id,
                "device_info": t.device_info,
                "ip_address": t.ip_address,
                "created_at": t.created_at,
                "expires_at": t.expires_at,
                "jti": t.jti,
            }
            for t in tokens
            if t.status == TokenStatus.ACTIVE.value
        ]
    
    def cleanup_expired_tokens(self) -> int:
        expired = []
        for jti, metadata in self._tokens.items():
            expires_at = datetime.fromisoformat(metadata.expires_at)
            if datetime.now(timezone.utc) > expires_at:
                expired.append(jti)
        
        for jti in expired:
            del self._tokens[jti]
        
        return len(expired)


class RefreshTokenManager:
    """
    Production-ready refresh token manager.
    Handles token rotation, family tracking, and security monitoring.
    """
    
    _instance = None
    _store = None
    
    def __new__(cls, use_redis: bool = False, redis_config: Optional[Dict] = None):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            if use_redis and redis_config:
                cls._store = RedisTokenStore(**redis_config)
            else:
                cls._store = InMemoryTokenStore()
        return cls._instance
    
    @property
    def store(self):
        return self._store
    
    def create_refresh_token(
        self,
        user_id: str,
        session_id: Optional[str] = None,
        device_id: Optional[str] = None,
        device_info: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        token_family_id: Optional[str] = None,
        rotation_count: int = 0,
        expires_days: int = 7
    ) -> Tuple[str, RefreshTokenMetadata]:
        """
        Create a new refresh token with metadata.
        
        Returns:
            Tuple of (token_jti, metadata)
        """
        jti = secrets.token_urlsafe(32)
        family_id = token_family_id or secrets.token_urlsafe(16)
        
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(days=expires_days)
        
        metadata = RefreshTokenMetadata(
            jti=jti,
            user_id=user_id,
            token_family_id=family_id,
            rotation_count=rotation_count,
            created_at=now.isoformat(),
            expires_at=expires_at.isoformat(),
            session_id=session_id or secrets.token_urlsafe(16),
            device_id=device_id,
            device_info=device_info,
            ip_address=ip_address,
            status=TokenStatus.ACTIVE.value,
        )
        
        self._store.store_token(metadata)
        
        return jti, metadata
    
    def rotate_token(
        self,
        jti: str,
        device_info: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None
    ) -> Tuple[str, RefreshTokenMetadata]:
        """
        Rotate a refresh token.
        
        Args:
            jti: Current token JTI
            device_info: Updated device info
            ip_address: Current IP address
            
        Returns:
            Tuple of (new_jti, new_metadata)
            
        Raises:
            ValueError: If token is invalid, revoked, or reused
        """
        current = self._store.get_token(jti)
        
        if not current:
            raise ValueError("Token not found")
        
        # Check for token reuse (detected rotation attack)
        if current.status != TokenStatus.ACTIVE.value:
            # Token reuse detected - revoke entire family
            self._store._revoke_token_family(
                current.token_family_id,
                "token_reuse_detected"
            )
            logger.warning(
                f"Token reuse detected for user {current.user_id}. "
                f"All tokens in family {current.token_family_id} revoked."
            )
            raise ValueError(
                "Token reuse detected. Please re-authenticate."
            )
        
        # Mark current token as rotated
        self._store.update_token(jti, {
            "status": TokenStatus.ROTATED.value,
            "rotated_to_jti": None,  # Will be updated after creating new token
        })
        
        # Create new token in same family
        new_jti, new_metadata = self.create_refresh_token(
            user_id=current.user_id,
            session_id=current.session_id,
            device_id=current.device_id,
            device_info=device_info or current.device_info,
            ip_address=ip_address or current.ip_address,
            token_family_id=current.token_family_id,
            rotation_count=current.rotation_count + 1,
        )
        
        # Update rotated_to reference
        self._store.update_token(jti, {"rotated_to_jti": new_jti})
        
        logger.info(
            f"Token rotated for user {current.user_id}. "
            f"Rotation count: {new_metadata.rotation_count}"
        )
        
        return new_jti, new_metadata
    
    def validate_token(self, jti: str) -> RefreshTokenMetadata:
        """
        Validate a refresh token.
        
        Raises:
            ValueError: If token is invalid, expired, or revoked
        """
        metadata = self._store.get_token(jti)
        
        if not metadata:
            raise ValueError("Token not found")
        
        if metadata.status == TokenStatus.REVOKED.value:
            raise ValueError("Token has been revoked")
        
        if metadata.status == TokenStatus.COMPROMISED.value:
            raise ValueError("Token family compromised")
        
        if metadata.status == TokenStatus.EXPIRED.value:
            raise ValueError("Token has expired")
        
        # Update last used
        self._store.update_token(jti, {
            "last_used_at": datetime.now(timezone.utc).isoformat()
        })
        
        return metadata
    
    def revoke_token(
        self,
        jti: str,
        reason: str = "manual_revoke",
        revoke_family: bool = False
    ) -> bool:
        """Revoke a refresh token."""
        return self._store.revoke_token(jti, reason, revoke_family)
    
    def revoke_all_user_tokens(self, user_id: str, reason: str = "user_logout") -> int:
        """Revoke all tokens for a user."""
        return self._store.revoke_all_user_tokens(user_id, reason)
    
    def get_user_sessions(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all active sessions for a user."""
        return self._store.get_active_user_sessions(user_id)
    
    def revoke_session(self, user_id: str, session_id: str) -> bool:
        """Revoke a specific session."""
        tokens = self._store.get_user_tokens(user_id)
        for token in tokens:
            if token.session_id == session_id:
                return self._store.revoke_token(token.jti, "session_revoked")
        return False
    
    def detect_suspicious_activity(
        self,
        user_id: str,
        current_ip: str,
        current_device: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Detect suspicious token usage patterns.
        
        Returns:
            List of suspicious activities detected
        """
        alerts = []
        tokens = self._store.get_user_tokens(user_id)
        
        for token in tokens:
            # Check for IP changes
            if token.ip_address and token.ip_address != current_ip:
                alerts.append({
                    "type": "ip_change",
                    "severity": "medium",
                    "message": f"IP address change detected",
                    "previous_ip": token.ip_address,
                    "current_ip": current_ip,
                    "token_jti": token.jti,
                })
            
            # Check for rapid rotation
            if token.rotation_count > 10:
                alerts.append({
                    "type": "rapid_rotation",
                    "severity": "high",
                    "message": f"Unusual token rotation activity",
                    "rotation_count": token.rotation_count,
                    "token_jti": token.jti,
                })
        
        return alerts


# Factory function for creating token manager
def create_token_manager(
    use_redis: bool = False,
    redis_config: Optional[Dict] = None
) -> RefreshTokenManager:
    """Create and configure refresh token manager."""
    return RefreshTokenManager(use_redis=use_redis, redis_config=redis_config)
