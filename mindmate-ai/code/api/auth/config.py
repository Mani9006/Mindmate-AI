"""
MindMate AI - Authentication Configuration
Centralized configuration for the authentication module.
"""

import os
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field
from enum import Enum


class Environment(Enum):
    """Application environments."""
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"
    TESTING = "testing"


@dataclass
class JWTSettings:
    """JWT configuration settings."""
    secret_key: str
    refresh_secret_key: Optional[str] = None
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    password_reset_token_expire_minutes: int = 30
    email_verification_token_expire_hours: int = 24
    mfa_setup_token_expire_minutes: int = 10
    issuer: str = "mindmate-ai"
    audience: str = "mindmate-ai-api"
    
    def __post_init__(self):
        if not self.refresh_secret_key:
            self.refresh_secret_key = self.secret_key


@dataclass
class PasswordPolicySettings:
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
class RateLimitSettings:
    """Rate limiting configuration."""
    enabled: bool = True
    login_attempts_per_minute: int = 5
    login_attempts_per_hour: int = 20
    password_reset_per_hour: int = 3
    registration_per_hour: int = 5
    window_minutes: int = 60


@dataclass
class MFASettings:
    """MFA configuration settings."""
    enabled: bool = True
    required_for_roles: List[str] = field(default_factory=list)
    totp_issuer: str = "MindMate AI"
    totp_digits: int = 6
    totp_interval: int = 30
    sms_code_length: int = 6
    sms_code_expire_minutes: int = 10
    email_code_length: int = 6
    email_code_expire_minutes: int = 10
    backup_codes_count: int = 10
    max_verification_attempts: int = 3


@dataclass
class OAuthSettings:
    """OAuth provider configuration."""
    google_enabled: bool = False
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    google_redirect_uri: Optional[str] = None
    
    apple_enabled: bool = False
    apple_client_id: Optional[str] = None
    apple_team_id: Optional[str] = None
    apple_key_id: Optional[str] = None
    apple_private_key: Optional[str] = None
    apple_redirect_uri: Optional[str] = None


@dataclass
class RedisSettings:
    """Redis configuration for token storage."""
    enabled: bool = False
    host: str = "localhost"
    port: int = 6379
    db: int = 0
    password: Optional[str] = None
    ssl: bool = False
    key_prefix: str = "mindmate:auth:"


@dataclass
class SecuritySettings:
    """General security settings."""
    bcrypt_rounds: int = 12
    argon2_time_cost: int = 3
    argon2_memory_cost: int = 65536
    argon2_parallelism: int = 4
    session_timeout_minutes: int = 30
    max_concurrent_sessions: int = 5
    lockout_after_failed_attempts: int = 5
    lockout_duration_minutes: int = 30
    require_email_verification: bool = True
    allowed_hosts: List[str] = field(default_factory=list)
    cors_origins: List[str] = field(default_factory=lambda: ["http://localhost:3000"])
    secure_cookies: bool = True
    cookie_samesite: str = "lax"


@dataclass
class AuthConfig:
    """Complete authentication configuration."""
    environment: Environment = Environment.DEVELOPMENT
    jwt: JWTSettings = None
    password_policy: PasswordPolicySettings = None
    rate_limit: RateLimitSettings = None
    mfa: MFASettings = None
    oauth: OAuthSettings = None
    redis: RedisSettings = None
    security: SecuritySettings = None
    
    def __post_init__(self):
        if self.jwt is None:
            self.jwt = JWTSettings(secret_key="change-me-in-production")
        if self.password_policy is None:
            self.password_policy = PasswordPolicySettings()
        if self.rate_limit is None:
            self.rate_limit = RateLimitSettings()
        if self.mfa is None:
            self.mfa = MFASettings()
        if self.oauth is None:
            self.oauth = OAuthSettings()
        if self.redis is None:
            self.redis = RedisSettings()
        if self.security is None:
            self.security = SecuritySettings()


