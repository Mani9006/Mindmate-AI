"""
MindMate AI - Authentication Endpoints
Production-ready FastAPI endpoints for user authentication.
"""

import re
import secrets
import hashlib
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, validator
from fastapi import APIRouter, HTTPException, Depends, Request, BackgroundTasks, status
from fastapi.security import HTTPBearer
import logging

# Import our modules
from .jwt import JWTManager, JWTConfig, create_tokens, refresh_access_token, TokenType
from .refresh_token import RefreshTokenManager, create_token_manager
from .middleware import get_current_auth, AuthContext, require_mfa_verified
from .mfa import MFAManager, MFAMethod
from .oauth import OAuthManager, OAuthProvider
from .password_reset import PasswordResetManager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])
security = HTTPBearer()


# ============================================================================
# Pydantic Models
# ============================================================================

class UserRegistrationRequest(BaseModel):
    """User registration request model."""
    email: EmailStr
    password: str = Field(..., min_length=12, max_length=128)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    accept_terms: bool = Field(..., description="Must accept terms of service")
    marketing_consent: bool = False
    
    @validator('password')
    def validate_password(cls, v):
        """Validate password strength."""
        if len(v) < 12:
            raise ValueError('Password must be at least 12 characters')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        return v
    
    @validator('accept_terms')
    def validate_terms(cls, v):
        if not v:
            raise ValueError('You must accept the terms of service')
        return v
    
    @validator('phone')
    def validate_phone(cls, v):
        if v and not re.match(r'^\+?[1-9]\d{1,14}$', v.replace(' ', '').replace('-', '')):
            raise ValueError('Invalid phone number format')
        return v


class UserRegistrationResponse(BaseModel):
    """User registration response model."""
    user_id: str
    email: str
    message: str
    email_verification_sent: bool
    requires_email_verification: bool = True


class LoginRequest(BaseModel):
    """Login request model."""
    email: EmailStr
    password: str
    device_id: Optional[str] = None
    device_info: Optional[Dict[str, Any]] = None
    mfa_code: Optional[str] = None


class LoginResponse(BaseModel):
    """Login response model."""
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int
    user_id: str
    email: str
    roles: List[str]
    mfa_required: bool = False
    mfa_methods: Optional[List[str]] = None


class TokenRefreshRequest(BaseModel):
    """Token refresh request model."""
    refresh_token: str


class TokenRefreshResponse(BaseModel):
    """Token refresh response model."""
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int


class LogoutRequest(BaseModel):
    """Logout request model."""
    refresh_token: Optional[str] = None
    logout_all_devices: bool = False


class LogoutResponse(BaseModel):
    """Logout response model."""
    message: str
    sessions_terminated: int


class ForgotPasswordRequest(BaseModel):
    """Forgot password request model."""
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    """Forgot password response model."""
    message: str


class ResetPasswordRequest(BaseModel):
    """Reset password request model."""
    token: str
    new_password: str = Field(..., min_length=12, max_length=128)
    confirm_password: str
    
    @validator('new_password')
    def validate_password(cls, v):
        if len(v) < 12:
            raise ValueError('Password must be at least 12 characters')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        return v
    
    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('Passwords do not match')
        return v


class ResetPasswordResponse(BaseModel):
    """Reset password response model."""
    message: str


class ChangePasswordRequest(BaseModel):
    """Change password request model."""
    current_password: str
    new_password: str = Field(..., min_length=12, max_length=128)
    confirm_password: str
    logout_all_devices: bool = False


class MFASetupRequest(BaseModel):
    """MFA setup request model."""
    method: str  # "totp", "sms", "email"
    phone_number: Optional[str] = None


class MFASetupResponse(BaseModel):
    """MFA setup response model."""
    method: str
    secret: Optional[str] = None  # For TOTP
    qr_code_uri: Optional[str] = None  # For TOTP
    backup_codes: Optional[List[str]] = None
    message: str


class MFAVerifyRequest(BaseModel):
    """MFA verification request model."""
    method: str
    code: str
    setup_token: Optional[str] = None


class MFAVerifyResponse(BaseModel):
    """MFA verification response model."""
    verified: bool
    message: str


