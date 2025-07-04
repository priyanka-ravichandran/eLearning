// src/repository/daily_challenge.repository.js
require("dotenv").config();
const OpenAI = require("openai");
const { DailyChallenge } = require("../model/DailyChallenge.model");
const { Group } = require("../model/Group.model");
const { Student } = require("../model/Student.model");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// LLM scoring function for daily challenges
async function scoreDailyChallengeAnswer(questionText, correctAnswer, studentAnswer) {
  console.log("=== DAILY CHALLENGE LLM SCORING ===");
  console.log("Question:", questionText);
  console.log("Expected Answer:", correctAnswer);
  console.log("Student Answer:", studentAnswer);

  // Handle simple arithmetic directly
  const arithmeticMatch = questionText.match(/(\d+)\s*[\+\-\*\/]\s*(\d+)/);
  if (arithmeticMatch) {
    const num1 = parseInt(arithmeticMatch[1]);
    const operator = questionText.match(/[\+\-\*\/]/)[0];
    const num2 = parseInt(arithmeticMatch[2]);
    
    let calculatedAnswer;
    switch (operator) {
      case '+': calculatedAnswer = num1 + num2; break;
      case '-': calculatedAnswer = num1 - num2; break;
      case '*': calculatedAnswer = num1 * num2; break;
      case '/': calculatedAnswer = num1 / num2; break;
    }
    
    const studentNum = parseInt(studentAnswer.toString().trim());
    
    if (!isNaN(studentNum)) {
      if (studentNum === calculatedAnswer) {
        return {
          is_correct: true,
          score: 10,
          explanation: "Perfect! Correct calculation.",
          solution: `${questionText} = ${calculatedAnswer}`
        };
      } else {
        return {
          is_correct: false,
          score: 1,
          explanation: `Incorrect. You answered ${studentNum} but the correct answer is ${calculatedAnswer}.`,
          solution: `${questionText} = ${calculatedAnswer}`
        };
      }
    }
  }

  // For complex questions, use LLM
  const prompt = `
You are grading a daily challenge answer. Be STRICT but fair.

Question: ${questionText}
Student's Answer: ${studentAnswer}
Expected Answer: ${correctAnswer || "Not provided"}

STRICT GRADING for DAILY CHALLENGES:
- 10 points: Perfect answer, completely correct
- 8-9 points: Very good answer with minor issues
- 6-7 points: Good attempt with some correct elements
- 4-5 points: Partial understanding shown
- 2-3 points: Poor answer but some effort
- 1 point: Completely wrong or no effort

Respond with this exact JSON format:
{
  "is_correct": true/false,
  "score": number_1_to_10,
  "explanation": "Clear explanation of scoring",
  "solution": "The correct answer and reasoning"
}`.trim();

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0,
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = completion.choices[0].message.content.trim();
    console.log("LLM Response:", raw);
    
    let jsonStr = raw;
    if (raw.includes('{')) {
      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}') + 1;
      jsonStr = raw.substring(start, end);
    }
    
    const result = JSON.parse(jsonStr);
    result.score = Math.max(1, Math.min(10, Math.round(result.score)));
    
    console.log("Final LLM Result:", result);
    return result;
    
  } catch (err) {
    console.error("LLM Error:", err);
    
    // Simple fallback
    const isMatch = studentAnswer.toString().toLowerCase().trim() === 
                   correctAnswer.toString().toLowerCase().trim();
    
    return {
      is_correct: isMatch,
      score: isMatch ? 10 : 3,
      explanation: isMatch ? "Correct answer!" : "Answer doesn't match expected result.",
      solution: correctAnswer || "Check with your teacher for the correct answer."
    };
  }
}

// Calculate time bonus (faster answers get bonus points)
function calculateTimeBonus(timeTakenMinutes) {
  const maxTime = 12 * 60; // 12 hours in minutes
  const minTime = 5; // Minimum 5 minutes
  
  if (timeTakenMinutes < minTime) timeTakenMinutes = minTime;
  if (timeTakenMinutes > maxTime) return 0;
  
  // Linear decrease from 5 bonus points (fastest) to 0 (slowest)
  const timeBonus = Math.max(0, 5 - (timeTakenMinutes / (maxTime / 5)));
  return Math.round(timeBonus * 10) / 10; // Round to 1 decimal
}

// Calculate final score (LLM score + time bonus)
function calculateFinalScore(llmScore, timeTakenMinutes) {
  const timeBonus = calculateTimeBonus(timeTakenMinutes);
  return llmScore + timeBonus;
}

