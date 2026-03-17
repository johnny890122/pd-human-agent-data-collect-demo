const endpoint = process.env.SMOKE_GRAPHQL_ENDPOINT || 'http://localhost:3000/graphql';

async function graphQL(query, variables = {}) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${endpoint}`);
  }

  const payload = await response.json();
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((err) => err.message).join('; '));
  }

  return payload.data;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function run() {
  const nonce = Date.now();
  const sessionId = `smoke-${nonce}`;
  const edgeId = `SMOKE-${nonce}`;

  const setupInput = {
    activeEdgeIds: [edgeId],
    edgeConfigs: [
      {
        edgeId,
        label: 'SmokeLabel',
        low: 'LowState',
        high: 'HighState',
      },
    ],
    decisionMaker: 'HB',
    opponent: 'RA',
  };

  const saveSetupData = await graphQL(
    `mutation SaveSetup($setup: ExperimentSetupInput!) {
      saveExperimentSetup(setup: $setup) {
        activeEdgeIds
        decisionMaker
        opponent
      }
    }`,
    { setup: setupInput }
  );

  assert(saveSetupData?.saveExperimentSetup, 'saveExperimentSetup returned no data');
  assert(
    saveSetupData.saveExperimentSetup.activeEdgeIds.includes(edgeId),
    'saved setup does not include expected edge id'
  );

  const submitData = await graphQL(
    `mutation SubmitSurvey($sessionId: String!, $setup: ExperimentSetupInput!, $results: [SurveyAnswerInput!]!) {
      submitSurvey(sessionId: $sessionId, setup: $setup, results: $results) {
        id
        sessionId
        createdAt
      }
    }`,
    {
      sessionId,
      setup: setupInput,
      results: [{ scenarioId: 1, cooperationProbability: 0.6 }],
    }
  );

  assert(submitData?.submitSurvey?.id, 'submitSurvey did not return an id');
  assert(
    submitData.submitSurvey.sessionId === sessionId,
    'submitSurvey returned unexpected sessionId'
  );

  const readSetupData = await graphQL(`query ReadSetup {
    activeExperimentSetup {
      activeEdgeIds
      decisionMaker
      opponent
    }
  }`);

  assert(readSetupData?.activeExperimentSetup, 'activeExperimentSetup returned no data');
  assert(
    readSetupData.activeExperimentSetup.activeEdgeIds.includes(edgeId),
    'activeExperimentSetup does not match the setup saved in this smoke run'
  );

  console.log('Smoke e2e passed');
  console.log(`endpoint=${endpoint}`);
  console.log(`sessionId=${sessionId}`);
  console.log(`submissionId=${submitData.submitSurvey.id}`);
}

run().catch((error) => {
  console.error('Smoke e2e failed');
  console.error(error.message);
  process.exit(1);
});
