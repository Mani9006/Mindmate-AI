"""
User Profile Service Layer for MindMate AI
Business logic for user profile operations
"""

from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import secrets
import logging

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
    AccountDeletionResponse,
    UserInDB,
    AvatarStyle,
    UserStatsResponse
)
from .dependencies import user_db, get_password_hash

logger = logging.getLogger(__name__)


class UserServiceError(Exception):
    """User service error"""
    def __init__(self, message: str, code: str = "USER_ERROR"):
        self.message = message
        self.code = code
        super().__init__(message)


class UserNotFoundError(UserServiceError):
    """User not found error"""
    def __init__(self, user_id: str):
        super().__init__(f"User {user_id} not found", "USER_NOT_FOUND")


class ValidationError(UserServiceError):
    """Validation error"""
    def __init__(self, message: str):
        super().__init__(message, "VALIDATION_ERROR")


class UserService:
    """Service class for user profile operations"""
    
    # Avatar URL templates
    AVATAR_TEMPLATES = {
        AvatarStyle.CALM: "https://cdn.mindmate.ai/avatars/calm/{color}.png",
        AvatarStyle.ENERGETIC: "https://cdn.mindmate.ai/avatars/energetic/{color}.png",
        AvatarStyle.FRIENDLY: "https://cdn.mindmate.ai/avatars/friendly/{color}.png",
        AvatarStyle.PROFESSIONAL: "https://cdn.mindmate.ai/avatars/professional/{color}.png",
        AvatarStyle.PLAYFUL: "https://cdn.mindmate.ai/avatars/playful/{color}.png",
        AvatarStyle.MINDFUL: "https://cdn.mindmate.ai/avatars/mindful/{color}.png",
    }
    
    DEFAULT_AVATAR_COLOR = "#6366F1"
    
    def __init__(self, db=user_db):
        self.db = db
    
    # ============== User Profile Methods ==============
    
    async def get_user_profile(self, user_id: str) -> UserProfileResponse:
        """Get complete user profile with related data"""
        user = await self.db.get_user_by_id(user_id)
        if not user:
            raise UserNotFoundError(user_id)
        
        # Get preferences
        preferences = await self.db.get_preferences(user_id)
        
        # Get emergency contacts
        emergency_contacts = await self.db.get_emergency_contacts(user_id)
        
        # Get onboarding intake
        onboarding_intake = await self.db.get_onboarding_intake(user_id)
        
        # Build response
        profile_data = {
            **user,
            "preferences": preferences,
            "emergency_contacts": emergency_contacts,
            "onboarding_intake": onboarding_intake
        }
        
        return UserProfileResponse(**profile_data)
    
    async def update_user_profile(
        self,
        user_id: str,
        update_data: UserUpdateRequest
    ) -> UserProfileResponse:
        """Update user profile"""
        user = await self.db.get_user_by_id(user_id)
        if not user:
            raise UserNotFoundError(user_id)
        
        # Filter out None values
        update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
        
        if not update_dict:
            raise ValidationError("No valid fields to update")
        
        # Update user
        updated_user = await self.db.update_user(user_id, update_dict)
        
        # Return full profile
        return await self.get_user_profile(user_id)
    
    async def get_user_by_email(self, email: str) -> Optional[UserInDB]:
        """Get user by email"""
        user = await self.db.get_user_by_email(email)
        if user:
            return UserInDB(**user)
        return None
    
    # ============== Preferences Methods ==============
    
    async def get_user_preferences(self, user_id: str) -> UserPreferencesResponse:
        """Get user preferences"""
        user = await self.db.get_user_by_id(user_id)
        if not user:
            raise UserNotFoundError(user_id)
        
        preferences = await self.db.get_preferences(user_id)
        
        if not preferences:
            # Create default preferences
            preferences = await self.db.update_preferences(user_id, {
                "theme": "system",
                "language": "en",
                "notifications_enabled": True,
                "notification_frequency": "daily_digest",
                "email_notifications": True,
                "push_notifications": True,
                "sms_notifications": False,
                "sound_enabled": True,
                "haptic_feedback": True,
                "font_size": "medium",
                "high_contrast": False,
                "reduce_animations": False,
                "custom_settings": {}
            })
        
        return UserPreferencesResponse(**preferences)
    
    async def update_user_preferences(
        self,
        user_id: str,
        preferences_data: PreferencesUpdateRequest
    ) -> UserPreferencesResponse:
        """Update user preferences"""
        user = await self.db.get_user_by_id(user_id)
        if not user:
            raise UserNotFoundError(user_id)
        
        # Convert to dict and filter None values
        update_dict = {k: v for k, v in preferences_data.dict().items() if v is not None}
        
        # Handle custom_settings separately
        if "custom_settings" in update_dict and update_dict["custom_settings"]:
            existing = await self.db.get_preferences(user_id)
            if existing and existing.get("custom_settings"):
                existing_custom = existing["custom_settings"]
                existing_custom.update(update_dict["custom_settings"])
                update_dict["custom_settings"] = existing_custom
        
        updated_preferences = await self.db.update_preferences(user_id, update_dict)
        return UserPreferencesResponse(**updated_preferences)
    
    # ============== Emergency Contacts Methods ==============
    
    async def get_emergency_contacts(self, user_id: str) -> List[EmergencyContactResponse]:
        """Get all emergency contacts for a user"""
        user = await self.db.get_user_by_id(user_id)
        if not user:
            raise UserNotFoundError(user_id)
        
        contacts = await self.db.get_emergency_contacts(user_id)
        return [EmergencyContactResponse(**contact) for contact in contacts]
    
    async def add_emergency_contact(
        self,
        user_id: str,
        contact_data: EmergencyContactCreateRequest
    ) -> EmergencyContactResponse:
        """Add a new emergency contact"""
        user = await self.db.get_user_by_id(user_id)
        if not user:
            raise UserNotFoundError(user_id)
        
        # Validate max contacts (e.g., 5 max)
        existing_contacts = await self.db.get_emergency_contacts(user_id)
        if len(existing_contacts) >= 5:
            raise ValidationError("Maximum of 5 emergency contacts allowed")
        
        # Validate phone number format (basic)
        phone = contact_data.phone_number
        if not phone or len(phone) < 5:
            raise ValidationError("Valid phone number is required")
        
        contact = await self.db.add_emergency_contact(
            user_id,
            contact_data.dict()
        )
        
        return EmergencyContactResponse(**contact)
    
    async def update_emergency_contact(
        self,
        user_id: str,
        contact_id: str,
        contact_data: EmergencyContactUpdateRequest
    ) -> EmergencyContactResponse:
        """Update an existing emergency contact"""
        user = await self.db.get_user_by_id(user_id)
        if not user:
            raise UserNotFoundError(user_id)
        
        # Filter None values
        update_dict = {k: v for k, v in contact_data.dict().items() if v is not None}
        
        if not update_dict:
            raise ValidationError("No valid fields to update")
        
        updated_contact = await self.db.update_emergency_contact(
            user_id,
            contact_id,
            update_dict
        )
        
        if not updated_contact:
            raise UserServiceError(
                f"Emergency contact {contact_id} not found",
                "CONTACT_NOT_FOUND"
            )
        
        return EmergencyContactResponse(**updated_contact)
    
    async def delete_emergency_contact(
        self,
        user_id: str,
        contact_id: str
    ) -> bool:
        """Delete an emergency contact"""
        user = await self.db.get_user_by_id(user_id)
        if not user:
            raise UserNotFoundError(user_id)
        
        result = await self.db.delete_emergency_contact(user_id, contact_id)
        if not result:
            raise UserServiceError(
                f"Emergency contact {contact_id} not found",
                "CONTACT_NOT_FOUND"
            )
        
        return True
    
    async def get_primary_emergency_contact(
        self,
        user_id: str
    ) -> Optional[EmergencyContactResponse]:
        """Get the primary emergency contact for a user"""
        contacts = await self.get_emergency_contacts(user_id)
        
        for contact in contacts:
            if contact.is_primary:
                return contact
        
        # Return first contact if no primary
        return contacts[0] if contacts else None
    
    # ============== Onboarding Methods ==============
    
    async def submit_onboarding(
        self,
        user_id: str,
        onboarding_data: OnboardingSubmitRequest
    ) -> OnboardingIntakeResponse:
        """Submit onboarding questionnaire"""
        user = await self.db.get_user_by_id(user_id)
        if not user:
            raise UserNotFoundError(user_id)
        
        # Validate concerns
        valid_concerns = [
            "anxiety", "depression", "stress", "sleep_issues",
            "relationships", "work_issues", "grief", "trauma",
            "self_esteem", "loneliness", "anger", "addiction",
            "eating_disorders", "phobias", "other"
        ]
        
        for concern in onboarding_data.primary_concerns:
            if concern not in valid_concerns:
                raise ValidationError(f"Invalid concern: {concern}")
        
        # Validate age range
        valid_age_ranges = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"]
        if onboarding_data.age_range and onboarding_data.age_range not in valid_age_ranges:
            raise ValidationError(f"Invalid age range: {onboarding_data.age_range}")
        
        # Prepare data
        data = onboarding_data.dict()
        data["completed_at"] = datetime.utcnow()
        
        # Save onboarding intake
        intake = await self.db.save_onboarding_intake(user_id, data)
        
        logger.info(f"User {user_id} completed onboarding")
        
        return OnboardingIntakeResponse(**intake)
    
    async def get_onboarding_intake(
        self,
        user_id: str
    ) -> Optional[OnboardingIntakeResponse]:
        """Get user's onboarding intake data"""
        user = await self.db.get_user_by_id(user_id)
        if not user:
            raise UserNotFoundError(user_id)
        
        intake = await self.db.get_onboarding_intake(user_id)
        if intake:
            return OnboardingIntakeResponse(**intake)
        return None
    
    async def is_onboarding_complete(self, user_id: str) -> bool:
        """Check if user has completed onboarding"""
        user = await self.db.get_user_by_id(user_id)
        if not user:
            return False
        return user.get("is_onboarded", False)
    
    # ============== Avatar Selection Methods ==============
    
    async def select_avatar(
        self,
        user_id: str,
        selection: AvatarSelectionRequest
    ) -> AvatarSelectionResponse:
        """Select or update user avatar"""
        user = await self.db.get_user_by_id(user_id)
        if not user:
            raise UserNotFoundError(user_id)
        
        avatar_url = None
        
        if selection.use_custom and selection.custom_avatar_url:
            # Use custom avatar URL
            avatar_url = selection.custom_avatar_url
            # Validate URL format
            if not avatar_url.startswith(("http://", "https://")):
                raise ValidationError("Invalid avatar URL format")
        else:
            # Use preset avatar
            color = selection.avatar_color or self.DEFAULT_AVATAR_COLOR
            color_code = color.replace("#", "").lower()
            avatar_url = self.AVATAR_TEMPLATES[selection.avatar_style].format(
                color=color_code
            )
        
        # Update user
        await self.db.update_user(user_id, {
            "avatar_url": avatar_url,
            "avatar_style": selection.avatar_style.value
        })
        
        logger.info(f"User {user_id} selected avatar: {selection.avatar_style.value}")
        
        return AvatarSelectionResponse(
            success=True,
            avatar_url=avatar_url,
            avatar_style=selection.avatar_style,
            message="Avatar updated successfully"
        )
    
    async def get_available_avatars(self) -> Dict[str, Any]:
        """Get list of available avatars"""
        return {
            "styles": [
                {
                    "id": style.value,
                    "name": style.value.replace("_", " ").title(),
                    "preview_url": template.format(color="6366f1"),
                    "description": self._get_avatar_description(style)
                }
                for style, template in self.AVATAR_TEMPLATES.items()
            ],
            "colors": [
                {"code": "#6366F1", "name": "Indigo"},
                {"code": "#EC4899", "name": "Pink"},
                {"code": "#10B981", "name": "Emerald"},
                {"code": "#F59E0B", "name": "Amber"},
                {"code": "#3B82F6", "name": "Blue"},
                {"code": "#8B5CF6", "name": "Violet"},
                {"code": "#EF4444", "name": "Red"},
                {"code": "#14B8A6", "name": "Teal"},
            ],
            "supports_custom": True
        }
    
    def _get_avatar_description(self, style: AvatarStyle) -> str:
        """Get description for avatar style"""
        descriptions = {
            AvatarStyle.CALM: "A peaceful, serene avatar that promotes relaxation",
            AvatarStyle.ENERGETIC: "A vibrant, dynamic avatar full of energy",
            AvatarStyle.FRIENDLY: "A warm, approachable avatar that invites conversation",
            AvatarStyle.PROFESSIONAL: "A polished, sophisticated avatar for formal settings",
            AvatarStyle.PLAYFUL: "A fun, whimsical avatar that brings joy",
            AvatarStyle.MINDFUL: "A contemplative avatar focused on mindfulness"
        }
        return descriptions.get(style, "A personalized avatar")
    
    # ============== Account Deletion Methods (GDPR) ==============
    
    async def schedule_account_deletion(
        self,
        user_id: str,
        reason: Optional[str] = None,
        feedback: Optional[str] = None
    ) -> AccountDeletionResponse:
        """Schedule account deletion per GDPR requirements"""
        user = await self.db.get_user_by_id(user_id)
        if not user:
            raise UserNotFoundError(user_id)
        
        # Check if already scheduled for deletion
        if user.get("deleted_at"):
            raise UserServiceError(
                "Account deletion already scheduled",
                "DELETION_ALREADY_SCHEDULED"
            )
        
        # Schedule deletion
        deletion_log = await self.db.schedule_account_deletion(
            user_id,
            reason,
            feedback
        )
        
        logger.info(f"Account deletion scheduled for user {user_id}")
        
        return AccountDeletionResponse(
            success=True,
            message="Account deletion scheduled successfully",
            deletion_scheduled_at=deletion_log["requested_at"],
            data_retention_days=deletion_log["retention_days"],
            can_be_reversed_until=deletion_log["can_be_reversed_until"]
        )
    
    async def cancel_account_deletion(self, user_id: str) -> bool:
        """Cancel scheduled account deletion"""
        user = await self.db.get_user_by_id(user_id)
        if not user:
            raise UserNotFoundError(user_id)
        
        if not user.get("deleted_at"):
            raise UserServiceError(
                "No deletion scheduled for this account",
                "NO_DELETION_SCHEDULED"
            )
        
        # Reactivate account
        await self.db.update_user(user_id, {
            "deleted_at": None,
            "deletion_reason": None,
            "is_active": True
        })
        
        logger.info(f"Account deletion cancelled for user {user_id}")
        
        return True
    
    async def permanently_delete_account(self, user_id: str) -> bool:
        """Permanently delete user account and all data (GDPR)"""
        # This would be called by a background job after retention period
        user = await self.db.get_user_by_id(user_id)
        if not user:
            raise UserNotFoundError(user_id)
        
        logger.info(f"Permanently deleting account for user {user_id}")
        
        # In production, this would:
        # 1. Delete or anonymize all user data
        # 2. Delete all messages and sessions
        # 3. Delete all files and media
        # 4. Remove from all indexes
        # 5. Generate anonymized analytics record
        # 6. Log deletion completion
        
        # For now, just mark as deleted
        await self.db.update_user(user_id, {
            "email": f"deleted_{user_id}@anonymized.local",
            "first_name": None,
            "last_name": None,
            "phone_number": None,
            "bio": None,
            "location": None,
            "occupation": None,
            "avatar_url": None,
            "hashed_password": "DELETED",
        })
        
        return True
    
    # ============== User Statistics Methods ==============
    
    async def get_user_stats(self, user_id: str) -> UserStatsResponse:
        """Get user statistics and activity summary"""
        user = await self.db.get_user_by_id(user_id)
        if not user:
            raise UserNotFoundError(user_id)
        
        # Calculate account age
        created_at = user.get("created_at", datetime.utcnow())
        account_age_days = (datetime.utcnow() - created_at).days
        
        # In production, these would come from actual session/message data
        # For now, return placeholder data
        return UserStatsResponse(
            user_id=user_id,
            total_sessions=0,  # Would query sessions table
            total_messages=0,  # Would query messages table
            streak_days=0,  # Would calculate from session history
            last_session_at=None,  # Would query sessions table
            account_age_days=account_age_days,
            preferred_topics=[]  # Would analyze from conversations
        )
    
    # ============== Helper Methods ==============
    
    async def create_user(
        self,
        email: str,
        password: str,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None
    ) -> UserInDB:
        """Create a new user (for testing/initialization)"""
        user_id = secrets.token_urlsafe(16)
        now = datetime.utcnow()
        
        user_data = {
            "id": user_id,
            "email": email,
            "hashed_password": get_password_hash(password),
            "first_name": first_name,
            "last_name": last_name,
            "is_active": True,
            "is_verified": False,
            "is_onboarded": False,
            "timezone": "UTC",
            "created_at": now,
            "updated_at": now,
        }
        
        self.db.users[user_id] = user_data
        
        return UserInDB(**user_data)


# Global service instance
user_service = UserService()