class ConfigLoader:
    """Load configuration from environment variables."""
    
    @staticmethod
    def load_from_env() -> AuthConfig:
        """Load configuration from environment variables."""
        env = Environment(os.getenv("APP_ENV", "development"))
        
        # JWT Settings
        jwt_secret = os.getenv("JWT_SECRET_KEY")
        if not jwt_secret and env == Environment.PRODUCTION:
            raise ValueError("JWT_SECRET_KEY is required in production")
        
        jwt_settings = JWTSettings(
            secret_key=jwt_secret or "dev-secret-do-not-use-in-production",
            refresh_secret_key=os.getenv("JWT_REFRESH_SECRET_KEY"),
            algorithm=os.getenv("JWT_ALGORITHM", "HS256"),
            access_token_expire_minutes=int(
                os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "15")
            ),
            refresh_token_expire_days=int(
                os.getenv("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "7")
            ),
            issuer=os.getenv("JWT_ISSUER", "mindmate-ai"),
            audience=os.getenv("JWT_AUDIENCE", "mindmate-ai-api"),
        )
        
        # Password Policy
        password_policy = PasswordPolicySettings(
            min_length=int(os.getenv("PASSWORD_MIN_LENGTH", "12")),
            max_length=int(os.getenv("PASSWORD_MAX_LENGTH", "128")),
            require_uppercase=os.getenv("PASSWORD_REQUIRE_UPPERCASE", "true").lower() == "true",
            require_lowercase=os.getenv("PASSWORD_REQUIRE_LOWERCASE", "true").lower() == "true",
            require_digits=os.getenv("PASSWORD_REQUIRE_DIGITS", "true").lower() == "true",
            require_special=os.getenv("PASSWORD_REQUIRE_SPECIAL", "true").lower() == "true",
            password_history_count=int(os.getenv("PASSWORD_HISTORY_COUNT", "5")),
        )
        
        # Rate Limiting
        rate_limit = RateLimitSettings(
            enabled=os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true",
            login_attempts_per_minute=int(
                os.getenv("RATE_LIMIT_LOGIN_PER_MINUTE", "5")
            ),
            login_attempts_per_hour=int(
                os.getenv("RATE_LIMIT_LOGIN_PER_HOUR", "20")
            ),
        )
        
        # MFA
        mfa = MFASettings(
            enabled=os.getenv("MFA_ENABLED", "true").lower() == "true",
            totp_issuer=os.getenv("MFA_TOTP_ISSUER", "MindMate AI"),
            required_for_roles=os.getenv(
                "MFA_REQUIRED_ROLES", ""
            ).split(",") if os.getenv("MFA_REQUIRED_ROLES") else [],
        )
        
        # OAuth
        oauth = OAuthSettings(
            google_enabled=os.getenv("GOOGLE_OAUTH_ENABLED", "false").lower() == "true",
            google_client_id=os.getenv("GOOGLE_CLIENT_ID"),
            google_client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
            google_redirect_uri=os.getenv("GOOGLE_REDIRECT_URI"),
            apple_enabled=os.getenv("APPLE_OAUTH_ENABLED", "false").lower() == "true",
            apple_client_id=os.getenv("APPLE_CLIENT_ID"),
            apple_team_id=os.getenv("APPLE_TEAM_ID"),
            apple_key_id=os.getenv("APPLE_KEY_ID"),
            apple_private_key=os.getenv("APPLE_PRIVATE_KEY"),
            apple_redirect_uri=os.getenv("APPLE_REDIRECT_URI"),
        )
        
        # Redis
        redis = RedisSettings(
            enabled=os.getenv("REDIS_ENABLED", "false").lower() == "true",
            host=os.getenv("REDIS_HOST", "localhost"),
            port=int(os.getenv("REDIS_PORT", "6379")),
            db=int(os.getenv("REDIS_DB", "0")),
            password=os.getenv("REDIS_PASSWORD"),
            ssl=os.getenv("REDIS_SSL", "false").lower() == "true",
            key_prefix=os.getenv("REDIS_KEY_PREFIX", "mindmate:auth:"),
        )
        
        # Security
        security = SecuritySettings(
            bcrypt_rounds=int(os.getenv("BCRYPT_ROUNDS", "12")),
            session_timeout_minutes=int(
                os.getenv("SESSION_TIMEOUT_MINUTES", "30")
            ),
            max_concurrent_sessions=int(
                os.getenv("MAX_CONCURRENT_SESSIONS", "5")
            ),
            lockout_after_failed_attempts=int(
                os.getenv("LOCKOUT_AFTER_FAILED_ATTEMPTS", "5")
            ),
            lockout_duration_minutes=int(
                os.getenv("LOCKOUT_DURATION_MINUTES", "30")
            ),
            require_email_verification=os.getenv(
                "REQUIRE_EMAIL_VERIFICATION", "true"
            ).lower() == "true",
            secure_cookies=os.getenv("SECURE_COOKIES", "true").lower() == "true",
            cookie_samesite=os.getenv("COOKIE_SAMESITE", "lax"),
        )
        
        # Parse CORS origins
        cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000")
        security.cors_origins = [o.strip() for o in cors_origins.split(",")]
        
        # Parse allowed hosts
        allowed_hosts = os.getenv("ALLOWED_HOSTS", "")
        if allowed_hosts:
            security.allowed_hosts = [h.strip() for h in allowed_hosts.split(",")]
        
        return AuthConfig(
            environment=env,
            jwt=jwt_settings,
            password_policy=password_policy,
            rate_limit=rate_limit,
            mfa=mfa,
            oauth=oauth,
            redis=redis,
            security=security,
        )
    
    @staticmethod
    def load_from_dict(config_dict: Dict[str, Any]) -> AuthConfig:
        """Load configuration from dictionary."""
        jwt_settings = JWTSettings(**config_dict.get("jwt", {}))
        password_policy = PasswordPolicySettings(**config_dict.get("password_policy", {}))
        rate_limit = RateLimitSettings(**config_dict.get("rate_limit", {}))
        mfa = MFASettings(**config_dict.get("mfa", {}))
        oauth = OAuthSettings(**config_dict.get("oauth", {}))
        redis = RedisSettings(**config_dict.get("redis", {}))
        security = SecuritySettings(**config_dict.get("security", {}))
        
        return AuthConfig(
            environment=Environment(config_dict.get("environment", "development")),
            jwt=jwt_settings,
            password_policy=password_policy,
            rate_limit=rate_limit,
            mfa=mfa,
            oauth=oauth,
            redis=redis,
            security=security,
        )


