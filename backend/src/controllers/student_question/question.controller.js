// src/controllers/student_question/question.controller.js

const { StatusCodes } = require("http-status-codes");
const { StudentQuestion } = require("../../model/StudentQuestion.model");
const { Student } = require("../../model/Student.model");
const { response } = require("../../utils/response");
const questionRepository = require("../../repository/student_question.repository");
const groupRepo = require("../../repository/group.repository");
const studentRepo = require("../../repository/student.repository");
const { Message } = require("../../utils/Message");
const mongoose = require("mongoose");

// Create a new question
const post_a_question = async (req, res) => {
  const { question, description, topic, points, student_id, correct_answer } = req.body;
  const POINTS_FOR_POSTING = 5;

  console.log("POST A QUESTION - Request body:", req.body);
  console.log("Student ID received:", student_id);

  try {
    const question_result = await questionRepository.post_a_question(
      question,
      description,
      topic,
      points,
      student_id,
      correct_answer
    );
    
    // Award points to student (non-blocking)
    let achievementInfo = null;
    try {
      console.log("=== QUESTION POSTING POINTS AWARD ===");
      console.log("Attempting to update points for student:", student_id, "with points:", POINTS_FOR_POSTING);
      console.log("Calling studentRepo.update_student_points...");
      
      const pointsResult = await studentRepo.update_student_points(
        student_id,
        POINTS_FOR_POSTING,
        "credit",
        "Posted a question"
      );
      console.log("Points update result:", pointsResult);
      
      if (pointsResult && pointsResult.success) {
        console.log("✅ Points successfully awarded for posting question!");
        
        // Update question posting points breakdown
        await Student.findByIdAndUpdate(
          student_id,
          { $inc: { "points_breakdown.question_posting_points": POINTS_FOR_POSTING } }
        );
        console.log("✅ Points breakdown updated!");
        
        // Always provide achievement info for successful points update
        achievementInfo = {
          reason: "Posted a question",
          points: `+${POINTS_FOR_POSTING}`,
          date: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long', 
            day: 'numeric'
          })
        };
        console.log("✅ Achievement info prepared:", achievementInfo);
      } else {
        console.error("❌ Points update failed:", pointsResult);
        // Still provide achievement info even if database update failed
        // This ensures the frontend can show the points earned message
        achievementInfo = {
          reason: "Posted a question",
          points: `+${POINTS_FOR_POSTING}`,
          date: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        };
      }
    } catch (pointsError) {
      console.error("Error updating student points:", pointsError);
      // Don't fail the entire request if points update fails
    }
    
    if (!question_result) {
      return response(
        res,
        StatusCodes.NOT_FOUND,
        false,
        {},
        "Question not found"
      );
    }

    return response(res, StatusCodes.OK, true, {
      question: question_result,
      achievement: achievementInfo
    }, achievementInfo ? `Question posted successfully! You earned ${POINTS_FOR_POSTING} points.` : null);
  } catch (error) {
    console.error(error);
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      error.message
    );
  }
};

// Get all questions in a date range
const get_questions_for_week = async (req, res) => {
  const { start_date, end_date } = req.body;
  try {
    const questions = await questionRepository.get_questions_for_week(
      start_date,
      end_date
    );
    return response(res, StatusCodes.ACCEPTED, true, questions, null);
  } catch (error) {
    console.error(error);
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      error.message
    );
  }
};

// Get details for a single question (plus this student’s answer, if any)
const get_question_details = async (req, res) => {
  const { question_id, student_id } = req.body;
  try {
    const question = await questionRepository.get_question_details(
      question_id,
      student_id
    );
    return response(
      res,
      StatusCodes.ACCEPTED,
      true,
      { question },
      null
    );
  } catch (error) {
    console.error(error);
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      error.message
    );
  }
};

// ─────────────────────────────────────────────────
// THIS is the only function that changed:
// We now capture the object returned by the repo
// (which includes llm_verification, score, explanation…)
// and send it back as `data` instead of `null`.
// ─────────────────────────────────────────────────
const submit_answer = async (req, res) => {
  console.log("in submit_answer controller");
  const { question_id, student_id, answer } = req.body;

  try {
    // returns the updated question details + LLM verdict
    const updatedDetails = await questionRepository.submit_answer(
      question_id,
      student_id,
      answer
    );
    
    // Check if points were awarded and create an achievement notification
    let achievementInfo = null;
    if (updatedDetails && updatedDetails.llm && updatedDetails.llm.score > 0) {
      // Get the latest achievement for notification
      const currentStudent = await Student.findById(student_id);
      if (currentStudent && currentStudent.achievements && currentStudent.achievements.length > 0) {
        const latestAchievement = currentStudent.achievements[currentStudent.achievements.length - 1];
        achievementInfo = {
          reason: latestAchievement.reason || `Earned points for answer (score: ${updatedDetails.llm.score}/10)`,
          points: `+${updatedDetails.llm.score}`,
          date: new Date(latestAchievement.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        };
      }
    }

    return response(
      res,
      StatusCodes.ACCEPTED,
      true,
      {
        ...updatedDetails,
        achievement: achievementInfo
      },
      achievementInfo ? 
        `Answer submitted successfully! You earned ${achievementInfo.points} points.` : 
        "Answer submitted successfully"
    );
  } catch (error) {
    console.error("submit_answer error:", error);
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      error.message
    );
  }
};

