#!/usr/bin/env node
// Cron job to post today's group daily challenge (similar style to previous crons)

require('dotenv').config();
require('./src/config/conn'); // Connect to database

const groupDailyChallengeRepo = require('./src/repository/group_daily_challenge.repository');
const { getNextSubject } = require('./src/utils/subjectAlternator');
const cron = require('node-cron');

async function postTodaysGroupChallenge() {
  try {
    console.log('🚀 Starting group daily challenge posting...');
    const subject = getNextSubject();
    const result = await groupDailyChallengeRepo.generateAndPostGroupDailyChallenge(subject);
    console.log('✅ SUCCESS!');
    console.log('📋 Action:', result.action);
    if (result.challenge) {
      console.log('❓ Question:', result.challenge.question);
      console.log('📚 Subject:', result.challenge.subject);
      console.log('✅ Correct Answer:', result.challenge.correct_answer);
      console.log('📅 Date:', result.challenge.challenge_date?.toDateString?.());
      console.log('🟢 Status:', result.challenge.status);
      console.log('⏰ Start Time:', result.challenge.start_time?.toLocaleString?.());
      console.log('🔚 End Time:', result.challenge.end_time?.toLocaleString?.());
      console.log('🆔 Challenge ID:', result.challenge._id);
    }
    // Test API endpoint
    console.log('\n🔍 Testing API: Getting active group daily challenge...');
    const activeChallenge = await groupDailyChallengeRepo.getActiveGroupChallenge();
    if (activeChallenge) {
      console.log('✅ API test successful - Active challenge retrieved');
      console.log('📝 Retrieved question:', activeChallenge.question);
    } else {
      console.log('⚠️ No active group challenge found via API');
    }
  } catch (err) {
    console.error('❌ FAILED!', err);
  }
}

// Run every day at midnight
cron.schedule('0 0 * * *', postTodaysGroupChallenge);

console.log('[CRON] Group Daily Challenge scheduler started.');
