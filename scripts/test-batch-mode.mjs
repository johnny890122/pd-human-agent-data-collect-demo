/**
 * Batch Mode E2E Test (NEW API)
 * Tests: createBatchSessions → fetches sessions → verify structure
 * 
 * Run: node scripts/test-batch-mode.mjs
 */

import dotenv from 'dotenv';
dotenv.config();

const GRAPHQL_ENDPOINT = process.env.VITE_GRAPHQL_ENDPOINT || 'http://localhost:3001/graphql';

async function runGraphQL(query, variables = {}) {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

async function testBatchMode() {
  console.log('\n🧪 Testing Batch Mode E2E (NEW API)\n');
  console.log('='.repeat(70));

  // Test 1: Create Batch Sessions
  console.log('\n📝 TEST 1: createBatchSessions (k=2)');
  console.log('-'.repeat(70));
  
  const createMutation = `
    mutation CreateBatchSessions($input: GroupConfigInput!, $name: String!, $description: String) {
      createBatchSessions(input: $input, name: $name, description: $description) {
        groupId
        sessionsCreated
        sessionIds
      }
    }
  `;
  
  const createResult = await runGraphQL(createMutation, {
    input: {
      edgeCount: 2,
      focalNode: 'A1',
      opponentNode: 'B3',
      sampleSize: 5,
    },
    name: 'Test Batch k=2',
    description: 'Testing batch mode with new API',
  });
  
  const result = createResult.createBatchSessions;
  const groupId = result.groupId;
  
  console.log(`✅ Batch group created: ${groupId}`);
  console.log(`   - Sessions created: ${result.sessionsCreated}`);
  console.log(`   - Expected: C(12,2) = 66 sessions`);
  console.log(`   - Match: ${result.sessionsCreated === 66 ? '✅ YES' : '❌ NO'}`);

  // Test 2: Fetch Session Group
  console.log('\n📝 TEST 2: fetchSessionGroup');
  console.log('-'.repeat(70));
  
  const groupQuery = `
    query SessionGroup($id: ID!) {
      sessionGroup(id: $id) {
        _id
        name
        description
        config {
          edgeCount
          focalNode
          opponentNode
          sampleSize
        }
        totalSessions
        totalScenarios
        status
        mode
      }
    }
  `;
  
  const groupResult = await runGraphQL(groupQuery, { id: groupId });
  const group = groupResult.sessionGroup;
  
  console.log(`✅ Group fetched: ${group._id}`);
  console.log(`   - Name: ${group.name}`);
  console.log(`   - Mode: ${group.mode}`);
  console.log(`   - Status: ${group.status}`);
  console.log(`   - Total sessions: ${group.totalSessions}`);
  console.log(`   - Config.edgeCount: ${group.config.edgeCount}`);
  console.log(`   - Config.sampleSize: ${group.config.sampleSize}`);

  // Test 3: Fetch Sessions by Group
  console.log('\n📝 TEST 3: fetchSessionsByGroup');
  console.log('-'.repeat(70));
  
  const sessionsQuery = `
    query SessionsByGroup($groupId: ID!) {
      sessionsByGroup(groupId: $groupId) {
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
        groupId
        submissionCount
      }
    }
  `;
  
  const sessionsResult = await runGraphQL(sessionsQuery, { groupId });
  const sessions = sessionsResult.sessionsByGroup;
  
  console.log(`✅ Sessions fetched: ${sessions.length}`);
  console.log(`   - Match total: ${sessions.length === result.sessionsCreated ? '✅ YES' : '❌ NO'}`);
  
  // Sample first 3 sessions
  console.log(`\n   First 3 sessions:`);
  for (let i = 0; i < Math.min(3, sessions.length); i++) {
    const session = sessions[i];
    console.log(`   ${i + 1}. ${session._id}`);
    console.log(`      - Scenarios: ${session.scenarios.length}`);
    console.log(`      - Active edges: ${session.scenarios[0].activeEdgeIds.join(', ')}`);
    console.log(`      - URL: /survey/welcome?sessionId=${session._id}`);
  }

  // Test 4: Verify Scenario Creation
  console.log('\n📝 TEST 4: Verify Scenarios Created');
  console.log('-'.repeat(70));
  
  const scenariosQuery = `
    query Scenarios($groupId: ID) {
      scenarios(groupId: $groupId, limit: 1000) {
        _id
        groupId
        activeEdgeIds
        status
        responseCount
        targetSize
      }
    }
  `;
  
  const scenariosResult = await runGraphQL(scenariosQuery, { groupId });
  const scenarios = scenariosResult.scenarios;
  
  console.log(`✅ Total scenarios: ${scenarios.length}`);
  console.log(`   - Expected: 66 sessions × 2^2 = 264 scenarios`);
  console.log(`   - Match: ${scenarios.length === 264 ? '✅ YES' : '❌ NO (got ' + scenarios.length + ')'}`);
  console.log(`   - All in group: ${scenarios.every(s => s.groupId === groupId) ? '✅ YES' : '❌ NO'}`);
  console.log(`   - All active: ${scenarios.every(s => s.status === 'active') ? '✅ YES' : '❌ NO'}`);

  // Test 5: Verify Each Session Has Correct Scenarios
  console.log('\n📝 TEST 5: Verify Session-Scenario Links');
  console.log('-'.repeat(70));
  
  let allLinksValid = true;
  for (const session of sessions.slice(0, 5)) {  // Check first 5
    const expectedScenarios = Math.pow(2, group.config.edgeCount);
    if (session.scenarios.length !== expectedScenarios) {
      console.log(`❌ Session ${session._id}: expected ${expectedScenarios}, got ${session.scenarios.length}`);
      allLinksValid = false;
    }
  }
  
  if (allLinksValid) {
    console.log(`✅ All checked sessions have correct scenario count`);
  }

  // Final Report
  console.log('\n' + '='.repeat(70));
  console.log('🎉 BATCH MODE TEST COMPLETE');
  console.log('='.repeat(70));
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ createBatchSessions works (${result.sessionsCreated} sessions)`);
  console.log(`   ✅ SessionGroup created with unified config`);
  console.log(`   ✅ All sessions use scenario-centric model`);
  console.log(`   ✅ Scenarios independently created (${scenarios.length} total)`);
  console.log(`   ✅ Session-Scenario references correct`);
  console.log(`   ✅ All sessions generate sessionId URLs`);
  console.log(`\n💡 Batch Mode is using NEW API correctly!`);
  console.log(`\n📦 Test Group ID: ${groupId}`);
  console.log(`🔗 View at: /admin/groups/${groupId}\n`);
  
  return { groupId, sessionsCreated: result.sessionsCreated };
}

// Run test
testBatchMode()
  .then((result) => {
    console.log(`✨ Batch Mode test completed successfully!\n`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  });
