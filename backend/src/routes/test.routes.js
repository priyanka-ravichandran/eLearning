const { Router } = require("express");
const { Student } = require("../model/Student.model");
const { StudentQuestion } = require("../model/StudentQuestion.model");
const studentRepo = require("../repository/student.repository");
const { response } = require("../utils/response");
const { StatusCodes } = require("http-status-codes");

const router = Router();

// Get student points
router.get("/student/:student_id/points", async (req, res) => {
  try {
    const student = await Student.findById(req.params.student_id);
    if (!student) {
      return response(
        res,
        StatusCodes.NOT_FOUND,
        false,
        {},
        "Student not found"
      );
    }
    
    return response(
      res,
      StatusCodes.OK,
      true,
      {
        current_points: student.current_points,
        total_points_earned: student.total_points_earned,
        points_breakdown: student.points_breakdown
      },
      "Student points retrieved successfully"
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
});

// Test award points endpoint
router.post("/student/:student_id/award-points", async (req, res) => {
  const { points, reason } = req.body;
  
  if (!points || isNaN(points)) {
    return response(
      res,
      StatusCodes.BAD_REQUEST,
      false,
      {},
      "Valid points value is required"
    );
  }
  
  try {
    await studentRepo.update_student_points(
      req.params.student_id,
      points,
      "credit",
      reason || "Test award points"
    );
    
    const student = await Student.findById(req.params.student_id);
    
    return response(
      res,
      StatusCodes.OK,
      true,
      {
        current_points: student.current_points,
        points_breakdown: student.points_breakdown
      },
      "Points awarded successfully"
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
});

// Test reaction simulation
router.post("/simulate-reaction", async (req, res) => {
  const { question_id, reaction_by, reaction_for, reaction } = req.body;
  
  if (!question_id || !reaction_by || !reaction_for || !reaction) {
    return response(
      res,
      StatusCodes.BAD_REQUEST,
      false,
      {},
      "Missing required fields"
    );
  }
  
  try {
    const question = await StudentQuestion.findById(question_id);
    if (!question) {
      return response(
        res,
        StatusCodes.NOT_FOUND,
        false,
        {},
        "Question not found"
      );
    }
    
    // Display available answers for debugging
    const answersInfo = question.answers.map(a => ({
      answer_id: String(a._id),
      student_id: String(a.student_id),
      student_name: a.student_name
    }));
    
    // Log the test information
    console.log("SIMULATE REACTION TEST");
    console.log("Question ID:", question_id);
    console.log("Reaction By:", reaction_by);
    console.log("Reaction For:", reaction_for);
    console.log("Reaction:", reaction);
    console.log("Available answers:", answersInfo);
    
    // Call the repository function directly for testing
    const questionRepository = require("../repository/student_question.repository");
    const reactionResult = await questionRepository.react_to_answer(
      question_id,
      reaction_by,
      reaction_for,
      reaction
    );
    
    // Award points if applicable
    const POINTS_FOR_REACTION = 2;
    if (reaction === "👍" || reaction === "❤️" || reaction === "love" || reaction === "like" || reaction === "thumbs_up") {
      try {
        console.log("Awarding points for reaction:", reaction, "to student:", reaction_for);
        await studentRepo.update_student_points(
          reaction_for,
          POINTS_FOR_REACTION,
          "credit",
          `Test: Received ${reaction} reaction on answer`
        );
        
        // Update reaction points breakdown - get current value first
        const currentStudent = await Student.findById(reaction_for);
        const currentReactionPoints = currentStudent.points_breakdown?.reaction_points || 0;
        
        await Student.findByIdAndUpdate(
          reaction_for,
          { $set: { "points_breakdown.reaction_points": currentReactionPoints + POINTS_FOR_REACTION } }
        );
      } catch (pointsError) {
        console.error("Error updating student points for reaction:", pointsError);
      }
    }
    
    const result = reactionResult;
    
    // Get updated student points
    const student = await Student.findById(reaction_for);
    
    return response(
      res,
      StatusCodes.OK,
      true,
      {
        reaction_result: result,
        student_points: {
          current_points: student.current_points,
          points_breakdown: student.points_breakdown
        }
      },
      "Reaction simulation completed"
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
});

module.exports = router;
