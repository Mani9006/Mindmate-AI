/**
 * MindMate AI Notification Service - Challenge Model
 */

import mongoose, { Schema, Document } from 'mongoose';
import {
  IChallenge,
  IChallengeTask,
  IChallengeReward,
  ChallengeCategory,
  ChallengeDifficulty,
} from '../types';

// ============================================
// Sub-schemas
// ============================================

const ChallengeTaskSchema = new Schema({
  id: { type: String, required: true },
  day: { type: Number, required: true, min: 1 },
  title: { type: String, required: true },
  description: { type: String, required: true },
  estimatedMinutes: { type: Number, required: true, min: 1 },
  type: {
    type: String,
    enum: ['reflection', 'activity', 'meditation', 'journal', 'quiz'],
    required: true,
  },
}, { _id: false });

const ChallengeRewardSchema = new Schema({
  type: { type: String, enum: ['badge', 'points', 'streak', 'unlock'], required: true },
  value: { type: Schema.Types.Mixed, required: true },
  description: { type: String, required: true },
}, { _id: false });

// ============================================
// Challenge Schema
// ============================================

export interface IChallengeDocument extends IChallenge, Document {}

const ChallengeSchema = new Schema<IChallengeDocument>({
  id: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: Object.values(ChallengeCategory),
    required: true,
    index: true,
  },
  difficulty: {
    type: String,
    enum: Object.values(ChallengeDifficulty),
    required: true,
    index: true,
  },
  duration: { type: Number, required: true, min: 1 },
  tasks: { type: [ChallengeTaskSchema], required: true },
  rewards: { type: [ChallengeRewardSchema], required: true },
  prerequisites: { type: [String], default: [] },
  tags: { type: [String], default: [] },
  isActive: { type: Boolean, default: true, index: true },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// ============================================
// Indexes
// ============================================

ChallengeSchema.index({ category: 1, difficulty: 1, isActive: 1 });
ChallengeSchema.index({ tags: 1 });
ChallengeSchema.index({ difficulty: 1 });

// ============================================
// Virtuals
// ============================================

ChallengeSchema.virtual('totalTasks').get(function() {
  return this.tasks.length;
});

ChallengeSchema.virtual('totalEstimatedMinutes').get(function() {
  return this.tasks.reduce((sum: number, task: IChallengeTask) => sum + task.estimatedMinutes, 0);
});

// ============================================
// Methods
// ============================================

ChallengeSchema.methods.getTaskForDay = function(day: number): IChallengeTask | undefined {
  return this.tasks.find((task: IChallengeTask) => task.day === day);
};

ChallengeSchema.methods.hasPrerequisites = function(completedChallenges: string[]): boolean {
  if (!this.prerequisites || this.prerequisites.length === 0) {
    return true;
  }
  return this.prerequisites.every((prereq: string) => completedChallenges.includes(prereq));
};

// ============================================
// Static Methods
// ============================================

ChallengeSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

ChallengeSchema.statics.findByCategory = function(category: ChallengeCategory) {
  return this.find({ category, isActive: true });
};

ChallengeSchema.statics.findByDifficulty = function(difficulty: ChallengeDifficulty) {
  return this.find({ difficulty, isActive: true });
};

ChallengeSchema.statics.findEligibleForUser = async function(
  completedChallenges: string[],
  preferredCategories?: ChallengeCategory[],
  difficulty?: ChallengeDifficulty
) {
  const query: any = { isActive: true };
  
  if (preferredCategories && preferredCategories.length > 0) {
    query.category = { $in: preferredCategories };
  }
  
  if (difficulty) {
    query.difficulty = difficulty;
  }
  
  // Exclude already completed challenges
  if (completedChallenges.length > 0) {
    query.id = { $nin: completedChallenges };
  }
  
  const challenges = await this.find(query);
  
  // Filter by prerequisites
  return challenges.filter((challenge: IChallengeDocument) =>
    challenge.hasPrerequisites(completedChallenges)
  );
};

ChallengeSchema.statics.getRandomChallenge = async function(
  completedChallenges: string[],
  preferredCategories?: ChallengeCategory[],
  difficulty?: ChallengeDifficulty
): Promise<IChallengeDocument | null> {
  const eligible = await this.findEligibleForUser(
    completedChallenges,
    preferredCategories,
    difficulty
  );
  
  if (eligible.length === 0) {
    return null;
  }
  
  // Weight by category preference
  const weighted = eligible.flatMap((challenge: IChallengeDocument) => {
    const weight = preferredCategories?.includes(challenge.category) ? 3 : 1;
    return Array(weight).fill(challenge);
  });
  
  const randomIndex = Math.floor(Math.random() * weighted.length);
  return weighted[randomIndex];
};

ChallengeSchema.statics.getRecommendedChallenge = async function(
  userState: {
    completedChallenges: string[];
    preferredCategories: ChallengeCategory[];
    difficulty: ChallengeDifficulty;
    challengeStreak: number;
  }
): Promise<IChallengeDocument | null> {
  const { completedChallenges, preferredCategories, difficulty, challengeStreak } = userState;
  
  // Adjust difficulty based on streak
  let adjustedDifficulty = difficulty;
  if (challengeStreak >= 7 && difficulty === ChallengeDifficulty.BEGINNER) {
    adjustedDifficulty = ChallengeDifficulty.INTERMEDIATE;
  } else if (challengeStreak >= 14 && difficulty === ChallengeDifficulty.INTERMEDIATE) {
    adjustedDifficulty = ChallengeDifficulty.ADVANCED;
  }
  
  return this.getRandomChallenge(
    completedChallenges,
    preferredCategories,
    adjustedDifficulty
  );
};

// ============================================
// Export
// ============================================

export const Challenge = mongoose.model<IChallengeDocument>('Challenge', ChallengeSchema);
