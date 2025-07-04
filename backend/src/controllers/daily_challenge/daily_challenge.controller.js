// src/controllers/daily_challenge/daily_challenge.controller.js
const { StatusCodes } = require("http-status-codes");
const { response } = require("../../utils/response");
const dailyChallengeRepo = require("../../repository/daily_challenge.repository");
const groupRepo = require("../../repository/group.repository");
const studentRepo = require("../../repository/student.repository");
const { Student } = require("../../model/Student.model");
const { Group } = require("../../model/Group.model");

// Teacher posts a daily challenge
const postDailyChallenge = async (req, res) => {
  const { question, description, topic, correct_answer, teacher_id } = req.body;
  
  console.log("POST DAILY CHALLENGE - Request body:", req.body);
  
  try {
    // Validate required fields
    if (!question || !topic || !correct_answer || !teacher_id) {
      return response(
        res,
        StatusCodes.BAD_REQUEST,
        false,
        {},
        "Missing required fields: question, topic, correct_answer, teacher_id"
      );
    }
    
    // Verify teacher exists (you might want to add a teacher role check here)
    const teacher = await Student.findById(teacher_id);
    if (!teacher) {
      return response(
        res,
        StatusCodes.NOT_FOUND,
        false,
        {},
        "Teacher not found"
      );
    }
    
    const challenge = await dailyChallengeRepo.postDailyChallenge(
      question,
      description,
      topic,
      correct_answer,
      teacher_id
    );
    
    console.log("✅ Daily challenge posted successfully:", challenge._id);
    
    return response(
      res,
      StatusCodes.CREATED,
      true,
      { challenge },
      "Daily challenge posted successfully"
    );
  } catch (error) {
    console.error("Error posting daily challenge:", error);
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      error.message
    );
  }
};

// Get today's challenge
const getTodaysChallenge = async (req, res) => {
  try {
    const challenge = await dailyChallengeRepo.getTodaysChallenge();
    
    if (!challenge) {
      return response(
        res,
        StatusCodes.NOT_FOUND,
        false,
        {},
        "No challenge found for today"
      );
    }
    
    return response(
      res,
      StatusCodes.OK,
      true,
      { challenge },
      "Today's challenge retrieved successfully"
    );
  } catch (error) {
    console.error("Error getting today's challenge:", error);
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      error.message
    );
  }
};

// Get active challenge
const getActiveChallenge = async (req, res) => {
  try {
    const challenge = await dailyChallengeRepo.getActiveChallenge();
    
    if (!challenge) {
      return response(
        res,
        StatusCodes.NOT_FOUND,
        false,
        {},
        "No active challenge found"
      );
    }
    
    return response(
      res,
      StatusCodes.OK,
      true,
      { challenge },
      "Active challenge retrieved successfully"
    );
  } catch (error) {
    console.error("Error getting active challenge:", error);
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      error.message
    );
  }
};

// Submit group answer to daily challenge
const submitGroupAnswer = async (req, res) => {
  const { challenge_id, group_id, student_id, answer } = req.body;
  const CHALLENGE_POINTS = 100; // Base points for participating in daily challenge
  
  console.log("SUBMIT GROUP ANSWER - Request body:", req.body);
  
  try {
    // Validate required fields
    if (!challenge_id || !group_id || !student_id || !answer) {
      return response(
        res,
        StatusCodes.BAD_REQUEST,
        false,
        {},
        "Missing required fields: challenge_id, group_id, student_id, answer"
      );
    }
    
    // Verify student is in the group
    const group = await Group.findById(group_id);
    if (!group || !group.team_members.includes(student_id)) {
      return response(
        res,
        StatusCodes.FORBIDDEN,
        false,
        {},
        "Student is not a member of this group"
      );
    }
    
    const result = await dailyChallengeRepo.submitGroupAnswer(
      challenge_id,
      group_id,
      student_id,
      answer
    );
    
    console.log("✅ Group answer submitted successfully");
    
    // Award points to the submitting student
    let achievementInfo = null;
    try {
      // Calculate points based on LLM score
      const pointsEarned = Math.round(result.llm_result.score * 10); // LLM score * 10 for daily challenge
      
      if (pointsEarned > 0) {
        const pointsResult = await studentRepo.update_student_points(
          student_id,
          pointsEarned,
          "credit",
          `Daily Challenge: ${result.llm_result.score}/10 (Time: ${result.time_taken_minutes}min)`
        );
        
        if (pointsResult.success) {
          console.log("✅ Points awarded for daily challenge submission");
          
          // Update daily challenge points breakdown
          await Student.findByIdAndUpdate(
            student_id,
            { $inc: { "points_breakdown.daily_challenge_points": pointsEarned } }
          );
          
          achievementInfo = {
            reason: `Daily Challenge: ${result.llm_result.score}/10 score`,
            points: `+${pointsEarned}`,
            date: new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
          };
        }
      }
    } catch (pointsError) {
      console.error("Error awarding points for daily challenge:", pointsError);
    }
    
    // Award bonus points to group if they're the current winner
    if (result.is_current_winner) {
      try {
        await groupRepo.update_group_points(
          student_id,
          50, // Bonus group points for leading
          "credit",
          "Leading in Daily Challenge"
        );
        console.log("✅ Bonus group points awarded for leading");
      } catch (groupPointsError) {
        console.error("Error awarding group points:", groupPointsError);
      }
    }
    
    return response(
      res,
      StatusCodes.OK,
      true,
      {
        submission: result.submission,
        llm_feedback: result.llm_result,
        final_score: result.final_score,
        time_taken_minutes: result.time_taken_minutes,
        is_current_winner: result.is_current_winner,
        achievement: achievementInfo
      },
      achievementInfo ? 
        `Answer submitted! You earned ${achievementInfo.points} points. ${result.is_current_winner ? 'Your group is currently leading!' : ''}` :
        `Answer submitted! ${result.is_current_winner ? 'Your group is currently leading!' : ''}`
    );
  } catch (error) {
    console.error("Error submitting group answer:", error);
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      error.message
    );
  }
};

