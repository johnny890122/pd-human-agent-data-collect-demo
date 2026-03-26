import { connectToDatabase, isDbConfigured } from '../db.js';
import { ExperimentSetupModel, EdgeConfigEntryModel } from '../models/ExperimentSetup.js';
import { GraphQLScalarType } from 'graphql';
import { randomUUID } from 'crypto';


function requireDb() {
  if (!isDbConfigured()) {
    throw new Error('MONGODB_URI is not configured. Set it in your environment to enable persistence.');
  }
}

async function toSetupGraph(doc) {
  if (!doc) return null;
  const submissionCount = await EdgeConfigEntryModel.countDocuments({
    sessionId: String(doc._id),
    $or: [
      { isCompleted: true },
      { isCompleted: { $exists: false } },
    ],
  });
  return {
    id: String(doc._id),
    activeEdgeIds: doc.activeEdgeIds,
    scenarios: doc.scenarios,
    focalNode: doc.focalNode,
    opponentNode: doc.opponentNode,
    sampleSize: doc.sampleSize || 20,
    submissionCount,
    updatedAt: (doc.updatedAt instanceof Date) ? doc.updatedAt.toISOString() : null,
  };
}


function validateResults(results) {
  for (const answer of results) {
    if (answer.cooperationProbability < 0 || answer.cooperationProbability > 1) {
      throw new Error('cooperationProbability must be between 0 and 1');
    }
  }
}

function mapEntry(doc) {
  return {
    id: String(doc._id),
    sessionId: doc.sessionId,
    edgeId: doc.edgeId,
    results: doc.results || [],
    demographics: doc.demographics || null,
    isCompleted: doc.isCompleted === true,
    createdAt: (doc.createdAt instanceof Date) ? doc.createdAt.toISOString() : null,
  };
}

export const resolvers = {
  JSON: new GraphQLScalarType({
    name: 'JSON',
    serialize: (val) => val,
    parseValue: (val) => val,
    parseLiteral: (ast) => {
      // Basic implementation for JSON in variables, but handles literals if needed
      switch (ast.kind) {
        case 'StringValue':
        case 'BooleanValue':
          return ast.value;
        case 'IntValue':
        case 'FloatValue':
          return parseFloat(ast.value);
        case 'ObjectValue':
          return Object.fromEntries(ast.fields.map(f => [f.name.value, resolvers.JSON.parseLiteral(f.value)]));
        case 'ListValue':
          return ast.values.map(v => resolvers.JSON.parseLiteral(v));
        default:
          return null;
      }
    },
  }),

  Query: {
    health: () => 'ok',
    activeExperimentSetup: async () => {
      requireDb();
      await connectToDatabase();
      const doc = await ExperimentSetupModel.findOne().sort({ updatedAt: -1 }).lean();
      return await toSetupGraph(doc);
    },
    experimentSetup: async (_, { id }) => {
      requireDb();
      await connectToDatabase();
      const doc = await ExperimentSetupModel.findById(id).lean();
      return await toSetupGraph(doc);
    },
    allExperimentSetups: async () => {
      requireDb();
      await connectToDatabase();
      const docs = await ExperimentSetupModel.find({}).sort({ createdAt: -1 }).lean();
      return await Promise.all(docs.map(doc => toSetupGraph(doc)));
    },
    recentSubmissions: async (_, { limit }) => {
      requireDb();
      await connectToDatabase();
      const docs = await EdgeConfigEntryModel.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
      return docs.map((doc) => ({
        ...mapEntry(doc),
        isCompleted: doc.isCompleted === true,
      }));

    },
  },
  Mutation: {
    saveExperimentSetup: async (_, { setup }) => {
      requireDb();
      await connectToDatabase();

      // We create a new setup each time or update the last one? 
      // Given the user removed 'key', maybe they want a history.
      // I'll create a new one to be safe, or update the most recent.
      // Let's create a new one as it's cleaner without a key.
      const doc = await ExperimentSetupModel.create({
        _id: randomUUID(),
        activeEdgeIds: setup.activeEdgeIds,
        scenarios: setup.scenarios,
        focalNode: setup.focalNode,
        opponentNode: setup.opponentNode,
        sampleSize: setup.sampleSize,
      });

      return await toSetupGraph(doc.toObject());
    },
    startSurveyEntry: async (_, { sessionId, edgeId }) => {
      requireDb();
      await connectToDatabase();

      const doc = await EdgeConfigEntryModel.create({
        sessionId,
        edgeId,
        results: [],
        demographics: null,
        isCompleted: false,
      });

      return mapEntry(doc);
    },
    saveSurveyAnswer: async (_, { entryId, answer }) => {
      requireDb();
      validateResults([answer]);
      await connectToDatabase();

      const existing = await EdgeConfigEntryModel.findById(entryId);
      if (!existing) {
        throw new Error('Survey entry not found.');
      }

      const results = Array.isArray(existing.results) ? [...existing.results] : [];
      const idx = results.findIndex((item) => item.scenarioId === answer.scenarioId);
      if (idx >= 0) {
        results[idx] = answer;
      } else {
        results.push(answer);
      }
      results.sort((a, b) => a.scenarioId - b.scenarioId);

      existing.results = results;
      await existing.save();
      return mapEntry(existing);
    },
    completeSurveyEntry: async (_, { entryId, demographics }) => {
      requireDb();
      await connectToDatabase();

      const doc = await EdgeConfigEntryModel.findByIdAndUpdate(
        entryId,
        {
          $set: {
            demographics,
            isCompleted: true,
          },
        },
        { new: true }
      );

      if (!doc) {
        throw new Error('Survey entry not found.');
      }

      return mapEntry(doc);
    },
    submitSurvey: async (_, { sessionId, edgeId, results, demographics }) => {
      try {
        requireDb();
        validateResults(results);
        await connectToDatabase();

        const doc = await EdgeConfigEntryModel.create({
          sessionId,
          edgeId,
          results,
          demographics,
          isCompleted: true,
        });

        // Use a 100% safe way to get ISO string
        let createdAtStr = new Date().toISOString();
        if (doc && doc.createdAt) {
          try {
            if (typeof doc.createdAt.toISOString === 'function') {
              createdAtStr = doc.createdAt.toISOString();
            } else {
              createdAtStr = new Date(doc.createdAt).toISOString();
            }
          } catch (e) {
            console.warn("Date conversion failed, using now()", e);
          }
        }

        return {
          id: String(doc._id),
          sessionId: doc.sessionId || sessionId,
          edgeId: doc.edgeId || edgeId,
          results: doc.results || results,
          demographics: doc.demographics || demographics,
          isCompleted: true,
          createdAt: createdAtStr,
        };
      } catch (error) {
        console.error("Survey submission failed:", error);
        throw error;
      }
    },
  },
};

