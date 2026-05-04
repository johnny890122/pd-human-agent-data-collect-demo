import { SessionModel } from '../backend/models/Session.js';
import { ScenarioModel } from '../backend/models/Scenario.js';
import { connectToDatabase } from '../backend/db.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkSession() {
  await connectToDatabase();
  
  const sessionId = '78f8479e-a1d7-4b4c-9b67-ddafc8fb089f';
  
  console.log(`\n=== Checking Session: ${sessionId} ===\n`);
  
  const session = await SessionModel.findById(sessionId).lean();
  
  if (!session) {
    console.log('❌ Session not found');
    process.exit(0);
    return;
  }
  
  console.log('Session data:');
  console.log('- _id:', session._id);
  console.log('- focalNode:', session.focalNode);
  console.log('- opponentNode:', session.opponentNode);
  console.log('- sampleSize:', session.sampleSize);
  console.log('- scenarioIds count:', session.scenarioIds?.length || 0);
  
  if (session.scenarioIds && session.scenarioIds.length > 0) {
    console.log('\n--- First Scenario ID:', session.scenarioIds[0]);
    
    const scenario = await ScenarioModel.findById(session.scenarioIds[0]).lean();
    
    if (scenario) {
      console.log('\nFirst scenario data:');
      console.log('- _id:', scenario._id);
      console.log('- activeEdgeIds:', scenario.activeEdgeIds);
      console.log('- activeEdgeIds count:', scenario.activeEdgeIds?.length || 0);
      console.log('- edgeStates:', scenario.edgeStates);
      console.log('- scenarioIndex:', scenario.scenarioIndex);
    } else {
      console.log('❌ First scenario not found!');
    }
  } else {
    console.log('\n❌ No scenarioIds in session!');
  }
  
  await mongoose.disconnect();
  console.log('\n✅ Check complete');
}

checkSession().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
