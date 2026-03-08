"""
User Profile API Routes for MindMate AI
FastAPI routes for user profile endpoints
"""

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from fastapi.responses import JSONResponse

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
    UserStatsResponse
)
from .dependencies import (
    get_current_user_token,
    get_current_active_user,
    get_current_verified_user,
    UserTokenData,
    rate_limit_dependency
)
from .service import user_service, UserServiceError, UserNotFoundError, ValidationError

# Create router
router = APIRouter(
    prefix="/users",
    tags=["users"],
    responses={
        401: {"description": "Unauthorized"},
        403: {"description": "Forbidden"},
        404: {"description": "Not found"},
        429: {"description": "Too many requests"},
    }
)


# ============== Error Handlers ==============

def handle_service_error(error: UserServiceError) -> HTTPException:
    """Convert service errors to HTTP exceptions"""
    status_code = status.HTTP_400_BAD_REQUEST
    
    if error.code == "USER_NOT_FOUND":
        status_code = status.HTTP_404_NOT_FOUND
    elif error.code == "VALIDATION_ERROR":
        status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    elif error.code == "DELETION_ALREADY_SCHEDULED":
        status_code = status.HTTP_409_CONFLICT
    elif error.code == "NO_DELETION_SCHEDULED":
        status_code = status.HTTP_400_BAD_REQUEST
    
    return HTTPException(
        status_code=status_code,
        detail={
            "error": error.code,
            "message": error.message
        }
    )


# ============== GET /users/me ==============

@router.get(
    "/me",
    response_model=UserProfileResponse,
    summary="Get current user profile",
    description="Retrieve the complete profile of the currently authenticated user",
    responses={
        200: {
            "description": "User profile retrieved successfully",
            "model": UserProfileResponse
        }
    }
)
async def get_current_user_profile(
    current_user: UserTokenData = Depends(get_current_active_user),
    include_preferences: bool = Query(True, description="Include user preferences"),
    include_contacts: bool = Query(True, description="Include emergency contacts"),
    include_onboarding: bool = Query(False, description="Include onboarding data")
) -> UserProfileResponse:
    """
    Get the current user's complete profile.
    
    Returns the authenticated user's profile information including:
    - Basic info (name, email, etc.)
    - Profile details (bio, location, etc.)
    - Preferences (if requested)
    - Emergency contacts (if requested)
    - Onboarding data (if requested)
    """
    try:
        profile = await user_service.get_user_profile(current_user.user_id)
        
        # Filter included data based on query params
        if not include_preferences:
            profile.preferences = None
        if not include_contacts:
            profile.emergency_contacts = []
        if not include_onboarding:
            profile.onboarding_intake = None
        
        return profile
    
    except UserServiceError as e:
        raise handle_service_error(e)


# ============== PUT /users/me ==============

@router.put(
    "/me",
    response_model=UserProfileResponse,
    summary="Update current user profile",
    description="Update the profile of the currently authenticated user",
    responses={
        200: {
            "description": "User profile updated successfully",
            "model": UserProfileResponse
        },
        422: {
            "description": "Validation error in request data"
        }
    }
)
async def update_current_user_profile(
    update_data: UserUpdateRequest,
    current_user: UserTokenData = Depends(get_current_active_user)
) -> UserProfileResponse:
    """
    Update the current user's profile.
    
    Only provided fields will be updated. Omit fields you don't want to change.
    
    Available fields:
    - first_name: User's first name
    - last_name: User's last name
    - phone_number: Contact phone number
    - date_of_birth: Date of birth
    - bio: Short biography (max 1000 chars)
    - location: User's location
    - timezone: User's timezone
    - occupation: User's occupation
    - avatar_url: Custom avatar URL
    """
    try:
        updated_profile = await user_service.update_user_profile(
            current_user.user_id,
            update_data
        )
        return updated_profile
    
    except UserServiceError as e:
        raise handle_service_error(e)


