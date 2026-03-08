"""
Test Suite for MindMate AI User Profile API

This module contains tests for all user profile endpoints.
Run with: pytest test_users.py -v
"""

import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from jose import jwt

# Import the application and dependencies
from .main_example import app
from .dependencies import (
    SECRET_KEY,
    ALGORITHM,
    create_access_token,
    get_password_hash,
    user_db
)
from .service import user_service

# Create test client
client = TestClient(app)


# ============== Test Fixtures ==============

@pytest.fixture
def test_user():
    """Create a test user"""
    user_data = {
        "id": "test_user_123",
        "email": "test@example.com",
        "hashed_password": get_password_hash("TestPassword123"),
        "first_name": "Test",
        "last_name": "User",
        "phone_number": "+1234567890",
        "is_active": True,
        "is_verified": True,
        "is_onboarded": False,
        "timezone": "UTC",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    user_db.users["test_user_123"] = user_data
    return user_data


@pytest.fixture
def auth_token(test_user):
    """Create an authentication token for the test user"""
    token = create_access_token({
        "sub": test_user["id"],
        "email": test_user["email"],
        "is_active": test_user["is_active"],
        "is_verified": test_user["is_verified"],
        "scopes": ["user"]
    })
    return token


@pytest.fixture
def auth_headers(auth_token):
    """Create authorization headers"""
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture(autouse=True)
def cleanup():
    """Clean up after each test"""
    yield
    # Clear test data
    keys_to_remove = [k for k in user_db.users.keys() if k.startswith("test_")]
    for key in keys_to_remove:
        user_db.users.pop(key, None)
        user_db.preferences.pop(key, None)
        user_db.emergency_contacts.pop(key, None)
        user_db.onboarding_intakes.pop(key, None)


# ============== GET /users/me Tests ==============

class TestGetUserProfile:
    """Tests for GET /users/me endpoint"""
    
    def test_get_profile_success(self, auth_headers, test_user):
        """Test successful profile retrieval"""
        response = client.get("/api/v1/users/me", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_user["id"]
        assert data["email"] == test_user["email"]
        assert data["first_name"] == test_user["first_name"]
    
    def test_get_profile_unauthorized(self):
        """Test profile retrieval without authentication"""
        response = client.get("/api/v1/users/me")
        
        assert response.status_code == 403
        assert "Not authenticated" in response.text
    
    def test_get_profile_invalid_token(self):
        """Test profile retrieval with invalid token"""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/api/v1/users/me", headers=headers)
        
        assert response.status_code == 403
    
    def test_get_profile_with_query_params(self, auth_headers, test_user):
        """Test profile retrieval with include flags"""
        response = client.get(
            "/api/v1/users/me?include_preferences=true&include_contacts=true",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "preferences" in data
        assert "emergency_contacts" in data


# ============== PUT /users/me Tests ==============

class TestUpdateUserProfile:
    """Tests for PUT /users/me endpoint"""
    
    def test_update_profile_success(self, auth_headers, test_user):
        """Test successful profile update"""
        update_data = {
            "first_name": "Updated",
            "last_name": "Name",
            "bio": "This is my bio"
        }
        
        response = client.put("/api/v1/users/me", json=update_data, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["first_name"] == "Updated"
        assert data["last_name"] == "Name"
        assert data["bio"] == "This is my bio"
    
    def test_update_profile_partial(self, auth_headers, test_user):
        """Test partial profile update"""
        update_data = {
            "first_name": "OnlyFirstName"
        }
        
        response = client.put("/api/v1/users/me", json=update_data, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["first_name"] == "OnlyFirstName"
        # Last name should remain unchanged
        assert data["last_name"] == test_user["last_name"]
    
    def test_update_profile_validation_error(self, auth_headers):
        """Test profile update with invalid data"""
        update_data = {
            "bio": "x" * 2000  # Exceeds max length
        }
        
        response = client.put("/api/v1/users/me", json=update_data, headers=auth_headers)
        
        assert response.status_code == 422
    
    def test_update_profile_unauthorized(self):
        """Test profile update without authentication"""
        response = client.put("/api/v1/users/me", json={"first_name": "Test"})
        
        assert response.status_code == 403


# ============== POST /users/onboarding Tests ==============

class TestOnboarding:
    """Tests for POST /users/onboarding endpoint"""
    
    def test_submit_onboarding_success(self, auth_headers, test_user):
        """Test successful onboarding submission"""
        onboarding_data = {
            "age_range": "25-34",
            "gender": "prefer_not_to_say",
            "primary_concerns": ["anxiety", "stress"],
            "therapy_experience": "some",
            "has_therapist": False,
            "emergency_support_needed": False,
            "goals": ["reduce_anxiety", "improve_sleep"]
        }
        
        response = client.post(
            "/api/v1/users/onboarding",
            json=onboarding_data,
            headers=auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["user_id"] == test_user["id"]
        assert "anxiety" in data["primary_concerns"]
    
    def test_submit_onboarding_already_complete(self, auth_headers, test_user):
        """Test onboarding submission when already complete"""
        # First submission
        onboarding_data = {
            "age_range": "25-34",
            "primary_concerns": ["anxiety"],
            "therapy_experience": "none"
        }
        client.post("/api/v1/users/onboarding", json=onboarding_data, headers=auth_headers)
        
        # Second submission should fail
        response = client.post(
            "/api/v1/users/onboarding",
            json=onboarding_data,
            headers=auth_headers
        )
        
        assert response.status_code == 409
        assert "already completed" in response.json()["detail"]["message"].lower()
    
    def test_submit_onboarding_invalid_concern(self, auth_headers):
        """Test onboarding with invalid concern"""
        onboarding_data = {
            "primary_concerns": ["invalid_concern"]
        }
        
        response = client.post(
            "/api/v1/users/onboarding",
            json=onboarding_data,
            headers=auth_headers
        )
        
        assert response.status_code == 400


# ============== GET/PUT /users/preferences Tests ==============

class TestUserPreferences:
    """Tests for user preferences endpoints"""
    
    def test_get_preferences_success(self, auth_headers, test_user):
        """Test successful preferences retrieval"""
        response = client.get("/api/v1/users/preferences", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "theme" in data
        assert "language" in data
        assert "notifications_enabled" in data
    
    def test_update_preferences_success(self, auth_headers):
        """Test successful preferences update"""
        preferences_data = {
            "theme": "dark",
            "language": "es",
            "notifications_enabled": False
        }
        
        response = client.put(
            "/api/v1/users/preferences",
            json=preferences_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["theme"] == "dark"
        assert data["language"] == "es"
        assert data["notifications_enabled"] == False
    
    def test_update_preferences_custom_settings(self, auth_headers):
        """Test updating custom settings"""
        preferences_data = {
            "custom_settings": {
                "dashboard_layout": "grid",
                "favorite_tools": ["breathing", "meditation"]
            }
        }
        
        response = client.put(
            "/api/v1/users/preferences",
            json=preferences_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["custom_settings"]["dashboard_layout"] == "grid"


# ============== GET/PUT /users/emergency-contacts Tests ==============

class TestEmergencyContacts:
    """Tests for emergency contacts endpoints"""
    
    def test_add_emergency_contact_success(self, auth_headers):
        """Test successful emergency contact addition"""
        contact_data = {
            "name": "Emergency Contact",
            "relationship": "Family",
            "phone_number": "+9876543210",
            "email": "emergency@example.com",
            "is_primary": True,
            "can_be_contacted": True
        }
        
        response = client.post(
            "/api/v1/users/emergency-contacts",
            json=contact_data,
            headers=auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Emergency Contact"
        assert data["is_primary"] == True
    
    def test_get_emergency_contacts(self, auth_headers):
        """Test retrieving emergency contacts"""
        # Add a contact first
        contact_data = {
            "name": "Test Contact",
            "relationship": "Friend",
            "phone_number": "+1111111111"
        }
        client.post("/api/v1/users/emergency-contacts", json=contact_data, headers=auth_headers)
        
        response = client.get("/api/v1/users/emergency-contacts", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert data[0]["name"] == "Test Contact"
    
    def test_update_emergency_contact(self, auth_headers):
        """Test updating emergency contact"""
        # Add a contact
        contact_data = {
            "name": "Original Name",
            "relationship": "Friend",
            "phone_number": "+2222222222"
        }
        create_response = client.post(
            "/api/v1/users/emergency-contacts",
            json=contact_data,
            headers=auth_headers
        )
        contact_id = create_response.json()["id"]
        
        # Update the contact
        update_data = {"name": "Updated Name"}
        response = client.put(
            f"/api/v1/users/emergency-contacts/{contact_id}",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        assert response.json()["name"] == "Updated Name"
    
    def test_delete_emergency_contact(self, auth_headers):
        """Test deleting emergency contact"""
        # Add a contact
        contact_data = {
            "name": "To Delete",
            "relationship": "Friend",
            "phone_number": "+3333333333"
        }
        create_response = client.post(
            "/api/v1/users/emergency-contacts",
            json=contact_data,
            headers=auth_headers
        )
        contact_id = create_response.json()["id"]
        
        # Delete the contact
        response = client.delete(
            f"/api/v1/users/emergency-contacts/{contact_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 204
    
    def test_max_emergency_contacts(self, auth_headers):
        """Test maximum emergency contacts limit"""
        # Add 5 contacts (the limit)
        for i in range(5):
            contact_data = {
                "name": f"Contact {i}",
                "relationship": "Friend",
                "phone_number": f"+{i:010d}"
            }
            client.post("/api/v1/users/emergency-contacts", json=contact_data, headers=auth_headers)
        
        # Try to add a 6th contact
        contact_data = {
            "name": "Sixth Contact",
            "relationship": "Friend",
            "phone_number": "+6666666666"
        }
        response = client.post(
            "/api/v1/users/emergency-contacts",
            json=contact_data,
            headers=auth_headers
        )
        
        assert response.status_code == 400
        assert "maximum" in response.json()["detail"]["message"].lower()


# ============== DELETE /users/account Tests ==============

class TestAccountDeletion:
    """Tests for DELETE /users/account endpoint"""
    
    def test_schedule_deletion_success(self, auth_headers, test_user):
        """Test successful account deletion scheduling"""
        deletion_request = {
            "confirm_deletion": True,
            "password": "TestPassword123",
            "reason": "No longer needed",
            "feedback": "Great service!"
        }
        
        response = client.delete(
            "/api/v1/users/account",
            json=deletion_request,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "deletion_scheduled_at" in data
        assert "can_be_reversed_until" in data
    
    def test_schedule_deletion_not_confirmed(self, auth_headers):
        """Test deletion without confirmation"""
        deletion_request = {
            "confirm_deletion": False,
            "password": "TestPassword123"
        }
        
        response = client.delete(
            "/api/v1/users/account",
            json=deletion_request,
            headers=auth_headers
        )
        
        assert response.status_code == 422
    
    def test_cancel_deletion(self, auth_headers, test_user):
        """Test cancelling scheduled deletion"""
        # Schedule deletion first
        deletion_request = {
            "confirm_deletion": True,
            "password": "TestPassword123"
        }
        client.delete("/api/v1/users/account", json=deletion_request, headers=auth_headers)
        
        # Cancel deletion
        response = client.post(
            "/api/v1/users/account/cancel-deletion",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        assert response.json()["success"] == True


# ============== POST /users/avatar-selection Tests ==============

class TestAvatarSelection:
    """Tests for POST /users/avatar-selection endpoint"""
    
    def test_select_preset_avatar(self, auth_headers):
        """Test selecting a preset avatar"""
        selection = {
            "avatar_style": "calm",
            "avatar_color": "#6366F1",
            "use_custom": False
        }
        
        response = client.post(
            "/api/v1/users/avatar-selection",
            json=selection,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "avatar_url" in data
        assert data["avatar_style"] == "calm"
    
    def test_select_custom_avatar(self, auth_headers):
        """Test selecting a custom avatar"""
        selection = {
            "avatar_style": "calm",
            "use_custom": True,
            "custom_avatar_url": "https://example.com/my-avatar.png"
        }
        
        response = client.post(
            "/api/v1/users/avatar-selection",
            json=selection,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "example.com/my-avatar.png" in data["avatar_url"]
    
    def test_get_avatar_options(self, auth_headers):
        """Test getting available avatar options"""
        response = client.get(
            "/api/v1/users/avatar-selection/options",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "styles" in data
        assert "colors" in data
        assert len(data["styles"]) > 0
        assert len(data["colors"]) > 0


# ============== Additional Tests ==============

class TestUserStats:
    """Tests for user statistics endpoint"""
    
    def test_get_user_stats(self, auth_headers, test_user):
        """Test getting user statistics"""
        response = client.get("/api/v1/users/me/stats", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == test_user["id"]
        assert "total_sessions" in data
        assert "account_age_days" in data


class TestTokenVerification:
    """Tests for token verification endpoint"""
    
    def test_verify_token(self, auth_headers, test_user):
        """Test token verification"""
        response = client.get("/api/v1/users/me/verify", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True
        assert data["user_id"] == test_user["id"]


# ============== Integration Tests ==============

class TestUserFlow:
    """Integration tests for complete user flows"""
    
    def test_complete_user_onboarding_flow(self, auth_headers, test_user):
        """Test complete user onboarding flow"""
        # 1. Get initial profile
        response = client.get("/api/v1/users/me", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["is_onboarded"] == False
        
        # 2. Submit onboarding
        onboarding_data = {
            "age_range": "25-34",
            "gender": "prefer_not_to_say",
            "primary_concerns": ["anxiety", "stress"],
            "therapy_experience": "some",
            "has_therapist": False,
            "goals": ["reduce_anxiety"]
        }
        response = client.post(
            "/api/v1/users/onboarding",
            json=onboarding_data,
            headers=auth_headers
        )
        assert response.status_code == 201
        
        # 3. Update profile
        profile_update = {
            "first_name": "John",
            "last_name": "Doe",
            "bio": "Working on my mental health"
        }
        response = client.put("/api/v1/users/me", json=profile_update, headers=auth_headers)
        assert response.status_code == 200
        
        # 4. Set preferences
        preferences = {
            "theme": "dark",
            "notifications_enabled": True
        }
        response = client.put("/api/v1/users/preferences", json=preferences, headers=auth_headers)
        assert response.status_code == 200
        
        # 5. Select avatar
        avatar = {
            "avatar_style": "mindful",
            "avatar_color": "#10B981"
        }
        response = client.post("/api/v1/users/avatar-selection", json=avatar, headers=auth_headers)
        assert response.status_code == 200
        
        # 6. Add emergency contact
        contact = {
            "name": "Jane Doe",
            "relationship": "Spouse",
            "phone_number": "+1234567890",
            "is_primary": True
        }
        response = client.post("/api/v1/users/emergency-contacts", json=contact, headers=auth_headers)
        assert response.status_code == 201
        
        # 7. Verify complete profile
        response = client.get("/api/v1/users/me", headers=auth_headers)
        assert response.status_code == 200
        profile = response.json()
        assert profile["first_name"] == "John"
        assert profile["is_onboarded"] == True
        assert len(profile["emergency_contacts"]) == 1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
