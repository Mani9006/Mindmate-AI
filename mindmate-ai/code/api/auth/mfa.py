"""
MindMate AI - Multi-Factor Authentication (MFA) Module
Production-ready MFA implementation supporting TOTP, SMS, and Email.
"""

import secrets
import base64
import hashlib
import hmac
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta, timezone
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class MFAMethod(Enum):
    """Supported MFA methods."""
    TOTP = "totp"  # Time-based One-Time Password (Authenticator apps)
    SMS = "sms"    # SMS-based verification
    EMAIL = "email"  # Email-based verification
    BACKUP_CODE = "backup_code"  # Backup recovery codes


@dataclass
class MFASecret:
    """MFA secret data."""
    user_id: str
    method: MFAMethod
    secret: str
    verified: bool = False
    created_at: str = None
    last_used_at: Optional[str] = None
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now(timezone.utc).isoformat()
        if self.metadata is None:
            self.metadata = {}


@dataclass
class MFAVerificationAttempt:
    """MFA verification attempt tracking."""
    user_id: str
    method: MFAMethod
    code: str
    expires_at: datetime
    attempts: int = 0
    max_attempts: int = 3
    verified: bool = False


class TOTPGenerator:
    """
    RFC 6238 TOTP (Time-based One-Time Password) implementation.
    Compatible with Google Authenticator, Authy, etc.
    """
    
    def __init__(self, digits: int = 6, interval: int = 30):
        self.digits = digits
        self.interval = interval
    
    def generate_secret(self) -> str:
        """Generate a new TOTP secret."""
        return base64.b32encode(secrets.token_bytes(20)).decode('utf-8')
    
    def get_totp(self, secret: str, timestamp: Optional[int] = None) -> str:
        """
        Generate TOTP code for given secret.
        
        Args:
            secret: Base32-encoded secret
            timestamp: Unix timestamp (defaults to current time)
            
        Returns:
            TOTP code as string
        """
        if timestamp is None:
            timestamp = int(datetime.now(timezone.utc).timestamp())
        
        # Calculate counter value
        counter = timestamp // self.interval
        
        # Decode secret
        secret_bytes = base64.b32decode(secret.upper().replace(' ', ''))
        
        # Create HMAC
        counter_bytes = counter.to_bytes(8, byteorder='big')
        hmac_hash = hmac.new(secret_bytes, counter_bytes, hashlib.sha1).digest()
        
        # Dynamic truncation
        offset = hmac_hash[-1] & 0x0f
        code = ((hmac_hash[offset] & 0x7f) << 24 |
                (hmac_hash[offset + 1] & 0xff) << 16 |
                (hmac_hash[offset + 2] & 0xff) << 8 |
                (hmac_hash[offset + 3] & 0xff))
        
        # Modulo to get required digits
        code = code % (10 ** self.digits)
        
        # Zero pad
        return str(code).zfill(self.digits)
    
    def verify(self, secret: str, code: str, window: int = 1) -> bool:
        """
        Verify TOTP code with time window tolerance.
        
        Args:
            secret: TOTP secret
            code: Code to verify
            window: Number of intervals to check before/after current
            
        Returns:
            True if code is valid
        """
        timestamp = int(datetime.now(timezone.utc).timestamp())
        
        for i in range(-window, window + 1):
            check_time = timestamp + (i * self.interval)
            expected = self.get_totp(secret, check_time)
            
            # Use constant-time comparison
            if hmac.compare_digest(expected, code):
                return True
        
        return False
    
    def get_provisioning_uri(
        self,
        secret: str,
        account_name: str,
        issuer: str = "MindMate AI",
        algorithm: str = "SHA1",
        digits: Optional[int] = None,
        period: Optional[int] = None
    ) -> str:
        """
        Generate provisioning URI for QR code.
        
        Format: otpauth://totp/{issuer}:{account}?secret={secret}&issuer={issuer}
        """
        from urllib.parse import quote
        
        label = quote(f"{issuer}:{account_name}")
        issuer_quoted = quote(issuer)
        
        uri = f"otpauth://totp/{label}?secret={secret}&issuer={issuer_quoted}"
        
        if algorithm != "SHA1":
            uri += f"&algorithm={algorithm}"
        if digits and digits != 6:
            uri += f"&digits={digits}"
        if period and period != 30:
            uri += f"&period={period}"
        
        return uri
    
    def generate_backup_codes(self, count: int = 10) -> List[str]:
        """Generate backup recovery codes."""
        codes = []
        for _ in range(count):
            # Generate 8-character alphanumeric code
            code = ''.join(
                secrets.choice('ABCDEFGHJKLMNPQRSTUVWXYZ23456789')
                for _ in range(8)
            )
            # Format: XXXX-XXXX
            formatted = f"{code[:4]}-{code[4:]}"
            codes.append(formatted)
        return codes