class MFADisableRequest(BaseModel):
    """MFA disable request model."""
    password: str
    mfa_code: str


class OAuthLoginRequest(BaseModel):
    """OAuth login request model."""
    provider: str  # "google", "apple"
    code: Optional[str] = None
    id_token: Optional[str] = None
    access_token: Optional[str] = None
    device_id: Optional[str] = None
    device_info: Optional[Dict[str, Any]] = None


class OAuthLoginResponse(BaseModel):
    """OAuth login response model."""
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int
    user_id: str
    email: str
    is_new_user: bool
    roles: List[str]


class SessionInfo(BaseModel):
    """Session information model."""
    session_id: str
    device_id: Optional[str]
    device_info: Optional[Dict[str, Any]]
    ip_address: Optional[str]
    created_at: str
    expires_at: str


class SessionsResponse(BaseModel):
    """Active sessions response model."""
    sessions: List[SessionInfo]


# ============================================================================
# Mock Database (Replace with actual database in production)
# ============================================================================

class MockUserDB:
    """Mock user database for demonstration."""
    
    def __init__(self):
        self.users: Dict[str, Dict] = {}
        self.email_index: Dict[str, str] = {}  # email -> user_id
    
    def get_by_email(self, email: str) -> Optional[Dict]:
        user_id = self.email_index.get(email.lower())
        if user_id:
            return self.users.get(user_id)
        return None
    
    def get_by_id(self, user_id: str) -> Optional[Dict]:
        return self.users.get(user_id)
    
    def create(self, user_data: Dict) -> str:
        user_id = secrets.token_urlsafe(16)
        user_data['user_id'] = user_id
        user_data['created_at'] = datetime.now(timezone.utc).isoformat()
        self.users[user_id] = user_data
        self.email_index[user_data['email'].lower()] = user_id
        return user_id
    
    def update(self, user_id: str, updates: Dict) -> bool:
        if user_id in self.users:
            self.users[user_id].update(updates)
            return True
        return False


# Global instances (use dependency injection in production)
user_db = MockUserDB()
jwt_manager = JWTManager()
token_manager = create_token_manager(use_redis=False)
mfa_manager = MFAManager()
oauth_manager = OAuthManager()
password_reset_manager = PasswordResetManager()


# ============================================================================
# Password Hashing
# ============================================================================

class PasswordHasher:
    """Production-ready password hashing using Argon2."""
    
    def __init__(self):
        try:
            from argon2 import PasswordHasher as Argon2Hasher
            self.hasher = Argon2Hasher(
                time_cost=3,
                memory_cost=65536,
                parallelism=4,
                hash_len=32,
                salt_len=16
            )
            self.use_argon2 = True
        except ImportError:
            import bcrypt
            self.use_argon2 = False
            self.bcrypt = bcrypt
    
    def hash(self, password: str) -> str:
        """Hash a password."""
        if self.use_argon2:
            return self.hasher.hash(password)
        else:
            return self.bcrypt.hashpw(
                password.encode(),
                self.bcrypt.gensalt(rounds=12)
            ).decode()
    
    def verify(self, password: str, hashed: str) -> bool:
        """Verify a password against its hash."""
        try:
            if self.use_argon2:
                self.hasher.verify(hashed, password)
                return True
            else:
                return self.bcrypt.checkpw(
                    password.encode(),
                    hashed.encode()
                )
        except Exception:
            return False
    
    def needs_rehash(self, hashed: str) -> bool:
        """Check if password needs rehashing."""
        if self.use_argon2:
            return self.hasher.check_needs_rehash(hashed)
        return False


password_hasher = PasswordHasher()


# ============================================================================
# Registration Endpoint
# ============================================================================

