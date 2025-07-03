// src/repository/student_question.repository.js
require("dotenv").config();
const OpenAI = require("openai");
const { StudentQuestion: Question } = require("../model/StudentQuestion.model");
const { Student } = require("../model/Student.model");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Calls OpenAI with a prompt that:
 *  1) Solves the equation step by step.
 *  2) Parses out the numeric piece of the student's answer.
 *  3) Compares and deducts 2 points for each missing step.
 */
async function verifyAnswerWithLLM_v2(qText, correctAns = "", studentAns = "") {
  // Simplified, more focused prompt for better consistency
  const prompt = `
You are a math teacher grading a student's answer. Your job is to:
1. Solve the problem correctly
2. Check if the student's answer is right
3. Give a score out of 10
4. Provide helpful feedback

QUESTION: ${qText}
EXPECTED ANSWER: ${correctAns || "Calculate yourself"}
STUDENT'S ANSWER: ${studentAns}

SCORING RULES:
- 10 points: Completely correct answer and method
- 8-9 points: Correct answer, minor issues with work shown
- 5-7 points: Partially correct, some understanding shown
- 2-4 points: Wrong answer but some correct steps
- 0-1 points: Completely wrong or no work shown

IMPORTANT:
- For arithmetic problems, focus on the final numerical answer
- Be consistent in your scoring
- Always show the correct solution step by step
- If it's a simple addition/subtraction, don't overcomplicate

Please respond with EXACTLY this JSON format (no extra text):
{
  "is_correct": true/false,
  "score": number_0_to_10,
  "explanation": "Brief explanation of what was right/wrong",
  "solution": "Step-by-step correct solution with final answer"
}`.trim();

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0.1, // Reduced temperature for more consistency
      max_tokens: 500,  // Limit response length
      messages: [{ role: "user", content: prompt }],
    });

    const raw = completion.choices[0].message.content.trim();
    console.log("LLM Raw Response:", raw); // Debug log
    
    // Try to extract JSON if it's wrapped in other text
    let jsonStr = raw;
    if (raw.includes('{') && raw.includes('}')) {
      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}') + 1;
      jsonStr = raw.substring(start, end);
    }
    
    const result = JSON.parse(jsonStr);
    
    // Validate the response structure
    if (typeof result.is_correct !== 'boolean' || 
        typeof result.score !== 'number' || 
        typeof result.explanation !== 'string' || 
        typeof result.solution !== 'string') {
      throw new Error('Invalid response structure');
    }
    
    // Ensure score is within valid range
    result.score = Math.max(0, Math.min(10, Math.round(result.score)));
    
    console.log("LLM Parsed Result:", result); // Debug log
    return result;
    
  } catch (err) {
    console.error("LLM error:", err);
    console.error("Raw response:", completion?.choices?.[0]?.message?.content || "No response");
    
    // Fallback: Simple exact match check
    const isExactMatch = studentAns.toString().trim().toLowerCase() === 
                        correctAns.toString().trim().toLowerCase();
    
    return {
      is_correct: isExactMatch,
      score: isExactMatch ? 10 : 2,
      explanation: isExactMatch ? 
        "Correct answer!" : 
        "Answer doesn't match expected result. Please check your calculation.",
      solution: correctAns ? 
        `The correct answer is: ${correctAns}` : 
        "Please verify the solution with your teacher."
    };
  }
}

// Helper function to validate and clean answers
function validateAnswers(qText, correctAns, studentAns) {
  // Clean and normalize answers
  const cleanStudent = studentAns.toString().trim();
  const cleanCorrect = correctAns.toString().trim();
  
  // For simple arithmetic, try to extract just the numbers and calculate ourselves
  const arithmeticMatch = qText.match(/(\d+)\s*[\+\-\*\/]\s*(\d+)/);
  if (arithmeticMatch) {
    const num1 = parseInt(arithmeticMatch[1]);
    const operator = qText.match(/[\+\-\*\/]/)[0];
    const num2 = parseInt(arithmeticMatch[2]);
    
    let calculatedAnswer;
    switch (operator) {
      case '+': calculatedAnswer = num1 + num2; break;
      case '-': calculatedAnswer = num1 - num2; break;
      case '*': calculatedAnswer = num1 * num2; break;
      case '/': calculatedAnswer = num1 / num2; break;
    }
    
    const studentNum = parseInt(cleanStudent);
    
    if (!isNaN(studentNum) && !isNaN(calculatedAnswer)) {
      return {
        isSimpleArithmetic: true,
        studentAnswer: studentNum,
        correctAnswer: calculatedAnswer,
        originalStudent: cleanStudent,
        originalCorrect: calculatedAnswer.toString()
      };
    }
  }
  
  return {
    isSimpleArithmetic: false,
    studentAnswer: cleanStudent,
    correctAnswer: cleanCorrect,
    originalStudent: cleanStudent,
    originalCorrect: cleanCorrect
  };
}

