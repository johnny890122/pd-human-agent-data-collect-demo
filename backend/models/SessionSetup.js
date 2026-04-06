import mongoose from 'mongoose';
import { randomUUID } from 'crypto';

const sessionSetupSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    activeEdgeIds: { type: [String], required: true },
    scenarios: { type: [Object], required: true },
    focalNode: { type: String, required: true },
    opponentNode: { type: String, required: true },
    sampleSize: { type: Number, required: true },
  },
  { timestamps: true }
);

const submissionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true }, // point to sessionSetupSchema
    edgeId: { type: String, required: true },
    results: { type: [Object], required: false, default: [] }, // {scenarioId: number, cooperationProbability: number}
    demographics: { type: Object, required: false, default: null }, // {age: number, gender: string, education: string}
    isCompleted: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);



export const SessionSetupModel =
  mongoose.models.SessionSetup ||
  mongoose.model('SessionSetup', sessionSetupSchema);

export const SubmissionModel =
  mongoose.models.Submission ||
  mongoose.model('Submission', submissionSchema);


