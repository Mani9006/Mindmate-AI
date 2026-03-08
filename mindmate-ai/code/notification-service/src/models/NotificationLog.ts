/**
 * MindMate AI Notification Service - Notification Log Model
 */

import mongoose, { Schema, Document } from 'mongoose';
import {
  INotificationLog,
  NotificationType,
  NotificationChannel,
  NotificationStatus,
} from '../types';

// ============================================
// Notification Log Schema
// ============================================

export interface INotificationLogDocument extends INotificationLog, Document {}

const NotificationLogSchema = new Schema<INotificationLogDocument>({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  type: {
    type: String,
    enum: Object.values(NotificationType),
    required: true,
    index: true,
  },
  channel: {
    type: String,
    enum: Object.values(NotificationChannel),
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: Object.values(NotificationStatus),
    required: true,
    index: true,
  },
  title: { type: String, required: true },
  body: { type: String, required: true },
  sentAt: { type: Date, index: true },
  deliveredAt: { type: Date },
  readAt: { type: Date },
  errorMessage: { type: String },
  metadata: { type: Schema.Types.Mixed },
}, {
  timestamps: { createdAt: true, updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// ============================================
// Indexes
// ============================================

NotificationLogSchema.index({ userId: 1, createdAt: -1 });
NotificationLogSchema.index({ status: 1, createdAt: 1 });
NotificationLogSchema.index({ type: 1, channel: 1, createdAt: -1 });
NotificationLogSchema.index({ sentAt: 1 });

// TTL index to auto-delete old logs after 90 days
NotificationLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 }
);

// ============================================
// Methods
// ============================================

NotificationLogSchema.methods.markAsSent = async function(
  messageId?: string
): Promise<void> {
  this.status = NotificationStatus.SENT;
  this.sentAt = new Date();
  if (messageId) {
    this.metadata = { ...this.metadata, messageId };
  }
  await this.save();
};

NotificationLogSchema.methods.markAsDelivered = async function(): Promise<void> {
  this.status = NotificationStatus.DELIVERED;
  this.deliveredAt = new Date();
  await this.save();
};

NotificationLogSchema.methods.markAsRead = async function(): Promise<void> {
  this.status = NotificationStatus.READ;
  this.readAt = new Date();
  await this.save();
};

NotificationLogSchema.methods.markAsFailed = async function(
  errorMessage: string
): Promise<void> {
  this.status = NotificationStatus.FAILED;
  this.errorMessage = errorMessage;
  await this.save();
};

// ============================================
// Static Methods
// ============================================

NotificationLogSchema.statics.findByUser = function(
  userId: string,
  options: { limit?: number; offset?: number; status?: NotificationStatus } = {}
) {
  const query = this.find({ userId });
  
  if (options.status) {
    query.where('status', options.status);
  }
  
  query.sort({ createdAt: -1 });
  
  if (options.limit) {
    query.limit(options.limit);
  }
  
  if (options.offset) {
    query.skip(options.offset);
  }
  
  return query;
};

NotificationLogSchema.statics.findPending = function() {
  return this.find({
    status: { $in: [NotificationStatus.PENDING, NotificationStatus.QUEUED] },
  }).sort({ createdAt: 1 });
};

NotificationLogSchema.statics.getStats = async function(
  startDate: Date,
  endDate: Date
) {
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          type: '$type',
          channel: '$channel',
          status: '$status',
        },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: {
          type: '$_id.type',
          channel: '$_id.channel',
        },
        statuses: {
          $push: {
            status: '$_id.status',
            count: '$count',
          },
        },
        total: { $sum: '$count' },
      },
    },
    {
      $sort: { total: -1 },
    },
  ]);
};

NotificationLogSchema.statics.getUserStats = async function(
  userId: string,
  days: number = 30
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        userId,
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: '$channel',
        total: { $sum: 1 },
        sent: {
          $sum: {
            $cond: [{ $eq: ['$status', NotificationStatus.SENT] }, 1, 0],
          },
        },
        delivered: {
          $sum: {
            $cond: [{ $eq: ['$status', NotificationStatus.DELIVERED] }, 1, 0],
          },
        },
        read: {
          $sum: {
            $cond: [{ $eq: ['$status', NotificationStatus.READ] }, 1, 0],
          },
        },
        failed: {
          $sum: {
            $cond: [{ $eq: ['$status', NotificationStatus.FAILED] }, 1, 0],
          },
        },
      },
    },
  ]);
};

NotificationLogSchema.statics.cleanupOld = async function(
  olderThanDays: number = 90
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
  
  const result = await this.deleteMany({
    createdAt: { $lt: cutoffDate },
    status: { $in: [NotificationStatus.SENT, NotificationStatus.DELIVERED, NotificationStatus.READ] },
  });
  
  return result.deletedCount || 0;
};

// ============================================
// Export
// ============================================

export const NotificationLog = mongoose.model<INotificationLogDocument>(
  'NotificationLog',
  NotificationLogSchema
);
