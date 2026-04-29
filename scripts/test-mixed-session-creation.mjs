/**
 * Test Mixed Mode Session Creation (bypassing Turnstile for debugging)
 * This directly tests the startMixedSession logic
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config();

// Import models
import { SessionModel } from '../backend/models/Session.js';
import { ScenarioModel } from '../backend/models/Scenario.js';
import { SessionGroupModel } from '../backend/models/SessionGroup.js';
import { balancedSelect } from '../utils/scenarioSelection.js';

async function testMixedSessionCreation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pd-data-collect');
    console.log('✅ Connected to MongoDB\n');
    
    // Find a Mixed Mode group
    const group = await SessionGroupModel.findOne({ 'config.maxK': { $exists: true } }).lean();
    
    if (!group) {
      console.log('❌ No Mixed Mode group found. Create one first via Admin UI.');
      await mongoose.connection.close();
      return;
    }
    
    console.log('Found Mixed Mode Group:');
    console.log(`  ID: ${group._id}`);
    console.log(`  Name: ${group.name}`);
    console.log(`  maxK: ${group.config.maxK}`);
    console.log(`  scenariosPerSession: ${group.config.scenariosPerSession}`);
    console.log(`  Total Scenarios: ${group.totalScenarios}\n`);
    
    const groupId = String(group._id);
    const config = group.config || {};
    const scenariosPerSession = config.scenariosPerSession || 20;
    const participantId = `test-participant-${Date.now()}`;
    
    // Simulate startMixedSession logic
    console.log('🔍 Fetching active scenarios...');
    const candidateScenarios = await ScenarioModel.find({ 
      groupId, 
      status: 'active' 
    }).lean();
    
    console.log(`Found ${candidateScenarios.length} active scenarios\n`);
    
    // Show first 10 scenarios
    console.log('First 10 scenarios in pool:');
    candidateScenarios.slice(0, 10).forEach((s, i) => {
      console.log(`  ${i+1}. ID: ${s._id.substring(0, 8)}..., edges: ${JSON.stringify(s.activeEdgeIds)}, k=${s.activeEdgeIds.length}`);
    });
    
    // Use balanced selection
    console.log(`\n🎲 Selecting ${scenariosPerSession} scenarios using balanced strategy...`);
    const selectedScenarioIds = balancedSelect(candidateScenarios, scenariosPerSession);
    
    console.log(`Selected ${selectedScenarioIds.length} scenario IDs`);
    console.log('Selected IDs:', selectedScenarioIds.map(id => id.substring(0, 8) + '...'));
    
    // Check for duplicates
    const uniqueIds = [...new Set(selectedScenarioIds)];
    if (uniqueIds.length !== selectedScenarioIds.length) {
      console.log(`\n❌ BUG FOUND: balancedSelect returned ${selectedScenarioIds.length} IDs but only ${uniqueIds.length} are unique!`);
      console.log('Duplicate IDs detected!');
    } else {
      console.log(`\n✅ All ${selectedScenarioIds.length} selected IDs are unique`);
    }
    
    // Fetch full scenario details
    const selectedScenarios = await ScenarioModel.find({ 
      _id: { $in: selectedScenarioIds } 
    }).lean();
    
    console.log(`\nFetched ${selectedScenarios.length} scenario documents`);
    
    // Analyze selected scenarios
    console.log('\nSelected Scenarios Analysis:');
    selectedScenarios.forEach((s, i) => {
      console.log(`  ${i+1}. edges: ${JSON.stringify(s.activeEdgeIds)}, states: ${JSON.stringify(s.edgeStates)}, index: ${s.scenarioIndex}`);
    });
    
    // Check edge count distribution
    const edgeCounts = selectedScenarios.map(s => s.activeEdgeIds?.length);
    const uniqueCounts = [...new Set(edgeCounts)];
    console.log('\nEdge Count Distribution:');
    uniqueCounts.forEach(k => {
      const count = edgeCounts.filter(c => c === k).length;
      console.log(`  k=${k}: ${count} scenarios`);
    });
    
    // Check for identical edge+state combinations
    const combos = selectedScenarios.map(s => JSON.stringify({ edges: s.activeEdgeIds, states: s.edgeStates }));
    const uniqueCombos = [...new Set(combos)];
    
    if (uniqueCombos.length !== selectedScenarios.length) {
      console.log(`\n⚠️  WARNING: Found duplicate edge+state combinations!`);
      console.log(`Expected ${selectedScenarios.length} unique, but only ${uniqueCombos.length} are unique`);
    } else {
      console.log(`\n✅ All scenarios have unique edge+state combinations`);
    }
    
    console.log('\n========== CONCLUSION ==========');
    if (uniqueIds.length === selectedScenarioIds.length && uniqueCombos.length === selectedScenarios.length) {
      console.log('✅ balancedSelect is working correctly');
      console.log('✅ All selected scenarios are unique');
      console.log('\nIf you still see duplicate scenarios in UI, the issue is likely in:');
      console.log('  1. Frontend rendering (SurveyView)');
      console.log('  2. Session populate logic');
      console.log('  3. GraphQL query not returning full scenario data');
    } else {
      console.log('❌ Bug detected in scenario selection or data structure');
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testMixedSessionCreation();
