export const typeDefs = `#graphql
  scalar JSON

  # ============================================================================
  # Scenario (NEW) - Atomic Unit of Experiment
  # ============================================================================
  
  type Scenario {
    _id: ID!
    focalNode: String!
    opponentNode: String!
    activeEdgeIds: [String!]!
    edgeStates: JSON!
    scenarioIndex: Int!                 # Required: position in design matrix
    groupId: ID
    targetSize: Int!
    responseCount: Int!
    status: String!                     # 'active' | 'inactive' - controls selection availability
    completionRate: Float!
    createdAt: String!
    updatedAt: String!
  }

  # ============================================================================
  # Session (REFACTORED from SessionSetup) - Scenario Container
  # ============================================================================
  
  type Session {
    _id: ID!
    scenarioIds: [ID!]!
    scenarios: [Scenario!]!
    activeEdgeIds: [String!]!          # Virtual field derived from first scenario (BUG-003 fix)
    focalNode: String!
    opponentNode: String!
    sampleSize: Int!
    groupId: ID
    submissionCount: Int!
    metadata: SessionMetadata
    createdAt: String!
    updatedAt: String!
  }

  type SessionMetadata {
    participantId: String
    createdFor: String
  }

  input SessionInput {
    activeEdgeIds: [String!]!
    focalNode: String!
    opponentNode: String!
    sampleSize: Int!
  }

  # ============================================================================
  # Submission (UPDATED) - References Scenario UUIDs
  # ============================================================================
  
  type Submission {
    _id: ID!
    sessionId: ID!
    participantId: String
    results: [SurveyResult!]!
    demographics: Demographics
    isCompleted: Boolean!
    completedAt: String
    isInvalid: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type SurveyResult {
    scenarioId: ID!
    cooperationProbability: Float!
    responseTime: Int
    answeredAt: String
  }

  type Demographics {
    age: Int
    gender: String
    education: String
  }

  input DemographicsInput {
    age: Int
    gender: String
    education: String
  }

  input SurveyAnswerInput {
    scenarioId: ID!
    cooperationProbability: Float!
  }

  # ============================================================================
  # SessionGroup (UPDATED) - Unified Config
  # ============================================================================
  
  type SessionGroup {
    _id: ID!
    name: String!
    description: String
    config: GroupConfig!
    totalSessions: Int!
    totalScenarios: Int!
    mode: String!
    completionPercentage: Float
    createdAt: String!
    updatedAt: String!
  }

  type GroupConfig {
    edgeCount: Int
    maxK: Int
    scenariosPerSession: Int
    targetSizePerScenario: Int
    focalNode: String!
    opponentNode: String!
    sampleSize: Int!
  }

  input GroupConfigInput {
    edgeCount: Int
    maxK: Int
    scenariosPerSession: Int
    targetSizePerScenario: Int
    focalNode: String!
    opponentNode: String!
    sampleSize: Int!
  }

  # ============================================================================
  # Result Types
  # ============================================================================

  type ManualSessionResult {
    session: Session!
    scenariosCreated: Int!
  }

  type MixedGroupResult {
    groupId: ID!
    totalScenarios: Int!
    estimatedSessions: Int!
    masterUrl: String!
  }

  type MixedSessionResult {
    sessionId: ID!
    assignedScenarios: [Scenario!]!
  }

  # ============================================================================
  # Queries
  # ============================================================================

  type Query {
    health: String!
    
    # Session queries (renamed from SessionSetup)
    session(id: ID!): Session
    allSessions(excludeGroupSessions: Boolean): [Session!]!
    sessionsByGroup(groupId: ID!): [Session!]!
    activeSession: Session
    findUserSession(groupId: ID!, participantId: String!): Session
    
    # Scenario queries (NEW)
    scenario(id: ID!): Scenario
    scenarios(groupId: ID, status: String, limit: Int, ids: [ID!]): [Scenario!]!
    
    # SessionGroup queries
    sessionGroup(id: ID!): SessionGroup
    allSessionGroups: [SessionGroup!]!
    
    # Submission queries
    recentSubmissions(limit: Int = 20): [Submission!]!
    
  }

  # ============================================================================
  # Mutations
  # ============================================================================

  type Mutation {
    # Mode 1: Manual (NEW - replaces saveSessionSetup)
    createManualSession(input: SessionInput!): ManualSessionResult!
    
    # Mode 3: Mixed (NEW)
    createMixedGroup(input: GroupConfigInput!, name: String!, description: String): MixedGroupResult!
    startMixedSession(groupId: ID!, participantId: String): MixedSessionResult!
    
    # Unified survey flow
    startSurvey(sessionId: ID!, participantId: String): Submission!
    saveSurveyAnswer(submissionId: ID!, scenarioId: ID!, cooperationProbability: Float!): Submission!
    completeSurvey(submissionId: ID!, demographics: DemographicsInput!): Submission!
    
    # Admin controls
    deleteSessionGroup(groupId: ID!): Boolean!
    clearDatabase: Boolean!
    invalidateSubmission(submissionId: ID!, isInvalid: Boolean!): Submission!
    
    # Session replay (pending removal per REQ-413)
    saveSessionEvents(sessionId: String!, events: [JSON!]!): Boolean!
  }
`;