// Post a new daily challenge (Teacher only)
const postDailyChallenge = async (questionText, description, topic, correctAnswer, teacherId) => {
  console.log("=== POSTING DAILY CHALLENGE ===");
  
  // Set challenge times (10 AM to 10 PM today)
  const now = new Date();
  const challengeDate = new Date(now);
  challengeDate.setHours(0, 0, 0, 0);
  
  const startTime = new Date(challengeDate);
  startTime.setHours(10, 0, 0, 0); // 10:00 AM
  
  const endTime = new Date(challengeDate);
  endTime.setHours(22, 0, 0, 0); // 10:00 PM
  
  // Check if challenge already exists for today
  const existingChallenge = await DailyChallenge.findOne({
    challenge_date: {
      $gte: challengeDate,
      $lt: new Date(challengeDate.getTime() + 24 * 60 * 60 * 1000)
    }
  });
  
  if (existingChallenge) {
    throw new Error("Daily challenge already exists for today");
  }
  
  const challengeData = {
    question: questionText,
    description: description || "",
    topic,
    correct_answer: correctAnswer,
    posted_by: teacherId,
    challenge_date: challengeDate,
    start_time: startTime,
    end_time: endTime,
    status: now >= startTime && now <= endTime ? "active" : "scheduled",
    group_submissions: [],
    winner: null
  };
  
  console.log("Creating challenge:", challengeData);
  return await DailyChallenge.create(challengeData);
};

// Get today's challenge
const getTodaysChallenge = async () => {
  return await DailyChallenge.getTodaysChallenge();
};

// Get active challenge
const getActiveChallenge = async () => {
  return await DailyChallenge.getActiveChallenge();
};

// Submit group answer to daily challenge
const submitGroupAnswer = async (challengeId, groupId, studentId, answer) => {
  console.log("=== SUBMITTING GROUP ANSWER ===");
  console.log("Challenge ID:", challengeId, "Group ID:", groupId, "Student ID:", studentId);
  
  const challenge = await DailyChallenge.findById(challengeId);
  if (!challenge) {
    throw new Error("Challenge not found");
  }
  
  const now = new Date();
  
  // Check if challenge is active
  if (challenge.status !== "active" || now < challenge.start_time || now > challenge.end_time) {
    throw new Error("Challenge is not currently active");
  }
  
  // Check if group already submitted
  const existingSubmission = challenge.group_submissions.find(
    sub => sub.group_id.toString() === groupId.toString()
  );
  
  if (existingSubmission) {
    throw new Error("Group has already submitted an answer for this challenge");
  }
  
  // Calculate time taken from challenge start
  const timeTakenMinutes = Math.round((now - challenge.start_time) / (1000 * 60));
  
  // Get LLM score
  const llmResult = await scoreDailyChallengeAnswer(
    challenge.question,
    challenge.correct_answer,
    answer
  );
  
  // Calculate final score
  const finalScore = calculateFinalScore(llmResult.score, timeTakenMinutes);
  
  // Create submission
  const submission = {
    group_id: groupId,
    answer: answer,
    submitted_by: studentId,
    submission_time: now,
    llm_score: llmResult.score,
    llm_feedback: {
      is_correct: llmResult.is_correct,
      explanation: llmResult.explanation,
      solution: llmResult.solution
    },
    time_taken_minutes: timeTakenMinutes,
    final_score: finalScore
  };
  
  // Add submission to challenge
  challenge.group_submissions.push(submission);
  
  // Check if this is the best score so far
  const currentWinner = challenge.winner;
  if (!currentWinner || finalScore > currentWinner.final_score) {
    challenge.winner = {
      group_id: groupId,
      final_score: finalScore,
      submission_time: now,
      time_taken_minutes: timeTakenMinutes
    };
  }
  
  await challenge.save();
  
  console.log("Submission saved:", {
    llm_score: llmResult.score,
    time_taken_minutes: timeTakenMinutes,
    final_score: finalScore,
    is_winner: !currentWinner || finalScore > currentWinner.final_score
  });
  
  return {
    submission,
    llm_result: llmResult,
    final_score: finalScore,
    time_taken_minutes: timeTakenMinutes,
    is_current_winner: !currentWinner || finalScore > currentWinner.final_score
  };
};