@router.post(
    "/register",
    response_model=UserRegistrationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Create a new user account with email verification."
)
async def register(
    request: Request,
    background_tasks: BackgroundTasks,
    registration: UserRegistrationRequest
):
    """
    Register a new user account.
    
    - Validates email uniqueness
    - Enforces strong password requirements
    - Hashes password securely
    - Sends verification email
    """
    # Check if email already exists
    existing_user = user_db.get_by_email(registration.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )
    
    # Hash password
    password_hash = password_hasher.hash(registration.password)
    
    # Create user
    user_data = {
        "email": registration.email.lower(),
        "password_hash": password_hash,
        "first_name": registration.first_name,
        "last_name": registration.last_name,
        "phone": registration.phone,
        "date_of_birth": registration.date_of_birth,
        "marketing_consent": registration.marketing_consent,
        "email_verified": False,
        "roles": ["user"],
        "permissions": ["read:profile", "write:profile"],
        "account_status": "pending_verification",
        "failed_login_attempts": 0,
        "locked_until": None,
        "mfa_enabled": False,
        "mfa_methods": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    
    user_id = user_db.create(user_data)
    
    # Generate email verification token
    verification_token = jwt_manager.generate_email_verification_token(
        user_id=user_id,
        email=registration.email
    )
    
    # Send verification email (async)
    background_tasks.add_task(
        send_verification_email,
        email=registration.email,
        token=verification_token,
        first_name=registration.first_name
    )
    
    logger.info(f"New user registered: {registration.email}")
    
    return UserRegistrationResponse(
        user_id=user_id,
        email=registration.email,
        message="Registration successful. Please check your email to verify your account.",
        email_verification_sent=True,
        requires_email_verification=True
    )


async def send_verification_email(email: str, token: str, first_name: str):
    """Send email verification email."""
    # Implement with your email service (SendGrid, AWS SES, etc.)
    logger.info(f"Sending verification email to {email}")
    # TODO: Implement actual email sending


# ============================================================================
# Login Endpoint
# ============================================================================

@router.post(
    "/login",
    response_model=LoginResponse,
    summary="User login",
    description="Authenticate user and return JWT tokens."
)
async def login(
    request: Request,
    login_data: LoginRequest
):
    """
    Authenticate user and issue JWT tokens.
    
    - Validates credentials
    - Checks account status
    - Handles MFA if enabled
    - Issues access and refresh tokens
    """
    # Get user by email
    user = user_db.get_by_email(login_data.email)
    
    if not user:
        # Use constant-time comparison to prevent timing attacks
        password_hasher.hash("dummy_password_for_timing")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check account status
    if user.get("account_status") == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account suspended. Please contact support."
        )
    
    if user.get("account_status") == "pending_verification":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email verification required"
        )
    
    # Check account lock
    locked_until = user.get("locked_until")
    if locked_until:
        locked_time = datetime.fromisoformat(locked_until)
        if datetime.now(timezone.utc) < locked_time:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account temporarily locked. Please try again later."
            )
        else:
            # Reset lock
            user_db.update(user['user_id'], {
                "locked_until": None,
                "failed_login_attempts": 0
            })
    
    # Verify password
    if not password_hasher.verify(login_data.password, user['password_hash']):
        # Increment failed attempts
        failed_attempts = user.get('failed_login_attempts', 0) + 1
        updates = {"failed_login_attempts": failed_attempts}
        
        # Lock account after 5 failed attempts
        if failed_attempts >= 5:
            lock_until = datetime.now(timezone.utc) + timedelta(minutes=30)
            updates["locked_until"] = lock_until.isoformat()
            logger.warning(f"Account locked for user {login_data.email}")
        
        user_db.update(user['user_id'], updates)
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Reset failed attempts on successful login
    user_db.update(user['user_id'], {
        "failed_login_attempts": 0,
        "last_login_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Check if MFA is required
    if user.get("mfa_enabled"):
        if not login_data.mfa_code:
            return LoginResponse(
                access_token="",
                refresh_token="",
                token_type="Bearer",
                expires_in=0,
                user_id=user['user_id'],
                email=user['email'],
                roles=user.get('roles', ['user']),
                mfa_required=True,
                mfa_methods=[m['method'] for m in user.get('mfa_methods', [])]
            )
        
        # Verify MFA code
        mfa_verified = False
        for mfa_method in user.get('mfa_methods', []):
            if mfa_manager.verify_code(
                user['user_id'],
                mfa_method['method'],
                login_data.mfa_code
            ):
                mfa_verified = True
                break
        
        if not mfa_verified:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid MFA code"
            )
    
    # Create session
    session_id = secrets.token_urlsafe(16)
    device_id = login_data.device_id or secrets.token_urlsafe(8)
    
    # Generate tokens
    tokens = create_tokens(
        user_id=user['user_id'],
        roles=user.get('roles', ['user']),
        permissions=user.get('permissions', []),
        session_id=session_id,
        device_id=device_id
    )
    
    # Store refresh token
    client_ip = request.client.host if request.client else None
    token_manager.create_refresh_token(
        user_id=user['user_id'],
        session_id=session_id,
        device_id=device_id,
        device_info=login_data.device_info,
        ip_address=client_ip
    )
    
    logger.info(f"User logged in: {login_data.email}")
    
    return LoginResponse(
        access_token=tokens['access_token'],
        refresh_token=tokens['refresh_token'],
        token_type=tokens['token_type'],
        expires_in=tokens['expires_in'],
        user_id=user['user_id'],
        email=user['email'],
        roles=user.get('roles', ['user']),
        mfa_required=False
    )


# ============================================================================
# Token Refresh Endpoint
# ============================================================================

@router.post(
    "/refresh",
    response_model=TokenRefreshResponse,
    summary="Refresh access token",
    description="Get new access token using refresh token."
)
async def refresh_token(
    request: Request,
    refresh_data: TokenRefreshRequest
):
    """
    Refresh access token using a valid refresh token.
    
    Implements token rotation - returns new refresh token.
    """
    try:
        tokens = refresh_access_token(refresh_data.refresh_token)
        
        return TokenRefreshResponse(
            access_token=tokens['access_token'],
            refresh_token=tokens['refresh_token'],
            token_type=tokens['token_type'],
            expires_in=tokens['expires_in']
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )


# ============================================================================
# Logout Endpoint
# ============================================================================

@router.post(
    "/logout",
    response_model=LogoutResponse,
    summary="User logout",
    description="Logout user and revoke tokens."
)
async def logout(
    request: Request,
    logout_data: LogoutRequest,
    auth: AuthContext = Depends(get_current_auth)
):
    """
    Logout user and revoke tokens.
    
    - Revokes current refresh token
    - Optionally revokes all user tokens
    """
    sessions_terminated = 0
    
    if logout_data.logout_all_devices:
        # Revoke all user tokens
        sessions_terminated = token_manager.revoke_all_user_tokens(
            auth.user_id,
            reason="user_logout_all"
        )
        jwt_manager.revoke_all_user_tokens(auth.user_id)
    elif logout_data.refresh_token:
        # Revoke specific refresh token
        try:
            payload = jwt_manager.validate_token(
                logout_data.refresh_token,
                TokenType.REFRESH
            )
            jwt_manager.revoke_token(payload['jti'])
            token_manager.revoke_token(payload['jti'], "user_logout")
            sessions_terminated = 1
        except Exception:
            pass
    
    # Revoke access token
    jwt_manager.revoke_token(auth.token_jti)
    
    logger.info(f"User logged out: {auth.user_id}")
    
    return LogoutResponse(
        message="Logout successful",
        sessions_terminated=sessions_terminated
    )


# ============================================================================
# Password Reset Endpoints
# ============================================================================

@router.post(
    "/forgot-password",
    response_model=ForgotPasswordResponse,
    summary="Request password reset",
    description="Send password reset email to user."
)
async def forgot_password(
    request: Request,
    background_tasks: BackgroundTasks,
    forgot_data: ForgotPasswordRequest
):
    """
    Request password reset email.
    
    Always returns success to prevent email enumeration attacks.
    """
    user = user_db.get_by_email(forgot_data.email)
    
    if user:
        # Generate reset token
        reset_token = jwt_manager.generate_password_reset_token(user['user_id'])
        
        # Send reset email (async)
        background_tasks.add_task(
            send_password_reset_email,
            email=forgot_data.email,
            token=reset_token,
            first_name=user.get('first_name', 'User')
        )
        
        logger.info(f"Password reset requested for: {forgot_data.email}")
    
    # Always return success
    return ForgotPasswordResponse(
        message="If an account exists with this email, you will receive password reset instructions."
    )


async def send_password_reset_email(email: str, token: str, first_name: str):
    """Send password reset email."""
    logger.info(f"Sending password reset email to {email}")
    # TODO: Implement actual email sending


@router.post(
    "/reset-password",
    response_model=ResetPasswordResponse,
    summary="Reset password",
    description="Reset password using reset token."
)
async def reset_password(
    request: Request,
    reset_data: ResetPasswordRequest
):
    """
    Reset password using valid reset token.
    """
    try:
        # Validate reset token
        payload = jwt_manager.validate_token(
            reset_data.token,
            TokenType.PASSWORD_RESET
        )
        
        user_id = payload.get("sub")
        user = user_db.get_by_id(user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
        
        # Hash new password
        new_password_hash = password_hasher.hash(reset_data.new_password)
        
        # Update password
        user_db.update(user_id, {
            "password_hash": new_password_hash,
            "password_changed_at": datetime.now(timezone.utc).isoformat(),
            "failed_login_attempts": 0,
            "locked_until": None
        })
        
        # Revoke all existing tokens
        token_manager.revoke_all_user_tokens(user_id, "password_reset")
        jwt_manager.revoke_all_user_tokens(user_id)
        
        # Revoke reset token
        jwt_manager.revoke_token(payload['jti'])
        
        logger.info(f"Password reset successful for user: {user_id}")
        
        return ResetPasswordResponse(
            message="Password reset successful. Please log in with your new password."
        )
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset token"
        )


@router.post(
    "/change-password",
    summary="Change password",
    description="Change password while logged in."
)
async def change_password(
    request: Request,
    change_data: ChangePasswordRequest,
    auth: AuthContext = Depends(get_current_auth)
):
    """
    Change password for logged-in user.
    """
    user = user_db.get_by_id(auth.user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Verify current password
    if not password_hasher.verify(change_data.current_password, user['password_hash']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect"
        )
    
    # Hash new password
    new_password_hash = password_hasher.hash(change_data.new_password)
    
    # Update password
    user_db.update(auth.user_id, {
        "password_hash": new_password_hash,
        "password_changed_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Optionally logout from all devices
    if change_data.logout_all_devices:
        token_manager.revoke_all_user_tokens(auth.user_id, "password_change")
        jwt_manager.revoke_all_user_tokens(auth.user_id)
    
    logger.info(f"Password changed for user: {auth.user_id}")
    
    return {"message": "Password changed successfully"}


# ============================================================================
# MFA Endpoints
# ============================================================================

@router.post(
    "/mfa/setup",
    response_model=MFASetupResponse,
    summary="Setup MFA",
    description="Setup multi-factor authentication."
)
async def setup_mfa(
    request: Request,
    setup_data: MFASetupRequest,
    auth: AuthContext = Depends(get_current_auth)
):
    """
    Setup MFA for the user.
    
    Supports TOTP (authenticator apps), SMS, and email.
    """
    user = user_db.get_by_id(auth.user_id)
    
    if setup_data.method == "totp":
        # Generate TOTP secret
        secret, qr_uri, backup_codes = mfa_manager.setup_totp(auth.user_id)
        
        return MFASetupResponse(
            method="totp",
            secret=secret,
            qr_code_uri=qr_uri,
            backup_codes=backup_codes,
            message="Scan the QR code with your authenticator app and verify with a code."
        )
    
    elif setup_data.method == "sms":
        if not setup_data.phone_number:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number required for SMS MFA"
            )
        
        mfa_manager.setup_sms(auth.user_id, setup_data.phone_number)
        
        return MFASetupResponse(
            method="sms",
            message=f"SMS MFA setup initiated. Verification code sent to {setup_data.phone_number}"
        )
    
    elif setup_data.method == "email":
        mfa_manager.setup_email(auth.user_id, user['email'])
        
        return MFASetupResponse(
            method="email",
            message=f"Email MFA setup initiated. Verification code sent to {user['email']}"
        )
    
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported MFA method"
        )


@router.post(
    "/mfa/verify",
    response_model=MFAVerifyResponse,
    summary="Verify MFA setup",
    description="Verify MFA setup code."
)
async def verify_mfa(
    request: Request,
    verify_data: MFAVerifyRequest,
    auth: AuthContext = Depends(get_current_auth)
):
    """
    Verify MFA setup code and enable MFA.
    """
    verified = mfa_manager.verify_setup_code(
        auth.user_id,
        verify_data.method,
        verify_data.code
    )
    
    if verified:
        # Enable MFA for user
        user = user_db.get_by_id(auth.user_id)
        mfa_methods = user.get('mfa_methods', [])
        
        # Check if method already exists
        existing = [m for m in mfa_methods if m['method'] == verify_data.method]
        if not existing:
            mfa_methods.append({
                "method": verify_data.method,
                "enabled_at": datetime.now(timezone.utc).isoformat(),
                "verified": True
            })
        
        user_db.update(auth.user_id, {
            "mfa_enabled": True,
            "mfa_methods": mfa_methods
        })
        
        logger.info(f"MFA enabled for user {auth.user_id}: {verify_data.method}")
        
        return MFAVerifyResponse(
            verified=True,
            message="MFA setup successful"
        )
    
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Invalid verification code"
    )


@router.post(
    "/mfa/disable",
    summary="Disable MFA",
    description="Disable multi-factor authentication."
)
async def disable_mfa(
    request: Request,
    disable_data: MFADisableRequest,
    auth: AuthContext = Depends(get_current_auth)
):
    """
    Disable MFA for the user.
    """
    user = user_db.get_by_id(auth.user_id)
    
    # Verify password
    if not password_hasher.verify(disable_data.password, user['password_hash']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Password is incorrect"
        )
    
    # Verify MFA code
    mfa_verified = False
    for mfa_method in user.get('mfa_methods', []):
        if mfa_manager.verify_code(
            auth.user_id,
            mfa_method['method'],
            disable_data.mfa_code
        ):
            mfa_verified = True
            break
    
    if not mfa_verified:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid MFA code"
        )
    
    # Disable MFA
    user_db.update(auth.user_id, {
        "mfa_enabled": False,
        "mfa_methods": []
    })
    
    logger.info(f"MFA disabled for user: {auth.user_id}")
    
    return {"message": "MFA disabled successfully"}


