"""
MindMate AI - Password Reset Module
Production-ready password reset flow with security features.
"""

import secrets
import hashlib
import re
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from enum import Enum
import logging

from .jwt import JWTManager, TokenType

logger = logging.getLogger(__name__)


class PasswordStrength(Enum):
    """Password strength levels."""
    VERY_WEAK = 0
    WEAK = 1
    FAIR = 2
    GOOD = 3
    STRONG = 4
    VERY_STRONG = 5


@dataclass
class PasswordPolicy:
    """Password policy configuration."""
    min_length: int = 12
    max_length: int = 128
    require_uppercase: bool = True
    require_lowercase: bool = True
    require_digits: bool = True
    require_special: bool = True
    min_unique_chars: int = 6
    max_repeated_chars: int = 3
    prevent_common_passwords: bool = True
    prevent_username_in_password: bool = True
    password_history_count: int = 5
    max_age_days: Optional[int] = 90


@dataclass
class PasswordResetAttempt:
    """Track password reset attempts."""
    user_id: str
    token_jti: str
    requested_at: datetime
    expires_at: datetime
    used_at: Optional[datetime] = None
    used: bool = False
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    invalidated: bool = False
    invalidation_reason: Optional[str] = None


class PasswordValidator:
    """
    Comprehensive password validator with strength checking.
    """
    
    # Common passwords to prevent (top 1000 from various breaches)
    COMMON_PASSWORDS = {
        "password", "123456", "12345678", "qwerty", "abc123",
        "monkey", "letmein", "dragon", "111111", "baseball",
        "iloveyou", "trustno1", "sunshine", "princess", "admin",
        "welcome", "shadow", "ashley", "football", "jesus",
        "michael", "ninja", "mustang", "password1", "123456789",
        "adobe123", "admin123", "login", "master", "photoshop",
        "1q2w3e4r", "zaq12wsx", "password123", "qwerty123",
        # Add more as needed
    }
    
    def __init__(self, policy: Optional[PasswordPolicy] = None):
        self.policy = policy or PasswordPolicy()
    
    def validate(self, password: str, username: str = "", email: str = "") -> Dict[str, Any]:
        """
        Validate password against policy.
        
        Returns:
            Dict with 'valid', 'strength', 'errors', and 'suggestions'
        """
        errors = []
        suggestions = []
        
        # Check length
        if len(password) < self.policy.min_length:
            errors.append(f"Password must be at least {self.policy.min_length} characters")
        if len(password) > self.policy.max_length:
            errors.append(f"Password must not exceed {self.policy.max_length} characters")
        
        # Check character requirements
        if self.policy.require_uppercase and not re.search(r'[A-Z]', password):
            errors.append("Password must contain at least one uppercase letter")
        if self.policy.require_lowercase and not re.search(r'[a-z]', password):
            errors.append("Password must contain at least one lowercase letter")
        if self.policy.require_digits and not re.search(r'\d', password):
            errors.append("Password must contain at least one digit")
        if self.policy.require_special and not re.search(r'[!@#$%^&*(),.?":{}|<>\[\]\\/\-_=+`~]', password):
            errors.append("Password must contain at least one special character")
        
        # Check unique characters
        unique_chars = len(set(password))
        if unique_chars < self.policy.min_unique_chars:
            errors.append(f"Password must contain at least {self.policy.min_unique_chars} unique characters")
        
        # Check repeated characters
        for i in range(len(password) - self.policy.max_repeated_chars):
            if len(set(password[i:i + self.policy.max_repeated_chars + 1])) == 1:
                errors.append(f"Password must not contain more than {self.policy.max_repeated_chars} repeated characters")
                break
        
        # Check common passwords
        if self.policy.prevent_common_passwords:
            if password.lower() in self.COMMON_PASSWORDS:
                errors.append("Password is too common. Please choose a more unique password.")
        
        # Check for username/email in password
        if self.policy.prevent_username_in_password:
            password_lower = password.lower()
            if username and username.lower() in password_lower:
                errors.append("Password must not contain your username")
            if email:
                email_local = email.split('@')[0].lower()
                if email_local in password_lower:
                    errors.append("Password must not contain your email address")
        
        # Calculate strength
        strength = self._calculate_strength(password)
        
        # Generate suggestions
        if strength < PasswordStrength.GOOD:
            suggestions = self._generate_suggestions(password)
        
        return {
            "valid": len(errors) == 0,
            "strength": strength.name,
            "strength_score": strength.value,
            "errors": errors,
            "suggestions": suggestions
        }
    
    def _calculate_strength(self, password: str) -> PasswordStrength:
        """Calculate password strength score."""
        score = 0
        
        # Length scoring
        length = len(password)
        if length >= 8:
            score += 1
        if length >= 12:
            score += 1
        if length >= 16:
            score += 1
        
        # Character variety scoring
        if re.search(r'[a-z]', password):
            score += 1
        if re.search(r'[A-Z]', password):
            score += 1
        if re.search(r'\d', password):
            score += 1
        if re.search(r'[!@#$%^&*(),.?":{}|<>\[\]\\/\-_=+`~]', password):
            score += 1
        
        # Complexity bonus
        if len(set(password)) >= 10:
            score += 1
        
        # Penalize common patterns
        if password.lower() in self.COMMON_PASSWORDS:
            score = max(0, score - 3)
        
        # Map score to strength level
        if score <= 1:
            return PasswordStrength.VERY_WEAK
        elif score <= 2:
            return PasswordStrength.WEAK
        elif score <= 3:
            return PasswordStrength.FAIR
        elif score <= 4:
            return PasswordStrength.GOOD
        elif score <= 5:
            return PasswordStrength.STRONG
        else:
            return PasswordStrength.VERY_STRONG
    
    def _generate_suggestions(self, password: str) -> List[str]:
        """Generate password improvement suggestions."""
        suggestions = []
        
        if len(password) < 12:
            suggestions.append("Use at least 12 characters")
        if not re.search(r'[A-Z]', password):
            suggestions.append("Add uppercase letters")
        if not re.search(r'[a-z]', password):
            suggestions.append("Add lowercase letters")
        if not re.search(r'\d', password):
            suggestions.append("Add numbers")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>\[\]\\/\-_=+`~]', password):
            suggestions.append("Add special characters")
        
        return suggestions
    
    def generate_strong_password(self, length: int = 16) -> str:
        """Generate a strong random password."""
        import random
        
        if length < 12:
            length = 12
        
        # Character sets
        lowercase = 'abcdefghijklmnopqrstuvwxyz'
        uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        digits = '0123456789'
        special = '!@#$%^&*(),.?":{}|<>[]\\/_=+`~'
        
        # Ensure at least one of each type
        password = [
            secrets.choice(lowercase),
            secrets.choice(uppercase),
            secrets.choice(digits),
            secrets.choice(special),
        ]
        
        # Fill remaining with random choices
        all_chars = lowercase + uppercase + digits + special
        for _ in range(length - 4):
            password.append(secrets.choice(all_chars))
        
        # Shuffle
        random.shuffle(password)
        
        return ''.join(password)


