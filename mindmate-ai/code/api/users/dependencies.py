"""
Authentication and Authorization Dependencies for User Profile Endpoints
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
import secrets
import hashlib

# Security configuration
SECRET_KEY = secrets.token_urlsafe(32)  # In production, load from environment
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP Bearer for token authentication
security = HTTPBearer(auto_error=False)


class AuthError(Exception):
    """Custom authentication error"""
    def __init__(self, message: str, status_code: int = 401):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class UserTokenData:
    """Decoded user token data"""
    def __init__(
        self,
        user_id: str,
        email: str,
        is_active: bool = True,
        is_verified: bool = False,
        scopes: list = None,
        token_type: str = "access"
    ):
        self.user_id = user_id
        self.email = email
        self.is_active = is_active
        self.is_verified = is_verified
        self.scopes = scopes or []
        self.token_type = token_type


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a plain password"""
    return pwd_context.hash(password)


def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    })
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any]) -> str:
    """Create a JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "refresh"
    })
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate a JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def extract_token_from_request(request: Request) -> Optional[str]:
    """Extract token from various sources in the request"""
    # Check Authorization header
    auth_header = request.headers.get("Authorization")
    if auth_header:
        parts = auth_header.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            return parts[1]
    
    # Check query parameter
    token = request.query_params.get("token")
    if token:
        return token
    
    # Check cookie
    token = request.cookies.get("access_token")
    if token:
        return token
    
    return None


async def get_current_user_token(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> UserTokenData:
    """
    Dependency to get and validate the current user's token.
    Extracts token from Authorization header, query params, or cookies.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Get token from various sources
    token = None
    if credentials:
        token = credentials.credentials
    else:
        token = extract_token_from_request(request)
    
    if not token:
        raise credentials_exception
    
    # Decode and validate token
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception
    
    # Extract user data from payload
    user_id: str = payload.get("sub")
    email: str = payload.get("email")
    token_type: str = payload.get("type", "access")
    
    if user_id is None or email is None:
        raise credentials_exception
    
    # Check if token is expired
    exp = payload.get("exp")
    if exp and datetime.utcnow().timestamp() > exp:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check token type
    if token_type != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return UserTokenData(
        user_id=user_id,
        email=email,
        is_active=payload.get("is_active", True),
        is_verified=payload.get("is_verified", False),
        scopes=payload.get("scopes", []),
        token_type=token_type
    )


async def get_current_active_user(
    token_data: UserTokenData = Depends(get_current_user_token)
) -> UserTokenData:
    """
    Dependency to ensure the current user is active.
    Must be used after get_current_user_token.
    """
    if not token_data.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive or suspended"
        )
    return token_data


async def get_current_verified_user(
    token_data: UserTokenData = Depends(get_current_active_user)
) -> UserTokenData:
    """
    Dependency to ensure the current user is verified.
    Must be used after get_current_active_user.
    """
    if not token_data.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email verification required"
        )
    return token_data


async def optional_auth(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[UserTokenData]:
    """
    Optional authentication - returns user data if token is valid,
    None otherwise. Does not raise exceptions.
    """
    try:
        token = None
        if credentials:
            token = credentials.credentials
        else:
            token = extract_token_from_request(request)
        
        if not token:
            return None
        
        payload = decode_token(token)
        if payload is None:
            return None
        
        user_id = payload.get("sub")
        email = payload.get("email")
        
        if user_id is None or email is None:
            return None
        
        return UserTokenData(
            user_id=user_id,
            email=email,
            is_active=payload.get("is_active", True),
            is_verified=payload.get("is_verified", False),
            scopes=payload.get("scopes", [])
        )
    except Exception:
        return None


def generate_api_key() -> str:
    """Generate a secure API key"""
    return secrets.token_urlsafe(32)


def hash_api_key(api_key: str) -> str:
    """Hash an API key for storage"""
    return hashlib.sha256(api_key.encode()).hexdigest()


def verify_api_key(plain_api_key: str, hashed_api_key: str) -> bool:
    """Verify an API key against its hash"""
    return hash_api_key(plain_api_key) == hashed_api_key


class RateLimiter:
    """Simple in-memory rate limiter"""
    
    def __init__(self):
        self._requests: Dict[str, list] = {}
    
    def is_allowed(
        self,
        key: str,
        max_requests: int = 100,
        window_seconds: int = 60
    ) -> bool:
        """Check if request is within rate limit"""
        now = datetime.utcnow().timestamp()
        
        # Clean old requests
        if key in self._requests:
            self._requests[key] = [
                req_time for req_time in self._requests[key]
                if now - req_time < window_seconds
            ]
        else:
            self._requests[key] = []
        
        # Check limit
        if len(self._requests[key]) >= max_requests:
            return False
        
        # Record request
        self._requests[key].append(now)
        return True


# Global rate limiter instance
rate_limiter = RateLimiter()


async def rate_limit_dependency(
    request: Request,
    max_requests: int = 100,
    window_seconds: int = 60
):
    """Dependency for rate limiting"""
    # Use user ID if authenticated, otherwise use IP
    key = request.client.host
    
    token = extract_token_from_request(request)
    if token:
        payload = decode_token(token)
        if payload:
            key = payload.get("sub", key)
    
    if not rate_limiter.is_allowed(key, max_requests, window_seconds):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again later."
        )


