const { StatusCodes } = require("http-status-codes");
const { Student } = require("../../model/Student.model");
const { response } = require("../../utils/response");
const studentRepository = require("../../repository/student.repository");
const { Message } = require("../../utils/Message");

// Get student Details
const getStudentDetails = async (req, res) => {
  const { student_id } = req.body;

  try {
    const student = await studentRepository.findById(student_id);
    if (!student) {
      return response(
        res,
        StatusCodes.NOT_FOUND,
        false,
        {},
        Message.USER.NOT_FOUND
      );
    }
    console.log("Student Details: ", student);
    return response(res, StatusCodes.OK, true, student, null);
  } catch (error) {
    console.log(error.message);
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      error.message
    );
  }
};

const updateStudentPoints = async (req, res) => {
  try {
    const { student_id, points, transaction_type, reason } = req.body;

    try {
      const current_points = await studentRepository.update_student_points(
        student_id,
        points,
        transaction_type,
        reason
      );

      return response(
        res,
        StatusCodes.ACCEPTED,
        true,
        { current_points: current_points },
        null
      );
    } catch (error) {
      return response(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        false,
        {},
        error.message
      );
    }
  } catch (error) {
    console.log(error.message);
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      error.message
    );
  }
};

const getStudentAchievements = async (req, res) => {
  try {
    const { student_id } = req.body;
    console.log("Getting achievements for student:", student_id);

    try {
      // Use raw MongoDB query to get achievements since Mongoose schema has issues
      const db = require('mongoose').connection.db;
      const studentRaw = await db.collection('students').findOne({ 
        _id: require('mongoose').Types.ObjectId(student_id) 
      });
      
      if (!studentRaw) {
        return response(
          res,
          StatusCodes.NOT_FOUND,
          false,
          {},
          "Student not found"
        );
      }
      
      // Get achievements and format them for the UI
      let achievements = [];
      if (studentRaw.achievements && studentRaw.achievements.length > 0) {
        achievements = studentRaw.achievements.map(achievement => {
          // Format the achievement data
          return {
            reason: achievement.reason,
            date: achievement.date,
            type: achievement.type,
            points: achievement.type === 'credit' ? `+${achievement.points}` : `-${achievement.points}`,
            points_value: achievement.points, // Raw value for sorting/filtering
            formatted_date: new Date(achievement.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
          };
        });
        
        // Sort by date (newest first)
        achievements.sort((a, b) => new Date(b.date) - new Date(a.date));
      }
      
      // Include points breakdown for UI
      const pointsBreakdown = {
        current_points: studentRaw.current_points || 0,
        total_points_earned: studentRaw.total_points_earned || 0,
        breakdown: studentRaw.points_breakdown || {
          llm_score_points: 0,
          question_posting_points: 0,
          reaction_points: 0
        },
        individual_rank: studentRaw.individual_rank || 0
      };

      return response(
        res,
        StatusCodes.OK,
        true,
        { 
          achievements: achievements,
          points_info: pointsBreakdown
        },
        "Achievements retrieved successfully"
      );
    } catch (error) {
      console.error("Error getting student achievements:", error);
      return response(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        false,
        {},
        error.message
      );
    }
  } catch (error) {
    console.log(error.message);
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      error.message
    );
  }
};

const getIndividualLeaderboard = async (req, res) => {
  try {
    try {
      const inidividual_leaderboard =
        await studentRepository.get_inidividual_leaderboard();

      return response(
        res,
        StatusCodes.ACCEPTED,
        true,
        { payload: inidividual_leaderboard },
        null
      );
    } catch (error) {
      return response(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        false,
        {},
        error.message
      );
    }
  } catch (error) {
    console.log(error.message);
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      error.message
    );
  }
};

const getPointTransactions = async (req, res) => {
  try {
    const { student_id } = req.body;
    console.log("Getting point transactions for student:", student_id);

    try {
      // Use raw MongoDB query to get achievements since Mongoose schema has issues
      const db = require('mongoose').connection.db;
      const studentRaw = await db.collection('students').findOne({ 
        _id: require('mongoose').Types.ObjectId(student_id) 
      });
      
      if (!studentRaw) {
        return response(
          res,
          StatusCodes.NOT_FOUND,
          false,
          {},
          "Student not found"
        );
      }
      
      // Get achievements (which serve as point transactions) and format them for the UI
      let transactions = [];
      if (studentRaw.achievements && studentRaw.achievements.length > 0) {
        transactions = studentRaw.achievements.map(achievement => {
          // Format the transaction data to match frontend expectations
          return {
            reason: achievement.reason,
            date: achievement.date,
            type: achievement.type,
            points: achievement.type === 'credit' ? `+${achievement.points}` : `-${achievement.points}`,
            // Add amount field to match what frontend expects
            amount: achievement.points,
            points_value: achievement.points,
            formatted_date: new Date(achievement.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            // Add created_at as fallback for date
            created_at: achievement.date
          };
        });
        
        // Sort by date (newest first)
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
      }
      
      // Include current points info
      const pointsInfo = {
        current_points: studentRaw.current_points || 0,
        total_points_earned: studentRaw.total_points_earned || 0
      };

      console.log(`Successfully retrieved ${transactions.length} transactions for student ${student_id}`);

      return response(
        res,
        StatusCodes.OK,
        true,
        { 
          transactions: transactions,
          points_info: pointsInfo
        },
        "Point transactions retrieved successfully"
      );
    } catch (error) {
      console.error("Error getting student point transactions:", error);
      return response(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        false,
        {},
        error.message
      );
    }
  } catch (error) {
    console.log(error.message);
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
  getStudentDetails,
  updateStudentPoints,
  getStudentAchievements,
  getIndividualLeaderboard,
  getPointTransactions,
};