# ============================================================================
# OAuth Endpoints
# ============================================================================

@router.post(
    "/oauth/login",
    response_model=OAuthLoginResponse,
    summary="OAuth login",
    description="Login with Google or Apple OAuth."
)
async def oauth_login(
    request: Request,
    oauth_data: OAuthLoginRequest
):
    """
    Authenticate using OAuth provider (Google or Apple).
    
    - Validates OAuth token/code
    - Creates user if not exists
    - Issues JWT tokens
    """
    provider = OAuthProvider(oauth_data.provider)
    
    try:
        # Verify OAuth token
        if oauth_data.id_token:
            oauth_user = await oauth_manager.verify_id_token(
                provider,
                oauth_data.id_token
            )
        elif oauth_data.access_token:
            oauth_user = await oauth_manager.verify_access_token(
                provider,
                oauth_data.access_token
            )
        elif oauth_data.code:
            oauth_user = await oauth_manager.exchange_code(
                provider,
                oauth_data.code
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OAuth token, code, or id_token required"
            )
        
        # Check if user exists
        user = user_db.get_by_email(oauth_user['email'])
        is_new_user = False
        
        if not user:
            # Create new user from OAuth data
            user_data = {
                "email": oauth_user['email'].lower(),
                "password_hash": "",  # No password for OAuth users
                "first_name": oauth_user.get('first_name', ''),
                "last_name": oauth_user.get('last_name', ''),
                "email_verified": oauth_user.get('email_verified', True),
                "roles": ["user"],
                "permissions": ["read:profile", "write:profile"],
                "account_status": "active",
                "oauth_provider": provider.value,
                "oauth_subject": oauth_user.get('sub'),
                "mfa_enabled": False,
            }
            user_id = user_db.create(user_data)
            user = user_db.get_by_id(user_id)
            is_new_user = True
            
            logger.info(f"New user created via OAuth: {oauth_user['email']}")
        
        # Create session
        session_id = secrets.token_urlsafe(16)
        device_id = oauth_data.device_id or secrets.token_urlsafe(8)
        
        # Generate tokens
        tokens = create_tokens(
            user_id=user['user_id'],
            roles=user.get('roles', ['user']),
            permissions=user.get('permissions', []),
            session_id=session_id,
            device_id=device_id
        )
        
        # Store refresh token
        client_ip = request.client.host if request.client else None
        token_manager.create_refresh_token(
            user_id=user['user_id'],
            session_id=session_id,
            device_id=device_id,
            device_info=oauth_data.device_info,
            ip_address=client_ip
        )
        
        logger.info(f"OAuth login successful: {oauth_user['email']}")
        
        return OAuthLoginResponse(
            access_token=tokens['access_token'],
            refresh_token=tokens['refresh_token'],
            token_type=tokens['token_type'],
            expires_in=tokens['expires_in'],
            user_id=user['user_id'],
            email=user['email'],
            is_new_user=is_new_user,
            roles=user.get('roles', ['user'])
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"OAuth authentication failed: {str(e)}"
        )