@router.patch(
    "/me",
    response_model=UserProfileResponse,
    summary="Partially update current user profile",
    description="Partially update the profile of the currently authenticated user (alias for PUT)",
    responses={
        200: {
            "description": "User profile updated successfully",
            "model": UserProfileResponse
        }
    }
)
async def patch_current_user_profile(
    update_data: UserUpdateRequest,
    current_user: UserTokenData = Depends(get_current_active_user)
) -> UserProfileResponse:
    """Alias for PUT /users/me - partial update"""
    return await update_current_user_profile(update_data, current_user)


# ============== POST /users/onboarding ==============

@router.post(
    "/onboarding",
    response_model=OnboardingIntakeResponse,
    summary="Submit onboarding questionnaire",
    description="Submit the initial intake questionnaire for new users",
    responses={
        201: {
            "description": "Onboarding submitted successfully",
            "model": OnboardingIntakeResponse
        },
        400: {
            "description": "Invalid onboarding data"
        },
        409: {
            "description": "Onboarding already completed"
        }
    },
    status_code=status.HTTP_201_CREATED
)
async def submit_onboarding(
    onboarding_data: OnboardingSubmitRequest,
    current_user: UserTokenData = Depends(get_current_active_user)
) -> OnboardingIntakeResponse:
    """
    Submit the onboarding intake questionnaire.
    
    This endpoint captures initial user information to personalize the experience:
    - Demographics (age range, gender)
    - Primary mental health concerns
    - Previous therapy experience
    - Current medications
    - Goals for using MindMate
    
    This can only be submitted once per user.
    """
    try:
        # Check if already onboarded
        is_complete = await user_service.is_onboarding_complete(current_user.user_id)
        if is_complete:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "error": "ONBOARDING_ALREADY_COMPLETE",
                    "message": "Onboarding has already been completed for this account"
                }
            )
        
        intake = await user_service.submit_onboarding(
            current_user.user_id,
            onboarding_data
        )
        return intake
    
    except UserServiceError as e:
        raise handle_service_error(e)


@router.get(
    "/onboarding",
    response_model=OnboardingIntakeResponse,
    summary="Get onboarding data",
    description="Retrieve the user's onboarding intake data",
    responses={
        200: {
            "description": "Onboarding data retrieved",
            "model": OnboardingIntakeResponse
        },
        404: {
            "description": "No onboarding data found"
        }
    }
)
async def get_onboarding(
    current_user: UserTokenData = Depends(get_current_active_user)
) -> OnboardingIntakeResponse:
    """Get the user's onboarding intake data if it exists"""
    try:
        intake = await user_service.get_onboarding_intake(current_user.user_id)
        if not intake:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No onboarding data found for this user"
            )
        return intake
    
    except UserServiceError as e:
        raise handle_service_error(e)


# ============== GET /users/preferences ==============

@router.get(
    "/preferences",
    response_model=UserPreferencesResponse,
    summary="Get user preferences",
    description="Retrieve the current user's preferences and settings",
    responses={
        200: {
            "description": "Preferences retrieved successfully",
            "model": UserPreferencesResponse
        }
    }
)
async def get_user_preferences(
    current_user: UserTokenData = Depends(get_current_active_user)
) -> UserPreferencesResponse:
    """
    Get the current user's preferences.
    
    Returns user settings including:
    - Theme preference (light/dark/system)
    - Language
    - Notification settings
    - Accessibility options
    - Custom settings
    """
    try:
        preferences = await user_service.get_user_preferences(current_user.user_id)
        return preferences
    
    except UserServiceError as e:
        raise handle_service_error(e)


# ============== PUT /users/preferences ==============

