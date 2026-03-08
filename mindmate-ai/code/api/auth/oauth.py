"""
MindMate AI - OAuth Integration Module
Production-ready OAuth 2.0 integration for Google and Apple Sign-In.
"""

import jwt
import json
import base64
import secrets
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
from urllib.parse import urlencode, parse_qs, urlparse
import logging

import httpx

logger = logging.getLogger(__name__)


class OAuthProvider(Enum):
    """Supported OAuth providers."""
    GOOGLE = "google"
    APPLE = "apple"


@dataclass
class OAuthConfig:
    """OAuth provider configuration."""
    client_id: str
    client_secret: str
    redirect_uri: str
    authorization_endpoint: str
    token_endpoint: str
    userinfo_endpoint: Optional[str] = None
    scopes: List[str] = None
    
    def __post_init__(self):
        if self.scopes is None:
            self.scopes = ["openid", "email", "profile"]


@dataclass
class OAuthUserInfo:
    """Standardized OAuth user information."""
    sub: str  # Subject identifier (provider's user ID)
    email: str
    email_verified: bool
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    picture: Optional[str] = None
    locale: Optional[str] = None
    provider: str = None
    raw_data: Dict[str, Any] = None


class GoogleOAuthProvider:
    """
    Google OAuth 2.0 / OpenID Connect provider.
    
    Implements:
    - Authorization Code flow
    - ID Token validation
    - Userinfo endpoint
    """
    
    AUTHORIZATION_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth"
    TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
    USERINFO_ENDPOINT = "https://openidconnect.googleapis.com/v1/userinfo"
    CERTS_ENDPOINT = "https://www.googleapis.com/oauth2/v3/certs"
    
    DEFAULT_SCOPES = [
        "openid",
        "email",
        "profile",
    ]
    
    def __init__(self, config: OAuthConfig):
        self.config = config
        self._jwks_cache: Optional[Dict] = None
        self._jwks_cache_time: Optional[datetime] = None
    
    def get_authorization_url(
        self,
        state: Optional[str] = None,
        additional_scopes: Optional[List[str]] = None
    ) -> str:
        """
        Generate Google OAuth authorization URL.
        
        Args:
            state: CSRF protection state parameter
            additional_scopes: Additional OAuth scopes to request
            
        Returns:
            Authorization URL
        """
        scopes = self.config.scopes.copy()
        if additional_scopes:
            scopes.extend(additional_scopes)
        
        params = {
            "client_id": self.config.client_id,
            "redirect_uri": self.config.redirect_uri,
            "response_type": "code",
            "scope": " ".join(scopes),
            "access_type": "offline",
            "include_granted_scopes": "true",
            "prompt": "consent",
        }
        
        if state:
            params["state"] = state
        
        return f"{self.AUTHORIZATION_ENDPOINT}?{urlencode(params)}"
    
    async def exchange_code(self, code: str) -> Dict[str, Any]:
        """
        Exchange authorization code for tokens.
        
        Args:
            code: Authorization code from callback
            
        Returns:
            Token response containing access_token, id_token, refresh_token
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.TOKEN_ENDPOINT,
                data={
                    "code": code,
                    "client_id": self.config.client_id,
                    "client_secret": self.config.client_secret,
                    "redirect_uri": self.config.redirect_uri,
                    "grant_type": "authorization_code",
                },
                headers={"Accept": "application/json"}
            )
            
            if response.status_code != 200:
                logger.error(f"Google token exchange failed: {response.text}")
                raise ValueError(f"Token exchange failed: {response.text}")
            
            return response.json()
    
    async def verify_id_token(self, id_token: str) -> OAuthUserInfo:
        """
        Verify and decode Google ID token.
        
        Args:
            id_token: JWT ID token from Google
            
        Returns:
            OAuthUserInfo with user details
        """
        # Fetch Google's public keys
        jwks = await self._get_jwks()
        
        # Find the correct key
        unverified_header = jwt.get_unverified_header(id_token)
        kid = unverified_header.get("kid")
        
        key = None
        for jwk in jwks.get("keys", []):
            if jwk.get("kid") == kid:
                key = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(jwk))
                break
        
        if not key:
            raise ValueError("Unable to find appropriate key for ID token verification")
        
        # Verify and decode
        payload = jwt.decode(
            id_token,
            key,
            algorithms=["RS256"],
            audience=self.config.client_id,
            issuer=["https://accounts.google.com", "accounts.google.com"]
        )
        
        return OAuthUserInfo(
            sub=payload.get("sub"),
            email=payload.get("email"),
            email_verified=payload.get("email_verified", False),
            first_name=payload.get("given_name"),
            last_name=payload.get("family_name"),
            picture=payload.get("picture"),
            locale=payload.get("locale"),
            provider="google",
            raw_data=payload
        )
    
    async def verify_access_token(self, access_token: str) -> OAuthUserInfo:
        """
        Verify access token and fetch user info.
        
        Args:
            access_token: OAuth access token
            
        Returns:
            OAuthUserInfo with user details
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                self.USERINFO_ENDPOINT,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/json"
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Google userinfo failed: {response.text}")
                raise ValueError(f"Failed to fetch user info: {response.text}")
            
            data = response.json()
            
            return OAuthUserInfo(
                sub=data.get("sub"),
                email=data.get("email"),
                email_verified=data.get("email_verified", False),
                first_name=data.get("given_name"),
                last_name=data.get("family_name"),
                picture=data.get("picture"),
                locale=data.get("locale"),
                provider="google",
                raw_data=data
            )
    
    async def _get_jwks(self) -> Dict:
        """Fetch and cache Google's JWKS."""
        # Check cache (refresh every hour)
        if (self._jwks_cache and self._jwks_cache_time and
            (datetime.now(timezone.utc) - self._jwks_cache_time).seconds < 3600):
            return self._jwks_cache
        
        async with httpx.AsyncClient() as client:
            response = await client.get(self.CERTS_ENDPOINT)
            
            if response.status_code != 200:
                raise ValueError("Failed to fetch Google JWKS")
            
            self._jwks_cache = response.json()
            self._jwks_cache_time = datetime.now(timezone.utc)
            
            return self._jwks_cache
    
    async def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh access token using refresh token."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.TOKEN_ENDPOINT,
                data={
                    "refresh_token": refresh_token,
                    "client_id": self.config.client_id,
                    "client_secret": self.config.client_secret,
                    "grant_type": "refresh_token",
                }
            )
            
            if response.status_code != 200:
                raise ValueError(f"Token refresh failed: {response.text}")
            
            return response.json()


