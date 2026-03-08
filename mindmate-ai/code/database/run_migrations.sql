-- MindMate AI Database Migration Master Script
-- Run all migrations in order
-- Created by Agent 67

-- ============================================
-- MIGRATION EXECUTION ORDER
-- ============================================
-- This script runs all migrations in the correct order
-- Each migration is idempotent (can be run multiple times safely)

-- To run this script:
-- psql -U your_username -d your_database -f run_migrations.sql

-- Or run individual migrations:
-- psql -U your_username -d your_database -f migrations/001_create_users_table.sql

-- ============================================
-- MIGRATION LIST
-- ============================================

-- Migration 001: Create Users Table
\echo 'Running Migration 001: Create Users Table...'
\i migrations/001_create_users_table.sql

-- Migration 002: Create Sessions Table
\echo 'Running Migration 002: Create Sessions Table...'
\i migrations/002_create_sessions_table.sql

-- Migration 003: Create Messages Table
\echo 'Running Migration 003: Create Messages Table...'
\i migrations/003_create_messages_table.sql

-- Migration 004: Create Emotions Log and Mood Entries Tables
\echo 'Running Migration 004: Create Emotions and Mood Tables...'
\i migrations/004_create_emotions_and_mood_tables.sql

-- Migration 005: Create Tasks and Task Completions Tables
\echo 'Running Migration 005: Create Tasks Tables...'
\i migrations/005_create_tasks_tables.sql

-- Migration 006: Create Notifications and Notification Templates Tables
\echo 'Running Migration 006: Create Notifications Tables...'
\i migrations/006_create_notifications_tables.sql

-- Migration 007: Create Crisis Events Table
\echo 'Running Migration 007: Create Crisis Events Table...'
\i migrations/007_create_crisis_events_table.sql

-- Migration 008: Create Memory Entries Table
\echo 'Running Migration 008: Create Memory Entries Table...'
\i migrations/008_create_memory_entries_table.sql

-- Migration 009: Create Subscriptions and Subscription Tiers Tables
\echo 'Running Migration 009: Create Subscriptions Tables...'
\i migrations/009_create_subscriptions_tables.sql

-- Migration 010: Create Therapist Notes Table
\echo 'Running Migration 010: Create Therapist Notes Table...'
\i migrations/010_create_therapist_notes_table.sql

-- Migration 011: Create Emergency Contacts Table
\echo 'Running Migration 011: Create Emergency Contacts Table...'
\i migrations/011_create_emergency_contacts_table.sql

-- Migration 012: Create Progress Reports Table
\echo 'Running Migration 012: Create Progress Reports Table...'
\i migrations/012_create_progress_reports_table.sql

-- Migration 013: Create Gamification Tables (Challenges, Achievements, Avatars)
\echo 'Running Migration 013: Create Gamification Tables...'
\i migrations/013_create_gamification_tables.sql

-- Migration 014: Seed Data (Challenges, Templates, Avatars, Subscription Tiers)
\echo 'Running Migration 014: Seed Data...'
\i migrations/014_seed_data.sql

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
\echo 'All migrations completed successfully!'
\echo 'MindMate AI database is ready to use.'
