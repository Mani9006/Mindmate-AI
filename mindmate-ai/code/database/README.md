# MindMate AI Database

Complete database schema and migration files for the MindMate AI mental health companion platform.

## Overview

This directory contains all database-related files for MindMate AI:

- **Prisma Schema** - Complete type-safe database schema definition
- **SQL Migrations** - Production-ready PostgreSQL migration files
- **Seed Data** - Default challenges, notification templates, avatar options, subscription tiers
- **Environment Configuration** - Database connection settings

## Database Schema

### Core Tables (15 tables)

| Table | Description |
|-------|-------------|
| `users` | User accounts and profiles |
| `sessions` | Authentication sessions |
| `messages` | AI conversation messages |
| `emotions_log` | Real-time emotion tracking |
| `mood_entries` | Daily mood journal entries |
| `tasks` | User tasks and goals |
| `task_completions` | Task completion records |
| `notifications` | User notifications |
| `notification_templates` | Reusable notification templates |
| `crisis_events` | Crisis detection and response |
| `memory_entries` | AI memory/context storage |
| `subscriptions` | User subscriptions |
| `subscription_tiers` | Subscription plan definitions |
| `therapist_notes` | Clinical notes integration |
| `emergency_contacts` | User emergency contacts |
| `progress_reports` | Wellness progress reports |

### Gamification Tables (5 tables)

| Table | Description |
|-------|-------------|
| `challenges` | Available challenges |
| `user_challenges` | User challenge progress |
| `achievements` | Achievement definitions |
| `user_achievements` | User earned achievements |
| `avatar_options` | User avatar choices |

## Quick Start

### 1. Install PostgreSQL

```bash
# macOS
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql

# Create database and user
psql -U postgres
CREATE DATABASE mindmate_db;
CREATE USER mindmate_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE mindmate_db TO mindmate_user;
\q
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your database credentials
```

### 3. Run Migrations

```bash
# Option 1: Run all migrations at once
psql -U mindmate_user -d mindmate_db -f run_migrations.sql

# Option 2: Run migrations individually
psql -U mindmate_user -d mindmate_db -f migrations/001_create_users_table.sql
psql -U mindmate_user -d mindmate_db -f migrations/002_create_sessions_table.sql
# ... continue for each migration
```

### 4. Using Prisma

```bash
# Install Prisma
npm install prisma @prisma/client

# Generate Prisma Client
npx prisma generate

# Run migrations with Prisma
npx prisma migrate dev

# Open Prisma Studio
npx prisma studio
```

## Migration Order

Migrations must be run in the following order due to foreign key dependencies:

1. `001_create_users_table.sql` - Foundation table
2. `002_create_sessions_table.sql` - Depends on users
3. `003_create_messages_table.sql` - Depends on users
4. `004_create_emotions_and_mood_tables.sql` - Depends on users
5. `005_create_tasks_tables.sql` - Depends on users
6. `006_create_notifications_tables.sql` - Depends on users
7. `007_create_crisis_events_table.sql` - Depends on users, messages
8. `008_create_memory_entries_table.sql` - Depends on users, messages
9. `009_create_subscriptions_tables.sql` - Depends on users
10. `010_create_therapist_notes_table.sql` - Depends on users
11. `011_create_emergency_contacts_table.sql` - Depends on users
12. `012_create_progress_reports_table.sql` - Depends on users
13. `013_create_gamification_tables.sql` - Depends on users
14. `014_seed_data.sql` - Populates reference data

## Seed Data Included

### Subscription Tiers
- **Free** - Basic features, limited usage
- **Premium** ($9.99/mo) - Unlimited features, priority support
- **Pro** ($19.99/mo) - Therapist integration, family sharing

### Default Challenges
- Daily mood logging
- Gratitude journaling
- Mindful breathing exercises
- 7-day and 30-day streak challenges
- CBT thought reframing
- Sleep hygiene challenges
- Educational modules

### Notification Templates
- Welcome messages
- Mood check reminders
- Task due notifications
- Achievement unlocks
- Progress reports
- Crisis support resources
- Subscription reminders

### Avatar Options
- Free: Zen Circle, Sunshine, Ocean Wave, animals, abstract designs
- Premium: Phoenix, Northern Lights, Crystal, majestic animals
- Pro: Therapist Companion, Family Guardian

### Achievements
- Mood tracking milestones
- Task completion badges
- Login streak rewards
- Challenge completion trophies

## Database Design Principles

### 1. Data Integrity
- Foreign key constraints on all relationships
- Check constraints for valid data ranges
- Unique constraints where appropriate

### 2. Performance
- Strategic indexes on frequently queried columns
- Partial indexes for filtered queries
- GIN indexes for JSON/Array columns

### 3. Security
- UUID primary keys (non-sequential)
- Soft deletes with `deleted_at` column
- Audit fields (created_at, updated_at)

### 4. Scalability
- Normalized schema design
- JSONB columns for flexible metadata
- Enum types for status values

## Key Indexes

### Performance Critical Indexes
```sql
-- User lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- Message queries
CREATE INDEX idx_messages_user_conversation ON messages(user_id, conversation_id);

-- Mood tracking
CREATE INDEX idx_mood_entries_user_date ON mood_entries(user_id, entry_date);

-- Task management
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);

-- Notifications
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
```

## Enum Types

### Message Roles
- `USER` - User message
- `ASSISTANT` - AI response
- `SYSTEM` - System message

### Task Status
- `PENDING` - Not started
- `IN_PROGRESS` - Active
- `COMPLETED` - Done
- `CANCELLED` - Cancelled
- `DEFERRED` - Postponed

### Crisis Severity
- `LOW` - Minor concern
- `MEDIUM` - Moderate concern
- `HIGH` - Serious concern
- `CRITICAL` - Emergency

### Subscription Status
- `TRIAL` - Trial period
- `ACTIVE` - Paid subscription
- `PAST_DUE` - Payment overdue
- `CANCELED` - Cancelled
- `UNPAID` - Unpaid
- `PAUSED` - Temporarily paused

## Backup and Recovery

### Automated Backups
```bash
# Create backup script
pg_dump -U mindmate_user -d mindmate_db > backup_$(date +%Y%m%d).sql

# Restore from backup
psql -U mindmate_user -d mindmate_db < backup_20240101.sql
```

### Point-in-Time Recovery
```bash
# Enable WAL archiving in postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /backups/wal/%f'
```

## Monitoring Queries

### Database Size
```sql
SELECT pg_size_pretty(pg_database_size('mindmate_db'));
```

### Table Sizes
```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Slow Queries
```sql
SELECT query, calls, mean_time, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## Maintenance

### Vacuum and Analyze
```sql
-- Regular maintenance
VACUUM ANALYZE;

-- Full vacuum (locks table)
VACUUM FULL;
```

### Index Maintenance
```sql
-- Reindex all tables
REINDEX DATABASE mindmate_db;

-- Reindex specific table
REINDEX TABLE users;
```

## Troubleshooting

### Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# View connection logs
tail -f /var/log/postgresql/postgresql-*.log
```

### Migration Failures
```bash
# Check migration status
psql -d mindmate_db -c "\dt"

# View existing tables
psql -d mindmate_db -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
```

## Contributing

When adding new migrations:
1. Follow the naming convention: `XXX_description.sql`
2. Make migrations idempotent (use `IF NOT EXISTS`)
3. Include both `up` and `down` migrations when possible
4. Update this README with new tables/columns
5. Test migrations on a fresh database

## License

This database schema is part of the MindMate AI platform.
