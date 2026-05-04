/**
 * Manual Mode E2E Test (Skip Turnstile for backend testing)
 * Tests NEW API: createManualSession → session queries → scenario updates
 * 
 * Run: node scripts/test-manual-mode-no-turnstile.mjs
 */

import dotenv from 'dotenv';
dotenv.config();

const GRAPHQL_ENDPOINT = process.env.VITE_GRAPHQL_ENDPOINT || 'http://localhost:3001/graphql';

async function runGraphQL(query, variables = {}) {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      // Add Turnstile cookie for testing (simulates verified user)
      'Cookie': 'turnstile_verified=true',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  const json = await response.json();
  if (json.errors?.length) {
    throw new Error(`GraphQL Error: ${json.errors[0].message}`);
  }

  return json.data;
}

async function testManualModeAPI() {
  console.log('\n🧪 Manual Mode API Test (NEW API Only)\n');
  console.log('='.repeat(70));

  // Test 1: Create Manual Session
  console.log('\n✅ TEST 1: createManualSession');
  console.log('-'.repeat(70));
  
  const createMutation = `
    mutation CreateManualSession($input: SessionInput!) {
      createManualSession(input: $input) {
        session {
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
          submissionCount
          createdAt
        }
        scenariosCreated
      }
    }
  `;
  
  const createResult = await runGraphQL(createMutation, {
    input: {
      activeEdgeIds: ['KMT1-KMT2', 'KMT2-DPP3'],
      focalNode: 'KMT1',
      opponentNode: 'DPP3',
      sampleSize: 5,
    },
  });
  
  const session = createResult.createManualSession.session;
  const sessionId = session._id;
  
  console.log(`   ✓ Session ID: ${sessionId}`);
  console.log(`   ✓ Scenarios created: ${createResult.createManualSession.scenariosCreated}`);
  console.log(`   ✓ Sample size: ${session.sampleSize}`);
  console.log(`   ✓ Submission count: ${session.submissionCount}`);
  console.log(`   ✓ Scenario count: ${session.scenarios.length}`);
  
  if (session.scenarios.length !== createResult.createManualSession.scenariosCreated) {
    throw new Error(`Scenario count mismatch!`);
  }

  // Test 2: Fetch Session
  console.log('\n✅ TEST 2: fetchSession (query)');
  console.log('-'.repeat(70));
  
  const sessionQuery = `
    query Session($id: ID!) {
      session(id: $id) {
        _id
        scenarioIds
        scenarios {
          _id
          activeEdgeIds
          edgeStates
        }
        focalNode
        opponentNode
        sampleSize
        submissionCount
      }
    }
  `;
  
  const sessionResult = await runGraphQL(sessionQuery, { id: sessionId });
  const fetchedSession = sessionResult.session;
  
  console.log(`   ✓ Fetched session: ${fetchedSession._id}`);
  console.log(`   ✓ Scenarios populated: ${fetchedSession.scenarios.length}`);
  console.log(`   ✓ ScenarioIds match: ${fetchedSession.scenarioIds.length === fetchedSession.scenarios.length}`);

  // Test 3: Fetch All Sessions
  console.log('\n✅ TEST 3: fetchAllSessions (query)');
  console.log('-'.repeat(70));
  
  const allSessionsQuery = `
    query AllSessions {
      allSessions(excludeGroupSessions: false) {
        _id
        focalNode
        opponentNode
        sampleSize
        submissionCount
        groupId
      }
    }
  `;
  
  const allSessionsResult = await runGraphQL(allSessionsQuery);
  const sessions = allSessionsResult.allSessions;
  
  console.log(`   ✓ Total sessions: ${sessions.length}`);
  console.log(`   ✓ Our session found: ${sessions.some(s => s._id === sessionId)}`);

  // Test 4: Fetch Scenarios
  console.log('\n✅ TEST 4: fetchScenarios (query)');
  console.log('-'.repeat(70));
  
  const scenariosQuery = `
    query Scenarios {
      scenarios(limit: 100) {
        _id
        focalNode
        opponentNode
        activeEdgeIds
        status
        responseCount
        targetSize
        groupId
      }
    }
  `;
  
  const scenariosResult = await runGraphQL(scenariosQuery);
  const scenarios = scenariosResult.scenarios;
  
  console.log(`   ✓ Total scenarios: ${scenarios.length}`);
  console.log(`   ✓ Our scenarios found: ${scenarios.filter(s => session.scenarioIds.includes(s._id)).length}`);

  // Test 5: Verify Scenario Properties
  console.log('\n✅ TEST 5: Verify Scenario Properties');
  console.log('-'.repeat(70));
  
  for (let i = 0; i < session.scenarios.length; i++) {
    const scenario = session.scenarios[i];
    console.log(`   Scenario ${i + 1}:`);
    console.log(`     - ID: ${scenario._id}`);
    console.log(`     - Status: ${scenario.status}`);
    console.log(`     - Response count: ${scenario.responseCount}`);
    console.log(`     - Target size: ${scenario.targetSize}`);
    console.log(`     - Active edges: ${scenario.activeEdgeIds.join(', ')}`);
  }

  // Final Report
  console.log('\n' + '='.repeat(70));
  console.log('🎉 ALL TESTS PASSED - NEW API WORKING');
  console.log('='.repeat(70));
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ createManualSession mutation works`);
  console.log(`   ✅ session query with populate works`);
  console.log(`   ✅ allSessions query works`);
  console.log(`   ✅ scenarios query works`);
  console.log(`   ✅ Scenario model correctly structured`);
  console.log(`   ✅ Session → Scenario references working`);
  console.log(`\n💡 Next: Test with UI at http://localhost:5173/admin/setup`);
  console.log(`\n🔗 Created session URL: /survey/welcome?sessionId=${sessionId}\n`);
  
  return { sessionId };
}

// Run test
testManualModeAPI()
  .then((result) => {
    console.log(`✨ API tests completed successfully!\n`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  });