# Permission checking utilities
def has_scope(token_data: UserTokenData, scope: str) -> bool:
    """Check if user has a specific scope/permission"""
    return scope in token_data.scopes or "admin" in token_data.scopes


def require_scope(scope: str):
    """Dependency factory for requiring a specific scope"""
    async def check_scope(
        token_data: UserTokenData = Depends(get_current_active_user)
    ) -> UserTokenData:
        if not has_scope(token_data, scope):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required scope: {scope}"
            )
        return token_data
    return check_scope


# Mock database for demonstration - replace with actual DB calls
class MockUserDB:
    """Mock user database for demonstration"""
    
    def __init__(self):
        self.users: Dict[str, Dict[str, Any]] = {}
        self.preferences: Dict[str, Dict[str, Any]] = {}
        self.emergency_contacts: Dict[str, list] = {}
        self.onboarding_intakes: Dict[str, Dict[str, Any]] = {}
        self.gdpr_deletion_logs: Dict[str, Dict[str, Any]] = {}
    
    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        return self.users.get(user_id)
    
    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        for user in self.users.values():
            if user.get("email") == email:
                return user
        return None
    
    async def update_user(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update user data"""
        if user_id not in self.users:
            raise ValueError(f"User {user_id} not found")
        
        self.users[user_id].update(data)
        self.users[user_id]["updated_at"] = datetime.utcnow()
        return self.users[user_id]
    
    async def get_preferences(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user preferences"""
        return self.preferences.get(user_id)
    
    async def update_preferences(
        self,
        user_id: str,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update user preferences"""
        if user_id not in self.preferences:
            self.preferences[user_id] = {
                "id": secrets.token_urlsafe(16),
                "user_id": user_id,
                "created_at": datetime.utcnow(),
                "custom_settings": {}
            }
        
        self.preferences[user_id].update(data)
        self.preferences[user_id]["updated_at"] = datetime.utcnow()
        return self.preferences[user_id]
    
    async def get_emergency_contacts(self, user_id: str) -> list:
        """Get user's emergency contacts"""
        return self.emergency_contacts.get(user_id, [])
    
    async def add_emergency_contact(
        self,
        user_id: str,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Add emergency contact"""
        if user_id not in self.emergency_contacts:
            self.emergency_contacts[user_id] = []
        
        contact = {
            "id": secrets.token_urlsafe(16),
            "user_id": user_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            **data
        }
        
        # If this is primary, unset other primary contacts
        if contact.get("is_primary"):
            for c in self.emergency_contacts[user_id]:
                c["is_primary"] = False
        
        self.emergency_contacts[user_id].append(contact)
        return contact
    
    async def update_emergency_contact(
        self,
        user_id: str,
        contact_id: str,
        data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Update emergency contact"""
        contacts = self.emergency_contacts.get(user_id, [])
        for contact in contacts:
            if contact["id"] == contact_id:
                contact.update(data)
                contact["updated_at"] = datetime.utcnow()
                
                # If this is primary, unset other primary contacts
                if data.get("is_primary"):
                    for c in contacts:
                        if c["id"] != contact_id:
                            c["is_primary"] = False
                
                return contact
        return None
    
    async def delete_emergency_contact(
        self,
        user_id: str,
        contact_id: str
    ) -> bool:
        """Delete emergency contact"""
        contacts = self.emergency_contacts.get(user_id, [])
        for i, contact in enumerate(contacts):
            if contact["id"] == contact_id:
                contacts.pop(i)
                return True
        return False
    
    async def save_onboarding_intake(
        self,
        user_id: str,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Save onboarding intake"""
        intake = {
            "id": secrets.token_urlsafe(16),
            "user_id": user_id,
            "completed_at": datetime.utcnow(),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            **data
        }
        self.onboarding_intakes[user_id] = intake
        
        # Update user's onboarded status
        if user_id in self.users:
            self.users[user_id]["is_onboarded"] = True
            self.users[user_id]["onboarding_completed_at"] = datetime.utcnow()
        
        return intake
    
    async def get_onboarding_intake(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get onboarding intake"""
        return self.onboarding_intakes.get(user_id)
    
    async def schedule_account_deletion(
        self,
        user_id: str,
        reason: Optional[str],
        feedback: Optional[str]
    ) -> Dict[str, Any]:
        """Schedule account deletion (GDPR)"""
        deletion_id = secrets.token_urlsafe(16)
        scheduled_at = datetime.utcnow()
        retention_days = 30
        
        log = {
            "id": deletion_id,
            "user_id": user_id,
            "requested_at": scheduled_at,
            "reason": reason,
            "feedback": feedback,
            "status": "pending",
            "retention_days": retention_days,
            "can_be_reversed_until": scheduled_at + timedelta(days=retention_days)
        }
        
        self.gdpr_deletion_logs[deletion_id] = log
        
        # Mark user for deletion
        if user_id in self.users:
            self.users[user_id]["deleted_at"] = scheduled_at
            self.users[user_id]["deletion_reason"] = reason
            self.users[user_id]["is_active"] = False
        
        return log


# Global database instance - replace with actual database connection
user_db = MockUserDB()
