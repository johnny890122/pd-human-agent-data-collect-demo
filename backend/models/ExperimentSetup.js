import mongoose from 'mongoose';
import { randomUUID } from 'crypto';

const edgeConfigEntrySchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true }, // point to experimentSetupSchema
    edgeId: { type: String, required: true },
    results: { type: [Object], required: false, default: [] }, // {scenarioId: number, cooperationProbability: number}
    demographics: { type: Object, required: false, default: null }, // {age: number, gender: string, education: string}
    isCompleted: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

const experimentSetupSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    activeEdgeIds: { type: [String], required: true, default: [] },
    scenarios: { type: [Object], required: true },
    focalNode: { type: String, required: true },
    opponentNode: { type: String, required: true },
    sampleSize: { type: Number, required: true, default: 20 },
  },
  { timestamps: true }
);

export const ExperimentSetupModel =
  mongoose.models.ExperimentSetup ||
  mongoose.model('ExperimentSetup', experimentSetupSchema);

export const EdgeConfigEntryModel =
  mongoose.models.EdgeConfigEntry ||
  mongoose.model('EdgeConfigEntry', edgeConfigEntrySchema);


