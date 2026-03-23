import { ExperimentSetup, SurveyResult } from '../types';

const GRAPHQL_ENDPOINT = import.meta.env.VITE_GRAPHQL_ENDPOINT ?? '/graphql';
const isTestMode = import.meta.env.MODE === 'test';

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
  return {
    id: graph.id,
    activeEdgeIds: graph.activeEdgeIds,
    scenarios: graph.scenarios,
    focalNode: graph.focalNode,
    opponentNode: graph.opponentNode,
    sampleSize: graph.sampleSize,
    submissionCount: graph.submissionCount,
    updatedAt: graph.updatedAt,
  };
}


async function runGraphQL<TData>(query: string, variables?: Record<string, unknown>): Promise<TData> {
  if (isTestMode) {
    throw new Error('GraphQL calls are disabled in test mode.');
  }

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

