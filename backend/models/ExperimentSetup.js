import mongoose from 'mongoose';

const edgeConfigEntrySchema = new mongoose.Schema(
  {
    edgeId: { type: String, required: true },
    label: { type: String, required: true },
    low: { type: String, required: true },
    high: { type: String, required: true },
  },
  { _id: false }
);

const experimentSetupSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'active' },
    activeEdgeIds: { type: [String], required: true, default: [] },
    edgeConfigs: { type: [edgeConfigEntrySchema], required: true, default: [] },
    decisionMaker: { type: String, required: true },
    opponent: { type: String, required: true },
  },
  { timestamps: true }
);

export const ExperimentSetupModel =
  mongoose.models.ExperimentSetup ||
  mongoose.model('ExperimentSetup', experimentSetupSchema);