class AppleOAuthProvider:
    """
    Apple Sign In / OAuth 2.0 provider.
    
    Implements:
    - Authorization Code flow
    - ID Token validation with Apple's public keys
    - Client secret generation (Apple requires JWT client secret)
    """
    
    AUTHORIZATION_ENDPOINT = "https://appleid.apple.com/auth/authorize"
    TOKEN_ENDPOINT = "https://appleid.apple.com/auth/token"
    CERTS_ENDPOINT = "https://appleid.apple.com/auth/keys"
    
    DEFAULT_SCOPES = ["name", "email"]
    
    def __init__(self, config: OAuthConfig, team_id: str, key_id: str, private_key: str):
        """
        Initialize Apple OAuth provider.
        
        Args:
            config: OAuth configuration
            team_id: Apple Developer Team ID
            key_id: Apple Services ID Key ID
            private_key: Apple private key (PEM format)
        """
        self.config = config
        self.team_id = team_id
        self.key_id = key_id
        self.private_key = private_key
        self._jwks_cache: Optional[Dict] = None
        self._jwks_cache_time: Optional[datetime] = None
    
    def _generate_client_secret(self) -> str:
        """
        Generate Apple client secret (JWT).
        
        Apple requires the client_secret to be a JWT signed with your private key.
        """
        now = datetime.now(timezone.utc)
        
        headers = {
            "alg": "ES256",
            "kid": self.key_id
        }
        
        payload = {
            "iss": self.team_id,
            "iat": now,
            "exp": now + timedelta(hours=1),
            "aud": "https://appleid.apple.com",
            "sub": self.config.client_id,
        }
        
        return jwt.encode(
            payload,
            self.private_key,
            algorithm="ES256",
            headers=headers
        )
    
    def get_authorization_url(
        self,
        state: Optional[str] = None,
        nonce: Optional[str] = None
    ) -> str:
        """
        Generate Apple Sign In authorization URL.
        
        Args:
            state: CSRF protection state parameter
            nonce: Nonce for replay attack protection
            
        Returns:
            Authorization URL
        """
        params = {
            "client_id": self.config.client_id,
            "redirect_uri": self.config.redirect_uri,
            "response_type": "code id_token",
            "scope": " ".join(self.config.scopes),
            "response_mode": "form_post",
        }
        
        if state:
            params["state"] = state
        if nonce:
            params["nonce"] = nonce
        
        return f"{self.AUTHORIZATION_ENDPOINT}?{urlencode(params)}"
    
    async def exchange_code(self, code: str) -> Dict[str, Any]:
        """
        Exchange authorization code for tokens.
        
        Args:
            code: Authorization code from callback
            
        Returns:
            Token response
        """
        client_secret = self._generate_client_secret()
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.TOKEN_ENDPOINT,
                data={
                    "code": code,
                    "client_id": self.config.client_id,
                    "client_secret": client_secret,
                    "redirect_uri": self.config.redirect_uri,
                    "grant_type": "authorization_code",
                },
                headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Accept": "application/json"
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Apple token exchange failed: {response.text}")
                raise ValueError(f"Token exchange failed: {response.text}")
            
            return response.json()
    
    async def verify_id_token(self, id_token: str, nonce: Optional[str] = None) -> OAuthUserInfo:
        """
        Verify and decode Apple ID token.
        
        Args:
            id_token: JWT ID token from Apple
            nonce: Expected nonce value
            
        Returns:
            OAuthUserInfo with user details
        """
        # Fetch Apple's public keys
        jwks = await self._get_jwks()
        
        # Find the correct key
        unverified_header = jwt.get_unverified_header(id_token)
        kid = unverified_header.get("kid")
        
        key = None
        for jwk in jwks.get("keys", []):
            if jwk.get("kid") == kid:
                key = jwt.algorithms.ECAlgorithm.from_jwk(json.dumps(jwk))
                break
        
        if not key:
            raise ValueError("Unable to find appropriate key for ID token verification")
        
        # Verify and decode
        payload = jwt.decode(
            id_token,
            key,
            algorithms=["RS256"],
            audience=self.config.client_id,
            issuer="https://appleid.apple.com"
        )
        
        # Verify nonce if provided
        if nonce and payload.get("nonce") != nonce:
            raise ValueError("Nonce mismatch")
        
        # Parse user name if available (only on first sign-in)
        first_name = None
        last_name = None
        
        # Apple returns user info as JSON string in 'user' param during first auth
        # This needs to be handled at the callback level
        
        return OAuthUserInfo(
            sub=payload.get("sub"),
            email=payload.get("email"),
            email_verified=payload.get("email_verified", False),
            first_name=first_name,
            last_name=last_name,
            provider="apple",
            raw_data=payload
        )
    
    async def verify_access_token(self, access_token: str) -> OAuthUserInfo:
        """
        Apple doesn't have a userinfo endpoint.
        We need to use the ID token for user information.
        """
        raise NotImplementedError(
            "Apple doesn't support access token userinfo. Use ID token instead."
        )
    
    async def _get_jwks(self) -> Dict:
        """Fetch and cache Apple's JWKS."""
        if (self._jwks_cache and self._jwks_cache_time and
            (datetime.now(timezone.utc) - self._jwks_cache_time).seconds < 3600):
            return self._jwks_cache
        
        async with httpx.AsyncClient() as client:
            response = await client.get(self.CERTS_ENDPOINT)
            
            if response.status_code != 200:
                raise ValueError("Failed to fetch Apple JWKS")
            
            self._jwks_cache = response.json()
            self._jwks_cache_time = datetime.now(timezone.utc)
            
            return self._jwks_cache
    
    async def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh access token using refresh token."""
        client_secret = self._generate_client_secret()
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.TOKEN_ENDPOINT,
                data={
                    "refresh_token": refresh_token,
                    "client_id": self.config.client_id,
                    "client_secret": client_secret,
                    "grant_type": "refresh_token",
                }
            )
            
            if response.status_code != 200:
                raise ValueError(f"Token refresh failed: {response.text}")
            
            return response.json()


class OAuthManager:
    """
    Centralized OAuth manager for multiple providers.
    
    Features:
    - Provider registration
    - Token verification
    - User info retrieval
    - Session management
    """
    
    _instance = None
    _providers: Dict[OAuthProvider, Any] = {}
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def register_provider(
        self,
        provider: OAuthProvider,
        config: OAuthConfig,
        **provider_specific
    ) -> None:
        """
        Register an OAuth provider.
        
        Args:
            provider: Provider enum value
            config: OAuth configuration
            **provider_specific: Provider-specific settings
                - For Apple: team_id, key_id, private_key
        """
        if provider == OAuthProvider.GOOGLE:
            self._providers[provider] = GoogleOAuthProvider(config)
        elif provider == OAuthProvider.APPLE:
            self._providers[provider] = AppleOAuthProvider(
                config,
                team_id=provider_specific.get("team_id"),
                key_id=provider_specific.get("key_id"),
                private_key=provider_specific.get("private_key")
            )
        else:
            raise ValueError(f"Unsupported provider: {provider}")
        
        logger.info(f"Registered OAuth provider: {provider.value}")
    
    def get_authorization_url(
        self,
        provider: OAuthProvider,
        redirect_uri: str,
        state: Optional[str] = None,
        **kwargs
    ) -> str:
        """Get authorization URL for provider."""
        if provider not in self._providers:
            raise ValueError(f"Provider not registered: {provider.value}")
        
        # Update redirect URI if provided
        self._providers[provider].config.redirect_uri = redirect_uri
        
        return self._providers[provider].get_authorization_url(state=state, **kwargs)
    
    async def exchange_code(
        self,
        provider: OAuthProvider,
        code: str
    ) -> OAuthUserInfo:
        """
        Exchange authorization code for user info.
        
        Args:
            provider: OAuth provider
            code: Authorization code
            
        Returns:
            OAuthUserInfo
        """
        if provider not in self._providers:
            raise ValueError(f"Provider not registered: {provider.value}")
        
        provider_impl = self._providers[provider]
        
        # Exchange code for tokens
        token_response = await provider_impl.exchange_code(code)
        
        # Get ID token
        id_token = token_response.get("id_token")
        
        if id_token:
            # Verify and decode ID token
            return await provider_impl.verify_id_token(id_token)
        
        # Fall back to access token
        access_token = token_response.get("access_token")
        if access_token:
            return await provider_impl.verify_access_token(access_token)
        
        raise ValueError("No token received from provider")
    
    async def verify_id_token(
        self,
        provider: OAuthProvider,
        id_token: str
    ) -> OAuthUserInfo:
        """Verify ID token and return user info."""
        if provider not in self._providers:
            raise ValueError(f"Provider not registered: {provider.value}")
        
        return await self._providers[provider].verify_id_token(id_token)
    
    async def verify_access_token(
        self,
        provider: OAuthProvider,
        access_token: str
    ) -> OAuthUserInfo:
        """Verify access token and return user info."""
        if provider not in self._providers:
            raise ValueError(f"Provider not registered: {provider.value}")
        
        return await self._providers[provider].verify_access_token(access_token)
    
    def parse_user_name_from_apple_callback(
        self,
        user_data: Optional[str]
    ) -> Dict[str, Optional[str]]:
        """
        Parse user name from Apple callback.
        
        Apple only returns user name on first authentication.
        The 'user' parameter contains JSON with name information.
        
        Args:
            user_data: JSON string from 'user' parameter
            
        Returns:
            Dict with first_name and last_name
        """
        if not user_data:
            return {"first_name": None, "last_name": None}
        
        try:
            user = json.loads(user_data)
            name = user.get("name", {})
            return {
                "first_name": name.get("firstName"),
                "last_name": name.get("lastName")
            }
        except json.JSONDecodeError:
            return {"first_name": None, "last_name": None}


# Factory function
def create_oauth_manager(
    google_config: Optional[OAuthConfig] = None,
    apple_config: Optional[OAuthConfig] = None,
    apple_team_id: Optional[str] = None,
    apple_key_id: Optional[str] = None,
    apple_private_key: Optional[str] = None
) -> OAuthManager:
    """
    Create and configure OAuth manager.
    
    Args:
        google_config: Google OAuth configuration
        apple_config: Apple OAuth configuration
        apple_team_id: Apple Team ID
        apple_key_id: Apple Key ID
        apple_private_key: Apple private key (PEM)
        
    Returns:
        Configured OAuthManager
    """
    manager = OAuthManager()
    
    if google_config:
        manager.register_provider(OAuthProvider.GOOGLE, google_config)
    
    if apple_config:
        manager.register_provider(
            OAuthProvider.APPLE,
            apple_config,
            team_id=apple_team_id,
            key_id=apple_key_id,
            private_key=apple_private_key
        )
    
    return manager


# Example configuration helpers
def create_google_config(
    client_id: str,
    client_secret: str,
    redirect_uri: str
) -> OAuthConfig:
    """Create Google OAuth configuration."""
    return OAuthConfig(
        client_id=client_id,
        client_secret=client_secret,
        redirect_uri=redirect_uri,
        authorization_endpoint=GoogleOAuthProvider.AUTHORIZATION_ENDPOINT,
        token_endpoint=GoogleOAuthProvider.TOKEN_ENDPOINT,
        userinfo_endpoint=GoogleOAuthProvider.USERINFO_ENDPOINT,
        scopes=GoogleOAuthProvider.DEFAULT_SCOPES
    )


def create_apple_config(
    client_id: str,
    redirect_uri: str
) -> OAuthConfig:
    """Create Apple OAuth configuration."""
    return OAuthConfig(
        client_id=client_id,
        client_secret="",  # Generated dynamically
        redirect_uri=redirect_uri,
        authorization_endpoint=AppleOAuthProvider.AUTHORIZATION_ENDPOINT,
        token_endpoint=AppleOAuthProvider.TOKEN_ENDPOINT,
        scopes=AppleOAuthProvider.DEFAULT_SCOPES
    )