// Simple and reliable LLM function
async function verifyAnswerWithLLM_enhanced(qText, correctAns = "", studentAns = "") {
  console.log("=== LLM VERIFICATION START ===");
  console.log("Question:", qText);
  console.log("Expected Answer:", correctAns);
  console.log("Student Answer:", studentAns);
  
  // STEP 1: Handle simple arithmetic directly (no LLM needed)
  const arithmeticMatch = qText.match(/(\d+)\s*[\+\-\*\/]\s*(\d+)/);
  if (arithmeticMatch) {
    const num1 = parseInt(arithmeticMatch[1]);
    const operator = qText.match(/[\+\-\*\/]/)[0];
    const num2 = parseInt(arithmeticMatch[2]);
    
    let calculatedAnswer;
    switch (operator) {
      case '+': calculatedAnswer = num1 + num2; break;
      case '-': calculatedAnswer = num1 - num2; break;
      case '*': calculatedAnswer = num1 * num2; break;
      case '/': calculatedAnswer = num1 / num2; break;
    }
    
    console.log(`Calculated: ${num1} ${operator} ${num2} = ${calculatedAnswer}`);
    
    const studentNum = parseInt(studentAns.toString().trim());
    console.log("Student answered:", studentNum);
    
    if (!isNaN(studentNum)) {
      if (studentNum === calculatedAnswer) {
        console.log("✅ PERFECT MATCH - 10/10");
        return {
          is_correct: true,
          score: 10,
          explanation: "Correct answer!",
          solution: `${qText} = ${calculatedAnswer}`
        };
      } else {
        console.log("❌ WRONG ANSWER - 1/10");
        return {
          is_correct: false,
          score: 1,
          explanation: `Incorrect. You answered ${studentNum} but the correct answer is ${calculatedAnswer}.`,
          solution: `${qText} = ${calculatedAnswer}`
        };
      }
    }
  }
  
  // STEP 2: For non-arithmetic questions, use simplified LLM
  console.log("Using LLM for complex question...");
  
  const prompt = `
You are grading a student's answer. Be VERY STRICT.

Question: ${qText}
Student's Answer: ${studentAns}
Expected Correct Answer: ${correctAns || "Not provided"}

STRICT GRADING RULES:
- If student's answer exactly matches the expected answer: give 10 points
- If student's answer is completely wrong (different from expected): give 1 point ONLY
- If student shows partial understanding but wrong final answer: give 3-4 points maximum
- Be harsh on incorrect answers

EXAMPLE: If expected is "5" and student says "3", that's completely wrong = 1 point.

Respond with this exact JSON format:
{
  "is_correct": true/false,
  "score": number_from_1_to_10,
  "explanation": "Brief explanation of why this score",
  "solution": "The correct answer is [expected answer] because [brief reason]"
}`.trim();

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0,
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = completion.choices[0].message.content.trim();
    console.log("LLM Response:", raw);
    
    // Extract JSON
    let jsonStr = raw;
    if (raw.includes('{')) {
      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}') + 1;
      jsonStr = raw.substring(start, end);
    }
    
    const result = JSON.parse(jsonStr);
    result.score = Math.max(1, Math.min(10, Math.round(result.score)));
    
    // Additional validation: if answers don't match exactly and we have a correct answer, cap the score
    if (correctAns && correctAns.toString().trim() !== "") {
      const studentClean = studentAns.toString().trim().toLowerCase();
      const correctClean = correctAns.toString().trim().toLowerCase();
      
      if (studentClean !== correctClean && result.score > 4) {
        console.log(`Answers don't match exactly: "${studentClean}" vs "${correctClean}". Capping score from ${result.score} to 1.`);
        result.score = 1;
        result.is_correct = false;
        result.explanation = `Incorrect. Expected "${correctAns}" but got "${studentAns}".`;
      }
    }
    
    console.log("Final LLM Result:", result);
    return result;
    
  } catch (err) {
    console.error("LLM Error:", err);
    
    // Simple fallback
    const isMatch = studentAns.toString().toLowerCase().trim() === 
                   correctAns.toString().toLowerCase().trim();
    
    return {
      is_correct: isMatch,
      score: isMatch ? 10 : 2,
      explanation: isMatch ? "Correct!" : "Answer doesn't match expected result.",
      solution: correctAns || "Check with your teacher for the correct answer."
    };
  }
}

