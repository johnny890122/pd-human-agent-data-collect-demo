import { connectToDatabase, isDbConfigured } from '../db.js';
import { ExperimentSetupModel } from '../models/ExperimentSetup.js';
import { SurveySubmissionModel } from '../models/SurveySubmission.js';

function requireDb() {
  if (!isDbConfigured()) {
    throw new Error('MONGODB_URI is not configured. Set it in your environment to enable persistence.');
  }
}

function toSetupGraph(doc) {
  return {
    activeEdgeIds: doc.activeEdgeIds,
    edgeConfigs: doc.edgeConfigs,
    decisionMaker: doc.decisionMaker,
    opponent: doc.opponent,
    updatedAt: doc.updatedAt?.toISOString?.() ?? null,
  };
}

function validateResults(results) {
  for (const answer of results) {
    if (answer.cooperationProbability < 0 || answer.cooperationProbability > 1) {
      throw new Error('cooperationProbability must be between 0 and 1');
    }
  }
}

export const resolvers = {
  Query: {
    health: () => 'ok',
    activeExperimentSetup: async () => {
      requireDb();
      await connectToDatabase();
      const doc = await ExperimentSetupModel.findOne({ key: 'active' }).lean();
      if (!doc) {
        return null;
      }
      return toSetupGraph(doc);
    },
    recentSubmissions: async (_, { limit }) => {
      requireDb();
      await connectToDatabase();
      const docs = await SurveySubmissionModel.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
      return docs.map((doc) => ({
        id: String(doc._id),
        sessionId: doc.sessionId,
        results: doc.results,
        setup: {
          ...doc.setup,
          updatedAt: doc.updatedAt?.toISOString?.() ?? null,
        },
        createdAt: doc.createdAt.toISOString(),
      }));
    },
  },
  Mutation: {
    saveExperimentSetup: async (_, { setup }) => {
      requireDb();
      await connectToDatabase();

      const doc = await ExperimentSetupModel.findOneAndUpdate(
        { key: 'active' },
        {
          key: 'active',
          activeEdgeIds: setup.activeEdgeIds,
          edgeConfigs: setup.edgeConfigs,
          decisionMaker: setup.decisionMaker,
          opponent: setup.opponent,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();

      return toSetupGraph(doc);
    },
    submitSurvey: async (_, { sessionId, setup, results }) => {
      requireDb();
      validateResults(results);
      await connectToDatabase();

      const doc = await SurveySubmissionModel.create({
        sessionId,
        setup,
        results,
      });

      return {
        id: String(doc._id),
        sessionId: doc.sessionId,
        setup: {
          ...doc.setup.toObject(),
          updatedAt: doc.updatedAt.toISOString(),
        },
        results: doc.results,
        createdAt: doc.createdAt.toISOString(),
      };
    },
  },
};
