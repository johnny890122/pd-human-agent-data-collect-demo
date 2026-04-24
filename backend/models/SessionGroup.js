import mongoose from 'mongoose';
import { randomUUID } from 'crypto';

/**
 * SessionGroup Schema
 * 用於管理批次創建的 session 群組
 */
const sessionGroupSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    
    // 基本資訊
    name: { type: String, required: true },
    description: { type: String, required: false, default: null },
    
    // 批次模式標記
    batchMode: { type: Boolean, default: true },
    
    // 批次參數
    edgeCount: { type: Number, required: true, min: 1, max: 12 },
    focalNode: { type: String, required: true },
    opponentNode: { type: String, required: true },
    sampleSize: { type: Number, required: true, default: 20 },
    
    // 統計資訊
    totalSessions: { type: Number, default: 0 },
    completedSessions: { type: Number, default: 0 },
    
    // 狀態管理
    status: { 
      type: String, 
      enum: ['creating', 'active', 'completed', 'archived'],
      default: 'creating'
    },
  },
  { 
    timestamps: true,
    collection: 'sessiongroups'
  }
);

// 索引優化
sessionGroupSchema.index({ createdAt: -1 });
sessionGroupSchema.index({ status: 1 });
sessionGroupSchema.index({ batchMode: 1 });

// 虛擬欄位：完成百分比
sessionGroupSchema.virtual('completionPercentage').get(function() {
  if (this.totalSessions === 0) return 0;
  return (this.completedSessions / this.totalSessions) * 100;
});

// 實例方法：更新完成數量
sessionGroupSchema.methods.updateCompletedCount = async function() {
  const SessionSetupModel = mongoose.model('SessionSetup');
  const SubmissionModel = mongoose.model('Submission');
  
  // 獲取此群組的所有 sessions
  const sessions = await SessionSetupModel.find({ groupId: String(this._id) });
  
  let completed = 0;
  for (const session of sessions) {
    const submissionCount = await SubmissionModel.countDocuments({
      sessionId: String(session._id),
      isCompleted: true
    });
    
    if (submissionCount >= session.sampleSize) {
      completed++;
    }
  }
  
  this.completedSessions = completed;
  
  // 自動更新狀態
  if (completed === this.totalSessions && this.totalSessions > 0) {
    this.status = 'completed';
  }
  
  await this.save();
  return this;
};

export const SessionGroupModel =
  mongoose.models.SessionGroup ||
  mongoose.model('SessionGroup', sessionGroupSchema);
