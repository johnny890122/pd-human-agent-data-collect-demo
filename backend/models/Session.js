import mongoose from 'mongoose';
import { randomUUID } from 'crypto';

/**
 * Session Schema - Scenario Container
 * Session 是一個輕量容器，透過 ID 引用 scenarios
 */
const sessionSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    
    // 容器：引用 scenarios（不嵌入！）
    scenarioIds: { type: [String], required: true },  // Array of Scenario._id，保留順序
    
    // Session-level metadata
    focalNode: { type: String, required: true },
    opponentNode: { type: String, required: true },
    sampleSize: { type: Number, required: true },     // 多少人應該完成此 session
    
    // 所有權
    groupId: { type: String, required: false, default: null }, // 哪個 SessionGroup 擁有此 session
    
    // 快取統計
    submissionCount: { type: Number, required: true, default: 0 }, // 多少人完成了此 session
    
    // Mixed Mode metadata
    metadata: {
      participantId: { type: String, required: false, default: null },  // Mixed Mode: 此 session 是為哪個參與者建立的
      createdFor: {
        type: String,
        enum: ['manual', 'batch', 'mixed', null],
        required: false,
        default: null
      }
    },
  },
  { 
    timestamps: true,
    collection: 'sessions'
  }
);

// 虛擬欄位：populate scenarios
sessionSchema.virtual('scenarios', {
  ref: 'Scenario',
  localField: 'scenarioIds',
  foreignField: '_id',
  justOne: false
});

// 索引
sessionSchema.index({ groupId: 1 });
sessionSchema.index({ 'metadata.participantId': 1 });
sessionSchema.index({ createdAt: -1 });

// 確保虛擬欄位在 JSON 轉換時包含
sessionSchema.set('toJSON', { virtuals: true });
sessionSchema.set('toObject', { virtuals: true });

export const SessionModel =
  mongoose.models.Session ||
  mongoose.model('Session', sessionSchema);