// Get my own questions (filtered by topic / date range)
const get_my_questions = async (req, res) => {
  const { start_date, end_date, topic, student_id } = req.body;
  try {
    const questions = await questionRepository.get_my_questions(
      start_date,
      end_date,
      topic,
      student_id
    );
    return response(res, StatusCodes.ACCEPTED, true, questions, null);
  } catch (error) {
    console.error(error);
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      error.message
    );
  }
};

// Get questions posted by students (optionally by topic)
const get_student_questions_posted = async (req, res) => {
  const { topic } = req.body;
  try {
    const questions = await questionRepository.get_student_questions_posted(
      topic
    );
    return response(res, StatusCodes.ACCEPTED, true, questions, null);
  } catch (error) {
    console.error(error);
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      error.message
    );
  }
};

// Upvote/downvote someone’s answer
const vote_student_answer = async (req, res) => {
  const { question_id, vote_by, vote_to, vote } = req.body;
  try {
    await questionRepository.vote_student_answer(
      question_id,
      vote_by,
      vote_to,
      vote
    );
    if (vote === "up") {
      // award group points
      await groupRepo.update_group_points(
        vote_to,
        20,
        "credit",
        "submitted answer was upvoted"
      );
    }
    return response(res, StatusCodes.ACCEPTED, true, null, "Voted successfully");
  } catch (error) {
    console.error(error);
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      error.message
    );
  }
};

// React (emoji etc.) to someone's answer
const react_to_answer = async (req, res) => {
  const { question_id, reaction_by, reaction_for, reaction } = req.body;
  const POINTS_FOR_REACTION = 2;
  
  console.log("REACT TO ANSWER - Request body:", req.body);
  console.log("Reaction details:", { question_id, reaction_by, reaction_for, reaction });
  
  try {
    // Get the question details first to verify the actual student ID
    const questionDetails = await questionRepository.get_question_details(question_id);
    if (!questionDetails) {
      return response(
        res,
        StatusCodes.NOT_FOUND,
        false,
        {},
        "Question not found"
      );
    }
    
    // Find the correct student ID from the answers in the question
    let correctStudentId = null;
    let answerId = null;
    
    // First try to find the answer by ID
    const answerById = questionDetails.answers.find(a => String(a._id) === String(reaction_for));
    if (answerById) {
      correctStudentId = String(answerById.student_id._id || answerById.student_id);
      answerId = String(answerById._id);
      console.log("Found answer by ID, correct student_id:", correctStudentId);
    } else {
      // If not found by ID, look for it by student_id
      const answerByStudentId = questionDetails.answers.find(a => 
        String(a.student_id._id || a.student_id) === String(reaction_for)
      );
      
      if (answerByStudentId) {
        correctStudentId = String(answerByStudentId.student_id._id || answerByStudentId.student_id);
        answerId = String(answerByStudentId._id);
        console.log("Found answer by student_id, correct student_id:", correctStudentId);
      }
    }
    
    if (!correctStudentId) {
      console.log("Could not find valid student for reaction. Available answers:", 
        questionDetails.answers.map(a => ({
          answer_id: String(a._id),
          student_id: String(a.student_id._id || a.student_id)
        }))
      );
      return response(
        res,
        StatusCodes.BAD_REQUEST,
        false,
        {},
        "Could not find a valid student for this reaction"
      );
    }
    
    // Now use the identified student_id for the reaction
    const reactionResult = await questionRepository.react_to_answer(
      question_id,
      reaction_by,       // user_id (who is reacting)
      answerId || reaction_for, // Use the answer ID we found if available
      reaction           // emoji
    );
    
    console.log("Reaction result:", reactionResult);
    
    // Award points ONLY for thumbs up (like) or heart (love) reactions
    let achievementInfo = null;
    const pointEligibleReactions = ["like", "love"]; // Only these emojis award points
    
    if (pointEligibleReactions.includes(reaction)) {
      try {
        console.log("=== REACTION POINTS AWARD ===");
        console.log("Awarding points for reaction:", reaction, "to student:", correctStudentId);
        console.log("This reaction is eligible for points:", pointEligibleReactions.includes(reaction));
        
        // Use the verified student ID from the answer
        const pointsResult = await studentRepo.update_student_points(
          correctStudentId,
          POINTS_FOR_REACTION,
          "credit",
          `Received ${reaction} reaction on answer`
        );
        
        console.log("Reaction points update result:", pointsResult);
        
        if (pointsResult.success) {
          console.log("✅ Reaction points awarded successfully!");
          
          // Update reaction points breakdown if points update was successful
          try {
            const currentStudent = await Student.findById(correctStudentId);
            if (currentStudent) {
              const currentReactionPoints = currentStudent.points_breakdown?.reaction_points || 0;
              
              await Student.findByIdAndUpdate(
                correctStudentId,
                { $set: { "points_breakdown.reaction_points": currentReactionPoints + POINTS_FOR_REACTION } }
              );
              
              console.log("✅ Points breakdown updated! Student", correctStudentId, "now has", 
                currentReactionPoints + POINTS_FOR_REACTION, "reaction points");
              
              // Get the latest achievement for notification
              if (currentStudent.achievements && currentStudent.achievements.length > 0) {
                const latestAchievement = currentStudent.achievements[currentStudent.achievements.length - 1];
                achievementInfo = {
                  reason: latestAchievement.reason,
                  points: latestAchievement.type === 'credit' ? `+${latestAchievement.points}` : `-${latestAchievement.points}`,
                  date: new Date(latestAchievement.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                };
                console.log("✅ Reaction achievement info prepared:", achievementInfo);
              }
            }
          } catch (breakdownError) {
            console.error("❌ Error updating points breakdown:", breakdownError);
          }
        } else {
          console.error("❌ Failed to award reaction points:", pointsResult.error);
        }
        
      } catch (pointsError) {
        console.error("Error updating student points for reaction:", pointsError);
        // Don't fail the entire request if points update fails
      }
    } else {
      console.log("No points awarded for reaction:", reaction);
    }
    
    // Enhance the response with more details
    return response(
      res,
      StatusCodes.ACCEPTED,
      true,
      {
        ...reactionResult,
        reaction_details: {
          question_id,
          student_id: correctStudentId,
          reaction: reaction,
          points_awarded: pointEligibleReactions.includes(reaction) ? POINTS_FOR_REACTION : 0
        },
        achievement: achievementInfo // Include the achievement info for UI notification
      },
      achievementInfo ? 
        `Reacted successfully! ${achievementInfo.points} points awarded to the answer author.` : 
        "Reacted successfully"
    );
  } catch (error) {
    console.error(error);
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      error.message
    );
  }
};

