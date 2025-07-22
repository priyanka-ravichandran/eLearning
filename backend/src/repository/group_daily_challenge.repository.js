// src/repository/group_daily_challenge.repository.js
require("dotenv").config();
const OpenAI = require("openai");
const { DailyChallenge } = require("../model/DailyChallenge.model");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Auto-generate group daily challenge with LLM (hard difficulty)
const generateAndPostGroupDailyChallenge = async (subject) => {
  console.log("🚀 Auto-generating today's group daily challenge (HARD)...");
  try {
    // Check if challenge already exists for today
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const existingChallenge = await DailyChallenge.findOne({
      type: 'group',
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });
    if (existingChallenge) {
      console.log("⚠️ Today's group daily challenge already exists");
      return {
        success: false,
        action: "already_exists",
        challenge: existingChallenge,
        message: "Today's group daily challenge already exists"
      };
    }
    // Generate question using LLM
    const topics = ["Algebra", "Geometry", "Arithmetic", "Fractions", "Percentages", "Word Problems"];
    const randomTopic = subject || topics[Math.floor(Math.random() * topics.length)];
    const prompt = `Generate a math question for a group daily challenge with the following requirements:\n- Topic: ${randomTopic}\n- Difficulty: Hard (suitable for advanced high school or early college students)\n- Should have a clear numerical answer\n- Include a brief description if needed\n- Make it engaging and collaborative\n\nReturn ONLY a JSON object with this format:\n{\n  "question": "The main question text",\n  "description": "Brief description or context (optional)",\n  "topic": "${randomTopic}",\n  "correct_answer": "numerical answer",\n  "explanation": "Step-by-step solution"\n}`;
    console.log("🤖 Calling LLM to generate group daily challenge question...");
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a math teacher creating hard group daily challenge questions. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });
    const responseText = completion.choices[0].message.content.trim();
    console.log("🤖 LLM Response:", responseText);
    let questionData;
    try {
      questionData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("❌ Failed to parse LLM response:", parseError);
      throw new Error("Failed to parse LLM response");
    }
    // Set challenge times (12:01 AM to 11:59 PM today)
    const challengeDate = new Date(today);
    const startTime = new Date(challengeDate);
    startTime.setHours(0, 1, 0, 0); // 12:01 AM
    const endTime = new Date(challengeDate);
    endTime.setHours(23, 59, 0, 0); // 11:59 PM
    // Create the challenge
    const challengeData = {
      question: questionData.question,
      description: questionData.description || "",
      topic: questionData.topic,
      correct_answer: questionData.correct_answer.toString(),
      posted_by: null, // System generated
      challenge_date: challengeDate,
      start_time: startTime,
      end_time: endTime,
      status: now >= startTime && now <= endTime ? "active" : "scheduled",
      group_submissions: [],
      winner: null,
      llm_explanation: questionData.explanation || "",
      type: 'group',
      date: challengeDate
    };
    console.log("💾 Creating group daily challenge:", challengeData);
    const newChallenge = await DailyChallenge.create(challengeData);
    console.log("✅ Group daily challenge generated and posted successfully!");
    return {
      success: true,
      action: "created",
      challenge: newChallenge,
      message: "Group daily challenge generated and posted successfully"
    };
  } catch (error) {
    console.error("❌ Error generating group daily challenge:", error);
    return {
      success: false,
      action: "error",
      challenge: null,
      message: error.message
    };
  }
};

module.exports = { generateAndPostGroupDailyChallenge };
