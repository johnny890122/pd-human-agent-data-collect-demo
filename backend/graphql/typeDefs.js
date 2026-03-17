export const typeDefs = `#graphql
  type EdgeConfigEntry {
    edgeId: String!
    label: String!
    low: String!
    high: String!
  }

  input EdgeConfigEntryInput {
    edgeId: String!
    label: String!
    low: String!
    high: String!
  }

  type ExperimentSetup {
    activeEdgeIds: [String!]!
    edgeConfigs: [EdgeConfigEntry!]!
    decisionMaker: String!
    opponent: String!
    updatedAt: String
  }

  input ExperimentSetupInput {
    activeEdgeIds: [String!]!
    edgeConfigs: [EdgeConfigEntryInput!]!
    decisionMaker: String!
    opponent: String!
  }

  type SurveyAnswer {
    scenarioId: Int!
    cooperationProbability: Float!
  }

  input SurveyAnswerInput {
    scenarioId: Int!
    cooperationProbability: Float!
  }

  type SurveySubmission {
    id: ID!
    sessionId: String!
    results: [SurveyAnswer!]!
    setup: ExperimentSetup!
    createdAt: String!
  }

  type Query {
    health: String!
    activeExperimentSetup: ExperimentSetup
    recentSubmissions(limit: Int = 20): [SurveySubmission!]!
  }

  type Mutation {
    saveExperimentSetup(setup: ExperimentSetupInput!): ExperimentSetup!
    submitSurvey(sessionId: String!, setup: ExperimentSetupInput!, results: [SurveyAnswerInput!]!): SurveySubmission!
  }
`;
