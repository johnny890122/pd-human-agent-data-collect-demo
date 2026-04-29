import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const submissionSchema = new mongoose.Schema({
  _id: String,
  sessionId: String,
  participantId: String,
  results: Array,
  demographics: Object,
  isCompleted: Boolean,
  completedAt: Date,
  createdAt: Date,
  updatedAt: Date,
}, { collection: 'submissions' });

const sessionSchema = new mongoose.Schema({
  _id: String,
  scenarioIds: [String],
  focalNode: String,
  opponentNode: String,
  sampleSize: Number,
  groupId: String,
  submissionCount: Number,
  metadata: Object,
  createdAt: Date,
  updatedAt: Date,
}, { collection: 'sessions' });

const SubmissionModel = mongoose.model('Submission', submissionSchema);
const SessionModel = mongoose.model('Session', sessionSchema);

async function checkAllData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pd-data-collect');
    console.log('✓ Connected to MongoDB\n');
    
    const sessionId = 'f059e0a1-c3f1-4c5d-909c-2f21f4fe258a';
    
    // 檢查 session
    const session = await SessionModel.findById(sessionId).lean();
    console.log('========== SESSION DATA ==========');
    if (session) {
      console.log(`ID: ${session._id}`);
      console.log(`Focal: ${session.focalNode}, Opponent: ${session.opponentNode}`);
      console.log(`Sample Size: ${session.sampleSize}`);
      console.log(`Submission Count: ${session.submissionCount}`);
      console.log(`Scenarios: ${session.scenarioIds?.length || 0}`);
      console.log(`Group ID: ${session.groupId || 'null'}`);
      console.log(`Created: ${session.createdAt}`);
    } else {
      console.log('❌ Session not found!');
    }
    
    // 檢查所有 submissions (不過濾 isCompleted)
    const allSubmissions = await SubmissionModel.find({ sessionId }).lean();
    console.log(`\n========== ALL SUBMISSIONS (${allSubmissions.length}) ==========`);
    
    allSubmissions.forEach((sub, index) => {
      console.log(`\n--- Submission ${index + 1} ---`);
      console.log(`ID: ${sub._id}`);
      console.log(`isCompleted: ${sub.isCompleted}`);
      console.log(`completedAt: ${sub.completedAt || 'null'}`);
      console.log(`Results: ${sub.results?.length || 0}`);
      console.log(`Demographics: ${JSON.stringify(sub.demographics)}`);
      console.log(`Created: ${sub.createdAt}`);
      console.log(`Updated: ${sub.updatedAt}`);
    });
    
    // 統計
    const completedCount = allSubmissions.filter(s => s.isCompleted).length;
    const incompleteCount = allSubmissions.filter(s => !s.isCompleted).length;
    
    console.log(`\n========== SUMMARY ==========`);
    console.log(`Total submissions: ${allSubmissions.length}`);
    console.log(`Completed: ${completedCount}`);
    console.log(`Incomplete: ${incompleteCount}`);
    console.log(`Session.submissionCount: ${session?.submissionCount || 0}`);
    
    if (session && completedCount !== session.submissionCount) {
      console.log(`\n⚠️  WARNING: Mismatch detected!`);
      console.log(`   Actual completed: ${completedCount}`);
      console.log(`   Session count: ${session.submissionCount}`);
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAllData();
