// Simple test to check database connection and post challenge
require("dotenv").config();

const mongoose = require("mongoose");

async function testConnection() {
  try {
    console.log("🔌 Connecting to database...");
    
    // Connect to MongoDB
    const dbConnectionString = 'mongodb+srv://eLearning:Y1fVPMsdF6wBkpnv@cluster0.4rgqovz.mongodb.net/eLearningDb?retryWrites=true&w=majority&authSource=admin';
    await mongoose.connect(dbConnectionString);
    console.log("✅ Database connected successfully");
    
    // Import models after connection
    const { DailyChallenge } = require("./src/model/DailyChallenge.model");
    const { Student } = require("./src/model/Student.model");
    
    console.log("📊 Models loaded successfully");
    
    // Check if there's an existing challenge today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const existingChallenge = await DailyChallenge.findOne({
      challenge_date: {
        $gte: today,
        $lt: tomorrow
      }
    });
    
    if (existingChallenge) {
      console.log("📋 Found existing challenge for today:");
      console.log(`❓ Question: ${existingChallenge.question}`);
      console.log(`🟢 Status: ${existingChallenge.status}`);
      
      if (existingChallenge.status !== 'active') {
        console.log("🔄 Activating existing challenge...");
        existingChallenge.status = 'active';
        existingChallenge.start_time = new Date();
        const endTime = new Date();
        endTime.setHours(22, 0, 0, 0);
        existingChallenge.end_time = endTime;
        await existingChallenge.save();
        console.log("✅ Challenge activated!");
      }
      return;
    }
    
    // Find a teacher (any student for now)
    const teacher = await Student.findOne();
    if (!teacher) {
      console.log("❌ No teacher found in database");
      return;
    }
    
    console.log(`👨‍🏫 Using teacher: ${teacher.name} (${teacher._id})`);
    
    // Create new challenge
    const now = new Date();
    const endTime = new Date();
    endTime.setHours(22, 0, 0, 0);
    
    const challenge = await DailyChallenge.create({
      question: "Calculate: 25 + 17",
      description: "Solve this basic addition problem for today's challenge",
      topic: "Mathematics",
      correct_answer: "42",
      points: 100,
      posted_by: teacher._id,
      challenge_date: today,
      start_time: now,
      end_time: endTime,
      status: 'active'
    });
    
    console.log("🎉 NEW DAILY CHALLENGE CREATED!");
    console.log(`❓ Question: ${challenge.question}`);
    console.log(`📚 Topic: ${challenge.topic}`);
    console.log(`✅ Answer: ${challenge.correct_answer}`);
    console.log(`🎯 Points: ${challenge.points}`);
    console.log(`🆔 ID: ${challenge._id}`);
    console.log(`⏰ Active until: ${endTime.toLocaleString()}`);
    
  } catch (error) {
    console.error("💥 Error:", error.message);
  } finally {
    console.log("🔚 Closing connection...");
    await mongoose.disconnect();
    process.exit(0);
  }
}

testConnection();
