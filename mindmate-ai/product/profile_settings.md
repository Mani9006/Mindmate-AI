# MindMate AI - User Profile & Settings Specification

## Document Information
| Property | Value |
|----------|-------|
| Version | 1.0.0 |
| Status | Production Ready |
| Last Updated | 2024 |
| Owner | Product Design Team |

---

## Table of Contents
1. [User Profile System](#1-user-profile-system)
2. [Settings Screens](#2-settings-screens)
3. [Data Models](#3-data-models)
4. [UI/UX Specifications](#4-uiux-specifications)
5. [Security & Privacy](#5-security--privacy)

---

## 1. User Profile System

### 1.1 Personal Information

#### Core Profile Fields

| Field | Type | Required | Validation | Privacy Level |
|-------|------|----------|------------|---------------|
| `user_id` | UUID | Yes | Auto-generated | Internal |
| `display_name` | String | Yes | 2-50 chars, alphanumeric + spaces | Public |
| `email` | Email | Yes | Valid email format | Private |
| `phone_number` | Phone | Optional | E.164 format | Private |
| `date_of_birth` | Date | Optional | Age 13+ | Private |
| `gender_identity` | Enum | Optional | See options below | Private |
| `pronouns` | Enum | Optional | See options below | Public |
| `timezone` | String | Yes | IANA timezone | Internal |
| `language` | String | Yes | ISO 639-1 | Internal |
| `profile_photo` | URL | Optional | Max 5MB, JPG/PNG | Public |
| `bio` | String | Optional | Max 500 characters | Public |
| `account_created` | Timestamp | Yes | Auto-generated | Internal |
| `last_active` | Timestamp | Yes | Auto-updated | Internal |

#### Gender Identity Options
```typescript
enum GenderIdentity {
  MALE = "male",
  FEMALE = "female",
  NON_BINARY = "non_binary",
  TRANSGENDER = "transgender",
  GENDERQUEER = "genderqueer",
  GENDERFLUID = "genderfluid",
  AGENDER = "agender",
  PREFER_NOT_TO_SAY = "prefer_not_to_say",
  SELF_DESCRIBE = "self_describe" // Opens text field
}
```

#### Pronoun Options
```typescript
enum Pronouns {
  HE_HIM = "he/him",
  SHE_HER = "she/her",
  THEY_THEM = "they/them",
  HE_THEY = "he/they",
  SHE_THEY = "she/they",
  XE_XEM = "xe/xem",
  ZE_ZIR = "ze/zir",
  USE_NAME = "use_my_name",
  PREFER_NOT_TO_SAY = "prefer_not_to_say"
}
```

#### Location Information (Optional)
| Field | Type | Purpose |
|-------|------|---------|
| `country` | String | Crisis resource routing |
| `state_province` | String | Local resource matching |
| `city` | String | Support group suggestions |
| `postal_code` | String | Regional service availability |

---

### 1.2 Mental Health Goals

#### Goal Categories

```typescript
interface MentalHealthGoals {
  primary_goals: PrimaryGoal[];
  secondary_goals: SecondaryGoal[];
  custom_goals: CustomGoal[];
  goal_history: GoalHistory[];
  progress_tracking: ProgressTracking;
}
```

#### Primary Goals (Select up to 3)
| Goal ID | Goal Name | Description |
|---------|-----------|-------------|
| `reduce_anxiety` | Reduce Anxiety | Manage worry, panic, and anxious thoughts |
| `improve_mood` | Improve Mood | Address depression, sadness, low motivation |
| `better_sleep` | Better Sleep | Improve sleep quality and bedtime routines |
| `stress_management` | Stress Management | Handle daily stress and pressure |
| `build_confidence` | Build Confidence | Increase self-esteem and self-worth |
| `relationship_health` | Relationship Health | Improve connections with others |
| `process_trauma` | Process Trauma | Work through past difficult experiences |
| `anger_management` | Anger Management | Control and express anger healthily |
| `addiction_support` | Addiction Support | Manage substance use or behavioral addictions |
| `eating_disorder_recovery` | Eating Disorder Recovery | Develop healthy relationship with food |
| `grief_support` | Grief Support | Process loss and bereavement |
| `life_transitions` | Life Transitions | Navigate major life changes |

#### Secondary Goals (Unlimited)
| Goal ID | Goal Name |
|---------|-----------|
| `mindfulness_practice` | Develop Mindfulness Practice |
| `emotional_regulation` | Improve Emotional Regulation |
| `social_skills` | Build Social Skills |
| `communication_skills` | Improve Communication |
| `boundary_setting` | Set Healthy Boundaries |
| `work_life_balance` | Achieve Work-Life Balance |
| `academic_performance` | Improve Academic Performance |
| `career_satisfaction` | Increase Career Satisfaction |
| `physical_health` | Improve Physical Health Connection |
| `financial_stress` | Reduce Financial Stress |
| `loneliness` | Reduce Loneliness |
| `perfectionism` | Overcome Perfectionism |

#### Goal Progress Tracking
```typescript
interface ProgressTracking {
  current_streak_days: number;
  longest_streak_days: number;
  total_sessions_completed: number;
  goals_achieved: number;
  last_assessment_date: Date;
  progress_percentage: number; // 0-100
  weekly_checkin_enabled: boolean;
  milestone_rewards: Milestone[];
}
```

#### Milestone System
| Milestone | Sessions Required | Reward |
|-----------|-------------------|--------|
| First Step | 1 | Welcome badge |
| Consistent | 7 days streak | Streak badge + new avatar option |
| Dedicated | 30 days streak | Premium background theme |
| Explorer | 10 different exercises | Exercise library unlock |
| Reflective | 50 journal entries | Advanced journal templates |
| Growing | 25 sessions | Personalized insights report |
| Thriving | 100 sessions | Achievement badge + certificate |

---

### 1.3 Therapy Preferences

#### Communication Preferences

```typescript
interface TherapyPreferences {
  communication_style: CommunicationStyle;
  session_preferences: SessionPreferences;
  ai_personality: AIPersonality;
  content_preferences: ContentPreferences;
  crisis_preferences: CrisisPreferences;
}
```

#### Communication Style
| Preference | Options | Description |
|------------|---------|-------------|
| `response_length` | brief / moderate / detailed | How long AI responses should be |
| `tone` | warm / professional / casual / direct | AI communication tone |
| `question_frequency` | minimal / moderate / frequent | How often AI asks questions |
| `validation_style` | high / moderate / low | Amount of emotional validation |
| `directive_level` | exploratory / balanced / structured | How guided conversations are |

#### Session Preferences
```typescript
interface SessionPreferences {
  preferred_session_duration: number; // minutes: 5, 10, 15, 20, 30
  preferred_time_of_day: TimeOfDay[]; // morning, afternoon, evening, night
  reminder_enabled: boolean;
  reminder_time: string; // HH:MM format
  session_goals_prompt: boolean; // Ask for goals at start
  session_reflection_prompt: boolean; // Ask for reflection at end
  auto_save_enabled: boolean;
  background_sound: BackgroundSound;
}

enum TimeOfDay {
  MORNING = "morning", // 6AM - 12PM
  AFTERNOON = "afternoon", // 12PM - 5PM
  EVENING = "evening", // 5PM - 9PM
  NIGHT = "night" // 9PM - 6AM
}

enum BackgroundSound {
  NONE = "none",
  RAIN = "rain",
  OCEAN = "ocean",
  FOREST = "forest",
  WHITE_NOISE = "white_noise",
  SOFT_MUSIC = "soft_music"
}
```

#### AI Personality Selection
| Personality | Description | Best For |
|-------------|-------------|----------|
| `empathic_friend` | Warm, supportive, conversational | Building trust, casual support |
| `professional_therapist` | Clinical, structured, evidence-based | Serious work, trauma processing |
| `wise_mentor` | Insightful, philosophical, guiding | Self-discovery, life transitions |
| `cheerful_coach` | Energetic, motivational, action-oriented | Goal achievement, motivation |
| `gentle_guide` | Soft, patient, non-directive | Anxiety, sensitivity, first-time users |
| `direct_challenger` | Honest, straightforward, pushes growth | Users who want direct feedback |

#### Content Preferences
```typescript
interface ContentPreferences {
  preferred_techniques: TherapyTechnique[];
  avoided_topics: string[]; // User-specified sensitive topics
  content_warnings_enabled: boolean;
  preferred_learning_style: LearningStyle;
  exercise_difficulty: DifficultyLevel;
  include_research_citations: boolean;
}

enum TherapyTechnique {
  CBT = "cognitive_behavioral_therapy",
  DBT = "dialectical_behavior_therapy",
  ACT = "acceptance_commitment_therapy",
  MINDFULNESS = "mindfulness",
  POSITIVE_PSYCHOLOGY = "positive_psychology",
  SOLUTION_FOCUSED = "solution_focused",
  NARRATIVE_THERAPY = "narrative_therapy",
  SOMATIC = "somatic_techniques",
  JOURNALING = "journaling_prompts",
  BREATHING = "breathing_exercises",
  GROUNDING = "grounding_techniques",
  EXPOSURE = "exposure_techniques"
}

enum LearningStyle {
  READING = "reading",
  LISTENING = "listening",
  DOING = "doing",
  WATCHING = "watching"
}

enum DifficultyLevel {
  BEGINNER = "beginner",
  INTERMEDIATE = "intermediate",
  ADVANCED = "advanced"
}
```

#### Crisis Preferences
```typescript
interface CrisisPreferences {
  auto_detect_crisis: boolean;
  crisis_response_style: CrisisResponseStyle;
  emergency_contact_notify: boolean;
  preferred_crisis_resources: CrisisResource[];
  safety_plan_acknowledged: boolean;
  safety_plan_last_reviewed: Date;
}

enum CrisisResponseStyle {
  IMMEDIATE_RESOURCES = "immediate_resources",
  ASSESS_FIRST = "assess_first",
  STAY_WITH_ME = "stay_with_me"
}
```

---

### 1.4 Trigger List

#### Trigger Management System

```typescript
interface TriggerList {
  triggers: Trigger[];
  trigger_history: TriggerEvent[];
  coping_strategies: CopingStrategy[];
  trigger_insights: TriggerInsights;
}

interface Trigger {
  id: string;
  name: string;
  category: TriggerCategory;
  severity: SeverityLevel;
  description: string;
  physical_symptoms: string[];
  emotional_response: string[];
  coping_strategies: string[]; // IDs of coping strategies
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}
```

#### Trigger Categories
| Category | Examples |
|----------|----------|
| `social` | Crowds, conflict, rejection, social events |
| `environmental` | Loud noises, bright lights, certain places |
| `situational` | Deadlines, public speaking, travel |
| `interpersonal` | Arguments, criticism, abandonment |
| `physical` | Fatigue, hunger, pain, illness |
| `emotional` | Shame, guilt, anger, loneliness |
| `anniversary` | Dates, holidays, memories |
| `media` | News, violent content, specific topics |
| `substance_related` | Alcohol presence, drug-related cues |
| `work_school` | Performance reviews, exams, meetings |

#### Severity Levels
| Level | Description | Response Priority |
|-------|-------------|-------------------|
| `low` | Mildly uncomfortable | General coping tools |
| `moderate` | Noticeable distress | Targeted interventions |
| `high` | Significant distress | Immediate support offered |
| `severe` | Crisis potential | Crisis protocols activated |

#### Predefined Common Triggers (User can select)
```typescript
const COMMON_TRIGGERS = [
  { id: "social_gatherings", name: "Social Gatherings", category: "social" },
  { id: "public_speaking", name: "Public Speaking", category: "situational" },
  { id: "conflict", name: "Arguments/Conflict", category: "interpersonal" },
  { id: "criticism", name: "Receiving Criticism", category: "interpersonal" },
  { id: "loud_noises", name: "Loud Noises", category: "environmental" },
  { id: "crowds", name: "Being in Crowds", category: "environmental" },
  { id: "deadlines", name: "Deadlines/Time Pressure", category: "situational" },
  { id: "financial_stress", name: "Financial Concerns", category: "situational" },
  { id: "health_anxiety", name: "Health Worries", category: "emotional" },
  { id: "sleep_disruption", name: "Poor Sleep", category: "physical" },
  { id: "substance_exposure", name: "Exposure to Substances", category: "substance_related" },
  { id: "anniversary_dates", name: "Difficult Anniversary Dates", category: "anniversary" },
  { id: "news_media", name: "Distressing News", category: "media" },
  { id: "rejection", name: "Fear of Rejection", category: "social" },
  { id: "abandonment", name: "Fear of Abandonment", category: "interpersonal" }
];
```

#### Coping Strategies Linked to Triggers
| Strategy ID | Name | Technique Type |
|-------------|------|----------------|
| `box_breathing` | Box Breathing | Breathing |
| `5_4_3_2_1` | 5-4-3-2-1 Grounding | Grounding |
| `cold_water` | Cold Water on Wrists | Somatic |
| `progressive_muscle` | Progressive Muscle Relaxation | Somatic |
| `positive_self_talk` | Positive Self-Talk | CBT |
| `thought_record` | Quick Thought Record | CBT |
| `self_compassion` | Self-Compassion Break | Mindfulness |
| `distraction_list` | Healthy Distraction List | DBT |
| `tipp` | TIPP Skills | DBT |
| `call_support` | Call Support Person | Social |
| `safe_space_visualization` | Safe Space Visualization | Mindfulness |
| `movement_break` | Movement Break | Somatic |

---

### 1.5 Support Network Contacts

#### Support Network Structure

```typescript
interface SupportNetwork {
  contacts: SupportContact[];
  network_health_score: number; // 0-100
  last_updated: Date;
  sharing_preferences: SharingPreferences;
}

interface SupportContact {
  id: string;
  name: string;
  relationship: RelationshipType;
  phone_number: string;
  email: string;
  is_emergency_contact: boolean;
  notification_preferences: ContactNotificationPrefs;
  share_level: ShareLevel;
  notes: string;
  avatar_color: string;
  is_active: boolean;
  created_at: Date;
}
```

#### Relationship Types
| Type | Description |
|------|-------------|
| `partner_spouse` | Partner or Spouse |
| `parent` | Parent |
| `child` | Child |
| `sibling` | Sibling |
| `family_member` | Other Family Member |
| `close_friend` | Close Friend |
| `friend` | Friend |
| `therapist` | Therapist/Counselor |
| `psychiatrist` | Psychiatrist |
| `support_group_member` | Support Group Member |
| `sponsor` | Sponsor (Recovery) |
| `mentor` | Mentor |
| `colleague` | Colleague |
| `neighbor` | Neighbor |
| `religious_leader` | Religious/Spiritual Leader |
| `other` | Other |

#### Share Levels
| Level | What is Shared |
|-------|----------------|
| `none` | No information shared |
| `crisis_only` | Only notified in crisis situations |
| `checkin_reminder` | Weekly check-in reminders |
| `mood_summary` | Weekly mood summary |
| `progress_updates` | Goal progress updates |
| `session_insights` | Session insights (user-approved) |

#### Sharing Preferences
```typescript
interface SharingPreferences {
  auto_share_crisis: boolean;
  weekly_summary_recipients: string[]; // Contact IDs
  milestone_sharing: boolean;
  allow_contact_initiated_checkin: boolean;
  data_retention_days: number;
}
```

---

### 1.6 Emergency Contact

#### Emergency Contact Structure

```typescript
interface EmergencyContact {
  id: string;
  contact: SupportContact;
  priority: number; // 1 = primary, 2 = secondary, etc.
  is_professional: boolean;
  professional_type: ProfessionalType | null;
  availability_hours: AvailabilityHours;
  crisis_escalation: boolean;
  last_verified: Date;
}

enum ProfessionalType {
  THERAPIST = "therapist",
  PSYCHIATRIST = "psychiatrist",
  DOCTOR = "doctor",
  CRISIS_COUNSELOR = "crisis_counselor",
  CASE_MANAGER = "case_manager"
}

interface AvailabilityHours {
  monday: TimeRange[];
  tuesday: TimeRange[];
  wednesday: TimeRange[];
  thursday: TimeRange[];
  friday: TimeRange[];
  saturday: TimeRange[];
  sunday: TimeRange[];
  always_available: boolean;
}

interface TimeRange {
  start: string; // HH:MM format
  end: string; // HH:MM format
}
```

#### Crisis Contact Priority System
| Priority | Contact Type | When Contacted |
|----------|--------------|----------------|
| 1 | Primary Emergency Contact | First in crisis |
| 2 | Secondary Emergency Contact | If primary unavailable |
| 3 | Mental Health Professional | For clinical concerns |
| 4 | Crisis Hotline | If all contacts unavailable |

#### Crisis Hotline Integration (By Region)
| Country | Service | Number |
|---------|---------|--------|
| USA | 988 Suicide & Crisis Lifeline | 988 |
| USA | Crisis Text Line | Text HOME to 741741 |
| UK | Samaritans | 116 123 |
| Canada | Talk Suicide Canada | 1-833-456-4566 |
| Australia | Lifeline | 13 11 14 |
| International | Befrienders Worldwide | befrienders.org |

---

### 1.7 Avatar Preference

#### Avatar System

```typescript
interface AvatarPreference {
  current_avatar: Avatar;
  unlocked_avatars: Avatar[];
  customization: AvatarCustomization;
  animation_enabled: boolean;
  avatar_mood: AvatarMood;
}

interface Avatar {
  id: string;
  name: string;
  type: AvatarType;
  style: AvatarStyle;
  unlock_requirement: UnlockRequirement;
  asset_url: string;
  preview_url: string;
}
```

#### Avatar Types
| Type | Description | Examples |
|------|-------------|----------|
| `character` | Illustrated characters | Animals, fantasy creatures |
| `abstract` | Abstract shapes/colors | Geometric, aurora, orbs |
| `minimalist` | Simple line art | Stick figures, line drawings |
| `nature` | Nature-inspired | Plants, elements, landscapes |
| `celestial` | Space-themed | Stars, moons, galaxies |
| `custom_upload` | User-uploaded image | Personal photo, artwork |

#### Avatar Styles (Character Type)
| Style ID | Name | Description |
|----------|------|-------------|
| `calm_bear` | Calm Bear | Gentle, supportive bear character |
| `wise_owl` | Wise Owl | Thoughtful, knowledgeable owl |
| `gentle_deer` | Gentle Deer | Soft, empathetic deer |
| `brave_lion` | Brave Lion | Strong, courageous lion |
| `playful_dolphin` | Playful Dolphin | Joyful, friendly dolphin |
| `curious_cat` | Curious Cat | Inquisitive, comforting cat |
| `loyal_dog` | Loyal Dog | Faithful, supportive dog |
| `peaceful_elephant` | Peaceful Elephant | Wise, grounding elephant |
| `free_butterfly` | Free Butterfly | Transformative, light butterfly |
| `strong_tree` | Strong Tree | Grounded, growing tree spirit |

#### Avatar Customization
```typescript
interface AvatarCustomization {
  primary_color: string; // Hex color
  secondary_color: string; // Hex color
  accent_color: string; // Hex color
  size: AvatarSize;
  background_style: BackgroundStyle;
  accessories: Accessory[];
}

enum AvatarSize {
  SMALL = "small",
  MEDIUM = "medium",
  LARGE = "large"
}

enum AvatarMood {
  NEUTRAL = "neutral",
  HAPPY = "happy",
  CALM = "calm",
  SUPPORTIVE = "supportive",
  THOUGHTFUL = "thoughtful",
  ENCOURAGING = "encouraging"
}
```

#### Unlock Requirements
| Avatar | Requirement |
|--------|-------------|
| Default set | Available at signup |
| Streak avatars | 7, 30, 90, 365 day streaks |
| Session avatars | 10, 50, 100, 500 sessions |
| Goal avatars | Complete first goal, all primary goals |
| Special event | Holiday, awareness month events |
| Premium | Subscription upgrade |
| Referral | Invite 3 friends |

---

### 1.8 Voice Preference

#### Voice System

```typescript
interface VoicePreference {
  preferred_voice: Voice;
  available_voices: Voice[];
  voice_settings: VoiceSettings;
  use_voice_for: VoiceUseCase[];
}

interface Voice {
  id: string;
  name: string;
  gender: VoiceGender;
  age_range: VoiceAgeRange;
  accent: VoiceAccent;
  personality: VoicePersonality;
  preview_url: string;
  sample_text: string;
  quality_rating: number; // 1-5
}
```

#### Voice Gender Options
| Option | Description |
|--------|-------------|
| `female` | Female-presenting voice |
| `male` | Male-presenting voice |
| `non_binary` | Gender-neutral voice |
| `no_preference` | No preference |

#### Voice Age Ranges
| Range | Description |
|-------|-------------|
| `young` | Young adult (20s-30s) |
| `middle` | Middle-aged (40s-50s) |
| `mature` | Mature (60s+) |
| `no_preference` | No preference |

#### Voice Accents
| Accent | Region |
|--------|--------|
| `american` | American English |
| `british` | British English |
| `australian` | Australian English |
| `canadian` | Canadian English |
| `neutral` | Accent-neutral |
| `user_region` | Match user's region |

#### Voice Personalities
| Personality | Characteristics |
|-------------|-----------------|
| `warm` | Soft, nurturing, gentle |
| `professional` | Clear, measured, authoritative |
| `friendly` | Approachable, casual, upbeat |
| `calm` | Slow-paced, soothing, peaceful |
| `energetic` | Dynamic, motivating, lively |
| `wise` | Thoughtful, contemplative, deep |

#### Voice Settings
```typescript
interface VoiceSettings {
  speed: number; // 0.5 - 2.0 (default: 1.0)
  pitch: number; // -10 to +10 (default: 0)
  volume: number; // 0 - 100 (default: 80)
  pause_between_sentences: number; // milliseconds
  emphasis_level: EmphasisLevel;
}

enum EmphasisLevel {
  MINIMAL = "minimal",
  MODERATE = "moderate",
  HIGH = "high"
}
```

#### Voice Use Cases
| Use Case | Description | Default |
|----------|-------------|---------|
| `guided_exercises` | Meditation, breathing exercises | Enabled |
| `session_reading` | Reading AI responses aloud | Disabled |
| `notifications` | Notification announcements | Disabled |
| `journal_prompts` | Reading journal prompts | Enabled |
| `crisis_support` | Crisis intervention messages | Enabled |
| `progress_updates` | Reading progress summaries | Disabled |

---

## 2. Settings Screens

### 2.1 Notification Preferences

#### Notification Categories

```typescript
interface NotificationPreferences {
  master_switch: boolean;
  categories: NotificationCategory[];
  quiet_hours: QuietHours;
  channels: NotificationChannels;
  custom_schedule: CustomSchedule;
}
```

#### Notification Types

| Category | Type | Default | Description |
|----------|------|---------|-------------|
| **Session Reminders** | | | |
| | `daily_reminder` | On | Daily session reminder |
| | `streak_reminder` | On | Streak maintenance reminder |
| | `goal_checkin` | On | Weekly goal check-in |
| **Mental Health** | | | |
| | `mood_checkin` | On | Daily mood tracking prompt |
| | `trigger_alert` | On | Warning about known triggers |
| | `crisis_followup` | On | Post-crisis check-in |
| **Progress & Achievements** | | | |
| | `milestone_reached` | On | Goal/achievement unlocked |
| | `progress_summary` | Weekly | Weekly progress report |
| | `streak_milestone` | On | Streak achievement |
| **Social & Support** | | | |
| | `support_network_activity` | Off | Support network updates |
| | `message_from_contact` | On | Direct message notification |
| **App Updates** | | | |
| | `new_features` | On | New feature announcements |
| | `tips_suggestions` | On | Personalized tips |
| | `content_recommendations` | On | Recommended exercises |
| **Account** | | | |
| | `security_alerts` | On | Security-related notifications |
| | `subscription_updates` | On | Billing/subscription changes |

#### Quiet Hours
```typescript
interface QuietHours {
  enabled: boolean;
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  timezone: string;
  allow_emergency_override: boolean;
  days_active: DayOfWeek[];
}

enum DayOfWeek {
  MONDAY = "monday",
  TUESDAY = "tuesday",
  WEDNESDAY = "wednesday",
  THURSDAY = "thursday",
  FRIDAY = "friday",
  SATURDAY = "saturday",
  SUNDAY = "sunday"
}
```

#### Notification Channels
```typescript
interface NotificationChannels {
  push: boolean;
  email: boolean;
  sms: boolean;
  in_app: boolean;
  priority_order: ChannelType[];
}

enum ChannelType {
  PUSH = "push",
  EMAIL = "email",
  SMS = "sms",
  IN_APP = "in_app"
}
```

#### Custom Schedule Example
```typescript
interface CustomSchedule {
  daily_reminder: {
    enabled: true,
    time: "09:00",
    days: ["monday", "tuesday", "wednesday", "thursday", "friday"]
  };
  mood_checkin: {
    enabled: true,
    time: "20:00",
    days: ["monday", "wednesday", "friday", "sunday"]
  };
  weekly_summary: {
    enabled: true,
    day: "sunday",
    time: "10:00"
  };
}
```

---

### 2.2 Privacy Settings

#### Privacy Control Center

```typescript
interface PrivacySettings {
  data_collection: DataCollectionSettings;
  data_sharing: DataSharingSettings;
  visibility: VisibilitySettings;
  security: SecuritySettings;
  data_retention: DataRetentionSettings;
  legal: LegalSettings;
}
```

#### Data Collection Settings
| Setting | Options | Default | Description |
|---------|---------|---------|-------------|
| `analytics_enabled` | On/Off | On | Anonymous usage analytics |
| `crash_reporting` | On/Off | On | Automatic crash reports |
| `personalization_data` | On/Off | On | Data for personalization |
| `location_data` | On/Off/Approximate | Approximate | Location for resources |
| `usage_patterns` | On/Off | On | Session timing patterns |
| `device_info` | On/Off | On | Device type, OS version |

#### Data Sharing Settings
```typescript
interface DataSharingSettings {
  share_with_support_network: {
    enabled: boolean;
    share_level: ShareLevel;
    specific_contacts: string[];
  };
  share_with_professionals: {
    enabled: boolean;
    approved_professionals: string[];
    data_types: ProfessionalDataType[];
  };
  share_for_research: {
    enabled: boolean;
    anonymized_only: boolean;
    research_areas: string[];
  };
  third_party_integrations: ThirdPartyIntegration[];
}

enum ProfessionalDataType {
  MOOD_LOGS = "mood_logs",
  SESSION_SUMMARIES = "session_summaries",
  GOAL_PROGRESS = "goal_progress",
  TRIGGER_PATTERNS = "trigger_patterns",
  JOURNAL_ENTRIES = "journal_entries",
  CRISIS_HISTORY = "crisis_history"
}
```

#### Visibility Settings
| Setting | Options | Default |
|---------|---------|---------|
| `profile_visible_to` | public/friends_only/private | private |
| `show_online_status` | On/Off | Off |
| `show_last_active` | On/Off | Off |
| `allow_discoverability` | On/Off | Off |
| `show_achievements_publicly` | On/Off | Off |

#### Security Settings
```typescript
interface SecuritySettings {
  two_factor_auth: {
    enabled: boolean;
    method: TwoFAMethod;
    backup_codes: string[];
  };
  biometric_login: {
    enabled: boolean;
    methods: BiometricMethod[];
  };
  session_timeout: number; // minutes
  require_password_for: PasswordRequirement[];
  login_history: LoginRecord[];
  active_sessions: ActiveSession[];
}

enum TwoFAMethod {
  SMS = "sms",
  EMAIL = "email",
  AUTHENTICATOR = "authenticator_app"
}

enum BiometricMethod {
  FACE = "face_recognition",
  FINGERPRINT = "fingerprint",
  IRIS = "iris_scan"
}

enum PasswordRequirement {
  EXPORT_DATA = "export_data",
  DELETE_ACCOUNT = "delete_account",
  CHANGE_EMAIL = "change_email",
  VIEW_SENSITIVE = "view_sensitive_data",
  MODIFY_EMERGENCY = "modify_emergency_contact"
}
```

#### Data Retention Settings
```typescript
interface DataRetentionSettings {
  chat_history_retention: RetentionPeriod;
  journal_retention: RetentionPeriod;
  mood_log_retention: RetentionPeriod;
  session_recording_retention: RetentionPeriod;
  auto_delete_enabled: boolean;
  auto_delete_after: number; // days
}

enum RetentionPeriod {
  THIRTY_DAYS = 30,
  NINETY_DAYS = 90,
  ONE_YEAR = 365,
  TWO_YEARS = 730,
  INDEFINITE = -1
}
```

#### Legal Settings
```typescript
interface LegalSettings {
  terms_accepted: boolean;
  terms_accepted_date: Date;
  terms_version: string;
  privacy_policy_accepted: boolean;
  privacy_policy_date: Date;
  privacy_policy_version: string;
  hipaa_notice_acknowledged: boolean;
  data_processing_consent: boolean;
  marketing_consent: boolean;
  cookie_preferences: CookiePreferences;
}

interface CookiePreferences {
  essential: boolean; // Always true
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}
```

---

### 2.3 Data Export

#### Export System

```typescript
interface DataExport {
  export_requests: ExportRequest[];
  export_formats: ExportFormat[];
  scheduled_exports: ScheduledExport[];
  export_history: ExportRecord[];
}

interface ExportRequest {
  id: string;
  requested_at: Date;
  data_types: ExportDataType[];
  format: ExportFormat;
  date_range: DateRange;
  status: ExportStatus;
  download_url: string | null;
  expires_at: Date | null;
  file_size: number | null;
}
```

#### Export Data Types
| Data Type | Description | Format |
|-----------|-------------|--------|
| `profile_data` | Personal information, preferences | JSON/CSV |
| `chat_history` | All conversation history | JSON/PDF/HTML |
| `journal_entries` | Journal entries with metadata | JSON/PDF |
| `mood_logs` | Mood tracking data | JSON/CSV |
| `goals_progress` | Goals and progress history | JSON/CSV |
| `session_summaries` | Session summaries and insights | PDF/HTML |
| `trigger_data` | Triggers and coping strategies | JSON |
| `support_network` | Contact information | JSON/CSV |
| `exercise_history` | Completed exercises | JSON/CSV |
| `achievement_data` | Badges and milestones | JSON |
| `notification_history` | Notification log | JSON/CSV |
| `full_export` | All data combined | ZIP |

#### Export Formats
| Format | Extension | Best For |
|--------|-----------|----------|
| `json` | .json | Technical use, data portability |
| `csv` | .csv | Spreadsheet analysis |
| `pdf` | .pdf | Human-readable reports |
| `html` | .html | Interactive viewing |
| `xml` | .xml | Healthcare systems |
| `zip` | .zip | Complete data package |

#### Export Status Flow
```
REQUESTED → PROCESSING → READY → DOWNLOADED → COMPLETED
                    ↓
                FAILED (can retry)
```

#### Scheduled Exports
```typescript
interface ScheduledExport {
  id: string;
  name: string;
  frequency: ExportFrequency;
  data_types: ExportDataType[];
  format: ExportFormat;
  delivery_method: DeliveryMethod;
  last_run: Date;
  next_run: Date;
  is_active: boolean;
}

enum ExportFrequency {
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  QUARTERLY = "quarterly",
  YEARLY = "yearly"
}

enum DeliveryMethod {
  EMAIL = "email",
  CLOUD_STORAGE = "cloud_storage",
  DOWNLOAD_LINK = "download_link"
}
```

---

### 2.4 Session History

#### Session History System

```typescript
interface SessionHistory {
  sessions: SessionRecord[];
  filters: SessionFilters;
  insights: SessionInsights;
  favorites: string[]; // Session IDs
  tags: SessionTag[];
}

interface SessionRecord {
  id: string;
  started_at: Date;
  ended_at: Date;
  duration_minutes: number;
  type: SessionType;
  topic: string;
  summary: string;
  mood_before: MoodRating;
  mood_after: MoodRating;
  key_insights: string[];
  exercises_completed: Exercise[];
  journal_entry_id: string | null;
  is_favorite: boolean;
  tags: string[];
  ai_personality_used: AIPersonality;
  crisis_flag: boolean;
}
```

#### Session Types
| Type | Description |
|------|-------------|
| `free_chat` | Open conversation |
| `guided_session` | Structured therapy session |
| `crisis_support` | Crisis intervention session |
| `exercise_session` | Specific exercise/technique |
| `journal_session` | Journal-focused session |
| `checkin_session` | Brief mood/progress check-in |
| `goal_review` | Goal progress review |

#### Mood Rating Scale
| Rating | Label | Description |
|--------|-------|-------------|
| 1 | Very Low | Extremely difficult |
| 2 | Low | Struggling |
| 3 | Below Average | Not great |
| 4 | Average | Okay |
| 5 | Above Average | Pretty good |
| 6 | Good | Doing well |
| 7 | Very Good | Excellent |

#### Session Filters
```typescript
interface SessionFilters {
  date_range: DateRange;
  session_types: SessionType[];
  topics: string[];
  mood_range: { min: number; max: number };
  duration_range: { min: number; max: number };
  has_journal_entry: boolean | null;
  is_favorite: boolean | null;
  tags: string[];
  search_query: string;
}
```

#### Session Insights
```typescript
interface SessionInsights {
  total_sessions: number;
  total_duration_hours: number;
  average_session_length: number;
  favorite_topics: TopicFrequency[];
  mood_trend: MoodTrend;
  most_effective_exercises: ExerciseEffectiveness[];
  session_frequency_heatmap: DayHourMatrix;
  streaks: StreakRecord[];
}

interface MoodTrend {
  direction: "improving" | "stable" | "declining" | "fluctuating";
  change_percentage: number;
  confidence: number;
}
```

#### Session Actions
| Action | Description |
|--------|-------------|
| `view_details` | View full session details |
| `export_session` | Export single session |
| `add_to_journal` | Convert to journal entry |
| `share_with_therapist` | Share with professional |
| `mark_favorite` | Add to favorites |
| `add_tags` | Add custom tags |
| `delete_session` | Permanently delete |
| `compare_sessions` | Compare multiple sessions |

---

### 2.5 Subscription Management

#### Subscription System

```typescript
interface SubscriptionManagement {
  current_plan: SubscriptionPlan;
  billing_info: BillingInfo;
  payment_methods: PaymentMethod[];
  invoices: Invoice[];
  usage: UsageStats;
  available_plans: SubscriptionPlan[];
  promotions: Promotion[];
  referral_program: ReferralProgram;
}
```

#### Subscription Plans

| Plan | Price (Monthly) | Price (Annual) | Features |
|------|-----------------|----------------|----------|
| **Free** | $0 | $0 | Basic chat (10 msgs/day), 3 exercises, Basic mood tracking, Community support |
| **Basic** | $9.99 | $79.99/yr | Unlimited chat, All exercises, Full mood tracking, Journal, Email support |
| **Premium** | $19.99 | $159.99/yr | Everything in Basic + Voice sessions, Advanced analytics, Priority support, Custom avatars, Family sharing (2) |
| **Pro** | $39.99 | $319.99/yr | Everything in Premium + Therapist integration, Crisis escalation, Unlimited family sharing, API access |

#### Feature Comparison Matrix

| Feature | Free | Basic | Premium | Pro |
|---------|------|-------|---------|-----|
| Daily Messages | 10 | Unlimited | Unlimited | Unlimited |
| AI Sessions | 1/day | Unlimited | Unlimited | Unlimited |
| Voice Support | No | No | Yes | Yes |
| Exercise Library | 3 | All | All | All |
| Mood Tracking | Basic | Full | Full + Insights | Full + Insights |
| Journal | No | Yes | Yes + Templates | Yes + Templates |
| Session History | 7 days | 90 days | Unlimited | Unlimited |
| Custom Avatars | No | No | Yes | Yes |
| Voice Options | 1 | 3 | All | All |
| Export Data | No | Basic | Full | Full + API |
| Support | Community | Email | Priority | Dedicated |
| Crisis Features | Basic | Standard | Advanced | Full |
| Family Sharing | No | No | 2 members | Unlimited |
| Therapist Portal | No | No | No | Yes |

#### Billing Information
```typescript
interface BillingInfo {
  subscription_status: SubscriptionStatus;
  current_period_start: Date;
  current_period_end: Date;
  next_billing_date: Date;
  amount_due: number;
  currency: string;
  billing_cycle: BillingCycle;
  auto_renew: boolean;
  cancellation_date: Date | null;
  cancellation_reason: string | null;
}

enum SubscriptionStatus {
  ACTIVE = "active",
  TRIAL = "trial",
  PAST_DUE = "past_due",
  CANCELED = "canceled",
  EXPIRED = "expired",
  PAUSED = "paused"
}

enum BillingCycle {
  MONTHLY = "monthly",
  ANNUAL = "annual"
}
```

#### Payment Methods
```typescript
interface PaymentMethod {
  id: string;
  type: PaymentType;
  last_four: string;
  expiry_month: number;
  expiry_year: number;
  is_default: boolean;
  billing_address: Address;
  brand: CardBrand;
}

enum PaymentType {
  CREDIT_CARD = "credit_card",
  DEBIT_CARD = "debit_card",
  PAYPAL = "paypal",
  APPLE_PAY = "apple_pay",
  GOOGLE_PAY = "google_pay",
  BANK_TRANSFER = "bank_transfer"
}
```

#### Invoice Structure
```typescript
interface Invoice {
  id: string;
  invoice_number: string;
  date: Date;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  description: string;
  period_start: Date;
  period_end: Date;
  pdf_url: string;
  line_items: LineItem[];
}

interface LineItem {
  description: string;
  amount: number;
  quantity: number;
}
```

#### Usage Statistics
```typescript
interface UsageStats {
  current_cycle_start: Date;
  messages_used: number;
  messages_limit: number;
  sessions_completed: number;
  exercises_completed: number;
  storage_used_mb: number;
  storage_limit_mb: number;
  ai_voice_minutes_used: number;
  ai_voice_minutes_limit: number;
}
```

#### Referral Program
```typescript
interface ReferralProgram {
  referral_code: string;
  referral_link: string;
  total_referrals: number;
  successful_referrals: number;
  rewards_earned: Reward[];
  pending_rewards: Reward[];
  share_options: ShareOption[];
}

interface Reward {
  type: RewardType;
  value: number;
  description: string;
  earned_date: Date;
  expires_date: Date | null;
  redeemed: boolean;
}

enum RewardType {
  FREE_MONTH = "free_month",
  ACCOUNT_CREDIT = "account_credit",
  PREMIUM_FEATURE = "premium_feature",
  EXTENDED_TRIAL = "extended_trial"
}
```

---

## 3. Data Models

### 3.1 Complete User Profile Model

```typescript
interface CompleteUserProfile {
  // Core Identity
  id: string;
  email: string;
  display_name: string;
  
  // Personal Info (Section 1.1)
  personal_info: PersonalInfo;
  
  // Mental Health Goals (Section 1.2)
  mental_health_goals: MentalHealthGoals;
  
  // Therapy Preferences (Section 1.3)
  therapy_preferences: TherapyPreferences;
  
  // Trigger List (Section 1.4)
  trigger_list: TriggerList;
  
  // Support Network (Section 1.5)
  support_network: SupportNetwork;
  
  // Emergency Contact (Section 1.6)
  emergency_contact: EmergencyContact;
  
  // Avatar Preference (Section 1.7)
  avatar_preference: AvatarPreference;
  
  // Voice Preference (Section 1.8)
  voice_preference: VoicePreference;
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
  last_login: Date;
}
```

### 3.2 Complete Settings Model

```typescript
interface CompleteSettings {
  // Notification Preferences (Section 2.1)
  notifications: NotificationPreferences;
  
  // Privacy Settings (Section 2.2)
  privacy: PrivacySettings;
  
  // Data Export (Section 2.3)
  data_export: DataExport;
  
  // Session History (Section 2.4)
  session_history: SessionHistory;
  
  // Subscription Management (Section 2.5)
  subscription: SubscriptionManagement;
  
  // App Preferences
  app_preferences: {
    theme: "light" | "dark" | "system";
    font_size: "small" | "medium" | "large";
    reduce_motion: boolean;
    high_contrast: boolean;
    language: string;
    timezone: string;
  };
  
  // Timestamps
  last_updated: Date;
}
```

---

## 4. UI/UX Specifications

### 4.1 Profile Screen Layout

```
┌─────────────────────────────────────────┐
│  ← Profile                    Edit      │
├─────────────────────────────────────────┤
│  ┌─────────┐                            │
│  │  Avatar │  Display Name              │
│  │  Photo  │  @username                 │
│  │  [Edit] │  Member since Jan 2024     │
│  └─────────┘                            │
├─────────────────────────────────────────┤
│  📊 Progress Overview                   │
│  ┌────────┬────────┬────────┐          │
│  │Streak  │Sessions│Goals   │          │
│  │  12 🔥 │   45   │  3/5   │          │
│  └────────┴────────┴────────┘          │
├─────────────────────────────────────────┤
│  🎯 Mental Health Goals        >        │
│  🎭 Therapy Preferences        >        │
│  ⚠️  Trigger Management         >        │
│  👥 Support Network            >        │
│  🚨 Emergency Contact          >        │
├─────────────────────────────────────────┤
│  🎨 Avatar & Voice             >        │
│  ⚙️  Settings                   >        │
├─────────────────────────────────────────┤
│  📤 Export Data                >        │
│  ❓ Help & Support             >        │
│  🚪 Log Out                    >        │
└─────────────────────────────────────────┘
```

### 4.2 Settings Screen Layout

```
┌─────────────────────────────────────────┐
│  ← Settings                             │
├─────────────────────────────────────────┤
│  ACCOUNT                                │
│  ├─ Personal Information       >        │
│  ├─ Security                   >        │
│  ├─ Subscription               >        │
│  └─ Payment Methods            >        │
├─────────────────────────────────────────┤
│  PREFERENCES                            │
│  ├─ Notifications              >        │
│  ├─ Privacy                    >        │
│  ├─ Therapy Preferences        >        │
│  └─ App Appearance             >        │
├─────────────────────────────────────────┤
│  DATA & PRIVACY                         │
│  ├─ Session History            >        │
│  ├─ Export Data                >        │
│  ├─ Data Retention             >        │
│  └─ Delete Account             >        │
├─────────────────────────────────────────┤
│  SUPPORT                                │
│  ├─ Help Center                >        │
│  ├─ Contact Support            >        │
│  ├─ Report a Problem           >        │
│  └─ Terms & Privacy            >        │
├─────────────────────────────────────────┤
│  Version 1.0.0                          │
└─────────────────────────────────────────┘
```

### 4.3 Navigation Flow

```
Home/Chat
    │
    ├── Profile Tab
    │       ├── Personal Info
    │       ├── Mental Health Goals
    │       ├── Therapy Preferences
    │       ├── Trigger Management
    │       ├── Support Network
    │       ├── Emergency Contact
    │       └── Avatar & Voice
    │
    └── Settings Tab
            ├── Notifications
            ├── Privacy Settings
            ├── Data Export
            ├── Session History
            └── Subscription
```

---

## 5. Security & Privacy

### 5.1 Data Classification

| Classification | Data Types | Protection Level |
|----------------|------------|------------------|
| **Critical** | Crisis history, Emergency contacts, Trigger details | Encryption at rest + in transit, Access logging |
| **Sensitive** | Chat history, Journal entries, Mood logs, Goals | Encryption at rest + in transit |
| **Personal** | Name, Email, Phone, DOB, Location | Encryption at rest |
| **Internal** | Usage analytics, Device info | Anonymized where possible |

### 5.2 Access Controls

| Action | Authentication Required | Additional Verification |
|--------|------------------------|------------------------|
| View profile | Session token | None |
| Edit sensitive data | Session token | Password re-entry |
| Export data | Session token + 2FA | Email confirmation |
| Delete account | Session token + 2FA | Password + email confirmation |
| Modify emergency contact | Session token | Password re-entry |
| Change subscription | Session token | Payment verification |

### 5.3 Compliance Requirements

| Regulation | Requirements |
|------------|--------------|
| **GDPR** | Right to access, Right to erasure, Data portability, Consent management |
| **CCPA** | Disclosure of data collection, Right to deletion, Opt-out of sale |
| **HIPAA** | Business Associate Agreement, Encryption, Audit logs, Access controls |
| **COPPA** | Age verification, Parental consent for under 13 |

---

## 6. API Endpoints

### 6.1 Profile Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/profile` | GET | Get complete profile |
| `/api/v1/profile` | PATCH | Update profile |
| `/api/v1/profile/personal-info` | GET/PUT | Personal information |
| `/api/v1/profile/goals` | GET/POST/PUT/DELETE | Mental health goals |
| `/api/v1/profile/preferences` | GET/PUT | Therapy preferences |
| `/api/v1/profile/triggers` | GET/POST/PUT/DELETE | Trigger management |
| `/api/v1/profile/support-network` | GET/POST/PUT/DELETE | Support contacts |
| `/api/v1/profile/emergency-contact` | GET/PUT | Emergency contact |
| `/api/v1/profile/avatar` | GET/PUT | Avatar preferences |
| `/api/v1/profile/voice` | GET/PUT | Voice preferences |

### 6.2 Settings Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/settings/notifications` | GET/PUT | Notification preferences |
| `/api/v1/settings/privacy` | GET/PUT | Privacy settings |
| `/api/v1/settings/export` | POST | Request data export |
| `/api/v1/settings/export/:id` | GET | Download export |
| `/api/v1/settings/sessions` | GET | Session history |
| `/api/v1/settings/sessions/:id` | GET/DELETE | Session details |
| `/api/v1/settings/subscription` | GET | Subscription details |
| `/api/v1/settings/subscription/upgrade` | POST | Upgrade plan |
| `/api/v1/settings/subscription/cancel` | POST | Cancel subscription |

---

## 7. Implementation Checklist

### Phase 1: Core Profile
- [ ] Personal information form
- [ ] Profile photo upload
- [ ] Basic preferences
- [ ] Account security

### Phase 2: Mental Health Features
- [ ] Goals setup wizard
- [ ] Therapy preference selection
- [ ] Trigger management UI
- [ ] Support network contacts

### Phase 3: Personalization
- [ ] Avatar selection system
- [ ] Voice preference setup
- [ ] AI personality selection
- [ ] Customization options

### Phase 4: Settings
- [ ] Notification center
- [ ] Privacy controls
- [ ] Data export functionality
- [ ] Session history viewer

### Phase 5: Subscription
- [ ] Plan comparison page
- [ ] Payment integration
- [ ] Billing management
- [ ] Usage tracking

---

## Appendix A: Error Codes

| Code | Description | User Message |
|------|-------------|--------------|
| `PROFILE_001` | Profile not found | "Unable to load your profile" |
| `PROFILE_002` | Invalid data format | "Please check your information" |
| `SETTINGS_001` | Settings save failed | "Could not save settings" |
| `EXPORT_001` | Export generation failed | "Export request failed, please retry" |
| `SUB_001` | Payment failed | "Payment could not be processed" |
| `SUB_002` | Plan unavailable | "Selected plan is not available" |

---

## Appendix B: Localization Keys

```
profile.title
profile.edit_button
profile.personal_info
profile.mental_health_goals
profile.therapy_preferences
profile.trigger_management
profile.support_network
profile.emergency_contact
profile.avatar_voice
profile.progress_overview

settings.title
settings.notifications
settings.privacy
settings.data_export
settings.session_history
settings.subscription
settings.help_support
settings.logout

subscription.plans.free
subscription.plans.basic
subscription.plans.premium
subscription.plans.pro
subscription.upgrade
subscription.cancel
subscription.billing_history
```

---

*Document Version: 1.0.0*
*Last Updated: 2024*
*Status: Production Ready*
