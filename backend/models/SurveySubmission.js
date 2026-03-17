import mongoose from 'mongoose';

const surveyAnswerSchema = new mongoose.Schema(
  {
    scenarioId: { type: Number, required: true },
    cooperationProbability: { type: Number, required: true, min: 0, max: 1 },
  },
  { _id: false }
);

const edgeConfigEntrySchema = new mongoose.Schema(
  {
    edgeId: { type: String, required: true },
    label: { type: String, required: true },
    low: { type: String, required: true },
    high: { type: String, required: true },
  },
  { _id: false }
);

const surveySubmissionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true },
    results: { type: [surveyAnswerSchema], required: true, default: [] },
    setup: {
      activeEdgeIds: { type: [String], required: true, default: [] },
      edgeConfigs: { type: [edgeConfigEntrySchema], required: true, default: [] },
      decisionMaker: { type: String, required: true },
      opponent: { type: String, required: true },
    },
  },
  { timestamps: true }
);

export const SurveySubmissionModel =
  mongoose.models.SurveySubmission ||
  mongoose.model('SurveySubmission', surveySubmissionSchema);
