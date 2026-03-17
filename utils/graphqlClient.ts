import { EdgeConfig, ExperimentSetup, SurveyResult } from '../types';

const GRAPHQL_ENDPOINT = import.meta.env.VITE_GRAPHQL_ENDPOINT ?? '/graphql';
const isTestMode = import.meta.env.MODE === 'test';

interface GraphQLResponse<TData> {
  data?: TData;
  errors?: Array<{ message: string }>;
}

interface EdgeConfigEntry {
  edgeId: string;
  label: string;
  low: string;
  high: string;
}

interface GraphExperimentSetup {
  activeEdgeIds: string[];
  edgeConfigs: EdgeConfigEntry[];
  decisionMaker: string;
  opponent: string;
}

function setupToGraphInput(setup: ExperimentSetup): GraphExperimentSetup {
  return {
    activeEdgeIds: setup.activeEdgeIds,
    edgeConfigs: Object.entries(setup.edgeConfigs).map(([edgeId, cfg]) => ({
      edgeId,
      label: cfg.label,
      low: cfg.low,
      high: cfg.high,
    })),
    decisionMaker: setup.decisionMaker,
    opponent: setup.opponent,
  };
}

function setupFromGraph(graph: GraphExperimentSetup): ExperimentSetup {
  const edgeConfigs: Record<string, EdgeConfig> = {};
  for (const entry of graph.edgeConfigs) {
    edgeConfigs[entry.edgeId] = {
      label: entry.label,
      low: entry.low,
      high: entry.high,
    };
  }
  return {
    activeEdgeIds: graph.activeEdgeIds,
    edgeConfigs,
    decisionMaker: graph.decisionMaker as ExperimentSetup['decisionMaker'],
    opponent: graph.opponent as ExperimentSetup['opponent'],
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
        activeEdgeIds
        edgeConfigs {
          edgeId
          label
          low
          high
        }
        decisionMaker
        opponent
      }
    }
  `;

  const data = await runGraphQL<{ activeExperimentSetup: GraphExperimentSetup | null }>(query);
  if (!data.activeExperimentSetup) {
    return null;
  }
  return setupFromGraph(data.activeExperimentSetup);
}

export async function saveExperimentSetup(setup: ExperimentSetup): Promise<void> {
  const mutation = `
    mutation SaveExperimentSetup($setup: ExperimentSetupInput!) {
      saveExperimentSetup(setup: $setup) {
        decisionMaker
      }
    }
  `;

  await runGraphQL(mutation, {
    setup: setupToGraphInput(setup),
  });
}

export async function submitSurvey(sessionId: string, setup: ExperimentSetup, results: SurveyResult[]): Promise<void> {
  const mutation = `
    mutation SubmitSurvey($sessionId: String!, $setup: ExperimentSetupInput!, $results: [SurveyAnswerInput!]!) {
      submitSurvey(sessionId: $sessionId, setup: $setup, results: $results) {
        id
      }
    }
  `;

  await runGraphQL(mutation, {
    sessionId,
    setup: setupToGraphInput(setup),
    results,
  });
}
