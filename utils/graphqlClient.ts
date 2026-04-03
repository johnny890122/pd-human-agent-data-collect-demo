import { ExperimentSetup, SurveyResult } from '../types';

const GRAPHQL_ENDPOINT = import.meta.env.VITE_GRAPHQL_ENDPOINT ?? '/graphql';

interface GraphQLResponse<TData> {
  data?: TData;
  errors?: Array<{ message: string }>;
}

interface GraphExperimentSetup {
  id?: string;
  activeEdgeIds: string[];
  scenarios: any[];
  focalNode: string;
  opponentNode: string;
  sampleSize: number;
  submissionCount?: number;
  updatedAt?: string;
}

const CANONICAL_AGENT_IDS = new Set(['1', '2', '3', '4']);

function normalizeAgentId(id: string | undefined): string {
  if (!id) return '1';
  if (CANONICAL_AGENT_IDS.has(id)) return id;
  return '1';
}

function normalizeEdgeId(edgeId: string): string {
  const [sourceRaw, targetRaw] = edgeId.split('-');
  if (!sourceRaw || !targetRaw) {
    return edgeId;
  }
  const source = normalizeAgentId(sourceRaw.trim());
  const target = normalizeAgentId(targetRaw.trim());
  return `${source}-${target}`;
}

function normalizeScenarios(
  scenarios: any[]
): any[] {
  if (!Array.isArray(scenarios)) return [];

  return scenarios.map((scenario) => {
    if (!scenario || typeof scenario !== 'object') return scenario;
    const edgeStates = scenario.edgeStates;
    if (!edgeStates || typeof edgeStates !== 'object') {
      return scenario;
    }

    const normalizedEdgeStates = Object.fromEntries(
      Object.entries(edgeStates).map(([edgeId, state]) => [normalizeEdgeId(edgeId), state])
    );

    return {
      ...scenario,
      edgeStates: normalizedEdgeStates,
    };
  });
}

function setupToGraphInput(setup: ExperimentSetup): GraphExperimentSetup {
  return {
    activeEdgeIds: setup.activeEdgeIds,
    scenarios: setup.scenarios,
    focalNode: setup.focalNode,
    opponentNode: setup.opponentNode,
    sampleSize: setup.sampleSize,
  };
}

function setupFromGraph(graph: GraphExperimentSetup): ExperimentSetup {
  const focalNode = normalizeAgentId(graph.focalNode);
  let opponentNode = normalizeAgentId(graph.opponentNode);
  if (opponentNode === focalNode) {
    opponentNode = focalNode === '1' ? '2' : '1';
  }

  return {
    id: graph.id,
    activeEdgeIds: (graph.activeEdgeIds || []).map(normalizeEdgeId),
    scenarios: normalizeScenarios(graph.scenarios),
    focalNode,
    opponentNode,
    sampleSize: graph.sampleSize,
    submissionCount: graph.submissionCount,
    updatedAt: graph.updatedAt,
  };
}


async function runGraphQL<TData>(query: string, variables?: Record<string, unknown>): Promise<TData> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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

export async function fetchActiveExperimentSetup(): Promise<ExperimentSetup | null> {
  const query = `
    query ActiveExperimentSetup {
      activeExperimentSetup {
        id
        activeEdgeIds
        scenarios
        focalNode
        opponentNode
        sampleSize
      }
    }

  `;

  const data = await runGraphQL<{ activeExperimentSetup: GraphExperimentSetup | null }>(query);
  if (!data.activeExperimentSetup) {
    return null;
  }
  return setupFromGraph(data.activeExperimentSetup);
}
 
export async function fetchExperimentSetup(id: string): Promise<ExperimentSetup | null> {
  const query = `
    query ExperimentSetup($id: ID!) {
      experimentSetup(id: $id) {
        id
        activeEdgeIds
        scenarios
        focalNode
        opponentNode
        sampleSize
        submissionCount
      }
    }
  `;
 
  const data = await runGraphQL<{ experimentSetup: GraphExperimentSetup | null }>(query, { id });
  if (!data.experimentSetup) {
    return null;
  }
  return setupFromGraph(data.experimentSetup);
}
 