@router.get(
    "/oauth/{provider}/url",
    summary="Get OAuth URL",
    description="Get OAuth authorization URL for the provider."
)
async def get_oauth_url(provider: str, redirect_uri: str):
    """Get OAuth authorization URL."""
    try:
        oauth_provider = OAuthProvider(provider)
        auth_url = oauth_manager.get_authorization_url(
            oauth_provider,
            redirect_uri
        )
        return {"authorization_url": auth_url}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ============================================================================
# Session Management Endpoints
# ============================================================================

@router.get(
    "/sessions",
    response_model=SessionsResponse,
    summary="Get active sessions",
    description="Get all active sessions for the user."
)
async def get_sessions(
    auth: AuthContext = Depends(get_current_auth)
):
    """Get all active sessions for the current user."""
    sessions = token_manager.get_user_sessions(auth.user_id)
    return SessionsResponse(sessions=[SessionInfo(**s) for s in sessions])


@router.delete(
    "/sessions/{session_id}",
    summary="Revoke session",
    description="Revoke a specific session."
)
async def revoke_session(
    session_id: str,
    auth: AuthContext = Depends(get_current_auth)
):
    """Revoke a specific session."""
    success = token_manager.revoke_session(auth.user_id, session_id)
    
    if success:
        return {"message": "Session revoked successfully"}
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Session not found"
    )


