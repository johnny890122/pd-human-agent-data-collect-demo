import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true }, // point to Session._id
    participantId: { type: String, required: false, default: null }, // Mixed Mode: 唯一性檢查
    
    // 回應（現在引用 Scenario UUIDs）
    results: {
      type: [{
        scenarioId: { type: String, required: true },  // 引用 Scenario._id
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
    isInvalid: { type: Boolean, required: true, default: false },
    realisedRoundIndex: { type: Number, required: false, default: null },
    opponentProbs: { type: [Number], required: false, default: null },
  },
  { timestamps: true }
);

// 索引：基本查詢
submissionSchema.index({ sessionId: 1 });
// 索引：Mixed Mode 防重複提交 — unique + sparse 允許 null（Manual/Batch 無 fingerprint）
submissionSchema.index({ sessionId: 1, participantId: 1 }, { unique: true, sparse: true });
// 索引：完成狀態查詢
submissionSchema.index({ isCompleted: 1, createdAt: -1 });
// 索引：無效提交過濾
submissionSchema.index({ isInvalid: 1 });

export const SubmissionModel =
  mongoose.models.Submission ||
  mongoose.model('Submission', submissionSchema);