// Get challenge leaderboard
const getChallengeLeaderboard = async (challengeId) => {
  const challenge = await DailyChallenge.findById(challengeId)
    .populate('group_submissions.group_id', 'name team_members code')
    .populate('group_submissions.submitted_by', 'name email')
    .populate('winner.group_id', 'name team_members');
  
  if (!challenge) {
    throw new Error("Challenge not found");
  }
  
  // Sort submissions by final score (descending), handle empty submissions
  const sortedSubmissions = (challenge.group_submissions || []).sort((a, b) => (b.final_score || 0) - (a.final_score || 0));
  
  return {
    challenge_info: {
      question: challenge.question,
      status: challenge.status,
      start_time: challenge.start_time,
      end_time: challenge.end_time,
      total_submissions: (challenge.group_submissions || []).length
    },
    leaderboard: sortedSubmissions.map((submission, index) => ({
      rank: index + 1,
      group_name: submission.group_id?.name || 'Unknown Group',
      group_id: submission.group_id?._id || submission.group_id,
      submitted_by: submission.submitted_by?.name || 'Unknown User',
      answer: submission.answer,
      llm_score: submission.llm_score || 0,
      time_taken_minutes: submission.time_taken_minutes || 0,
      final_score: submission.final_score || 0,
      submission_time: submission.submission_time,
      is_winner: challenge.winner && submission.group_id?._id?.toString() === challenge.winner.group_id?.toString()
    })),
    winner: challenge.winner ? {
      group_id: challenge.winner.group_id?._id || challenge.winner.group_id,
      group_name: challenge.winner.group_id?.name || 'Unknown Group',
      final_score: challenge.winner.final_score || 0,
      time_taken_minutes: challenge.winner.time_taken_minutes || 0
    } : null
  };
};

// Update challenge status (automated)
const updateChallengeStatus = async () => {
  const now = new Date();
  
  // Activate scheduled challenges
  await DailyChallenge.updateMany(
    {
      status: "scheduled",
      start_time: { $lte: now },
      end_time: { $gte: now }
    },
    { status: "active" }
  );
  
  // Close active challenges
  await DailyChallenge.updateMany(
    {
      status: "active",
      end_time: { $lt: now }
    },
    { status: "closed" }
  );
  
  console.log("Challenge statuses updated at", now);
};

// Get challenge history
const getChallengeHistory = async (limit = 10) => {
  return await DailyChallenge.find()
    .sort({ challenge_date: -1 })
    .limit(limit)
    .populate('posted_by', 'name email')
    .populate('winner.group_id', 'name team_members')
    .select('question topic challenge_date status group_submissions winner');
};

// Automated function to activate today's challenge at 10 AM
const activateTodaysChallenge = async () => {
  console.log("🔄 Activating today's challenge...");
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Find today's scheduled challenge
  const challenge = await DailyChallenge.findOne({
    challenge_date: {
      $gte: today,
      $lt: tomorrow
    },
    status: 'scheduled'
  });
  
  if (!challenge) {
    console.log("❌ No scheduled challenge found for today");
    return { success: false, message: "No scheduled challenge found for today" };
  }
  
  // Set start and end times
  const now = new Date();
  const startTime = new Date();
  startTime.setHours(10, 0, 0, 0); // 10:00 AM
  
  const endTime = new Date();
  endTime.setHours(22, 0, 0, 0); // 10:00 PM
  
  // Update challenge status
  challenge.status = 'active';
  challenge.start_time = startTime;
  challenge.end_time = endTime;
  await challenge.save();
  
  console.log(`✅ Challenge "${challenge.question.substring(0, 50)}..." activated for today`);
  return { success: true, challenge };
};

// Automated function to close today's challenge at 10 PM and determine winner
const closeTodaysChallenge = async () => {
  console.log("🔄 Closing today's challenge...");
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Find today's active challenge
  const challenge = await DailyChallenge.findOne({
    challenge_date: {
      $gte: today,
      $lt: tomorrow
    },
    status: 'active'
  });
  
  if (!challenge) {
    console.log("❌ No active challenge found for today");
    return { success: false, message: "No active challenge found for today" };
  }
  
  // Determine winner based on highest final score
  if (challenge.group_submissions && challenge.group_submissions.length > 0) {
    const sortedSubmissions = challenge.group_submissions
      .filter(sub => sub.final_score > 0)
      .sort((a, b) => {
        // Primary sort: final_score (higher is better)
        if (b.final_score !== a.final_score) {
          return b.final_score - a.final_score;
        }
        // Secondary sort: time_taken_minutes (lower is better)
        return a.time_taken_minutes - b.time_taken_minutes;
      });
    
    if (sortedSubmissions.length > 0) {
      const winningSubmission = sortedSubmissions[0];
      
      // Set the winner
      challenge.winner = {
        group_id: winningSubmission.group_id,
        final_score: winningSubmission.final_score,
        submission_time: winningSubmission.submission_time,
        time_taken_minutes: winningSubmission.time_taken_minutes
      };
      
      console.log(`🏆 Winner determined: Group ${winningSubmission.group_id} with score ${winningSubmission.final_score}`);
    }
  }
  
  // Close the challenge
  challenge.status = 'closed';
  await challenge.save();
  
  console.log(`✅ Challenge "${challenge.question.substring(0, 50)}..." closed for today`);
  return { 
    success: true, 
    challenge,
    winner: challenge.winner 
  };
};