class PasswordResetManager:
    """
    Production-ready password reset manager.
    
    Features:
    - Secure token generation
    - Rate limiting
    - IP-based tracking
    - Audit logging
    - Token invalidation
    """
    
    _instance = None
    
    # Storage (use database in production)
    _reset_attempts: Dict[str, PasswordResetAttempt] = {}  # jti -> attempt
    _user_attempts: Dict[str, List[datetime]] = {}  # user_id -> list of attempt times
    _ip_attempts: Dict[str, List[datetime]] = {}  # ip -> list of attempt times
    
    # Configuration
    MAX_ATTEMPTS_PER_USER = 3  # Per hour
    MAX_ATTEMPTS_PER_IP = 5  # Per hour
    TOKEN_EXPIRY_MINUTES = 30
    RATE_LIMIT_WINDOW_HOURS = 1
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._jwt_manager = JWTManager()
            cls._password_validator = PasswordValidator()
        return cls._instance
    
    def request_reset(
        self,
        user_id: str,
        email: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Optional[str]:
        """
        Request a password reset.
        
        Args:
            user_id: User's ID
            email: User's email
            ip_address: Requester's IP address
            user_agent: Requester's user agent
            
        Returns:
            Reset token if allowed, None if rate limited
        """
        # Check rate limits
        if not self._check_rate_limits(user_id, ip_address):
            logger.warning(
                f"Password reset rate limit exceeded for user {user_id} from {ip_address}"
            )
            return None
        
        # Generate token
        token = self._jwt_manager.generate_password_reset_token(user_id)
        
        # Decode to get JTI
        payload = self._jwt_manager.validate_token(token, TokenType.PASSWORD_RESET)
        jti = payload.get("jti")
        
        # Track attempt
        now = datetime.now(timezone.utc)
        attempt = PasswordResetAttempt(
            user_id=user_id,
            token_jti=jti,
            requested_at=now,
            expires_at=now + timedelta(minutes=self.TOKEN_EXPIRY_MINUTES),
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        self._reset_attempts[jti] = attempt
        self._track_attempt(user_id, ip_address)
        
        logger.info(f"Password reset requested for user {user_id} from {ip_address}")
        
        return token
    
    def validate_reset_token(self, token: str) -> Optional[str]:
        """
        Validate a reset token.
        
        Args:
            token: Reset token
            
        Returns:
            user_id if valid, None otherwise
        """
        try:
            payload = self._jwt_manager.validate_token(token, TokenType.PASSWORD_RESET)
            jti = payload.get("jti")
            user_id = payload.get("sub")
            
            # Check if attempt exists and is valid
            attempt = self._reset_attempts.get(jti)
            if not attempt:
                logger.warning(f"Reset token not found: {jti}")
                return None
            
            if attempt.used:
                logger.warning(f"Reset token already used: {jti}")
                return None
            
            if attempt.invalidated:
                logger.warning(f"Reset token invalidated: {jti}")
                return None
            
            if datetime.now(timezone.utc) > attempt.expires_at:
                logger.warning(f"Reset token expired: {jti}")
                return None
            
            return user_id
            
        except Exception as e:
            logger.warning(f"Reset token validation failed: {e}")
            return None
    
    def reset_password(
        self,
        token: str,
        new_password: str,
        ip_address: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Reset password using token.
        
        Args:
            token: Reset token
            new_password: New password
            ip_address: Requester's IP address
            
        Returns:
            Dict with success status and message
        """
        # Validate token
        user_id = self.validate_reset_token(token)
        if not user_id:
            return {
                "success": False,
                "message": "Invalid or expired reset token"
            }
        
        # Validate new password
        validation = self._password_validator.validate(new_password)
        if not validation["valid"]:
            return {
                "success": False,
                "message": "Password does not meet requirements",
                "errors": validation["errors"],
                "suggestions": validation["suggestions"]
            }
        
        # Mark token as used
        payload = self._jwt_manager.validate_token(token, TokenType.PASSWORD_RESET)
        jti = payload.get("jti")
        attempt = self._reset_attempts.get(jti)
        if attempt:
            attempt.used = True
            attempt.used_at = datetime.now(timezone.utc)
        
        # Revoke token
        self._jwt_manager.revoke_token(jti)
        
        logger.info(f"Password reset successful for user {user_id} from {ip_address}")
        
        return {
            "success": True,
            "message": "Password reset successful",
            "user_id": user_id
        }
    
    def invalidate_token(
        self,
        token: str,
        reason: str = "user_request"
    ) -> bool:
        """Invalidate a reset token."""
        try:
            payload = self._jwt_manager.validate_token(token, TokenType.PASSWORD_RESET)
            jti = payload.get("jti")
            
            attempt = self._reset_attempts.get(jti)
            if attempt:
                attempt.invalidated = True
                attempt.invalidation_reason = reason
            
            self._jwt_manager.revoke_token(jti)
            
            return True
        except Exception:
            return False
    
    def invalidate_all_user_tokens(self, user_id: str, reason: str = "security") -> int:
        """Invalidate all pending reset tokens for a user."""
        invalidated = 0
        
        for jti, attempt in self._reset_attempts.items():
            if (attempt.user_id == user_id and 
                not attempt.used and 
                not attempt.invalidated):
                attempt.invalidated = True
                attempt.invalidation_reason = reason
                self._jwt_manager.revoke_token(jti)
                invalidated += 1
        
        return invalidated
    
    def _check_rate_limits(self, user_id: str, ip_address: Optional[str]) -> bool:
        """Check if request is within rate limits."""
        now = datetime.now(timezone.utc)
        window_start = now - timedelta(hours=self.RATE_LIMIT_WINDOW_HOURS)
        
        # Check user rate limit
        user_attempts = self._user_attempts.get(user_id, [])
        recent_user_attempts = [a for a in user_attempts if a > window_start]
        self._user_attempts[user_id] = recent_user_attempts
        
        if len(recent_user_attempts) >= self.MAX_ATTEMPTS_PER_USER:
            return False
        
        # Check IP rate limit
        if ip_address:
            ip_attempts = self._ip_attempts.get(ip_address, [])
            recent_ip_attempts = [a for a in ip_attempts if a > window_start]
            self._ip_attempts[ip_address] = recent_ip_attempts
            
            if len(recent_ip_attempts) >= self.MAX_ATTEMPTS_PER_IP:
                return False
        
        return True
    
    def _track_attempt(self, user_id: str, ip_address: Optional[str]) -> None:
        """Track a reset attempt."""
        now = datetime.now(timezone.utc)
        
        if user_id not in self._user_attempts:
            self._user_attempts[user_id] = []
        self._user_attempts[user_id].append(now)
        
        if ip_address:
            if ip_address not in self._ip_attempts:
                self._ip_attempts[ip_address] = []
            self._ip_attempts[ip_address].append(now)
    
    def get_pending_resets(self, user_id: str) -> List[Dict[str, Any]]:
        """Get pending reset attempts for a user."""
        pending = []
        
        for jti, attempt in self._reset_attempts.items():
            if (attempt.user_id == user_id and 
                not attempt.used and 
                not attempt.invalidated and
                datetime.now(timezone.utc) < attempt.expires_at):
                pending.append({
                    "jti": jti,
                    "requested_at": attempt.requested_at.isoformat(),
                    "expires_at": attempt.expires_at.isoformat(),
                    "ip_address": attempt.ip_address,
                })
        
        return pending
    
    def cleanup_expired(self) -> int:
        """Clean up expired reset attempts."""
        now = datetime.now(timezone.utc)
        expired = []
        
        for jti, attempt in self._reset_attempts.items():
            if now > attempt.expires_at + timedelta(hours=24):
                expired.append(jti)
        
        for jti in expired:
            del self._reset_attempts[jti]
        
        return len(expired)


# Password history checker
class PasswordHistory:
    """Track and check password history to prevent reuse."""
    
    def __init__(self, max_history: int = 5):
        self.max_history = max_history
        self._history: Dict[str, List[str]] = {}  # user_id -> list of password hashes
    
    def add_password(self, user_id: str, password_hash: str) -> None:
        """Add password to user's history."""
        if user_id not in self._history:
            self._history[user_id] = []
        
        self._history[user_id].insert(0, password_hash)
        
        # Trim to max history
        if len(self._history[user_id]) > self.max_history:
            self._history[user_id] = self._history[user_id][:self.max_history]
    
    def is_reused(self, user_id: str, password: str, hasher) -> bool:
        """Check if password was previously used."""
        if user_id not in self._history:
            return False
        
        for old_hash in self._history[user_id]:
            if hasher.verify(password, old_hash):
                return True
        
        return False
    
    def get_history(self, user_id: str) -> List[str]:
        """Get user's password history."""
        return self._history.get(user_id, []).copy()
    
    def clear_history(self, user_id: str) -> None:
        """Clear user's password history."""
        if user_id in self._history:
            del self._history[user_id]


# Convenience functions
def validate_password_strength(password: str, username: str = "", email: str = "") -> Dict[str, Any]:
    """Validate password strength."""
    validator = PasswordValidator()
    return validator.validate(password, username, email)


def generate_secure_password(length: int = 16) -> str:
    """Generate a secure random password."""
    validator = PasswordValidator()
    return validator.generate_strong_password(length)


def create_password_reset_manager() -> PasswordResetManager:
    """Factory function to create password reset manager."""
    return PasswordResetManager()