// Get question details with user-specific reaction information
async function get_question_details_for_user(question_id, user_id) {
  const question = await Question.findById(question_id)
    .populate("created_by", "name avatar")
    .populate({
      path: "answers",
      populate: { path: "student_id", select: "name avatar" }
    });
  
  // Generate avatar URLs for created_by
  if (question && question.created_by && question.created_by.avatar) {
    const avatarRepo = require("./avatar.repository");
    question.created_by.avatarUrl = avatarRepo.generateAvatarUrl(question.created_by.avatar);
  }
  
  // Sort answers by score in descending order (highest score first)
  if (question && question.answers) {
    question.answers.sort((a, b) => {
      const scoreA = a.score || 0;
      const scoreB = b.score || 0;
      return scoreB - scoreA; // Descending order
    });
    
    // Add avatar URLs and reaction summaries to each answer
    question.answers.forEach(answer => {
      // Generate avatar URL for answer author
      if (answer.student_id && answer.student_id.avatar) {
        const avatarRepo = require("./avatar.repository");
        answer.student_id.avatarUrl = avatarRepo.generateAvatarUrl(answer.student_id.avatar);
      }
      
      if (answer.reactions && answer.reactions.length > 0) {
        // Calculate reaction counts
        answer.reactionSummary = answer.reactions.reduce((acc, reaction) => {
          acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
          return acc;
        }, {});
        
        // Find current user's reaction
        answer.userReaction = answer.reactions.find(r => 
          String(r.user_id) === String(user_id)
        )?.emoji || null;
      } else {
        answer.reactionSummary = {};
        answer.userReaction = null;
      }
    });
  }
  
  return question;
}

// … your existing CRUD below …