export async function fetchAllExperimentSetups(): Promise<ExperimentSetup[]> {
  const query = `
    query AllExperimentSetups {
      allExperimentSetups {
        id
        activeEdgeIds
        scenarios
        focalNode
        opponentNode
        sampleSize
        submissionCount
        updatedAt
      }
    }
  `;
 
  const data = await runGraphQL<{ allExperimentSetups: GraphExperimentSetup[] }>(query);
  return data.allExperimentSetups.map(setupFromGraph);
}

export async function saveExperimentSetup(setup: ExperimentSetup): Promise<ExperimentSetup> {
  const mutation = `
    mutation SaveExperimentSetup($setup: ExperimentSetupInput!) {
      saveExperimentSetup(setup: $setup) {
        id
        focalNode
        opponentNode
        sampleSize
        submissionCount
      }
    }
  `;

  const data = await runGraphQL<{ saveExperimentSetup: GraphExperimentSetup }>(mutation, {
    setup: setupToGraphInput(setup),
  });
  return setupFromGraph(data.saveExperimentSetup);
}

export async function submitSurvey(
  sessionId: string,
  edgeId: string,
  results: SurveyResult[],
  demographics: { age: number; gender: string; education: string }
): Promise<void> {
  const mutation = `
    mutation SubmitSurvey($sessionId: String!, $edgeId: String!, $results: [SurveyAnswerInput!]!, $demographics: DemographicInput!) {
      submitSurvey(sessionId: $sessionId, edgeId: $edgeId, results: $results, demographics: $demographics) {
        sessionId
      }
    }
  `;

  await runGraphQL(mutation, {
    sessionId,
    edgeId,
    results,
    demographics,
  });
}

export async function startSurveyEntry(sessionId: string, edgeId: string): Promise<string> {
  const mutation = `
    mutation StartSurveyEntry($sessionId: String!, $edgeId: String!) {
      startSurveyEntry(sessionId: $sessionId, edgeId: $edgeId) {
        id
      }
    }
  `;

  const data = await runGraphQL<{ startSurveyEntry: { id: string } }>(mutation, {
    sessionId,
    edgeId,
  });

  return data.startSurveyEntry.id;
}

export async function saveSurveyAnswer(entryId: string, answer: SurveyResult): Promise<void> {
  const mutation = `
    mutation SaveSurveyAnswer($entryId: ID!, $answer: SurveyAnswerInput!) {
      saveSurveyAnswer(entryId: $entryId, answer: $answer) {
        id
      }
    }
  `;

  await runGraphQL(mutation, {
    entryId,
    answer,
  });
}

export async function completeSurveyEntry(
  entryId: string,
  demographics: { age: number; gender: string; education: string }
): Promise<void> {
  const mutation = `
    mutation CompleteSurveyEntry($entryId: ID!, $demographics: DemographicInput!) {
      completeSurveyEntry(entryId: $entryId, demographics: $demographics) {
        id
      }
    }
  `;

  await runGraphQL(mutation, {
    entryId,
    demographics,
  });
}


export interface EdgeConfigEntry {
  id: string;
  sessionId: string;
  edgeId: string;
  results: any[];
  demographics: any;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function fetchRecentSubmissions(): Promise<EdgeConfigEntry[]> {
  const query = `
    query RecentSubmissions {
      recentSubmissions(limit: 100) {
        id
        sessionId
        edgeId
        isCompleted
        createdAt
        updatedAt
      }
    }
  `;
  const data = await runGraphQL<{ recentSubmissions: EdgeConfigEntry[] }>(query);
  return data.recentSubmissions || [];
}

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
