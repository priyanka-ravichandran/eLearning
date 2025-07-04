#!/usr/bin/env node
// Test script to immediately post today's daily challenge

require("dotenv").config();
require("./src/config/conn"); // Connect to database

const dailyChallengeRepo = require("./src/repository/daily_challenge.repository");

async function postTodaysChallenge() {
  try {
    console.log("🚀 Starting daily challenge posting...");
    
    const result = await dailyChallengeRepo.postTodaysChallengeNow();
    
    if (result.success) {
      console.log("✅ SUCCESS!");
      console.log(`📋 Action: ${result.action}`);
      console.log(`❓ Question: ${result.challenge.question}`);
      console.log(`📚 Topic: ${result.challenge.topic}`);
      console.log(`✅ Correct Answer: ${result.challenge.correct_answer}`);
      console.log(`🎯 Points: ${result.challenge.points}`);
      console.log(`📅 Date: ${result.challenge.challenge_date.toDateString()}`);
      console.log(`🟢 Status: ${result.challenge.status}`);
      console.log(`⏰ Start Time: ${result.challenge.start_time.toLocaleString()}`);
      console.log(`🔚 End Time: ${result.challenge.end_time.toLocaleString()}`);
      console.log(`🆔 Challenge ID: ${result.challenge._id}`);
      
      // Test getting today's challenge
      console.log("\n🔍 Testing API: Getting today's challenge...");
      const todaysChallenge = await dailyChallengeRepo.getTodaysChallenge();
      if (todaysChallenge) {
        console.log("✅ API test successful - Today's challenge retrieved");
        console.log(`📝 Retrieved question: ${todaysChallenge.question}`);
      } else {
        console.log("❌ API test failed - Could not retrieve today's challenge");
      }
      
    } else {
      console.log("❌ FAILED!");
      console.log(`💬 Message: ${result.message}`);
    }
    
  } catch (error) {
    console.error("💥 ERROR:", error.message);
    console.error(error.stack);
  } finally {
    console.log("\n🏁 Script completed. Exiting...");
    process.exit(0);
  }
}

// Run the script
postTodaysChallenge();
