#!/usr/bin/env node
// Test script to immediately post today's individual daily question

require("dotenv").config();
require("./src/config/conn"); // Connect to database

const individualQuestionRepo = require("./src/repository/individual_daily_question.repository");

async function postTodaysIndividualQuestion() {
  try {
    console.log("🚀 Starting individual daily question posting...");
    
    const result = await individualQuestionRepo.postTodaysIndividualQuestion();
    
    if (result.success) {
      console.log("✅ SUCCESS!");
      console.log(`📋 Action: ${result.action}`);
      console.log(`❓ Question: ${result.question.question}`);
      console.log(`📚 Topic: ${result.question.topic}`);
      console.log(`✅ Correct Answer: ${result.question.correct_answer}`);
      console.log(`🎯 Difficulty: ${result.question.difficulty_level}`);
      console.log(`📅 Date: ${result.question.question_date.toDateString()}`);
      console.log(`🟢 Status: ${result.question.status}`);
      console.log(`⏰ Start Time: ${result.question.start_time.toLocaleString()}`);
      console.log(`🔚 End Time: ${result.question.end_time.toLocaleString()}`);
      console.log(`🆔 Question ID: ${result.question._id}`);
      
      // Test getting today's question
      console.log("\n🔍 Testing API: Getting today's individual question...");
      const todaysQuestion = await individualQuestionRepo.getTodaysIndividualQuestion();
      if (todaysQuestion) {
        console.log("✅ API test successful - Today's question retrieved");
        console.log(`📝 Retrieved question: ${todaysQuestion.question}`);
      } else {
        console.log("❌ API test failed - Could not retrieve today's question");
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
postTodaysIndividualQuestion();
