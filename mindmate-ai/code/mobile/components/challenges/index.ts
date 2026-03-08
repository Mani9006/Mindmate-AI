/**
 * MindMate AI - Daily Challenges Components
 * 
 * Barrel export file for all challenge-related components
 */

// Challenge Card Component
export { 
  default as ChallengeCard,
  type Challenge,
  type ChallengeCategory,
  type ChallengeDifficulty,
} from './ChallengeCard';

// Breathing Exercise Component
export { 
  default as BreathingExercise,
  type BreathingPattern,
} from './BreathingExercise';

// Meditation Player Component
export { 
  default as MeditationPlayer,
  type MeditationSession,
  type MeditationType,
} from './MeditationPlayer';

// Journaling Prompt Component
export { 
  default as JournalingPrompt,
  type JournalPrompt,
  type JournalMood,
} from './JournalingPrompt';

// Gratitude Log Component
export { 
  default as GratitudeLog,
  type GratitudeItem,
} from './GratitudeLog';

// Challenge Completion Animation Component
export { 
  default as ChallengeCompletionAnimation,
  type CompletionData,
} from './ChallengeCompletionAnimation';

// Daily Streak Display Component
export { 
  default as DailyStreakDisplay,
  type DayData,
  type DayStatus,
  type StreakMilestone,
} from './DailyStreakDisplay';
