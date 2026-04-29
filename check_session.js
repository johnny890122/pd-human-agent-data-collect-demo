const mongoose = require('mongoose');
require('dotenv').config();

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
});

const SubmissionModel = mongoose.model('Submission', submissionSchema, 'submissions');

async function checkSession() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pd-data-collect');
    console.log('Connected to MongoDB');
    
    const sessionId = 'f059e0a1-c3f1-4c5d-909c-2f21f4fe258a';
    
    // 查詢所有相關的 submissions
    const submissions = await SubmissionModel.find({ sessionId }).lean();
    
    console.log('\n========== Session Submissions ==========');
    console.log(`Session ID: ${sessionId}`);
    console.log(`Total submissions found: ${submissions.length}\n`);
    
    submissions.forEach((sub, index) => {
      console.log(`--- Submission ${index + 1} ---`);
      console.log(`ID: ${sub._id}`);
      console.log(`isCompleted: ${sub.isCompleted}`);
      console.log(`completedAt: ${sub.completedAt}`);
      console.log(`Results count: ${sub.results?.length || 0}`);
      console.log(`Demographics: ${sub.demographics ? 'Yes' : 'No'}`);
      console.log(`Created at: ${sub.createdAt}`);
      console.log(`Updated at: ${sub.updatedAt}`);
      console.log('');
    });
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSession();
