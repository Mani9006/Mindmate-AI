# MindMate AI User Profile API

Complete implementation of user profile endpoints for the MindMate AI mental health platform.

## Features

- **User Profile Management**: GET/PUT `/users/me` - Full profile CRUD operations
- **Onboarding Flow**: POST `/users/onboarding` - Intake questionnaire submission
- **Preferences**: GET/PUT `/users/preferences` - User settings and customization
- **Emergency Contacts**: GET/PUT `/users/emergency-contacts` - Contact management
- **GDPR Compliance**: DELETE `/users/account` - Account deletion with data retention
- **Avatar Selection**: POST `/users/avatar-selection` - Customizable user avatars

## Installation

```bash
pip install -r requirements.txt
```

## Quick Start

```python
from fastapi import FastAPI
from api.users import router as users_router

app = FastAPI()
app.include_router(users_router, prefix="/api/v1")
```

## API Endpoints

### User Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/me` | Get current user profile |
| PUT | `/users/me` | Update user profile |
| PATCH | `/users/me` | Partial update user profile |
| GET | `/users/me/stats` | Get user statistics |
| GET | `/users/me/verify` | Verify authentication token |

### Onboarding

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/users/onboarding` | Submit onboarding questionnaire |
| GET | `/users/onboarding` | Get onboarding data |

### Preferences

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/preferences` | Get user preferences |
| PUT | `/users/preferences` | Update preferences |
| PATCH | `/users/preferences` | Partial update preferences |

### Emergency Contacts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/emergency-contacts` | List emergency contacts |
| POST | `/users/emergency-contacts` | Add emergency contact |
| PUT | `/users/emergency-contacts/{id}` | Update contact |
| PATCH | `/users/emergency-contacts/{id}` | Partial update contact |
| DELETE | `/users/emergency-contacts/{id}` | Delete contact |

### Account Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| DELETE | `/users/account` | Schedule account deletion (GDPR) |
| POST | `/users/account/cancel-deletion` | Cancel scheduled deletion |

### Avatar

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/users/avatar-selection` | Select/update avatar |
| GET | `/users/avatar-selection/options` | Get available avatars |

## Authentication

All endpoints require JWT Bearer token authentication:

```http
Authorization: Bearer <your_jwt_token>
```

### Token Format

```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "is_active": true,
  "is_verified": true,
  "scopes": ["user"],
  "exp": 1234567890
}
```

## Request/Response Examples

### Get User Profile

**Request:**
```http
GET /api/v1/users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response:**
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "is_active": true,
  "is_verified": true,
  "is_onboarded": true,
  "bio": "Working on my mental health journey",
  "location": "San Francisco, CA",
  "timezone": "America/Los_Angeles",
  "avatar_url": "https://cdn.mindmate.ai/avatars/calm/6366f1.png",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T14:22:00Z",
  "preferences": {
    "theme": "dark",
    "language": "en",
    "notifications_enabled": true,
    "notification_frequency": "daily_digest"
  },
  "emergency_contacts": [
    {
      "id": "contact_456",
      "name": "Jane Doe",
      "relationship": "Spouse",
      "phone_number": "+1234567890",
      "is_primary": true
    }
  ]
}
```

### Update Profile

**Request:**
```http
PUT /api/v1/users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Smith",
  "bio": "Updated bio"
}
```

### Submit Onboarding

**Request:**
```http
POST /api/v1/users/onboarding
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "age_range": "25-34",
  "gender": "prefer_not_to_say",
  "primary_concerns": ["anxiety", "stress"],
  "therapy_experience": "some",
  "has_therapist": false,
  "goals": ["reduce_anxiety", "improve_sleep"]
}
```

### Add Emergency Contact

**Request:**
```http
POST /api/v1/users/emergency-contacts
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "name": "Emergency Contact",
  "relationship": "Family",
  "phone_number": "+9876543210",
  "email": "emergency@example.com",
  "is_primary": true,
  "can_be_contacted": true
}
```

### Schedule Account Deletion (GDPR)

**Request:**
```http
DELETE /api/v1/users/account
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "confirm_deletion": true,
  "password": "user_password",
  "reason": "No longer needed",
  "feedback": "Great service, thanks!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account deletion scheduled successfully",
  "deletion_scheduled_at": "2024-01-20T14:30:00Z",
  "data_retention_days": 30,
  "can_be_reversed_until": "2024-02-19T14:30:00Z"
}
```

### Select Avatar

**Request:**
```http
POST /api/v1/users/avatar-selection
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "avatar_style": "mindful",
  "avatar_color": "#10B981",
  "use_custom": false
}
```

## Data Models

### UserProfile

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique user ID |
| email | string | User email address |
| first_name | string | First name |
| last_name | string | Last name |
| is_active | boolean | Account active status |
| is_verified | boolean | Email verification status |
| is_onboarded | boolean | Onboarding completion status |
| bio | string | User biography |
| location | string | User location |
| timezone | string | User timezone |
| avatar_url | string | Avatar image URL |

### UserPreferences

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| theme | string | "system" | UI theme (light/dark/system) |
| language | string | "en" | Language code |
| notifications_enabled | boolean | true | Master notification toggle |
| notification_frequency | string | "daily_digest" | Notification frequency |
| email_notifications | boolean | true | Email notifications |
| push_notifications | boolean | true | Push notifications |
| font_size | string | "medium" | Text size |
| high_contrast | boolean | false | High contrast mode |

### EmergencyContact

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Contact name |
| relationship | string | Yes | Relationship to user |
| phone_number | string | Yes | Phone number |
| email | string | No | Email address |
| is_primary | boolean | No | Primary contact flag |
| can_be_contacted | boolean | No | Contact permission |

## Error Responses

All errors follow this format:

```json
{
  "detail": {
    "error": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| USER_NOT_FOUND | 404 | User does not exist |
| VALIDATION_ERROR | 422 | Invalid request data |
| ONBOARDING_ALREADY_COMPLETE | 409 | Onboarding already submitted |
| DELETION_ALREADY_SCHEDULED | 409 | Deletion already scheduled |
| CONTACT_NOT_FOUND | 404 | Emergency contact not found |

## Testing

Run the test suite:

```bash
pytest test_users.py -v
```

Run with coverage:

```bash
pytest test_users.py --cov=api.users --cov-report=html
```

## Development

### Code Formatting

```bash
black api/users/
isort api/users/
```

### Type Checking

```bash
mypy api/users/
```

### Linting

```bash
flake8 api/users/
```

## Production Considerations

1. **Database**: Replace `MockUserDB` with actual database (PostgreSQL recommended)
2. **Caching**: Add Redis for session/token caching
3. **Rate Limiting**: Implement proper rate limiting per endpoint
4. **Monitoring**: Add Sentry or similar for error tracking
5. **Logging**: Configure structured logging
6. **Secrets**: Use environment variables for SECRET_KEY
7. **HTTPS**: Enforce HTTPS in production
8. **CORS**: Configure CORS for your domains only

## License

MIT License - MindMate AI
