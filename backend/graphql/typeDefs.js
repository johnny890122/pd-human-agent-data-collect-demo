export const typeDefs = `#graphql
  scalar JSON

  type Submission {
    id: ID!
    sessionId: String!
    edgeId: String!
    results: [SurveyAnswer!]!
    demographics: Demographic
    isCompleted: Boolean!
    createdAt: String!
    updatedAt: String
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

  type SessionSetup {
    id: ID!
    activeEdgeIds: [String!]!
    scenarios: [JSON!]!
    focalNode: String!
    opponentNode: String!
    sampleSize: Int!
    submissionCount: Int!
    updatedAt: String
  }

  input SessionSetupInput {
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
    activeSessionSetup: SessionSetup
    sessionSetup(id: ID!): SessionSetup
    allSessionSetups: [SessionSetup!]!
    recentSubmissions(limit: Int = 20): [Submission!]!
    getSessionReplay(sessionId: String!): [JSON!]!
  }

  type Mutation {
    saveSessionSetup(setup: SessionSetupInput!): SessionSetup!
    startSurveyEntry(sessionId: String!, edgeId: String!): Submission!
    saveSurveyAnswer(entryId: ID!, answer: SurveyAnswerInput!): Submission!
    completeSurveyEntry(entryId: ID!, demographics: DemographicInput!): Submission!
    submitSurvey(sessionId: String!, edgeId: String!, results: [SurveyAnswerInput!]!, demographics: DemographicInput!): Submission!
    saveSessionEvents(sessionId: String!, events: [JSON!]!): Boolean!
    clearDatabase: Boolean!
  }
`;
