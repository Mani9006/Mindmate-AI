"""
User Profile Models for MindMate AI
Pydantic schemas for user profile endpoints
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field, EmailStr, validator


# ============== Enums ==============

class Gender(str, Enum):
    """User gender options"""
    MALE = "male"
    FEMALE = "female"
    NON_BINARY = "non_binary"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"
    OTHER = "other"


class TherapyExperience(str, Enum):
    """User therapy experience level"""
    NONE = "none"
    SOME = "some"
    REGULAR = "regular"
    EXTENSIVE = "extensive"


class AvatarStyle(str, Enum):
    """Available avatar styles"""
    CALM = "calm"
    ENERGETIC = "energetic"
    FRIENDLY = "friendly"
    PROFESSIONAL = "professional"
    PLAYFUL = "playful"
    MINDFUL = "mindful"


class NotificationFrequency(str, Enum):
    """Notification frequency preferences"""
    REALTIME = "realtime"
    DAILY_DIGEST = "daily_digest"
    WEEKLY_SUMMARY = "weekly_summary"
    MINIMAL = "minimal"
    NONE = "none"


class ThemePreference(str, Enum):
    """UI theme preferences"""
    LIGHT = "light"
    DARK = "dark"
    SYSTEM = "system"
    AUTO = "auto"


class LanguagePreference(str, Enum):
    """Supported languages"""
    EN = "en"
    ES = "es"
    FR = "fr"
    DE = "de"
    IT = "it"
    PT = "pt"
    JA = "ja"
    KO = "ko"
    ZH = "zh"


# ============== Base Models ==============

class UserBase(BaseModel):
    """Base user model with common fields"""
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None


class EmergencyContactBase(BaseModel):
    """Base emergency contact model"""
    name: str = Field(..., min_length=1, max_length=100)
    relationship: str = Field(..., min_length=1, max_length=50)
    phone_number: str = Field(..., min_length=5, max_length=20)
    email: Optional[EmailStr] = None
    is_primary: bool = False
    can_be_contacted: bool = True
    notes: Optional[str] = Field(None, max_length=500)


class UserPreferencesBase(BaseModel):
    """Base user preferences model"""
    theme: ThemePreference = ThemePreference.SYSTEM
    language: LanguagePreference = LanguagePreference.EN
    notifications_enabled: bool = True
    notification_frequency: NotificationFrequency = NotificationFrequency.DAILY_DIGEST
    email_notifications: bool = True
    push_notifications: bool = True
    sms_notifications: bool = False
    sound_enabled: bool = True
    haptic_feedback: bool = True
    font_size: str = "medium"  # small, medium, large
    high_contrast: bool = False
    reduce_animations: bool = False


class OnboardingIntakeBase(BaseModel):
    """Base onboarding intake questionnaire"""
    age_range: Optional[str] = None  # 18-24, 25-34, 35-44, 45-54, 55-64, 65+
    gender: Optional[Gender] = None
    primary_concerns: List[str] = Field(default_factory=list)
    therapy_experience: TherapyExperience = TherapyExperience.NONE
    current_medications: Optional[str] = None
    has_therapist: bool = False
    therapist_info: Optional[Dict[str, Any]] = None
    emergency_support_needed: bool = False
    preferred_check_in_times: List[str] = Field(default_factory=list)
    goals: List[str] = Field(default_factory=list)


# ============== Request Models ==============

class UserCreateRequest(UserBase):
    """Request model for creating a new user"""
    password: str = Field(..., min_length=8, max_length=128)
    
    @validator('password')
    def validate_password(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v


class UserUpdateRequest(BaseModel):
    """Request model for updating user profile"""
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=50)
    phone_number: Optional[str] = Field(None, max_length=20)
    date_of_birth: Optional[datetime] = None
    bio: Optional[str] = Field(None, max_length=1000)
    location: Optional[str] = Field(None, max_length=100)
    timezone: Optional[str] = Field(None, max_length=50)
    occupation: Optional[str] = Field(None, max_length=100)
    avatar_url: Optional[str] = None
    
    class Config:
        extra = "forbid"


class OnboardingSubmitRequest(OnboardingIntakeBase):
    """Request model for submitting onboarding questionnaire"""
    completed_at: Optional[datetime] = None
    
    class Config:
        extra = "forbid"


class PreferencesUpdateRequest(UserPreferencesBase):
    """Request model for updating user preferences"""
    custom_settings: Optional[Dict[str, Any]] = None
    
    class Config:
        extra = "forbid"


class EmergencyContactCreateRequest(EmergencyContactBase):
    """Request model for creating emergency contact"""
    pass


class EmergencyContactUpdateRequest(BaseModel):
    """Request model for updating emergency contact"""
    name: Optional[str] = Field(None, max_length=100)
    relationship: Optional[str] = Field(None, max_length=50)
    phone_number: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    is_primary: Optional[bool] = None
    can_be_contacted: Optional[bool] = None
    notes: Optional[str] = Field(None, max_length=500)
    
    class Config:
        extra = "forbid"


class AvatarSelectionRequest(BaseModel):
    """Request model for avatar selection"""
    avatar_style: AvatarStyle
    avatar_color: Optional[str] = Field(None, regex=r'^#[0-9A-Fa-f]{6}$')
    custom_avatar_url: Optional[str] = None
    use_custom: bool = False
    
    @validator('custom_avatar_url')
    def validate_custom_avatar(cls, v, values):
        if values.get('use_custom') and not v:
            raise ValueError('custom_avatar_url is required when use_custom is True')
        return v


class AccountDeletionRequest(BaseModel):
    """Request model for GDPR account deletion"""
    reason: Optional[str] = Field(None, max_length=500)
    feedback: Optional[str] = Field(None, max_length=1000)
    confirm_deletion: bool = False
    password: Optional[str] = None  # Required for verification
    
    @validator('confirm_deletion')
    def must_confirm_deletion(cls, v):
        if not v:
            raise ValueError('You must confirm deletion by setting confirm_deletion to True')
        return v


# ============== Response Models ==============

class EmergencyContactResponse(EmergencyContactBase):
    """Response model for emergency contact"""
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class UserPreferencesResponse(UserPreferencesBase):
    """Response model for user preferences"""
    id: str
    user_id: str
    custom_settings: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class OnboardingIntakeResponse(OnboardingIntakeBase):
    """Response model for onboarding intake"""
    id: str
    user_id: str
    completed_at: datetime
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class UserProfileResponse(UserBase):
    """Full user profile response"""
    id: str
    is_active: bool
    is_verified: bool
    is_onboarded: bool
    onboarding_completed_at: Optional[datetime] = None
    date_of_birth: Optional[datetime] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    timezone: str = "UTC"
    occupation: Optional[str] = None
    avatar_url: Optional[str] = None
    avatar_style: Optional[AvatarStyle] = None
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime] = None
    preferences: Optional[UserPreferencesResponse] = None
    onboarding_intake: Optional[OnboardingIntakeResponse] = None
    emergency_contacts: List[EmergencyContactResponse] = Field(default_factory=list)
    
    class Config:
        from_attributes = True


class AvatarSelectionResponse(BaseModel):
    """Response model for avatar selection"""
    success: bool
    avatar_url: str
    avatar_style: AvatarStyle
    message: str


class AccountDeletionResponse(BaseModel):
    """Response model for account deletion"""
    success: bool
    message: str
    deletion_scheduled_at: datetime
    data_retention_days: int = 30
    can_be_reversed_until: datetime


class UserStatsResponse(BaseModel):
    """User statistics and activity summary"""
    user_id: str
    total_sessions: int
    total_messages: int
    streak_days: int
    last_session_at: Optional[datetime] = None
    account_age_days: int
    preferred_topics: List[str] = Field(default_factory=list)


# ============== Internal/Database Models ==============

class UserInDB(BaseModel):
    """Internal database user model"""
    id: str
    email: str
    hashed_password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    is_active: bool = True
    is_verified: bool = False
    is_onboarded: bool = False
    onboarding_completed_at: Optional[datetime] = None
    date_of_birth: Optional[datetime] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    timezone: str = "UTC"
    occupation: Optional[str] = None
    avatar_url: Optional[str] = None
    avatar_style: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None
    deletion_reason: Optional[str] = None
    
    class Config:
        from_attributes = True


class GDPRDeletionLog(BaseModel):
    """Log entry for GDPR deletion"""
    id: str
    user_id: str
    requested_at: datetime
    completed_at: Optional[datetime] = None
    reason: Optional[str] = None
    feedback: Optional[str] = None
    status: str  # pending, in_progress, completed, failed
    anonymized_data_id: Optional[str] = None
