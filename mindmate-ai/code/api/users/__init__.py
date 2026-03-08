"""
MindMate AI User Profile API Module

This module provides user profile management endpoints for the MindMate AI platform.

Endpoints:
    - GET/PUT /users/me - User profile management
    - POST /users/onboarding - Onboarding questionnaire submission
    - GET/PUT /users/preferences - User preferences
    - GET/PUT /users/emergency-contacts - Emergency contacts management
    - DELETE /users/account - GDPR account deletion
    - POST /users/avatar-selection - Avatar selection

Usage:
    from api.users import router as users_router
    app.include_router(users_router)
"""

from .routes import router
from .models import (
    UserProfileResponse,
    UserUpdateRequest,
    UserPreferencesResponse,
    PreferencesUpdateRequest,
    EmergencyContactResponse,
    EmergencyContactCreateRequest,
    EmergencyContactUpdateRequest,
    OnboardingIntakeResponse,
    OnboardingSubmitRequest,
    AvatarSelectionRequest,
    AvatarSelectionResponse,
    AccountDeletionRequest,
    AccountDeletionResponse,
    UserStatsResponse,
    UserInDB,
    AvatarStyle,
    Gender,
    TherapyExperience,
    ThemePreference,
    NotificationFrequency,
    LanguagePreference,
)
from .dependencies import (
    get_current_user_token,
    get_current_active_user,
    get_current_verified_user,
    UserTokenData,
    create_access_token,
    create_refresh_token,
    verify_password,
    get_password_hash,
)
from .service import user_service, UserService, UserServiceError

__version__ = "1.0.0"
__all__ = [
    # Router
    "router",
    
    # Models
    "UserProfileResponse",
    "UserUpdateRequest",
    "UserPreferencesResponse",
    "PreferencesUpdateRequest",
    "EmergencyContactResponse",
    "EmergencyContactCreateRequest",
    "EmergencyContactUpdateRequest",
    "OnboardingIntakeResponse",
    "OnboardingSubmitRequest",
    "AvatarSelectionRequest",
    "AvatarSelectionResponse",
    "AccountDeletionRequest",
    "AccountDeletionResponse",
    "UserStatsResponse",
    "UserInDB",
    
    # Enums
    "AvatarStyle",
    "Gender",
    "TherapyExperience",
    "ThemePreference",
    "NotificationFrequency",
    "LanguagePreference",
    
    # Dependencies
    "get_current_user_token",
    "get_current_active_user",
    "get_current_verified_user",
    "UserTokenData",
    "create_access_token",
    "create_refresh_token",
    "verify_password",
    "get_password_hash",
    
    # Service
    "user_service",
    "UserService",
    "UserServiceError",
]