# ============================================================================
# Email Verification Endpoint
# ============================================================================

@router.get(
    "/verify-email",
    summary="Verify email",
    description="Verify email address using verification token."
)
async def verify_email(token: str):
    """Verify email address."""
    try:
        payload = jwt_manager.validate_token(token, TokenType.EMAIL_VERIFICATION)
        user_id = payload.get("sub")
        
        user = user_db.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification token"
            )
        
        # Update user
        user_db.update(user_id, {
            "email_verified": True,
            "account_status": "active"
        })
        
        # Revoke verification token
        jwt_manager.revoke_token(payload['jti'])
        
        logger.info(f"Email verified for user: {user_id}")
        
        return {"message": "Email verified successfully"}
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification token has expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification token"
        )


@router.post(
    "/resend-verification",
    summary="Resend verification email",
    description="Resend email verification link."
)
async def resend_verification(
    request: Request,
    background_tasks: BackgroundTasks,
    email: EmailStr
):
    """Resend email verification."""
    user = user_db.get_by_email(email)
    
    if user and not user.get('email_verified'):
        # Generate new verification token
        verification_token = jwt_manager.generate_email_verification_token(
            user_id=user['user_id'],
            email=email
        )
        
        # Send verification email
        background_tasks.add_task(
            send_verification_email,
            email=email,
            token=verification_token,
            first_name=user.get('first_name', 'User')
        )
    
    # Always return success
    return {"message": "If an unverified account exists, verification email has been sent."}