@router.put(
    "/preferences",
    response_model=UserPreferencesResponse,
    summary="Update user preferences",
    description="Update the current user's preferences and settings",
    responses={
        200: {
            "description": "Preferences updated successfully",
            "model": UserPreferencesResponse
        },
        422: {
            "description": "Validation error in preferences data"
        }
    }
)
async def update_user_preferences(
    preferences_data: PreferencesUpdateRequest,
    current_user: UserTokenData = Depends(get_current_active_user)
) -> UserPreferencesResponse:
    """
    Update the current user's preferences.
    
    Only provided fields will be updated. Available preferences:
    - theme: UI theme (light, dark, system, auto)
    - language: Preferred language code
    - notifications_enabled: Master notification toggle
    - notification_frequency: How often to send notifications
    - email_notifications: Enable email notifications
    - push_notifications: Enable push notifications
    - sms_notifications: Enable SMS notifications
    - sound_enabled: Enable sound effects
    - haptic_feedback: Enable haptic feedback
    - font_size: Text size preference (small, medium, large)
    - high_contrast: High contrast mode
    - reduce_animations: Reduce motion/animations
    - custom_settings: Arbitrary custom settings object
    """
    try:
        updated_preferences = await user_service.update_user_preferences(
            current_user.user_id,
            preferences_data
        )
        return updated_preferences
    
    except UserServiceError as e:
        raise handle_service_error(e)


@router.patch(
    "/preferences",
    response_model=UserPreferencesResponse,
    summary="Partially update user preferences",
    description="Partially update user preferences (alias for PUT)"
)
async def patch_user_preferences(
    preferences_data: PreferencesUpdateRequest,
    current_user: UserTokenData = Depends(get_current_active_user)
) -> UserPreferencesResponse:
    """Alias for PUT /users/preferences"""
    return await update_user_preferences(preferences_data, current_user)


# ============== GET /users/emergency-contacts ==============

@router.get(
    "/emergency-contacts",
    response_model=List[EmergencyContactResponse],
    summary="Get emergency contacts",
    description="Retrieve all emergency contacts for the current user",
    responses={
        200: {
            "description": "Emergency contacts retrieved successfully",
            "model": List[EmergencyContactResponse]
        }
    }
)
async def get_emergency_contacts(
    current_user: UserTokenData = Depends(get_current_active_user),
    include_inactive: bool = Query(False, description="Include inactive contacts")
) -> List[EmergencyContactResponse]:
    """
    Get all emergency contacts for the current user.
    
    Returns a list of emergency contacts including:
    - Name and relationship
    - Phone number and email
    - Primary contact indicator
    - Contact permissions
    """
    try:
        contacts = await user_service.get_emergency_contacts(current_user.user_id)
        return contacts
    
    except UserServiceError as e:
        raise handle_service_error(e)


# ============== POST /users/emergency-contacts ==============

@router.post(
    "/emergency-contacts",
    response_model=EmergencyContactResponse,
    summary="Add emergency contact",
    description="Add a new emergency contact for the current user",
    responses={
        201: {
            "description": "Emergency contact added successfully",
            "model": EmergencyContactResponse
        },
        400: {
            "description": "Invalid contact data or maximum contacts reached"
        },
        422: {
            "description": "Validation error"
        }
    },
    status_code=status.HTTP_201_CREATED
)
async def add_emergency_contact(
    contact_data: EmergencyContactCreateRequest,
    current_user: UserTokenData = Depends(get_current_active_user)
) -> EmergencyContactResponse:
    """
    Add a new emergency contact.
    
    Maximum 5 emergency contacts allowed per user.
    
    Required fields:
    - name: Contact's full name
    - relationship: Relationship to contact
    - phone_number: Contact phone number
    
    Optional fields:
    - email: Contact email
    - is_primary: Mark as primary contact
    - can_be_contacted: Permission to contact in emergencies
    - notes: Additional notes
    """
    try:
        contact = await user_service.add_emergency_contact(
            current_user.user_id,
            contact_data
        )
        return contact
    
    except UserServiceError as e:
        raise handle_service_error(e)


# ============== PUT /users/emergency-contacts/{contact_id} ==============

