import mongoose from 'mongoose';
import { randomUUID } from 'crypto';

/**
 * SessionGroup Schema
 * 用於管理由 Mixed Mode 創建的 session 群組
 */
const sessionGroupSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    
    // 基本資訊
    name: { type: String, required: true },
    description: { type: String, required: false, default: null },
    
    // 統一配置（mode 由哪些欄位被設定來隱含判斷）
    config: {
      // Mixed Mode 欄位
      maxK: { type: Number, required: false, min: 1, max: 12 },
      scenariosPerSession: { type: Number, required: false },
      targetSizePerScenario: { type: Number, required: false },
      
      // 共用欄位
      focalNode: { type: String, required: true },
      opponentNode: { type: String, required: true },
      sampleSize: { type: Number, required: true, default: 20 }  // Per-session target
    },
    
    // 快取統計
    totalSessions: { type: Number, default: 0 },       // Sessions 已建立
    totalScenarios: { type: Number, default: 0 },      // Scenarios 已建立（Mixed Mode）
  },
  {
    timestamps: true,
    collection: 'sessiongroups'
  }
);

// 索引優化
sessionGroupSchema.index({ createdAt: -1 });

// 虛擬欄位：mode 偵測
sessionGroupSchema.virtual('mode').get(function() {
  if (this.config.maxK) return 'mixed';
  return 'manual';  // 或 null for standalone sessions
});

// 虛擬欄位：完成百分比（依 mode 而定）
sessionGroupSchema.virtual('completionPercentage').get(function() {
  const mode = this.mode;
  
  if (mode === 'mixed') {
    // Mixed mode: 基於 scenario-level 完成度
    // 需要從 Scenario collection 查詢，這裡只提供 session-level 的估算
    if (this.totalScenarios === 0) return 0;
    // 實際計算需要在 resolver 中進行
    return 0; // placeholder
  } else {
    // Manual mode: 基於 session-level 完成度
    if (this.totalSessions === 0) return 0;
    return (this.completedSessions / this.totalSessions) * 100;
  }
});

// 實例方法：更新完成數量（Manual mode）
sessionGroupSchema.methods.updateCompletedCount = async function() {
  const SessionModel = mongoose.model('Session');
  const SubmissionModel = mongoose.model('Submission');
  
  // 獲取此群組的所有 sessions
  const sessions = await SessionModel.find({ groupId: String(this._id) });
  
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
  
  await this.save();
  return this;
};

// 確保虛擬欄位在 JSON 轉換時包含
sessionGroupSchema.set('toJSON', { virtuals: true });
sessionGroupSchema.set('toObject', { virtuals: true });

export const SessionGroupModel =
  mongoose.models.SessionGroup ||
  mongoose.model('SessionGroup', sessionGroupSchema);
