import mongoose from 'mongoose';
import { randomUUID } from 'crypto';

const sessionSetupSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    
    // 關聯到 SessionGroup（批次模式）
    groupId: { type: String, required: false, default: null },
    
    activeEdgeIds: { type: [String], required: true },
    scenarios: { type: [Object], required: true },
    focalNode: { type: String, required: true },
    opponentNode: { type: String, required: true },
    sampleSize: { type: Number, required: true },
  },
  { timestamps: true }
);

// 索引優化：加速按 groupId 查詢
sessionSetupSchema.index({ groupId: 1 });
sessionSetupSchema.index({ createdAt: -1 });

const submissionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true }, // point to Session._id (was SessionSetup)
    participantId: { type: String, required: false, default: null }, // Mixed Mode: 唯一性檢查
    
    // 回應（現在引用 Scenario UUIDs）
    results: {
      type: [{
        scenarioId: { type: String, required: true },  // 引用 Scenario._id (was: Number index)
        cooperationProbability: { type: Number, required: true, min: 0, max: 1 },
        responseTime: { type: Number, required: false }, // milliseconds
        answeredAt: { type: Date, required: false }
      }],
      required: false,
      default: []
    },
    
    demographics: {
      type: {
        age: { type: Number, required: false },
        gender: { type: String, required: false },
        education: { type: String, required: false }
      },
      required: false,
      default: null
    },
    
    isCompleted: { type: Boolean, required: true, default: false },
    completedAt: { type: Date, required: false, default: null },
  },
  { timestamps: true }
);

// 索引：基本查詢
submissionSchema.index({ sessionId: 1 });
// 索引：Mixed Mode 防重複提交
submissionSchema.index({ sessionId: 1, participantId: 1 });
// 索引：完成狀態查詢
submissionSchema.index({ isCompleted: 1, createdAt: -1 });



export const SessionSetupModel =
  mongoose.models.SessionSetup ||
  mongoose.model('SessionSetup', sessionSetupSchema);

export const SubmissionModel =
  mongoose.models.Submission ||
  mongoose.model('Submission', submissionSchema);


