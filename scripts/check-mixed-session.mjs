import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkMixedSession() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pd-data-collect');
    
    // 從命令行參數獲取 sessionId，或使用默認值
    const sessionId = process.argv[2] || '151e9198-1c82-4387-af4a-3c013ce548f8';
    
    console.log(`Checking session: ${sessionId}\n`);
    
    // Use proper String _id schema
    const SessionSchema = new mongoose.Schema({ _id: String }, { strict: false, collection: 'sessions' });
    const ScenarioSchema = new mongoose.Schema({ _id: String }, { strict: false, collection: 'scenarios' });
    
    const SessionModel = mongoose.model('SessionCheck', SessionSchema);
    const ScenarioModel = mongoose.model('ScenarioCheck', ScenarioSchema);
    
    const session = await SessionModel.findById(sessionId).lean();
    
    if (!session) {
      console.log('❌ Session not found');
      await mongoose.connection.close();
      return;
    }
    
    console.log('========== SESSION INFO ==========');
    console.log('Metadata:', session.metadata);
    console.log('Focal Node:', session.focalNode);
    console.log('Opponent Node:', session.opponentNode);
    console.log('Group ID:', session.groupId);
    console.log('ScenarioIds count:', session.scenarioIds?.length);
    console.log('\nScenario IDs:', session.scenarioIds);
    
    // Check for duplicates
    const uniqueIds = [...new Set(session.scenarioIds)];
    console.log(`\nUnique scenario IDs: ${uniqueIds.length}`);
    if (uniqueIds.length !== session.scenarioIds.length) {
      console.log(`⚠️  WARNING: Found ${session.scenarioIds.length - uniqueIds.length} duplicate scenario IDs!`);
    }
    
    if (session && session.scenarioIds) {
      console.log('\n========== SCENARIOS DETAILS ==========');
      const scenarios = await ScenarioModel.find({ _id: { $in: session.scenarioIds } }).lean();
      
      console.log(`Found ${scenarios.length} scenario documents\n`);
      
      scenarios.forEach((s, i) => {
        console.log(`${i+1}. ID: ${s._id.substring(0, 8)}...`);
        console.log(`   activeEdgeIds: ${JSON.stringify(s.activeEdgeIds)} (k=${s.activeEdgeIds?.length})`);
        console.log(`   edgeStates: ${JSON.stringify(s.edgeStates)}`);
        console.log(`   scenarioIndex: ${s.scenarioIndex}`);
        console.log('');
      });
      
      // Check unique edge combinations
      const edgeCombos = scenarios.map(s => JSON.stringify(s.activeEdgeIds)).filter(Boolean);
      const uniqueCombos = [...new Set(edgeCombos)];
      const edgeStateCombos = scenarios.map(s => JSON.stringify({ edges: s.activeEdgeIds, states: s.edgeStates }));
      const uniqueEdgeStateCombos = [...new Set(edgeStateCombos)];
      
      console.log('========== UNIQUENESS CHECK ==========');
      console.log(`Unique edge combinations: ${uniqueCombos.length}`);
      console.log(`Unique edge+state combinations: ${uniqueEdgeStateCombos.length}`);
      console.log(`Total scenarios: ${scenarios.length}`);
      
      if (uniqueEdgeStateCombos.length !== scenarios.length) {
        console.log(`\n⚠️  WARNING: Some scenarios are identical!`);
        console.log(`Expected ${scenarios.length} unique scenarios, but only found ${uniqueEdgeStateCombos.length}`);
      } else {
        console.log(`\n✅ All scenarios are unique`);
      }
      
      // Distribution by k
      const edgeCounts = scenarios.map(s => s.activeEdgeIds?.length).filter(Boolean);
      const uniqueCounts = [...new Set(edgeCounts)].sort();
      console.log('\n========== K DISTRIBUTION ==========');
      uniqueCounts.forEach(count => {
        const scenariosWithCount = edgeCounts.filter(c => c === count).length;
        console.log(`k=${count}: ${scenariosWithCount} scenarios`);
      });
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkMixedSession();
