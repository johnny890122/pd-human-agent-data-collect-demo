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
    
    // Outro (REQ-403, BUG-015): registration code (step 1) and payment email (step 4)
    registrationCode: { type: String, required: false, default: null },
    email: { type: String, required: false, default: null },
    // REQ-417: consent given on the welcome page (click time, label of the consent text)
    consentedAt: { type: Date, required: false, default: null },
    consentVersion: { type: String, required: false, default: null },
    // REQ-418: the device that started the submission
    deviceType: { type: String, enum: ['mobile', 'desktop', null], required: false, default: null },
    userAgent: { type: String, required: false, default: null },
    
    isCompleted: { type: Boolean, required: true, default: false },
    completedAt: { type: Date, required: false, default: null },
    isInvalid: { type: Boolean, required: true, default: false },
    realisedRoundIndex: { type: Number, required: false, default: null },
    opponentProbs: { type: [Number], required: false, default: null },
    myDecisions: { type: [Boolean], required: false, default: null },
    opponentDecisions: { type: [Boolean], required: false, default: null },
    // Payout of the realised round (REQ-408.5) — the amount shown to and paid to the participant
    realisedPoints: { type: Number, required: false, default: null },
    payoutNtd: { type: Number, required: false, default: null },
    // Post-survey questionnaire (REQ-416): political opinions — exposed to admins only
    questionnaire: {
      // answer: true = the question's first option (同意 / 好 / 管制), REQ-416
      type: [{ _id: false, questionId: { type: String, required: true }, answer: { type: Boolean, required: true } }],
      required: false,
      default: undefined,
    },
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
