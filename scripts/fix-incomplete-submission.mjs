#!/usr/bin/env node
/**
 * 修復已完成但狀態標記為 incomplete 的 submissions
 * 
 * 使用方式：
 *   node scripts/fix-incomplete-submission.mjs <sessionId>
 *   node scripts/fix-incomplete-submission.mjs --check-all
 */

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

async function getExpectedScenarioCount(sessionId) {
  try {
    const session = await SessionModel.findById(sessionId).lean();
    if (session && session.scenarioIds) {
      return session.scenarioIds.length;
    }
    return null;
  } catch (error) {
    console.error('Error fetching session:', error);
    return null;
  }
}

async function checkSubmission(submissionId, sessionId = null) {
  try {
    const submission = await SubmissionModel.findById(submissionId).lean();
    
    if (!submission) {
      console.log(`❌ Submission ${submissionId} not found`);
      return null;
    }
    
    const sid = sessionId || submission.sessionId;
    const expectedCount = await getExpectedScenarioCount(sid);
    const hasResults = submission.results && submission.results.length > 0;
    const hasAllResults = expectedCount ? submission.results?.length === expectedCount : false;
    
    return {
      submission,
      hasResults,
      hasAllResults,
      expectedCount,
      actualCount: submission.results?.length || 0,
      needsFix: !submission.isCompleted && hasAllResults,
    };
  } catch (error) {
    console.error(`Error checking submission ${submissionId}:`, error);
    return null;
  }
}

async function fixSubmission(submissionId, dryRun = false) {
  const check = await checkSubmission(submissionId);
  
  if (!check) {
    return false;
  }
  
  const { submission, hasAllResults, expectedCount, actualCount, needsFix } = check;
  
  console.log('\n========================================');
  console.log(`Submission ID: ${submissionId}`);
  console.log(`Session ID: ${submission.sessionId}`);
  console.log(`Current status: ${submission.isCompleted ? 'Completed' : 'Incomplete'}`);
  console.log(`Results: ${actualCount}/${expectedCount || '?'}`);
  console.log(`Has demographics: ${submission.demographics ? 'Yes' : 'No'}`);
  console.log(`Needs fix: ${needsFix ? 'YES ✓' : 'NO'}`);
  
  if (!needsFix) {
    console.log('✓ No fix needed');
    return false;
  }
  
  if (dryRun) {
    console.log('🔍 DRY RUN - Would update this submission to completed');
    return true;
  }
  
  // 執行修復
  const updated = await SubmissionModel.findByIdAndUpdate(
    submissionId,
    {
      $set: {
        isCompleted: true,
        completedAt: new Date(),
        demographics: submission.demographics || { age: 0, gender: 'unknown', education: 'unknown' }
      },
    },
    { new: true }
  );
  
  if (updated) {
    // 更新 session 的 submissionCount
    await SessionModel.findByIdAndUpdate(
      submission.sessionId,
      { $inc: { submissionCount: 1 } }
    );
    
    console.log('✅ Fixed! Updated to completed status');
    return true;
  } else {
    console.log('❌ Failed to update');
    return false;
  }
}

async function findIncompleteBySession(sessionId) {
  try {
    const submissions = await SubmissionModel.find({ 
      sessionId,
      isCompleted: false 
    }).lean();
    
    console.log(`\n🔍 Found ${submissions.length} incomplete submissions for session ${sessionId}`);
    
    const expectedCount = await getExpectedScenarioCount(sessionId);
    const fixable = [];
    
    for (const sub of submissions) {
      const hasAllResults = expectedCount && sub.results && sub.results.length === expectedCount;
      if (hasAllResults) {
        fixable.push(sub._id);
        console.log(`  ✓ ${sub._id} - has all ${sub.results.length}/${expectedCount} results`);
      } else {
        console.log(`  ⚠️  ${sub._id} - only has ${sub.results?.length || 0}/${expectedCount} results`);
      }
    }
    
    return fixable;
  } catch (error) {
    console.error('Error finding incomplete submissions:', error);
    return [];
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node scripts/fix-incomplete-submission.mjs <sessionId>');
    console.log('  node scripts/fix-incomplete-submission.mjs <sessionId> --fix');
    console.log('  node scripts/fix-incomplete-submission.mjs --check-all');
    process.exit(1);
  }
  
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pd-data-collect');
    console.log('✓ Connected to MongoDB');
    
    const sessionId = args[0];
    const shouldFix = args.includes('--fix');
    
    if (sessionId === '--check-all') {
      // 檢查所有 incomplete submissions
      const allIncomplete = await SubmissionModel.find({ isCompleted: false }).lean();
      console.log(`\n📊 Total incomplete submissions: ${allIncomplete.length}`);
      
      for (const sub of allIncomplete) {
        await checkSubmission(sub._id, sub.sessionId);
      }
    } else {
      // 檢查特定 session 的 submissions
      const fixableIds = await findIncompleteBySession(sessionId);
      
      if (fixableIds.length === 0) {
        console.log('\n✓ No fixable submissions found');
      } else if (shouldFix) {
        console.log(`\n🔧 Fixing ${fixableIds.length} submissions...`);
        for (const id of fixableIds) {
          await fixSubmission(id, false);
        }
        console.log('\n✅ All fixes completed!');
      } else {
        console.log(`\n💡 Run with --fix to apply fixes to ${fixableIds.length} submissions`);
        console.log(`   node scripts/fix-incomplete-submission.mjs ${sessionId} --fix`);
      }
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
