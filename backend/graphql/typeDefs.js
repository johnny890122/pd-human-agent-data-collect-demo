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
    groupId: String
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

  type SessionGroup {
    id: ID!
    name: String!
    description: String
    batchMode: Boolean!
    edgeCount: Int!
    focalNode: String!
    opponentNode: String!
    sampleSize: Int!
    totalSessions: Int!
    completedSessions: Int!
    status: String!
    createdAt: String!
    updatedAt: String!
  }

  input SessionGroupInput {
    name: String!
    description: String
    edgeCount: Int!
    focalNode: String!
    opponentNode: String!
    sampleSize: Int!
  }

  type BatchLaunchResult {
    groupId: ID!
    sessionsCreated: Int!
    sessionIds: [String!]!
  }

  type Query {
    health: String!
    activeSessionSetup: SessionSetup
    sessionSetup(id: ID!): SessionSetup
    allSessionSetups(excludeBatchSessions: Boolean): [SessionSetup!]!
    recentSubmissions(limit: Int = 20): [Submission!]!
    getSessionReplay(sessionId: String!): [JSON!]!
    sessionGroup(id: ID!): SessionGroup
    allSessionGroups: [SessionGroup!]!
    sessionsByGroup(groupId: ID!): [SessionSetup!]!
  }

  type Mutation {
    saveSessionSetup(setup: SessionSetupInput!): SessionSetup!
    startSurveyEntry(sessionId: String!, edgeId: String!): Submission!
    saveSurveyAnswer(entryId: ID!, answer: SurveyAnswerInput!): Submission!
    completeSurveyEntry(entryId: ID!, demographics: DemographicInput!): Submission!
    submitSurvey(sessionId: String!, edgeId: String!, results: [SurveyAnswerInput!]!, demographics: DemographicInput!): Submission!
    saveSessionEvents(sessionId: String!, events: [JSON!]!): Boolean!
    createBatchSessions(input: SessionGroupInput!): BatchLaunchResult!
    updateSessionGroupStatus(groupId: ID!, status: String!): SessionGroup!
    deleteSessionGroup(groupId: ID!): Boolean!
    clearDatabase: Boolean!
  }
`;
