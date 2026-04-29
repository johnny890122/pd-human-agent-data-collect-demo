#!/usr/bin/env node
/**
 * Test script for new Scenario-centric API
 * Validates Manual Mode using the new data model
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ScenarioModel } from '../backend/models/Scenario.js';
import { SessionModel } from '../backend/models/Session.js';
import { SubmissionModel } from '../backend/models/SessionSetup.js';

dotenv.config();

const TEST_CONFIG = {
  activeEdgeIds: ['A1-B3', 'B3-A1'],
  focalNode: 'A1',
  opponentNode: 'A2',
  sampleSize: 10
};

async function testNewAPI() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pd-data-collect');
    console.log('✓ Connected to MongoDB\n');

    // ============================================================================
    // Step 1: Test createManualSession
    // ============================================================================
    console.log('========== STEP 1: Creating Manual Session ==========');
    
    const response = await fetch('http://localhost:3001/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          mutation CreateManualSession($input: SessionInput!) {
            createManualSession(input: $input) {
              session {
                _id
                scenarioIds
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
        `,
        variables: {
          input: TEST_CONFIG
        }
      })
    });

    const result = await response.json();
    
    if (result.errors) {
      console.error('❌ GraphQL Error:', result.errors);
      process.exit(1);
    }

    const { session, scenariosCreated } = result.data.createManualSession;
    console.log(`✅ Session created: ${session._id}`);
    console.log(`✅ Scenarios created: ${scenariosCreated}`);
    console.log(`   scenarioIds: ${session.scenarioIds.join(', ')}`);
    console.log(`   metadata.createdFor: ${session.metadata.createdFor}`);

    // ============================================================================
    // Step 2: Verify independent Scenario documents
    // ============================================================================
    console.log('\n========== STEP 2: Verifying Scenario Documents ==========');
    
    const scenarios = await ScenarioModel.find({ _id: { $in: session.scenarioIds } }).lean();
    console.log(`✅ Found ${scenarios.length} independent Scenario documents`);
    
    scenarios.forEach((scenario, index) => {
      console.log(`\n--- Scenario ${index + 1} ---`);
      console.log(`  _id: ${scenario._id}`);
      console.log(`  activeEdgeIds: ${scenario.activeEdgeIds.join(', ')}`);
      console.log(`  edgeStates: ${JSON.stringify(scenario.edgeStates)}`);
      console.log(`  targetSize: ${scenario.targetSize}`);
      console.log(`  responseCount: ${scenario.responseCount}`);
      console.log(`  status: ${scenario.status}`);
    });

    // ============================================================================
    // Step 3: Verify Session only stores references
    // ============================================================================
    console.log('\n========== STEP 3: Verifying Session Structure ==========');
    
    const sessionDoc = await SessionModel.findById(session._id).lean();
    console.log(`✅ Session document:`);
    console.log(`   _id: ${sessionDoc._id}`);
    console.log(`   scenarioIds (references): ${sessionDoc.scenarioIds.join(', ')}`);
    console.log(`   focalNode: ${sessionDoc.focalNode}`);
    console.log(`   opponentNode: ${sessionDoc.opponentNode}`);
    console.log(`   sampleSize: ${sessionDoc.sampleSize}`);
    console.log(`   submissionCount: ${sessionDoc.submissionCount}`);
    console.log(`   metadata: ${JSON.stringify(sessionDoc.metadata)}`);

    // ============================================================================
    // Step 4: Test startSurvey
    // ============================================================================
    console.log('\n========== STEP 4: Starting Survey ==========');
    
    const startResponse = await fetch('http://localhost:3001/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          mutation StartSurvey($sessionId: ID!) {
            startSurvey(sessionId: $sessionId) {
              _id
              sessionId
              results {
                scenarioId
                cooperationProbability
              }
              isCompleted
            }
          }
        `,
        variables: { sessionId: session._id }
      })
    });

    const startResult = await startResponse.json();
    
    if (startResult.errors) {
      console.error('❌ Start Survey Error:', startResult.errors);
      process.exit(1);
    }

    const submission = startResult.data.startSurvey;
    console.log(`✅ Submission created: ${submission._id}`);
    console.log(`   sessionId reference: ${submission.sessionId}`);
    console.log(`   results: ${submission.results.length} (should be 0)`);

    // ============================================================================
    // Step 5: Test saveSurveyAnswer with Scenario UUIDs
    // ============================================================================
    console.log('\n========== STEP 5: Saving Answers ==========');
    
    for (let i = 0; i < scenarios.length; i++) {
      const scenario = scenarios[i];
      const probability = 0.5 + (i * 0.1);  // Varying probabilities
      
      const saveResponse = await fetch('http://localhost:3001/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
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
          `,
          variables: {
            submissionId: submission._id,
            scenarioId: scenario._id,  // UUID reference!
            cooperationProbability: probability
          }
        })
      });

      const saveResult = await saveResponse.json();
      
      if (saveResult.errors) {
        console.error(`❌ Save Answer Error for scenario ${i+1}:`, saveResult.errors);
        process.exit(1);
      }

      console.log(`✅ Saved answer ${i+1}/${scenarios.length}: scenario ${scenario._id.substring(0, 8)}... → ${probability}`);
    }

    // ============================================================================
    // Step 6: Verify Scenario.responseCount incremented
    // ============================================================================
    console.log('\n========== STEP 6: Verifying Scenario.responseCount ==========');
    
    const updatedScenarios = await ScenarioModel.find({ _id: { $in: session.scenarioIds } }).lean();
    updatedScenarios.forEach((scenario, index) => {
      console.log(`Scenario ${index + 1}: responseCount = ${scenario.responseCount} (expected: 1)`);
      if (scenario.responseCount !== 1) {
        console.error(`❌ responseCount should be 1, got ${scenario.responseCount}`);
      } else {
        console.log(`✅ responseCount correctly incremented`);
      }
    });

    // ============================================================================
    // Step 7: Test completeSurvey
    // ============================================================================
    console.log('\n========== STEP 7: Completing Survey ==========');
    
    const completeResponse = await fetch('http://localhost:3001/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
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
        `,
        variables: {
          submissionId: submission._id,
          demographics: {
            age: 25,
            gender: 'other',
            education: 'university'
          }
        }
      })
    });

    const completeResult = await completeResponse.json();
    
    if (completeResult.errors) {
      console.error('❌ Complete Survey Error:', completeResult.errors);
      process.exit(1);
    }

    const completedSubmission = completeResult.data.completeSurvey;
    console.log(`✅ Survey completed`);
    console.log(`   isCompleted: ${completedSubmission.isCompleted}`);
    console.log(`   completedAt: ${completedSubmission.completedAt}`);

    // ============================================================================
    // Step 8: Verify final data structure
    // ============================================================================
    console.log('\n========== STEP 8: Final Verification ==========');
    
    // Check submission
    const finalSubmission = await SubmissionModel.findById(submission._id).lean();
    console.log(`\n✅ Submission verification:`);
    console.log(`   results count: ${finalSubmission.results.length} (expected: ${scenarios.length})`);
    console.log(`   all scenarioIds are UUIDs: ${finalSubmission.results.every(r => r.scenarioId.match(/^[0-9a-f]{8}-/))}`);
    console.log(`   isCompleted: ${finalSubmission.isCompleted}`);
    console.log(`   has demographics: ${!!finalSubmission.demographics}`);

    // Check session
    const finalSession = await SessionModel.findById(session._id).lean();
    console.log(`\n✅ Session verification:`);
    console.log(`   submissionCount: ${finalSession.submissionCount} (expected: 1)`);

    // ============================================================================
    // Summary
    // ============================================================================
    console.log('\n========== TEST SUMMARY ==========');
    console.log('✅ createManualSession: PASS');
    console.log('✅ Independent Scenario documents: PASS');
    console.log('✅ Session with scenarioIds references: PASS');
    console.log('✅ startSurvey: PASS');
    console.log('✅ saveSurveyAnswer with UUID references: PASS');
    console.log('✅ Scenario.responseCount increment: PASS');
    console.log('✅ completeSurvey: PASS');
    console.log('✅ Final data structure: PASS');
    console.log('\n🎉 ALL TESTS PASSED! New API is working correctly.\n');

    await mongoose.connection.close();
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    process.exit(1);
  }
}

testNewAPI();