// Function to immediately post today's daily challenge (for testing)
const postTodaysChallengeNow = async (teacherId = null) => {
  console.log("🚀 Posting today's challenge immediately...");
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Check if today's challenge already exists
  const existingChallenge = await DailyChallenge.findOne({
    challenge_date: {
      $gte: today,
      $lt: tomorrow
    }
  });
  
  if (existingChallenge) {
    console.log("⚠️ Today's challenge already exists, activating it...");
    
    // Activate the existing challenge
    const now = new Date();
    const endTime = new Date();
    endTime.setHours(22, 0, 0, 0); // Still close at 10 PM
    
    existingChallenge.status = 'active';
    existingChallenge.start_time = now;
    existingChallenge.end_time = endTime;
    await existingChallenge.save();
    
    return { success: true, challenge: existingChallenge, action: 'activated' };
  }
  
  // If no teacher ID provided, try to find a teacher (student with teacher role)
  let teacher = null;
  if (teacherId) {
    teacher = await Student.findById(teacherId);
  } else {
    // Find any student to act as teacher (you might want to add a teacher role field)
    teacher = await Student.findOne();
  }
  
  if (!teacher) {
    console.log("❌ No teacher found to post challenge");
    return { success: false, message: "No teacher found" };
  }
  
  // Sample daily challenge questions
  const sampleChallenges = [
    {
      question: "Calculate: 15 + 27",
      description: "Solve this basic addition problem",
      topic: "Mathematics",
      correct_answer: "42"
    },
    {
      question: "What is 8 × 7?",
      description: "Calculate this multiplication",
      topic: "Mathematics", 
      correct_answer: "56"
    },
    {
      question: "Solve: 100 - 34",
      description: "Perform this subtraction",
      topic: "Mathematics",
      correct_answer: "66"
    },
    {
      question: "What is 72 ÷ 8?",
      description: "Calculate this division",
      topic: "Mathematics",
      correct_answer: "9"
    },
    {
      question: "Calculate the area of a rectangle with length 6 and width 4",
      description: "Use the formula: Area = length × width",
      topic: "Geometry",
      correct_answer: "24"
    }
  ];
  
  // Pick a random challenge
  const randomChallenge = sampleChallenges[Math.floor(Math.random() * sampleChallenges.length)];
  
  // Create the challenge
  const now = new Date();
  const endTime = new Date();
  endTime.setHours(22, 0, 0, 0); // Close at 10 PM
  
  const challengeData = {
    question: randomChallenge.question,
    description: randomChallenge.description,
    topic: randomChallenge.topic,
    correct_answer: randomChallenge.correct_answer,
    points: 100, // High points for daily challenges
    posted_by: teacher._id,
    challenge_date: today,
    start_time: now, // Start immediately
    end_time: endTime,
    status: 'active', // Start as active
    group_submissions: [],
    created_at: now,
    updated_at: now
  };
  
  const challenge = await DailyChallenge.create(challengeData);
  
  console.log(`✅ Daily challenge created and activated: "${challenge.question}"`);
  console.log(`🕐 Started at: ${now.toLocaleString()}`);
  console.log(`🕙 Will close at: ${endTime.toLocaleString()}`);
  
  return { success: true, challenge, action: 'created' };
};

// Get daily challenge by date
const getDailyChallengeByDate = async (date) => {
  console.log("📅 Getting daily challenge by date:", date);
  
  try {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    
    const challenge = await DailyChallenge.findOne({
      date: {
        $gte: startDate,
        $lt: endDate
      }
    }).populate('group_answers.group_id', 'group_name');
    
    console.log("📊 Challenge found:", challenge ? challenge._id : 'none');
    return challenge;
  } catch (error) {
    console.error("❌ Error getting daily challenge by date:", error);
    throw error;
  }
};

// Get daily challenge by ID
const getDailyChallengeById = async (challengeId) => {
  console.log("🔍 Getting daily challenge by ID:", challengeId);
  
  try {
    const challenge = await DailyChallenge.findById(challengeId)
      .populate('group_answers.group_id', 'group_name')
      .populate('winner.group_id', 'group_name');
    
    console.log("📊 Challenge found:", challenge ? challenge._id : 'none');
    return challenge;
  } catch (error) {
    console.error("❌ Error getting daily challenge by ID:", error);
    throw error;
  }
};

module.exports = {
  postDailyChallenge,
  getTodaysChallenge,
  getActiveChallenge,
  getDailyChallengeByDate,
  getDailyChallengeById,
  submitGroupAnswer,
  getChallengeLeaderboard,
  updateChallengeStatus,
  getChallengeHistory,
  scoreDailyChallengeAnswer,
  calculateTimeBonus,
  calculateFinalScore,
  activateTodaysChallenge,
  closeTodaysChallenge,
  postTodaysChallengeNow
};