# Global configuration instance
_config: Optional[AuthConfig] = None


def get_config() -> AuthConfig:
    """Get current configuration."""
    global _config
    if _config is None:
        _config = ConfigLoader.load_from_env()
    return _config


def set_config(config: AuthConfig) -> None:
    """Set global configuration."""
    global _config
    _config = config


def initialize_from_env() -> AuthConfig:
    """Initialize configuration from environment variables."""
    global _config
    _config = ConfigLoader.load_from_env()
    return _config


# Example configurations for different environments
def get_development_config() -> AuthConfig:
    """Get development configuration."""
    return AuthConfig(
        environment=Environment.DEVELOPMENT,
        jwt=JWTSettings(
            secret_key="dev-secret-key-do-not-use-in-production",
            access_token_expire_minutes=60,
            refresh_token_expire_days=30,
        ),
        password_policy=PasswordPolicySettings(
            min_length=8,  # Relaxed for development
        ),
        rate_limit=RateLimitSettings(
            enabled=False,  # Disabled for development
        ),
        mfa=MFASettings(
            enabled=True,
        ),
        redis=RedisSettings(
            enabled=False,
        ),
        security=SecuritySettings(
            secure_cookies=False,
            require_email_verification=False,
        ),
    )


def get_production_config() -> AuthConfig:
    """Get production configuration template."""
    jwt_secret = os.getenv("JWT_SECRET_KEY")
    if not jwt_secret:
        raise ValueError("JWT_SECRET_KEY environment variable is required in production")
    
    return AuthConfig(
        environment=Environment.PRODUCTION,
        jwt=JWTSettings(
            secret_key=jwt_secret,
            refresh_secret_key=os.getenv("JWT_REFRESH_SECRET_KEY"),
            access_token_expire_minutes=15,
            refresh_token_expire_days=7,
        ),
        password_policy=PasswordPolicySettings(
            min_length=12,
            require_uppercase=True,
            require_lowercase=True,
            require_digits=True,
            require_special=True,
        ),
        rate_limit=RateLimitSettings(
            enabled=True,
            login_attempts_per_minute=5,
            login_attempts_per_hour=20,
        ),
        mfa=MFASettings(
            enabled=True,
            required_for_roles=["admin"],
        ),
        redis=RedisSettings(
            enabled=True,
            host=os.getenv("REDIS_HOST", "localhost"),
            port=int(os.getenv("REDIS_PORT", "6379")),
            ssl=True,
        ),
        security=SecuritySettings(
            secure_cookies=True,
            require_email_verification=True,
            lockout_after_failed_attempts=5,
            lockout_duration_minutes=30,
        ),
    )
