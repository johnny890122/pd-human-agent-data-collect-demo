import { Session, Scenario, SessionGroup as SessionGroupType, Submission as SubmissionType } from '../types';

const GRAPHQL_ENDPOINT = import.meta.env.VITE_GRAPHQL_ENDPOINT ?? '/graphql';

interface GraphQLResponse<TData> {
  data?: TData;
  errors?: Array<{ message: string }>;
}

// ============================================================================
// Helper Functions
// ============================================================================

async function runGraphQL<TData>(query: string, variables?: Record<string, unknown>): Promise<TData> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  // Only add Authorization header if token exists and is not the string "undefined" or "null"
  if (token && token !== 'undefined' && token !== 'null') {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed with status ${response.status}`);
  }

  const json = (await response.json()) as GraphQLResponse<TData>;
  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }

  if (!json.data) {
    throw new Error('GraphQL response had no data.');
  }

  return json.data;
}

// ============================================================================
// NEW API: Session (replaces Session)
// ============================================================================

export async function fetchSession(id: string): Promise<Session | null> {
  const query = `
    query Session($id: ID!) {
      session(id: $id) {
        _id
        scenarioIds
        scenarios {
          _id
          focalNode
          opponentNode
          activeEdgeIds
          edgeStates
          scenarioIndex
          status
          responseCount
          targetSize
        }
        focalNode
        opponentNode
        sampleSize
        groupId
        submissionCount
        metadata {
          participantId
          createdFor
        }
        createdAt
        updatedAt
      }
    }
  `;

  const data = await runGraphQL<{ session: Session | null }>(query, { id });
  return data.session;
}

export async function fetchAllSessions(excludeGroupSessions = false): Promise<Session[]> {
  const query = `
    query AllSessions($excludeGroupSessions: Boolean) {
      allSessions(excludeGroupSessions: $excludeGroupSessions) {
        _id
        scenarioIds
        activeEdgeIds
        scenarios {
          _id
          activeEdgeIds
          edgeStates
          scenarioIndex
        }
        focalNode
        opponentNode
        sampleSize
        groupId
        submissionCount
        metadata {
          createdFor
        }
        createdAt
        updatedAt
      }
    }
  `;

  const data = await runGraphQL<{ allSessions: Session[] }>(query, { excludeGroupSessions });
  return data.allSessions || [];
}

export async function findUserSession(groupId: string, participantId: string): Promise<Session | null> {
  const query = `
    query FindUserSession($groupId: ID!, $participantId: String!) {
      findUserSession(groupId: $groupId, participantId: $participantId) {
        _id
        scenarioIds
        scenarios {
          _id
          focalNode
          opponentNode
          activeEdgeIds
          edgeStates
          scenarioIndex
          status
          responseCount
          targetSize
        }
        focalNode
        opponentNode
        sampleSize
        groupId
        submissionCount
        metadata {
          participantId
          createdFor
        }
        createdAt
        updatedAt
      }
    }
  `;

  const data = await runGraphQL<{ findUserSession: Session | null }>(query, { groupId, participantId });
  return data.findUserSession;
}

export async function fetchSessionsByGroup(groupId: string): Promise<Session[]> {
  const query = `
    query SessionsByGroup($groupId: ID!) {
      sessionsByGroup(groupId: $groupId) {
        _id
        scenarioIds
        scenarios {
          _id
          edgeStates
          scenarioIndex
          activeEdgeIds
        }
        focalNode
        opponentNode
        sampleSize
        submissionCount
        createdAt
      }
    }
  `;

  const data = await runGraphQL<{ sessionsByGroup: Session[] }>(query, { groupId });
  return data.sessionsByGroup || [];
}

// ============================================================================
// NEW API: Scenario
// ============================================================================

export async function fetchScenario(id: string): Promise<Scenario | null> {
  const query = `
    query Scenario($id: ID!) {
      scenario(id: $id) {
        _id
        focalNode
        opponentNode
        activeEdgeIds
        edgeStates
        scenarioIndex
        groupId
        targetSize
        responseCount
        status
        completionRate
        createdAt
        updatedAt
      }
    }
  `;

  const data = await runGraphQL<{ scenario: Scenario | null }>(query, { id });
  return data.scenario;
}

export async function fetchScenarios(params?: {
  groupId?: string;
  status?: string;
  limit?: number;
}): Promise<Scenario[]> {
  const query = `
    query Scenarios($groupId: ID, $status: String, $limit: Int) {
      scenarios(groupId: $groupId, status: $status, limit: $limit) {
        _id
        focalNode
        opponentNode
        activeEdgeIds
        edgeStates
        scenarioIndex
        groupId
        targetSize
        responseCount
        status
        completionRate
        createdAt
      }
    }
  `;

  const data = await runGraphQL<{ scenarios: Scenario[] }>(query, params || {});
  return data.scenarios || [];
}

// ============================================================================
// NEW API: Manual Mode
// ============================================================================

export interface ManualSessionResult {
  session: Session;
  scenariosCreated: number;
}

export async function createManualSession(
  activeEdgeIds: string[],
  focalNode: string,
  opponentNode: string,
  sampleSize: number
): Promise<ManualSessionResult> {
  const mutation = `
    mutation CreateManualSession($input: SessionInput!) {
      createManualSession(input: $input) {
        session {
          _id
          scenarioIds
          scenarios {
            _id
            edgeStates
            scenarioIndex
          }
          focalNode
          opponentNode
          sampleSize
          submissionCount
          metadata {
            createdFor
          }
        }
        scenariosCreated
      }
    }
  `;

  const data = await runGraphQL<{ createManualSession: ManualSessionResult }>(mutation, {
    input: { activeEdgeIds, focalNode, opponentNode, sampleSize },
  });

  return data.createManualSession;
}

// ============================================================================
// ============================================================================
// Mode 3: Mixed Mode (NEW)
// ============================================================================

export interface MixedGroupResult {
  groupId: string;
  totalScenarios: number;
  estimatedSessions: number;
  masterUrl: string;
}

export interface MixedSessionResult {
  sessionId: string;
  assignedScenarios: Scenario[];
}

export async function createMixedGroup(
  name: string,
  maxK: number,
  scenariosPerSession: number,
  targetSizePerScenario: number,
  focalNode: string,
  opponentNode: string,
  description?: string
): Promise<MixedGroupResult> {
  const mutation = `
    mutation CreateMixedGroup($input: GroupConfigInput!, $name: String!, $description: String) {
      createMixedGroup(input: $input, name: $name, description: $description) {
        groupId
        totalScenarios
        estimatedSessions
        masterUrl
      }
    }
  `;

  const data = await runGraphQL<{ createMixedGroup: MixedGroupResult }>(mutation, {
    input: {
      maxK,
      scenariosPerSession,
      targetSizePerScenario,
      focalNode,
      opponentNode,
      sampleSize: 1, // Mixed mode: each session has one participant
    },
    name,
    description: description || null,
  });

  return data.createMixedGroup;
}

export async function startMixedSession(
  groupId: string,
  participantId?: string
): Promise<MixedSessionResult> {
  const mutation = `
    mutation StartMixedSession($groupId: ID!, $participantId: String) {
      startMixedSession(groupId: $groupId, participantId: $participantId) {
        sessionId
        assignedScenarios {
          _id
          focalNode
          opponentNode
          activeEdgeIds
          edgeStates
          scenarioIndex
          targetSize
          responseCount
          status
        }
      }
    }
  `;

  const data = await runGraphQL<{ startMixedSession: MixedSessionResult }>(mutation, {
    groupId,
    participantId: participantId || null,
  });

  return data.startMixedSession;
}

// ============================================================================
// NEW API: SessionGroup (Refactored)
// ============================================================================

export async function fetchAllSessionGroups(): Promise<SessionGroupType[]> {
  const query = `
    query AllSessionGroups {
      allSessionGroups {
        _id
        name
        description
        config {
          edgeCount
          maxK
          scenariosPerSession
          targetSizePerScenario
          focalNode
          opponentNode
          sampleSize
        }
        totalSessions
        totalScenarios
        mode
        completionPercentage
        createdAt
        updatedAt
      }
    }
  `;

  const data = await runGraphQL<{ allSessionGroups: SessionGroupType[] }>(query);
  return data.allSessionGroups || [];
}

export async function fetchSessionGroup(id: string): Promise<SessionGroupType | null> {
  const query = `
    query SessionGroup($id: ID!) {
      sessionGroup(id: $id) {
        _id
        name
        description
        config {
          edgeCount
          maxK
          scenariosPerSession
          targetSizePerScenario
          focalNode
          opponentNode
          sampleSize
        }
        totalSessions
        totalScenarios
        mode
        completionPercentage
        createdAt
        updatedAt
      }
    }
  `;

  const data = await runGraphQL<{ sessionGroup: SessionGroupType | null }>(query, { id });
  return data.sessionGroup;
}

export async function deleteSessionGroup(groupId: string): Promise<boolean> {
  const mutation = `
    mutation DeleteSessionGroup($groupId: ID!) {
      deleteSessionGroup(groupId: $groupId)
    }
  `;

  try {
    const data = await runGraphQL<{ deleteSessionGroup: boolean }>(mutation, { groupId });
    return data.deleteSessionGroup;
  } catch (error) {
    console.error("Failed to delete session group:", error);
    return false;
  }
}

// ============================================================================
// NEW API: Unified Survey Flow
// ============================================================================

export async function startSurvey(sessionId: string, participantId?: string): Promise<SubmissionType> {
  const mutation = `
    mutation StartSurvey($sessionId: ID!, $participantId: String) {
      startSurvey(sessionId: $sessionId, participantId: $participantId) {
        _id
        sessionId
        participantId
        results {
          scenarioId
          cooperationProbability
          responseTime
          answeredAt
        }
        isCompleted
        createdAt
      }
    }
  `;

  const data = await runGraphQL<{ startSurvey: SubmissionType }>(mutation, {
    sessionId,
    participantId: participantId || null,
  });
  return data.startSurvey;
}

export async function saveSurveyAnswer(
  submissionId: string,
  scenarioId: string,
  cooperationProbability: number
): Promise<SubmissionType> {
  const mutation = `
    mutation SaveSurveyAnswer($submissionId: ID!, $scenarioId: ID!, $cooperationProbability: Float!) {
      saveSurveyAnswer(
        submissionId: $submissionId
        scenarioId: $scenarioId
        cooperationProbability: $cooperationProbability
      ) {
        _id
        results {
          scenarioId
          cooperationProbability
          answeredAt
        }
      }
    }
  `;

  const data = await runGraphQL<{ saveSurveyAnswer: SubmissionType }>(mutation, {
    submissionId,
    scenarioId,
    cooperationProbability,
  });

  return data.saveSurveyAnswer;
}

export async function completeSurvey(
  submissionId: string,
  demographics: { age?: number; gender?: string; education?: string }
): Promise<SubmissionType> {
  const mutation = `
    mutation CompleteSurvey($submissionId: ID!, $demographics: DemographicsInput!) {
      completeSurvey(submissionId: $submissionId, demographics: $demographics) {
        _id
        isCompleted
        completedAt
        demographics {
          age
          gender
          education
        }
      }
    }
  `;

  const data = await runGraphQL<{ completeSurvey: SubmissionType }>(mutation, {
    submissionId,
    demographics,
  });

  return data.completeSurvey;
}

export async function fetchSubmission(submissionId: string): Promise<SubmissionType | null> {
  const query = `
    query FetchSubmission($id: ID!) {
      submission(id: $id) {
        _id
        results {
          scenarioId
          cooperationProbability
          responseTime
          answeredAt
        }
        realisedRoundIndex
        opponentProbs
        isCompleted
      }
    }
  `;
  const data = await runGraphQL<{ submission: SubmissionType | null }>(query, { id: submissionId });
  return data.submission;
}

export interface DebriefResult {
  realisedRoundIndex: number;
  opponentProbs: number[];
}

export async function drawRealisedRound(submissionId: string): Promise<DebriefResult> {
  const mutation = `
    mutation DrawRealisedRound($submissionId: ID!) {
      drawRealisedRound(submissionId: $submissionId) {
        realisedRoundIndex
        opponentProbs
      }
    }
  `;
  const data = await runGraphQL<{ drawRealisedRound: DebriefResult }>(mutation, { submissionId });
  return data.drawRealisedRound;
}

// ============================================================================
// Submissions
// ============================================================================

export async function fetchRecentSubmissions(): Promise<SubmissionType[]> {
  const query = `
    query RecentSubmissions {
      recentSubmissions(limit: 100) {
        _id
        sessionId
        participantId
        results {
          scenarioId
          cooperationProbability
          responseTime
          answeredAt
        }
        demographics {
          age
          gender
          education
        }
        isCompleted
        completedAt
        isInvalid
        createdAt
        updatedAt
      }
    }
  `;

  const data = await runGraphQL<{ recentSubmissions: SubmissionType[] }>(query);
  return data.recentSubmissions || [];
}

export async function invalidateSubmission(
  submissionId: string,
  isInvalid: boolean
): Promise<SubmissionType> {
  const mutation = `
    mutation InvalidateSubmission($submissionId: ID!, $isInvalid: Boolean!) {
      invalidateSubmission(submissionId: $submissionId, isInvalid: $isInvalid) {
        _id
        sessionId
        isCompleted
        isInvalid
      }
    }
  `;

  const data = await runGraphQL<{ invalidateSubmission: SubmissionType }>(mutation, {
    submissionId,
    isInvalid,
  });

  return data.invalidateSubmission;
}

// ============================================================================
// Scenario Queries
// ============================================================================

export async function fetchScenariosByIds(ids: string[]): Promise<Scenario[]> {
  const query = `
    query GetScenariosByIds($ids: [ID!]!) {
      scenarios(ids: $ids) {
        _id
        scenarioIndex
        focalNode
        opponentNode
        activeEdgeIds
        edgeStates
      }
    }
  `;

  try {
    const data = await runGraphQL<{ scenarios: Scenario[] }>(query, { ids });
    return data.scenarios || [];
  } catch (error) {
    console.error("Failed to fetch scenarios by IDs:", error);
    return [];
  }
}

// ============================================================================
// Database Management
// ============================================================================

export async function clearDatabase(): Promise<boolean> {
  const mutation = `
    mutation ClearDatabase {
      clearDatabase
    }
  `;

  try {
    const data = await runGraphQL<{ clearDatabase: boolean }>(mutation);
    return data.clearDatabase || false;
  } catch (error) {
    console.error("Failed to clear database via GraphQL:", error);
    return false;
  }
}


// Re-export types from types.ts for convenience
export type { Submission, SessionGroup, Scenario, Session } from '../types';