@router.put(
    "/emergency-contacts/{contact_id}",
    response_model=EmergencyContactResponse,
    summary="Update emergency contact",
    description="Update an existing emergency contact",
    responses={
        200: {
            "description": "Emergency contact updated successfully",
            "model": EmergencyContactResponse
        },
        404: {
            "description": "Emergency contact not found"
        }
    }
)
async def update_emergency_contact(
    contact_id: str,
    contact_data: EmergencyContactUpdateRequest,
    current_user: UserTokenData = Depends(get_current_active_user)
) -> EmergencyContactResponse:
    """
    Update an existing emergency contact.
    
    Only provided fields will be updated.
    """
    try:
        updated_contact = await user_service.update_emergency_contact(
            current_user.user_id,
            contact_id,
            contact_data
        )
        return updated_contact
    
    except UserServiceError as e:
        raise handle_service_error(e)


@router.patch(
    "/emergency-contacts/{contact_id}",
    response_model=EmergencyContactResponse,
    summary="Partially update emergency contact",
    description="Partially update emergency contact (alias for PUT)"
)
async def patch_emergency_contact(
    contact_id: str,
    contact_data: EmergencyContactUpdateRequest,
    current_user: UserTokenData = Depends(get_current_active_user)
) -> EmergencyContactResponse:
    """Alias for PUT /users/emergency-contacts/{contact_id}"""
    return await update_emergency_contact(contact_id, contact_data, current_user)


# ============== DELETE /users/emergency-contacts/{contact_id} ==============

@router.delete(
    "/emergency-contacts/{contact_id}",
    summary="Delete emergency contact",
    description="Delete an emergency contact",
    responses={
        204: {
            "description": "Emergency contact deleted successfully"
        },
        404: {
            "description": "Emergency contact not found"
        }
    },
    status_code=status.HTTP_204_NO_CONTENT
)
async def delete_emergency_contact(
    contact_id: str,
    current_user: UserTokenData = Depends(get_current_active_user)
):
    """Delete an emergency contact"""
    try:
        await user_service.delete_emergency_contact(
            current_user.user_id,
            contact_id
        )
        return None  # 204 No Content
    
    except UserServiceError as e:
        raise handle_service_error(e)


# ============== DELETE /users/account ==============

@router.delete(
    "/account",
    response_model=AccountDeletionResponse,
    summary="Delete user account (GDPR)",
    description="Schedule permanent deletion of user account and all data per GDPR",
    responses={
        200: {
            "description": "Account deletion scheduled",
            "model": AccountDeletionResponse
        },
        400: {
            "description": "Invalid deletion request"
        },
        401: {
            "description": "Password verification required"
        },
        409: {
            "description": "Deletion already scheduled"
        }
    }
)
async def delete_user_account(
    deletion_request: AccountDeletionRequest,
    current_user: UserTokenData = Depends(get_current_verified_user)
) -> AccountDeletionResponse:
    """
    Schedule permanent account deletion (GDPR Right to Erasure).
    
    This endpoint initiates the account deletion process:
    1. Account is immediately deactivated
    2. Data is retained for 30 days (can be reversed during this period)
    3. After 30 days, all personal data is permanently deleted
    4. Anonymized analytics data may be retained
    
    Required fields:
    - confirm_deletion: Must be True to proceed
    - password: Required for verification
    
    Optional fields:
    - reason: Reason for leaving
    - feedback: Additional feedback
    
    The deletion can be cancelled within 30 days by contacting support.
    """
    try:
        # In production, verify password here
        # if not verify_password(deletion_request.password, user.hashed_password):
        #     raise HTTPException(status_code=401, detail="Invalid password")
        
        result = await user_service.schedule_account_deletion(
            current_user.user_id,
            reason=deletion_request.reason,
            feedback=deletion_request.feedback
        )
        return result
    
    except UserServiceError as e:
        raise handle_service_error(e)


