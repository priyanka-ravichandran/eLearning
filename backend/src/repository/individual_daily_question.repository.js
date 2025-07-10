require("dotenv").config();
const OpenAI = require("openai");
const { IndividualDailyQuestion } = require("../model/IndividualDailyQuestion.model");
const { Student } = require("../model/Student.model");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// LLM function to generate daily math questions
async function generateDailyMathQuestion() {
  const difficulties = ["easy", "medium", "hard"];
  const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
  
  const prompt = `Generate a ${randomDifficulty} level math question for students. 

Requirements:
- Create a clear, well-formatted mathematical problem
- Include the correct numerical answer
- Make it engaging and educational
- Difficulty: ${randomDifficulty}

Topics can include: arithmetic, algebra, geometry, fractions, percentages, word problems

Respond with this exact JSON format:
{
  "question": "Clear mathematical question here",
  "difficulty": "${randomDifficulty}",
  "correct_answer": "numerical answer only",
  "topic": "specific math topic"
}

Example for easy: {"question": "Calculate: 25 + 17", "difficulty": "easy", "correct_answer": "42", "topic": "Addition"}
Example for medium: {"question": "A rectangle has length 8m and width 5m. What is its area?", "difficulty": "medium", "correct_answer": "40", "topic": "Area"}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });

    const result = JSON.parse(completion.choices[0].message.content.trim());
    console.log("Generated question:", result);
    return result;
  } catch (error) {
    console.error("Error generating question:", error);
    // Fallback to predefined questions
    const fallbackQuestions = [
      {
        question: "Calculate: 45 + 28",
        difficulty: "easy",
        correct_answer: "73",
        topic: "Addition"
      },
      {
        question: "What is 12 × 7?",
        difficulty: "medium", 
        correct_answer: "84",
        topic: "Multiplication"
      },
      {
        question: "A circle has radius 5cm. What is its area? (Use π = 3.14)",
        difficulty: "hard",
        correct_answer: "78.5",
        topic: "Geometry"
      }
    ];
    return fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
  }
}

// LLM scoring function for individual answers
async function scoreIndividualAnswer(questionText, correctAnswer, studentAnswer) {
  const prompt = `
You are evaluating a math answer. Score from 1-10 based on correctness.

Question: ${questionText}
Correct Answer: ${correctAnswer}
Student Answer: ${studentAnswer}

SCORING CRITERIA:
- 10 points: Perfect answer, completely correct
- 8-9 points: Very close, minor calculation error or formatting issue
- 6-7 points: Right approach, some calculation mistakes
- 4-5 points: Shows understanding but significant errors
- 2-3 points: Some effort but mostly incorrect
- 1 point: Wrong answer but attempt made
- 0 points: No answer or completely unrelated

Consider:
- Exact numerical match gets full points
- Close approximations (rounding differences) get high points
- Correct method with calculation error gets partial credit
- Different valid forms (fractions vs decimals) should be accepted

Respond with this exact JSON format:
{
  "is_correct": true/false,
  "score": number_0_to_10,
  "explanation": "Brief explanation of the scoring",
  "solution": "Step-by-step solution"
}`.trim();

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0,
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

    const result = JSON.parse(completion.choices[0].message.content.trim());
    console.log(`LLM scored "${studentAnswer}" for question "${questionText}": ${result.score}/10`);
    return result;
  } catch (error) {
    console.error("Error scoring answer:", error);
    // Fallback scoring logic
    const normalizedStudentAnswer = studentAnswer.trim().toLowerCase();
    const normalizedCorrectAnswer = correctAnswer.trim().toLowerCase();
    
    if (normalizedStudentAnswer === normalizedCorrectAnswer) {
      return {
        is_correct: true,
        score: 10,
        explanation: "Correct answer",
        solution: `The correct answer is ${correctAnswer}`
      };
    } else {
      return {
        is_correct: false,
        score: 2,
        explanation: "Incorrect answer",
        solution: `The correct answer is ${correctAnswer}`
      };
    }
  }
}

// Calculate points earned based on LLM score (1-10 becomes 1-100 points)
function calculatePointsEarned(llmScore) {
  return Math.round(llmScore); // Direct LLM score out of 10 points
}

// Post today's individual daily question (automated at 10:05 AM)
const postTodaysIndividualQuestion = async () => {
  console.log("🚀 Posting today's individual daily question...");
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Check if today's question already exists
  const existingQuestion = await IndividualDailyQuestion.findOne({
    question_date: {
      $gte: today,
      $lt: tomorrow
    }
  });
  
  if (existingQuestion) {
    console.log("⚠️ Today's individual question already exists");
    if (existingQuestion.status !== 'active') {
      // Activate existing question
      const now = new Date();
      const endTime = new Date(tomorrow);
      endTime.setHours(0, 0, 0, 0); // 12:00 AM next day
      
      existingQuestion.status = 'active';
      existingQuestion.start_time = now;
      existingQuestion.end_time = endTime;
      await existingQuestion.save();
      
      return { success: true, question: existingQuestion, action: 'activated' };
    }
    return { success: true, question: existingQuestion, action: 'already_exists' };
  }
  
  // Find a system user to post the question
  let systemUser = await Student.findOne();
  if (!systemUser) {
    return { success: false, message: "No system user found" };
  }
  
  // Generate new question using LLM
  const generatedQuestion = await generateDailyMathQuestion();
  
  // Set question times (12:01 AM today to 11:59 PM today)
  const now = new Date();
  const startTime = new Date();
  startTime.setHours(0, 1, 0, 0); // 12:01 AM
  
  const endTime = new Date();
  endTime.setHours(23, 59, 0, 0); // 11:59 PM today
  
  const questionData = {
    question: generatedQuestion.question,
    topic: generatedQuestion.topic,
    difficulty_level: generatedQuestion.difficulty,
    correct_answer: generatedQuestion.correct_answer,
    posted_by: systemUser._id,
    question_date: today,
    start_time: startTime,
    end_time: endTime,
    status: now >= startTime ? "active" : "scheduled",
    individual_answers: [],
    total_participants: 0
  };
  
  const question = await IndividualDailyQuestion.create(questionData);
  
  console.log(`✅ Individual daily question created: "${question.question}"`);
  console.log(`🕐 Active from: ${startTime.toLocaleString()}`);
  console.log(`🕛 Active until: ${endTime.toLocaleString()}`);
  
  return { success: true, question, action: 'created' };
};

// Get today's individual question
const getTodaysIndividualQuestion = async () => {
  return await IndividualDailyQuestion.getTodaysQuestion();
};

// Get active individual question
const getActiveIndividualQuestion = async () => {
  return await IndividualDailyQuestion.getActiveQuestion();
};

// Submit individual answer
const submitIndividualAnswer = async (questionId, studentId, answer) => {
  console.log("=== SUBMITTING INDIVIDUAL ANSWER ===");
  console.log("Question ID:", questionId, "Student ID:", studentId);
  
  const question = await IndividualDailyQuestion.findById(questionId);
  if (!question) {
    throw new Error("Question not found");
  }
  
  const now = new Date();
  
  // Check if question is active
  if (question.status !== "active" || now < question.start_time || now > question.end_time) {
    throw new Error("Question is not currently active");
  }
  
  // Check if student already submitted
  const existingAnswer = question.individual_answers.find(
    ans => ans.student_id.toString() === studentId.toString()
  );
  
  if (existingAnswer) {
    throw new Error("You have already submitted an answer for today's question");
  }
  
  // Calculate time taken from question start
  const timeTakenMinutes = Math.round((now - question.start_time) / (1000 * 60));
  
  // Get LLM score
  const llmResult = await scoreIndividualAnswer(
    question.question,
    question.correct_answer,
    answer
  );
  
  // Calculate points earned
  const pointsEarned = calculatePointsEarned(llmResult.score);
  
  // Create answer submission
  const answerSubmission = {
    student_id: studentId,
    answer: answer,
    submission_time: now,
    llm_score: llmResult.score,
    llm_feedback: {
      is_correct: llmResult.is_correct,
      explanation: llmResult.explanation,
      solution: llmResult.solution
    },
    time_taken_minutes: timeTakenMinutes,
    points_earned: pointsEarned
  };
  
  // Add answer to question
  question.individual_answers.push(answerSubmission);
  question.total_participants = question.individual_answers.length;
  
  await question.save();
  
  console.log("Individual answer submitted:", {
    llm_score: llmResult.score,
    points_earned: pointsEarned,
    time_taken_minutes: timeTakenMinutes
  });
  
  return {
    submission: answerSubmission,
    llm_result: llmResult,
    points_earned: pointsEarned,
    time_taken_minutes: timeTakenMinutes
  };
};

// Get individual question by ID
const getIndividualQuestionById = async (questionId) => {
  console.log("🔍 Getting individual question by ID:", questionId);
  
  try {
    const question = await IndividualDailyQuestion.findById(questionId)
      .populate('individual_answers.student_id', 'name email');
    
    console.log("📊 Question found:", question ? question._id : 'none');
    return question;
  } catch (error) {
    console.error("❌ Error getting individual question by ID:", error);
    throw error;
  }
};

// Get student's answer for today
const getStudentAnswerForToday = async (studentId) => {
  const todaysQuestion = await getTodaysIndividualQuestion();
  if (!todaysQuestion) {
    return null;
  }
  
  const studentAnswer = todaysQuestion.individual_answers.find(
    ans => ans.student_id.toString() === studentId.toString()
  );
  
  return studentAnswer || null;
};

// Close today's individual question (automated at 12:00 AM)
const closeTodaysIndividualQuestion = async () => {
  console.log("🔄 Closing today's individual question...");
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const question = await IndividualDailyQuestion.findOne({
    question_date: {
      $gte: today,
      $lt: tomorrow
    },
    status: 'active'
  });
  
  if (!question) {
    console.log("❌ No active individual question found for today");
    return { success: false, message: "No active individual question found for today" };
  }
  
  // Close the question
  question.status = 'closed';
  await question.save();
  
  console.log(`✅ Individual question "${question.question.substring(0, 50)}..." closed for today`);
  console.log(`📊 Total participants: ${question.total_participants}`);
  
  return { 
    success: true, 
    question,
    total_participants: question.total_participants
  };
};

// Activate today's individual question (automated at 10:05 AM)
const activateTodaysIndividualQuestion = async () => {
  console.log("🔄 Activating today's individual question...");
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const question = await IndividualDailyQuestion.findOne({
    question_date: {
      $gte: today,
      $lt: tomorrow
    },
    status: 'scheduled'
  });
  
  if (!question) {
    // Try to create today's question if it doesn't exist
    return await postTodaysIndividualQuestion();
  }
  
  // Activate existing question
  const now = new Date();
  const endTime = new Date(tomorrow);
  endTime.setHours(0, 0, 0, 0); // 12:00 AM next day
  
  question.status = 'active';
  question.start_time = now;
  question.end_time = endTime;
  await question.save();
  
  console.log(`✅ Individual question activated: "${question.question.substring(0, 50)}..."`);
  return { success: true, question };
};

module.exports = {
  generateDailyMathQuestion,
  scoreIndividualAnswer,
  calculatePointsEarned,
  postTodaysIndividualQuestion,
  getTodaysIndividualQuestion,
  getActiveIndividualQuestion,
  submitIndividualAnswer,
  getIndividualQuestionById,
  getStudentAnswerForToday,
  closeTodaysIndividualQuestion,
  activateTodaysIndividualQuestion
};