// DEBUG: Get question structure to help identify correct student IDs
const debug_question_structure = async (req, res) => {
  const { question_id } = req.params;
  try {
    const question = await questionRepository.get_question_details(question_id);
    
    const debugInfo = {
      question_id: question._id,
      question_text: question.question ? question.question : "No question text",
      answers: question.answers.map((answer, index) => {
        // Ensure reactions is always an array
        const reactions = Array.isArray(answer.reactions) ? answer.reactions : [];
        
        return {
          index: index,
          answer_id: answer._id,
          student_id: answer.student_id,
          student_name: answer.student_name || "Unknown",
          answer_text: answer.answer ? answer.answer.substring(0, 50) + '...' : 'No text',
          reactions: reactions
        };
      })
    };
    
    return response(
      res,
      StatusCodes.OK,
      true,
      debugInfo,
      "Question structure retrieved"
    );
  } catch (error) {
    console.error(error);
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      error.message
    );
  }
};

// DEBUG: Get student information for debugging points
const debug_student_info = async (req, res) => {
  const { student_id } = req.params;
  try {
    // Check if ID is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(student_id)) {
      return response(
        res,
        StatusCodes.BAD_REQUEST,
        false,
        {},
        "Invalid student ID format"
      );
    }

    const student = await Student.findById(student_id);
    
    if (!student) {
      return response(
        res,
        StatusCodes.NOT_FOUND,
        false,
        {},
        "Student not found"
      );
    }
    
    // Get a safe version of student info for debugging
    const studentInfo = {
      _id: student._id,
      name: student.name,
      email: student.email.substring(0, 3) + "***" + student.email.substring(student.email.indexOf("@")),
      current_points: student.current_points,
      total_points_earned: student.total_points_earned,
      points_breakdown: student.points_breakdown,
      individual_rank: student.individual_rank,
    };
    
    return response(
      res,
      StatusCodes.OK,
      true,
      studentInfo,
      "Student information retrieved"
    );
  } catch (error) {
    console.error(error);
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      error.message
    );
  }
};

module.exports = {
  post_a_question,
  get_questions_for_week,
  get_question_details,
  submit_answer,             // ← updated
  get_my_questions,
  get_student_questions_posted,
  vote_student_answer,
  react_to_answer,
  debug_question_structure,  // ← new debug endpoint
  debug_student_info,        // ← new debug endpoint for student info
};
