#!/usr/bin/env node
// Test script to immediately post today's daily challenge

require("dotenv").config();
require("./src/config/conn"); // Connect to database

const dailyChallengeRepo = require("./src/repository/daily_challenge.repository");

async function postTodaysChallenge() {
  try {
    console.log("🚀 Starting daily challenge generation test...");
    
    const result = await dailyChallengeRepo.generateAndPostDailyChallenge();
    
    console.log("✅ SUCCESS!");
    console.log("📋 Action:", result.action);
    
    if (result.challenge) {
      console.log("❓ Question:", result.challenge.question);
      console.log("� Description:", result.challenge.description);
      console.log("📚 Topic:", result.challenge.topic);
      console.log("✅ Correct Answer:", result.challenge.correct_answer);
      console.log("�️ Date:", result.challenge.challenge_date.toDateString());
      console.log("🟢 Status:", result.challenge.status);
      console.log("⏰ Start Time:", result.challenge.start_time.toLocaleString());
      console.log("🔚 End Time:", result.challenge.end_time.toLocaleString());
      console.log("🆔 Challenge ID:", result.challenge._id);
    }
    
    // Test the API endpoint
    console.log("\n🔍 Testing API: Getting active daily challenge...");
    const activeChallenge = await dailyChallengeRepo.getActiveChallenge();
    
    if (activeChallenge) {
      console.log("✅ API test successful - Active challenge retrieved");
      console.log("📝 Retrieved question:", activeChallenge.question);
    } else {
      console.log("⚠️ No active challenge found via API");
    }
    
  } catch (error) {
    console.error("❌ ERROR:", error.message);
    console.error(error.stack);
  } finally {
    console.log("\n🏁 Script completed. Exiting...");
    process.exit(0);
  }
}

// Run the script
postTodaysChallenge();
