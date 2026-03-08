# MindMate AI Notification Service

A production-ready notification scheduler service built with Node.js, Bull queues (Redis-backed), and comprehensive push notification support.

## Features

- **Bull Queue System**: Redis-backed job queues for reliable notification processing
- **Daily Check-in Scheduler**: Personalized per-user timezone support
- **Challenge Assignment**: Intelligent challenge selection based on user state
- **Multi-Channel Push Notifications**:
  - Firebase Cloud Messaging (FCM) for Android
  - Apple Push Notification Service (APNs) for iOS
  - Web Push for browsers
- **SMS Integration**: Twilio-powered SMS notifications
- **Preference Enforcement**: Quiet hours, frequency caps, channel preferences
- **RESTful API**: Express-based API for notification management

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Notification Service                      │
├─────────────────────────────────────────────────────────────┤
│  API Server (Express)  │  Worker Process  │  Scheduler      │
├────────────────────────┼──────────────────┼─────────────────┤
│  - Send notifications  │  - Process jobs  │  - Cron tasks   │
│  - Manage preferences  │  - Handle retries│  - Daily jobs   │
│  - View history        │  - Route channels│  - Weekly jobs  │
└────────────────────────┴──────────────────┴─────────────────┘
                           │
                    ┌──────┴──────┐
                    │    Redis    │
                    │   (Bull)    │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────┴────┐       ┌────┴────┐       ┌────┴────┐
   │   FCM   │       │  APNs   │       │ Twilio  │
   │(Android)│       │  (iOS)  │       │  (SMS)  │
   └─────────┘       └─────────┘       └─────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+
- Redis 6+
- MongoDB 5+

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
```

### Configuration

Edit `.env` with your service credentials:

```env
# Redis
REDIS_URL=redis://localhost:6379

# MongoDB
MONGODB_URI=mongodb://localhost:27017/mindmate_notifications

# Firebase (FCM)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Apple Push (APNs)
APNS_KEY_ID=your-key-id
APNS_TEAM_ID=your-team-id
APNS_BUNDLE_ID=com.mindmate.app
APNS_KEY_PATH=/path/to/apns-key.p8

# Twilio
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

### Running the Service

```bash
# Start API server
npm run dev

# Start worker (in another terminal)
npm run dev:worker

# Start scheduler (in another terminal)
npm run dev:scheduler

# Or start all in production
npm run build
npm start
```

## API Endpoints

### Health & Status

```
GET  /health                 - Health check
GET  /api/queues/status      - Queue status
```

### Notifications

```
POST /api/notifications/send        - Send notification
POST /api/notifications/batch       - Send batch notification
GET  /api/notifications/:userId/history - Get notification history
```

### Check-ins

```
POST /api/checkins/schedule         - Schedule check-in
GET  /api/checkins/:userId/status   - Get check-in status
```

### Challenges

```
POST /api/challenges/assign         - Assign challenge
GET  /api/challenges/:userId/current - Get current challenge
POST /api/challenges/complete       - Complete challenge
```

### Users

```
GET    /api/users/:userId/preferences       - Get preferences
PATCH  /api/users/:userId/preferences       - Update preferences
POST   /api/users/:userId/push-tokens       - Register push token
DELETE /api/users/:userId/push-tokens/:token - Unregister push token
```

### Stats

```
GET /api/stats/notifications - Get notification stats
```

## Queue System

### Queue Types

| Queue | Purpose | Concurrency |
|-------|---------|-------------|
| `mindmate:notifications` | Main notification queue | 5 |
| `mindmate:push` | Push notifications | 5 |
| `mindmate:sms` | SMS notifications | 2 |
| `mindmate:email` | Email notifications | 5 |
| `mindmate:checkins` | Check-in jobs | 5 |
| `mindmate:challenges` | Challenge assignments | 5 |
| `mindmate:batch` | Batch notifications | 2 |

### Job Types

- `send-notification` - Send a notification
- `send-push` - Send push notification
- `send-sms` - Send SMS
- `schedule-checkin` - Schedule check-in
- `assign-challenge` - Assign challenge
- `batch-notify` - Batch notification

## Scheduled Tasks

| Task | Schedule | Description |
|------|----------|-------------|
| Check-in Scheduler | Every 5 min | Schedule user check-ins |
| Challenge Assignment | Mondays 8 AM | Weekly challenge assignments |
| Streak Check | Hourly | Check for streaks at risk |
| Reset Daily Counts | Midnight | Reset notification counters |
| Re-engagement | Wednesdays 10 AM | Re-engage inactive users |
| Cleanup Jobs | Daily 3 AM | Clean old completed jobs |
| Health Check | Every 5 min | Log queue health |

## Notification Preferences

### Channels

- Push (FCM/APNs)
- SMS (Twilio)
- Email
- In-app
- Web Push

### Quiet Hours

Users can set quiet hours during which notifications (except critical) are suppressed.

### Frequency Caps

- Push: 10/day
- SMS: 3/day
- Email: 5/day

### Notification Types

- Check-in
- Challenge
- Reminder
- Achievement
- Insight
- System
- Marketing

## Development

```bash
# Run tests
npm test

# Run linter
npm run lint

# Build for production
npm run build
```

## Docker

```dockerfile
# Dockerfile included
 docker build -t mindmate-notification-service .
 docker run -p 3003:3003 --env-file .env mindmate-notification-service
```

## License

MIT
