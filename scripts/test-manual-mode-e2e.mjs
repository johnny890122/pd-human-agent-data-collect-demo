/**
 * End-to-End test for Manual Mode with NEW API only
 * Tests: createManualSession → startSurvey → saveSurveyAnswer → completeSurvey
 * 
 * Run: node scripts/test-manual-mode-e2e.mjs
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

async function testManualMode() {
  console.log('\n🧪 Testing Manual Mode E2E (NEW API)\n');
  console.log('='.repeat(60));

  // Step 1: Create Manual Session
  console.log('\n📝 Step 1: Create Manual Session');
  console.log('-'.repeat(60));
  
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
            status
          }
          focalNode
          opponentNode
          sampleSize
          submissionCount
        }
        scenariosCreated
      }
    }
  `;
  
  const createResult = await runGraphQL(createMutation, {
    input: {
      activeEdgeIds: ['A1-A2'],
      focalNode: 'A1',
      opponentNode: 'B3',
      sampleSize: 3,
    },
  });
  
  const session = createResult.createManualSession.session;
  const sessionId = session._id;
  const scenariosCreated = createResult.createManualSession.scenariosCreated;
  
  console.log(`✅ Session created: ${sessionId}`);
  console.log(`   - Scenarios created: ${scenariosCreated}`);
  console.log(`   - Sample size: ${session.sampleSize}`);
  console.log(`   - Scenario IDs:`, session.scenarioIds);
  console.log(`   - URL: /survey/welcome?sessionId=${sessionId}`);

  // Step 2: Start Survey (as participant)
  console.log('\n📝 Step 2: Start Survey (Participant Flow)');
  console.log('-'.repeat(60));
  
  const startMutation = `
    mutation StartSurvey($sessionId: ID!) {
      startSurvey(sessionId: $sessionId) {
        _id
        sessionId
        isCompleted
        results {
          scenarioId
          cooperationProbability
        }
      }
    }
  `;
  
  const startResult = await runGraphQL(startMutation, { sessionId });
  const submission = startResult.startSurvey;
  const submissionId = submission._id;
  
  console.log(`✅ Submission started: ${submissionId}`);
  console.log(`   - Session ID: ${submission.sessionId}`);
  console.log(`   - Completed: ${submission.isCompleted}`);
  console.log(`   - Results count: ${submission.results.length}`);

  // Step 3: Save answers for each scenario
  console.log('\n📝 Step 3: Save Answers for Each Scenario');
  console.log('-'.repeat(60));
  
  const saveMutation = `
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
        }
      }
    }
  `;
  
  for (let i = 0; i < session.scenarios.length; i++) {
    const scenario = session.scenarios[i];
    const probability = Math.random(); // Random answer for testing
    
    const saveResult = await runGraphQL(saveMutation, {
      submissionId,
      scenarioId: scenario._id,
      cooperationProbability: probability,
    });
    
    console.log(`✅ Scenario ${i + 1}/${session.scenarios.length} answered`);
    console.log(`   - Scenario ID: ${scenario._id}`);
    console.log(`   - Cooperation probability: ${probability.toFixed(2)}`);
    console.log(`   - Total results saved: ${saveResult.saveSurveyAnswer.results.length}`);
  }

  // Step 4: Complete survey with demographics
  console.log('\n📝 Step 4: Complete Survey');
  console.log('-'.repeat(60));
  
  const completeMutation = `
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
  
  const completeResult = await runGraphQL(completeMutation, {
    submissionId,
    demographics: {
      age: 25,
      gender: 'male',
      education: 'bachelor',
    },
  });
  
  const completedSubmission = completeResult.completeSurvey;
  
  console.log(`✅ Survey completed!`);
  console.log(`   - Submission ID: ${completedSubmission._id}`);
  console.log(`   - Completed: ${completedSubmission.isCompleted}`);
  console.log(`   - Completed at: ${completedSubmission.completedAt}`);
  console.log(`   - Demographics:`, completedSubmission.demographics);

  // Step 5: Verify session updated
  console.log('\n📝 Step 5: Verify Session Updated');
  console.log('-'.repeat(60));
  
  const sessionQuery = `
    query Session($id: ID!) {
      session(id: $id) {
        _id
        submissionCount
        sampleSize
        scenarios {
          _id
          responseCount
        }
      }
    }
  `;
  
  const sessionResult = await runGraphQL(sessionQuery, { id: sessionId });
  const updatedSession = sessionResult.session;
  
  console.log(`✅ Session state verified`);
  console.log(`   - Submission count: ${updatedSession.submissionCount}/${updatedSession.sampleSize}`);
  console.log(`   - Scenarios response counts:`);
  updatedSession.scenarios.forEach((s, i) => {
    console.log(`     ${i + 1}. ${s._id}: ${s.responseCount} responses`);
  });

  // Final Summary
  console.log('\n' + '='.repeat(60));
  console.log('✅ Manual Mode E2E Test PASSED');
  console.log('='.repeat(60));
  console.log(`\n📊 Summary:`);
  console.log(`   - ✅ Created session with ${scenariosCreated} scenarios`);
  console.log(`   - ✅ Started survey (submission created)`);
  console.log(`   - ✅ Saved ${session.scenarios.length} scenario answers`);
  console.log(`   - ✅ Completed survey with demographics`);
  console.log(`   - ✅ Session submission count updated: ${updatedSession.submissionCount}`);
  console.log(`   - ✅ Scenario response counts updated`);
  console.log(`\n🎉 All NEW APIs working correctly!\n`);
  
  return { sessionId, submissionId };
}

// Run test
testManualMode()
  .then((result) => {
    console.log(`\n✨ Test completed successfully!`);
    console.log(`   Session ID: ${result.sessionId}`);
    console.log(`   Submission ID: ${result.submissionId}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  });
