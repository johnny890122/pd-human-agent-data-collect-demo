import mongoose from 'mongoose';

const sessionReplaySchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  chunkIndex: { type: Number, required: true, default: 0 },
  eventCount: { type: Number, required: true, default: 0 },
  events: { type: [mongoose.Schema.Types.Mixed], default: [] }
}, { timestamps: true });

export const SessionReplayModel = mongoose.models.SessionReplay || mongoose.model('SessionReplay', sessionReplaySchema);