// Get challenge leaderboard
const getChallengeLeaderboard = async (req, res) => {
  const { challenge_id } = req.params;
  
  try {
    if (!challenge_id) {
      return response(
        res,
        StatusCodes.BAD_REQUEST,
        false,
        {},
        "Challenge ID is required"
      );
    }
    
    const leaderboard = await dailyChallengeRepo.getChallengeLeaderboard(challenge_id);
    
    return response(
      res,
      StatusCodes.OK,
      true,
      { leaderboard },
      "Challenge leaderboard retrieved successfully"
    );
  } catch (error) {
    console.error("Error getting challenge leaderboard:", error);
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      error.message
    );
  }
};

// Get challenge history
const getChallengeHistory = async (req, res) => {
  const { limit } = req.query;
  
  try {
    const history = await dailyChallengeRepo.getChallengeHistory(
      limit ? parseInt(limit) : 10
    );
    
    return response(
      res,
      StatusCodes.OK,
      true,
      { history },
      "Challenge history retrieved successfully"
    );
  } catch (error) {
    console.error("Error getting challenge history:", error);
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      error.message
    );
  }
};

// Update challenge status (called by scheduler)
const updateChallengeStatus = async (req, res) => {
  try {
    await dailyChallengeRepo.updateChallengeStatus();
    
    return response(
      res,
      StatusCodes.OK,
      true,
      {},
      "Challenge statuses updated successfully"
    );
  } catch (error) {
    console.error("Error updating challenge status:", error);
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      error.message
    );
  }
};

// Get group's submission for a challenge
const getGroupSubmission = async (req, res) => {
  const { challenge_id, group_id } = req.params;
  
  try {
    const challenge = await dailyChallengeRepo.getTodaysChallenge();
    if (!challenge) {
      return response(
        res,
        StatusCodes.NOT_FOUND,
        false,
        {},
        "Challenge not found"
      );
    }
    
    const submission = challenge.group_submissions.find(
      sub => sub.group_id.toString() === group_id.toString()
    );
    
    if (!submission) {
      return response(
        res,
        StatusCodes.NOT_FOUND,
        false,
        {},
        "No submission found for this group"
      );
    }
    
    return response(
      res,
      StatusCodes.OK,
      true,
      { submission },
      "Group submission retrieved successfully"
    );
  } catch (error) {
    console.error("Error getting group submission:", error);
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      error.message
    );
  }
};

// Get daily challenge by date
const getDailyChallengeByDate = async (req, res) => {
  const { date } = req.params;
  
  console.log("GET DAILY CHALLENGE BY DATE - Date:", date);
  
  try {
    const challenge = await dailyChallengeRepo.getDailyChallengeByDate(date);
    
    if (!challenge) {
      return response(
        res,
        StatusCodes.NOT_FOUND,
        false,
        {},
        "No challenge found for this date"
      );
    }
    
    console.log("✅ Daily challenge found for date:", date);
    
    return response(
      res,
      StatusCodes.OK,
      true,
      challenge,
      "Daily challenge retrieved successfully"
    );
  } catch (error) {
    console.error("Error getting daily challenge by date:", error);
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      error.message
    );
  }
};

// Get daily challenge by ID
const getDailyChallengeById = async (req, res) => {
  const { challenge_id } = req.params;
  
  console.log("GET DAILY CHALLENGE BY ID - ID:", challenge_id);
  
  try {
    const challenge = await dailyChallengeRepo.getDailyChallengeById(challenge_id);
    
    if (!challenge) {
      return response(
        res,
        StatusCodes.NOT_FOUND,
        false,
        {},
        "Challenge not found"
      );
    }
    
    console.log("✅ Daily challenge found:", challenge_id);
    
    return response(
      res,
      StatusCodes.OK,
      true,
      challenge,
      "Daily challenge retrieved successfully"
    );
  } catch (error) {
    console.error("Error getting daily challenge by ID:", error);
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
  postDailyChallenge,
  getTodaysChallenge,
  getActiveChallenge,
  getDailyChallengeByDate,
  getDailyChallengeById,
  submitGroupAnswer,
  getChallengeLeaderboard,
  getChallengeHistory,
  updateChallengeStatus,
  getGroupSubmission
};
