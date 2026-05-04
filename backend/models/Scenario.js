import mongoose from 'mongoose';
import { randomUUID } from 'crypto';

/**
 * Scenario Schema - Atomic Unit of Experiment
 * 每個 Scenario 代表一個獨立的 # of edges + edge conditions 組合
 */
const scenarioSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    
    // 實驗配置（自包含）
    focalNode: { type: String, required: true },      // 'A1' | 'A2' | 'B3' | 'B4'
    opponentNode: { type: String, required: true },
    activeEdgeIds: { type: [String], required: true }, // e.g., ['A1-A2', 'A2-B3']
    
    // 特定狀態（此 scenario 的條件）
    edgeStates: { type: Map, of: String, required: true }, // edgeId → 'give' | 'not give'
    scenarioIndex: { type: Number, required: true },        // 在原始 design matrix 中的位置（必填）
    
    // 所有權（可追溯性）
    groupId: { type: String, required: false, default: null },     // 哪個 SessionGroup 創建的
    // 數據收集追蹤（scenario-level!）
    targetSize: { type: Number, required: true, default: 0 },      // 此 scenario 需要多少回應
    responseCount: { type: Number, required: true, default: 0 },   // 已收集多少回應
    
    status: {
      type: String,
      enum: ['active', 'inactive'],              // 控制 scenario 是否可被選擇
      default: 'active'                          // 'active' = 可選擇, 'inactive' = 已排除
    },                                           // 注意：完成狀態由 responseCount >= targetSize 判斷
  },
  { 
    timestamps: true,
    collection: 'scenarios'
  }
);

// 索引：Mixed Mode 平衡選擇
scenarioSchema.index({ groupId: 1, status: 1, responseCount: 1 });
// 索引：狀態查詢
scenarioSchema.index({ status: 1 });

// 虛擬欄位：完成率
scenarioSchema.virtual('completionRate').get(function() {
  if (this.targetSize === 0) return 0;
  return Math.min(this.responseCount / this.targetSize, 1);
});

// 確保虛擬欄位在 JSON 轉換時包含
scenarioSchema.set('toJSON', { virtuals: true });
scenarioSchema.set('toObject', { virtuals: true });

export const ScenarioModel =
  mongoose.models.Scenario ||
  mongoose.model('Scenario', scenarioSchema);