module.exports = {
  post_a_question: async (question, description, topic, points, student_id, correct_answer = null) => {
    console.log("=== CREATING QUESTION ===");
    console.log("Question text:", question);
    console.log("Provided correct answer:", correct_answer);
    
    // Auto-calculate for simple arithmetic
    let finalAnswer = correct_answer;
    
    const arithmeticMatch = question.match(/(\d+)\s*[\+\-\*\/]\s*(\d+)/);
    if (arithmeticMatch && !finalAnswer) {
      const num1 = parseInt(arithmeticMatch[1]);
      const operator = question.match(/[\+\-\*\/]/)[0];
      const num2 = parseInt(arithmeticMatch[2]);
      
      switch (operator) {
        case '+': finalAnswer = (num1 + num2).toString(); break;
        case '-': finalAnswer = (num1 - num2).toString(); break;
        case '*': finalAnswer = (num1 * num2).toString(); break;
        case '/': finalAnswer = (num1 / num2).toString(); break;
      }
      
      console.log(`Auto-calculated: ${num1} ${operator} ${num2} = ${finalAnswer}`);
    }
    
    const questionData = {
      question,
      description,
      topic,
      points,
      correct_answer: finalAnswer,
      date_posted: new Date(),
      created_by: student_id,
      active_from_date: new Date(),
      question_type: "week",
    };
    
    console.log("Saving question with correct_answer:", finalAnswer);
    
    return Question.create(questionData);
  },

  get_questions_for_week: async (start_date, end_date) => {
    const qs = await Question.find({
      due_date: { $gte: start_date, $lte: end_date }
    })
    .populate("created_by", "name avatar");
    
    // Add avatar URLs to all questions
    const avatarRepo = require("./avatar.repository");
    qs.forEach(question => {
      if (question.created_by && question.created_by.avatar) {
        question.created_by.avatarUrl = avatarRepo.generateAvatarUrl(question.created_by.avatar);
      }
    });
    
    return {
      day: qs.filter(q => q.question_type === "day").sort((a, b) => a.due_date - b.due_date),
      week: qs.find(q => q.question_type === "week") || {}
    };
  },

  get_question_details: async (question_id) => {
    const question = await Question.findById(question_id)
      .populate("created_by", "name avatar")
      .populate({
        path: "answers",
        populate: { path: "student_id", select: "name avatar" }
      });
    
    // Generate avatar URLs for created_by
    if (question && question.created_by && question.created_by.avatar) {
      const avatarRepo = require("./avatar.repository");
      question.created_by.avatarUrl = avatarRepo.generateAvatarUrl(question.created_by.avatar);
    }
    
    // Sort answers by score in descending order (highest score first)
    if (question && question.answers) {
      question.answers.sort((a, b) => {
        const scoreA = a.score || 0;
        const scoreB = b.score || 0;
        return scoreB - scoreA; // Descending order
      });
      
      // Add avatar URLs and reaction summaries to each answer
      question.answers.forEach(answer => {
        // Generate avatar URL for answer author
        if (answer.student_id && answer.student_id.avatar) {
          const avatarRepo = require("./avatar.repository");
          answer.student_id.avatarUrl = avatarRepo.generateAvatarUrl(answer.student_id.avatar);
        }
        
        // Ensure reactions is always an array
        if (!Array.isArray(answer.reactions)) {
          answer.reactions = [];
        }
        
        if (answer.reactions && answer.reactions.length > 0) {
          answer.reactionSummary = answer.reactions.reduce((acc, reaction) => {
            acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
            return acc;
          }, {});
        } else {
          answer.reactionSummary = {};
        }
      });
    }
    
    return question;
  },

  // Get question details with user-specific reaction information
  get_question_details_for_user: async (question_id, user_id) => {
    const question = await Question.findById(question_id)
      .populate("created_by", "name avatar")
      .populate({
        path: "answers",
        populate: { path: "student_id", select: "name avatar" }
      });
    
    // Generate avatar URLs for created_by
    if (question && question.created_by && question.created_by.avatar) {
      const avatarRepo = require("./avatar.repository");
      question.created_by.avatarUrl = avatarRepo.generateAvatarUrl(question.created_by.avatar);
    }
    
    // Sort answers by score in descending order (highest score first)
    if (question && question.answers) {
      question.answers.sort((a, b) => {
        const scoreA = a.score || 0;
        const scoreB = b.score || 0;
        return scoreB - scoreA; // Descending order
      });
      
      // Add avatar URLs and reaction summaries and user reaction status to each answer
      question.answers.forEach(answer => {
        // Generate avatar URL for answer author
        if (answer.student_id && answer.student_id.avatar) {
          const avatarRepo = require("./avatar.repository");
          answer.student_id.avatarUrl = avatarRepo.generateAvatarUrl(answer.student_id.avatar);
        }
        
        if (answer.reactions && answer.reactions.length > 0) {
          // Calculate reaction counts
          answer.reactionSummary = answer.reactions.reduce((acc, reaction) => {
            acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
            return acc;
          }, {});
          
          // Find current user's reaction
          answer.userReaction = answer.reactions.find(r => 
            String(r.user_id) === String(user_id)
          )?.emoji || null;
        } else {
          answer.reactionSummary = {};
          answer.userReaction = null;
        }
      });
    }
    
    return question;
  },

  submit_answer: async (question_id, student_id, answer) => {
    const q = await Question.findById(question_id);
    if (!q) throw new Error("Question not found");

    // Upsert
    let idx = q.answers.findIndex(a => String(a.student_id) === String(student_id));
    if (idx === -1) {
      q.answers.push({ student_id, answer, date: new Date() });
      idx = q.answers.length - 1;
    } else {
      q.answers[idx].answer = answer;
      q.answers[idx].date = new Date();
    }

    // LLM scoring with enhanced validation
    const llm = await verifyAnswerWithLLM_enhanced(q.question, q.correct_answer || "", answer);

    Object.assign(q.answers[idx], {
      is_correct: llm.is_correct,
      score: llm.score,
      explanation: llm.explanation,
      solution: llm.solution,
      verified: true,
      points_earned: llm.score
    });

    if (llm.score > 0) {
      await Student.updateOne(
        { _id: student_id },
        { $inc: { current_points: llm.score, total_points_earned: llm.score } }
      );
    }

    await q.save();
    return { success: true, llm };
  },

  // GET only this student's questions
  get_my_questions: async (start_date, end_date, topic, student_id) => {
    const filter = topic === "All"
      ? { created_by: student_id }
      : { topic, created_by: student_id };
    
    const questions = await Question.find(filter)
      .populate("created_by", "name avatar");
    
    // Add avatar URLs to all questions
    const avatarRepo = require("./avatar.repository");
    questions.forEach(question => {
      if (question.created_by && question.created_by.avatar) {
        question.created_by.avatarUrl = avatarRepo.generateAvatarUrl(question.created_by.avatar);
      }
    });
    
    return questions;
  },

  // GET all posted (or by topic)
  get_student_questions_posted: async (topic) => {
    const questions = topic === "All"
      ? await Question.find({}).populate("created_by", "name avatar")
      : await Question.find({ topic }).populate("created_by", "name avatar");
    
    // Add avatar URLs to all questions
    const avatarRepo = require("./avatar.repository");
    questions.forEach(question => {
      if (question.created_by && question.created_by.avatar) {
        question.created_by.avatarUrl = avatarRepo.generateAvatarUrl(question.created_by.avatar);
      }
    });
    
    return questions;
  },

  // simple vote / react handlers
  vote_student_answer: async (question_id, vote_by, vote_to, vote) => {
    const q = await Question.findById(question_id);
    const ans = q.answers.find(a => String(a.student_id) === String(vote_to));
    Object.assign(ans, { vote_by, vote_to, vote });
    await q.save();
    return { success: true };
  },

  // This react_to_answer function has been replaced by the improved version below
  react_to_answer_legacy: async (question_id, user_id, answer_student_id, emoji) => {
    console.log("=== REACT_TO_ANSWER_LEGACY CALLED ===");
    console.log("This function is deprecated. The enhanced version below will be used instead.");
    
    // Forward to the improved function
    return module.exports.react_to_answer(question_id, user_id, answer_student_id, emoji);
  },

  // Note: get_question_details_for_user is already defined above, this duplicate has been removed

  // React to someone's answer
  react_to_answer: async (question_id, user_id, answer_student_id, emoji) => {
    console.log("=== REACT_TO_ANSWER REPOSITORY ===");
    console.log("question_id:", question_id);
    console.log("user_id:", user_id);
    console.log("answer_student_id:", answer_student_id);
    console.log("emoji:", emoji);
    
    const q = await Question.findById(question_id);
    if (!q) throw new Error("Question not found");
    
    console.log("Question found, answers count:", q.answers.length);
    
    // Try to find answer by ID first (may be the answer_id)
    let answerIndex = -1;
    
    // Try to find by _id first
    try {
      answerIndex = q.answers.findIndex(a => String(a._id) === String(answer_student_id));
      console.log("Tried finding by answer._id, index:", answerIndex);
    } catch (err) {
      console.log("Error finding by _id:", err.message);
    }
    
    // If not found by _id, try by student_id
    if (answerIndex === -1) {
      answerIndex = q.answers.findIndex(a => String(a.student_id) === String(answer_student_id));
      console.log("Tried finding by student_id, index:", answerIndex);
    }
    
    console.log("Final answer index found:", answerIndex);
    
    if (answerIndex === -1) {
      console.error("Answer not found! Here are all answers:", 
        q.answers.map(a => ({
          _id: String(a._id),
          student_id: String(a.student_id)
        }))
      );
      throw new Error("Answer not found");
    }
    
    const answer = q.answers[answerIndex];
    
    // Initialize reactions array if it doesn't exist or is not an array
    if (!answer.reactions || !Array.isArray(answer.reactions)) {
      console.log("Initializing reactions array for answer");
      answer.reactions = [];
    }
    
    try {
      // Check if user has already reacted with this emoji
      const existingReactionIndex = answer.reactions.findIndex(
        r => String(r.user_id) === String(user_id) && r.emoji === emoji
      );
      
      if (existingReactionIndex !== -1) {
        // User already reacted with this emoji, remove it (toggle off)
        answer.reactions.splice(existingReactionIndex, 1);
      } else {
        // Check if user has reacted with a different emoji
        const userReactionIndex = answer.reactions.findIndex(
          r => String(r.user_id) === String(user_id)
        );
        
        if (userReactionIndex !== -1) {
          // User has reacted with different emoji, replace it
          answer.reactions[userReactionIndex].emoji = emoji;
          answer.reactions[userReactionIndex].date = new Date();
        } else {
          // User hasn't reacted, add new reaction
          answer.reactions.push({
            user_id,
            emoji,
            date: new Date()
          });
        }
      }
      
      await q.save();
      console.log("✅ Question saved successfully with reactions");
      
      // Return reaction summary for this answer
      const reactionSummary = answer.reactions.reduce((acc, reaction) => {
        acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
        return acc;
      }, {});
      
      const userReaction = answer.reactions.find(r => String(r.user_id) === String(user_id))?.emoji || null;
      
      console.log("Final reaction summary:", reactionSummary);
      console.log("User's current reaction:", userReaction);
      
      return { 
        success: true, 
        reactionSummary,
        userReaction,
        totalReactions: Object.values(reactionSummary).reduce((sum, count) => sum + count, 0)
      };
    } catch (error) {
      console.error("Error processing reactions:", error);
      // If there's an error with reactions, reset it to an empty array and save
      answer.reactions = [];
      await q.save();
      return { 
        success: true, 
        reactionSummary: {},
        userReaction: null,
        error: "Reactions reset due to data structure issue"
      };
    }
  },
};
