export const typeDefs = `#graphql
  scalar JSON

  type EdgeConfigEntry {
    id: ID!
    sessionId: String!
    edgeId: String!
    results: [SurveyAnswer!]!
    demographics: Demographic
    isCompleted: Boolean!
    createdAt: String!
  }


  type Demographic {
    age: Int!
    gender: String!
    education: String!
  }

  input DemographicInput {
    age: Int!
    gender: String!
    education: String!
  }

  type ExperimentSetup {
    id: ID!
    activeEdgeIds: [String!]!
    scenarios: [JSON!]!
    focalNode: String!
    opponentNode: String!
    sampleSize: Int!
    submissionCount: Int!
    updatedAt: String
  }

  input ExperimentSetupInput {
    activeEdgeIds: [String!]!
    scenarios: [JSON!]!
    focalNode: String!
    opponentNode: String!
    sampleSize: Int!
  }


  type SurveyAnswer {
    scenarioId: Int!
    cooperationProbability: Float!
  }

  input SurveyAnswerInput {
    scenarioId: Int!
    cooperationProbability: Float!
  }

  type Query {
    health: String!
    activeExperimentSetup: ExperimentSetup
    experimentSetup(id: ID!): ExperimentSetup
    allExperimentSetups: [ExperimentSetup!]!
    recentSubmissions(limit: Int = 20): [EdgeConfigEntry!]!
  }


  type Mutation {
    saveExperimentSetup(setup: ExperimentSetupInput!): ExperimentSetup!
    startSurveyEntry(sessionId: String!, edgeId: String!): EdgeConfigEntry!
    saveSurveyAnswer(entryId: ID!, answer: SurveyAnswerInput!): EdgeConfigEntry!
    completeSurveyEntry(entryId: ID!, demographics: DemographicInput!): EdgeConfigEntry!
    submitSurvey(sessionId: String!, edgeId: String!, results: [SurveyAnswerInput!]!, demographics: DemographicInput!): EdgeConfigEntry!
  }
`;
