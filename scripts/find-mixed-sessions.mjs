import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function findMixedSessions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pd-data-collect');
    
    const SessionSchema = new mongoose.Schema({ _id: String }, { strict: false, collection: 'sessions' });
    const SessionModel = mongoose.model('SessionFind', SessionSchema);
    
    // Find sessions with metadata.createdFor = 'mixed'
    const mixedSessions = await SessionModel.find({ 
      'metadata.createdFor': 'mixed' 
    }).sort({ createdAt: -1 }).limit(10).lean();
    
    console.log(`Found ${mixedSessions.length} Mixed Mode sessions:\n`);
    
    mixedSessions.forEach((session, index) => {
      console.log(`${index + 1}. Session ID: ${session._id}`);
      console.log(`   Group ID: ${session.groupId}`);
      console.log(`   Participant ID: ${session.metadata?.participantId || 'null'}`);
      console.log(`   Scenario IDs count: ${session.scenarioIds?.length}`);
      console.log(`   Created: ${session.createdAt}`);
      console.log('');
    });
    
    if (mixedSessions.length > 0) {
      console.log(`\nTo check a specific session, run:`);
      console.log(`node scripts/check-mixed-session.mjs ${mixedSessions[0]._id}`);
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

findMixedSessions();