@router.post(
    "/account/cancel-deletion",
    summary="Cancel account deletion",
    description="Cancel a scheduled account deletion",
    responses={
        200: {
            "description": "Account deletion cancelled",
            "content": {
                "application/json": {
                    "example": {"success": True, "message": "Account deletion cancelled"}
                }
            }
        },
        400: {
            "description": "No deletion scheduled"
        }
    }
)
async def cancel_account_deletion(
    current_user: UserTokenData = Depends(get_current_active_user)
):
    """Cancel a scheduled account deletion (within 30-day window)"""
    try:
        await user_service.cancel_account_deletion(current_user.user_id)
        return {"success": True, "message": "Account deletion cancelled successfully"}
    
    except UserServiceError as e:
        raise handle_service_error(e)


# ============== POST /users/avatar-selection ==============

@router.post(
    "/avatar-selection",
    response_model=AvatarSelectionResponse,
    summary="Select user avatar",
    description="Select or update the user's avatar",
    responses={
        200: {
            "description": "Avatar updated successfully",
            "model": AvatarSelectionResponse
        },
        400: {
            "description": "Invalid avatar selection"
        },
        422: {
            "description": "Validation error"
        }
    }
)
async def select_avatar(
    selection: AvatarSelectionRequest,
    current_user: UserTokenData = Depends(get_current_active_user)
) -> AvatarSelectionResponse:
    """
    Select or update the user's avatar.
    
    Two options available:
    1. Use a preset avatar style with optional color
    2. Use a custom avatar URL
    
    Preset styles:
    - calm: Peaceful, serene avatar
    - energetic: Vibrant, dynamic avatar
    - friendly: Warm, approachable avatar
    - professional: Polished, sophisticated avatar
    - playful: Fun, whimsical avatar
    - mindful: Contemplative, focused avatar
    
    For custom avatars, provide a valid HTTPS URL.
    """
    try:
        result = await user_service.select_avatar(
            current_user.user_id,
            selection
        )
        return result
    
    except UserServiceError as e:
        raise handle_service_error(e)


@router.get(
    "/avatar-selection/options",
    summary="Get available avatar options",
    description="Get list of available avatar styles and colors",
    responses={
        200: {
            "description": "Avatar options retrieved",
            "content": {
                "application/json": {
                    "example": {
                        "styles": [
                            {"id": "calm", "name": "Calm", "preview_url": "..."}
                        ],
                        "colors": [
                            {"code": "#6366F1", "name": "Indigo"}
                        ],
                        "supports_custom": True
                    }
                }
            }
        }
    }
)
async def get_avatar_options(
    current_user: UserTokenData = Depends(get_current_active_user)
):
    """Get available avatar styles and customization options"""
    return await user_service.get_available_avatars()


# ============== Additional Utility Endpoints ==============

@router.get(
    "/me/stats",
    response_model=UserStatsResponse,
    summary="Get user statistics",
    description="Get user activity statistics and summary",
    responses={
        200: {
            "description": "User statistics retrieved",
            "model": UserStatsResponse
        }
    }
)
async def get_user_stats(
    current_user: UserTokenData = Depends(get_current_active_user)
) -> UserStatsResponse:
    """Get user activity statistics and summary"""
    try:
        stats = await user_service.get_user_stats(current_user.user_id)
        return stats
    
    except UserServiceError as e:
        raise handle_service_error(e)


@router.get(
    "/me/verify",
    summary="Verify current user token",
    description="Verify that the current authentication token is valid",
    responses={
        200: {
            "description": "Token is valid",
            "content": {
                "application/json": {
                    "example": {
                        "valid": True,
                        "user_id": "user_123",
                        "email": "user@example.com"
                    }
                }
            }
        }
    }
)
async def verify_token(
    current_user: UserTokenData = Depends(get_current_active_user)
):
    """Verify the current authentication token"""
    return {
        "valid": True,
        "user_id": current_user.user_id,
        "email": current_user.email,
        "is_verified": current_user.is_verified,
        "scopes": current_user.scopes
    }


# ============== Health Check ==============

@router.get(
    "/health",
    summary="User service health check",
    description="Check if user service is healthy",
    include_in_schema=False
)
async def health_check():
    """Health check endpoint for the user service"""
    return {
        "status": "healthy",
        "service": "users",
        "timestamp": datetime.utcnow().isoformat()
    }