class SMSProvider:
    """Abstract SMS provider interface."""
    
    async def send_sms(self, phone_number: str, message: str) -> bool:
        """Send SMS message."""
        raise NotImplementedError


class TwilioSMSProvider(SMSProvider):
    """Twilio SMS provider implementation."""
    
    def __init__(self, account_sid: str, auth_token: str, from_number: str):
        self.account_sid = account_sid
        self.auth_token = auth_token
        self.from_number = from_number
    
    async def send_sms(self, phone_number: str, message: str) -> bool:
        """Send SMS via Twilio."""
        try:
            from twilio.rest import Client
            
            client = Client(self.account_sid, self.auth_token)
            client.messages.create(
                body=message,
                from_=self.from_number,
                to=phone_number
            )
            return True
        except Exception as e:
            logger.error(f"Failed to send SMS: {e}")
            return False


class MockSMSProvider(SMSProvider):
    """Mock SMS provider for development."""
    
    async def send_sms(self, phone_number: str, message: str) -> bool:
        logger.info(f"[MOCK SMS] To: {phone_number}, Message: {message}")
        return True


class MFAManager:
    """
    Production-ready MFA Manager.
    
    Features:
    - TOTP (Google Authenticator compatible)
    - SMS-based verification
    - Email-based verification
    - Backup recovery codes
    - Rate limiting
    """
    
    _instance = None
    
    # Storage (use Redis/database in production)
    _secrets: Dict[str, MFASecret] = {}  # user_id:method -> MFASecret
    _verification_codes: Dict[str, MFAVerificationAttempt] = {}  # user_id:method -> attempt
    _used_codes: set = set()  # Prevent replay attacks
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._totp = TOTPGenerator()
            cls._sms_provider = MockSMSProvider()
        return cls._instance
    
    def configure_sms(self, provider: SMSProvider):
        """Configure SMS provider."""
        self._sms_provider = provider
    
    # ========================================================================
    # TOTP Methods
    # ========================================================================
    
    def setup_totp(self, user_id: str) -> Tuple[str, str, List[str]]:
        """
        Setup TOTP for user.
        
        Returns:
            Tuple of (secret, qr_code_uri, backup_codes)
        """
        secret = self._totp.generate_secret()
        
        # Store secret (unverified until confirmed)
        key = f"{user_id}:{MFAMethod.TOTP.value}"
        self._secrets[key] = MFASecret(
            user_id=user_id,
            method=MFAMethod.TOTP,
            secret=secret,
            verified=False,
            metadata={"setup_initiated_at": datetime.now(timezone.utc).isoformat()}
        )
        
        # Generate QR code URI
        qr_uri = self._totp.get_provisioning_uri(
            secret=secret,
            account_name=user_id,
            issuer="MindMate AI"
        )
        
        # Generate backup codes
        backup_codes = self._totp.generate_backup_codes(10)
        
        # Hash and store backup codes
        hashed_codes = [hashlib.sha256(c.replace('-', '').encode()).hexdigest() 
                       for c in backup_codes]
        self._secrets[key].metadata['backup_codes'] = hashed_codes
        
        logger.info(f"TOTP setup initiated for user: {user_id}")
        
        return secret, qr_uri, backup_codes
    
    def verify_totp(self, user_id: str, code: str) -> bool:
        """Verify TOTP code."""
        key = f"{user_id}:{MFAMethod.TOTP.value}"
        mfa_secret = self._secrets.get(key)
        
        if not mfa_secret:
            return False
        
        # Check for replay attack
        code_hash = hashlib.sha256(code.encode()).hexdigest()
        if code_hash in self._used_codes:
            logger.warning(f"TOTP code reuse attempt for user: {user_id}")
            return False
        
        # Verify code
        if self._totp.verify(mfa_secret.secret, code):
            self._used_codes.add(code_hash)
            mfa_secret.last_used_at = datetime.now(timezone.utc).isoformat()
            return True
        
        return False
    
    # ========================================================================
    # SMS Methods
    # ========================================================================
    
    def setup_sms(self, user_id: str, phone_number: str) -> bool:
        """
        Setup SMS MFA for user.
        
        Sends verification code to phone number.
        """
        # Validate phone number format
        if not self._validate_phone(phone_number):
            raise ValueError("Invalid phone number format")
        
        # Generate and send verification code
        code = self._generate_numeric_code(6)
        
        key = f"{user_id}:{MFAMethod.SMS.value}"
        self._verification_codes[key] = MFAVerificationAttempt(
            user_id=user_id,
            method=MFAMethod.SMS,
            code=code,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=10)
        )
        
        # Store phone number in secret
        self._secrets[key] = MFASecret(
            user_id=user_id,
            method=MFAMethod.SMS,
            secret=phone_number,  # Store phone as "secret"
            verified=False,
            metadata={"phone_number": phone_number}
        )
        
        # Send SMS (async)
        import asyncio
        asyncio.create_task(
            self._sms_provider.send_sms(
                phone_number,
                f"Your MindMate AI verification code is: {code}. Valid for 10 minutes."
            )
        )
        
        logger.info(f"SMS MFA setup initiated for user: {user_id}")
        
        return True
    
    def verify_sms(self, user_id: str, code: str) -> bool:
        """Verify SMS code."""
        key = f"{user_id}:{MFAMethod.SMS.value}"
        attempt = self._verification_codes.get(key)
        
        if not attempt:
            return False
        
        # Check expiration
        if datetime.now(timezone.utc) > attempt.expires_at:
            return False
        
        # Check max attempts
        if attempt.attempts >= attempt.max_attempts:
            return False
        
        # Verify code
        attempt.attempts += 1
        
        if hmac.compare_digest(attempt.code, code):
            attempt.verified = True
            
            # Mark secret as verified
            secret = self._secrets.get(key)
            if secret:
                secret.verified = True
                secret.last_used_at = datetime.now(timezone.utc).isoformat()
            
            # Clean up verification code
            del self._verification_codes[key]
            
            return True
        
        return False
    
    async def send_sms_code(self, user_id: str) -> bool:
        """Send new SMS verification code."""
        key = f"{user_id}:{MFAMethod.SMS.value}"
        secret = self._secrets.get(key)
        
        if not secret:
            return False
        
        phone_number = secret.metadata.get("phone_number")
        if not phone_number:
            return False
        
        # Generate new code
        code = self._generate_numeric_code(6)
        
        self._verification_codes[key] = MFAVerificationAttempt(
            user_id=user_id,
            method=MFAMethod.SMS,
            code=code,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=10)
        )
        
        # Send SMS
        return await self._sms_provider.send_sms(
            phone_number,
            f"Your MindMate AI verification code is: {code}. Valid for 10 minutes."
        )
    
    # ========================================================================
    # Email Methods
    # ========================================================================
    
    def setup_email(self, user_id: str, email: str) -> str:
        """
        Setup email MFA for user.
        
        Returns verification code to be sent via email.
        """
        code = self._generate_numeric_code(6)
        
        key = f"{user_id}:{MFAMethod.EMAIL.value}"
        self._verification_codes[key] = MFAVerificationAttempt(
            user_id=user_id,
            method=MFAMethod.EMAIL,
            code=code,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=10)
        )
        
        self._secrets[key] = MFASecret(
            user_id=user_id,
            method=MFAMethod.EMAIL,
            secret=email,
            verified=False,
            metadata={"email": email}
        )
        
        logger.info(f"Email MFA setup initiated for user: {user_id}")
        
        return code
    
    def verify_email_code(self, user_id: str, code: str) -> bool:
        """Verify email MFA code."""
        key = f"{user_id}:{MFAMethod.EMAIL.value}"
        attempt = self._verification_codes.get(key)
        
        if not attempt:
            return False
        
        # Check expiration
        if datetime.now(timezone.utc) > attempt.expires_at:
            return False
        
        # Check max attempts
        if attempt.attempts >= attempt.max_attempts:
            return False
        
        attempt.attempts += 1
        
        if hmac.compare_digest(attempt.code, code):
            attempt.verified = True
            
            secret = self._secrets.get(key)
            if secret:
                secret.verified = True
                secret.last_used_at = datetime.now(timezone.utc).isoformat()
            
            del self._verification_codes[key]
            
            return True
        
        return False
    
    # ========================================================================
    # Backup Codes
    # ========================================================================
    
    def verify_backup_code(self, user_id: str, code: str) -> bool:
        """Verify backup recovery code."""
        key = f"{user_id}:{MFAMethod.TOTP.value}"
        mfa_secret = self._secrets.get(key)
        
        if not mfa_secret:
            return False
        
        # Normalize code
        normalized = code.replace('-', '').upper()
        code_hash = hashlib.sha256(normalized.encode()).hexdigest()
        
        # Check against stored hashed codes
        stored_codes = mfa_secret.metadata.get('backup_codes', [])
        
        if code_hash in stored_codes:
            # Remove used backup code
            stored_codes.remove(code_hash)
            mfa_secret.metadata['backup_codes'] = stored_codes
            mfa_secret.last_used_at = datetime.now(timezone.utc).isoformat()
            
            logger.info(f"Backup code used for user: {user_id}")
            
            return True
        
        return False
    
    def regenerate_backup_codes(self, user_id: str) -> List[str]:
        """Generate new backup codes (invalidates old ones)."""
        key = f"{user_id}:{MFAMethod.TOTP.value}"
        mfa_secret = self._secrets.get(key)
        
        if not mfa_secret:
            raise ValueError("TOTP not set up for user")
        
        # Generate new codes
        backup_codes = self._totp.generate_backup_codes(10)
        hashed_codes = [hashlib.sha256(c.replace('-', '').encode()).hexdigest() 
                       for c in backup_codes]
        
        mfa_secret.metadata['backup_codes'] = hashed_codes
        
        logger.info(f"Backup codes regenerated for user: {user_id}")
        
        return backup_codes
    
    # ========================================================================
    # General Methods
    # ========================================================================
    
    def verify_code(self, user_id: str, method: str, code: str) -> bool:
        """Verify MFA code for any method."""
        method_enum = MFAMethod(method)
        
        if method_enum == MFAMethod.TOTP:
            return self.verify_totp(user_id, code)
        elif method_enum == MFAMethod.SMS:
            return self.verify_sms(user_id, code)
        elif method_enum == MFAMethod.EMAIL:
            return self.verify_email_code(user_id, code)
        elif method_enum == MFAMethod.BACKUP_CODE:
            return self.verify_backup_code(user_id, code)
        
        return False
    
    def verify_setup_code(self, user_id: str, method: str, code: str) -> bool:
        """Verify setup code and mark method as verified."""
        method_enum = MFAMethod(method)
        verified = False
        
        if method_enum == MFAMethod.TOTP:
            verified = self.verify_totp(user_id, code)
        elif method_enum == MFAMethod.SMS:
            verified = self.verify_sms(user_id, code)
        elif method_enum == MFAMethod.EMAIL:
            verified = self.verify_email_code(user_id, code)
        
        if verified:
            key = f"{user_id}:{method}"
            secret = self._secrets.get(key)
            if secret:
                secret.verified = True
        
        return verified
    
    def is_enabled(self, user_id: str, method: Optional[str] = None) -> bool:
        """Check if MFA is enabled for user."""
        if method:
            key = f"{user_id}:{method}"
            secret = self._secrets.get(key)
            return secret is not None and secret.verified
        
        # Check any MFA method
        for m in MFAMethod:
            key = f"{user_id}:{m.value}"
            secret = self._secrets.get(key)
            if secret and secret.verified:
                return True
        
        return False
    
    def disable(self, user_id: str, method: Optional[str] = None) -> bool:
        """Disable MFA for user."""
        if method:
            key = f"{user_id}:{method}"
            if key in self._secrets:
                del self._secrets[key]
                logger.info(f"MFA {method} disabled for user: {user_id}")
                return True
            return False
        
        # Disable all methods
        for m in MFAMethod:
            key = f"{user_id}:{m.value}"
            if key in self._secrets:
                del self._secrets[key]
        
        logger.info(f"All MFA disabled for user: {user_id}")
        return True
    
    def get_enabled_methods(self, user_id: str) -> List[Dict[str, Any]]:
        """Get list of enabled MFA methods for user."""
        methods = []
        
        for m in MFAMethod:
            key = f"{user_id}:{m.value}"
            secret = self._secrets.get(key)
            if secret and secret.verified:
                methods.append({
                    "method": m.value,
                    "enabled_at": secret.created_at,
                    "last_used_at": secret.last_used_at
                })
        
        return methods
    
    # ========================================================================
    # Helper Methods
    # ========================================================================
    
    def _generate_numeric_code(self, length: int = 6) -> str:
        """Generate random numeric code."""
        return ''.join(secrets.choice('0123456789') for _ in range(length))
    
    def _validate_phone(self, phone: str) -> bool:
        """Validate phone number format (E.164)."""
        import re
        # Basic E.164 validation
        pattern = r'^\+[1-9]\d{1,14}$'
        return bool(re.match(pattern, phone.replace(' ', '').replace('-', '')))


# Convenience functions
def generate_totp_qr_code(uri: str) -> str:
    """
    Generate QR code for TOTP provisioning URI.
    
    Returns base64-encoded PNG image.
    """
    try:
        import qrcode
        import qrcode.image.svg
        from io import BytesIO
        
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=4,
        )
        qr.add_data(uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        
        return base64.b64encode(buffer.getvalue()).decode()
    except ImportError:
        logger.warning("qrcode package not installed")
        return ""


def create_mfa_manager() -> MFAManager:
    """Factory function to create MFA manager."""
    return MFAManager()
