const { Router } = require("express");
const {
  getStudentDetails,
  updateStudentPoints,
  getStudentAchievements,
  getIndividualLeaderboard,
  getPointTransactions,
} = require("../controllers/student/student.controller");
const isAuth = require("../middleware/auth");
const router = Router();

router.post("/get_student_details", getStudentDetails);

// router.put('/updateStudentDetails', isAuth, updateStudentDetails)
// router.put('/createStudent', createStudent)
router.post("/update_student_points", updateStudentPoints);

router.post("/get_student_achievements", getStudentAchievements);
router.post("/get_inidividual_leaderboard", getIndividualLeaderboard);
// Debug endpoint to test leaderboard with avatars
router.get("/debug_leaderboard", async (req, res) => {
  const studentRepo = require("../repository/student.repository");
  
  try {
    console.log("DEBUG: Testing leaderboard with avatars");
    
    const result = await studentRepo.get_inidividual_leaderboard();
    
    console.log("DEBUG: Leaderboard result:", {
      count: result.individual_leaderboard?.length,
      first_student: result.individual_leaderboard?.[0],
      has_avatar_urls: result.individual_leaderboard?.some(s => s.avatarUrl)
    });
    
    return res.status(200).json({
      success: true,
      message: "Debug leaderboard retrieved",
      result: result
    });
  } catch (error) {
    console.error("DEBUG: Error getting leaderboard:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test endpoint to manually award points for debugging
router.post("/debug_award_points", async (req, res) => {
  const { student_id, points, reason } = req.body;
  const studentRepo = require("../repository/student.repository");
  
  try {
    console.log("DEBUG: Manual points award requested:", { student_id, points, reason });
    
    const result = await studentRepo.update_student_points(
      student_id,
      points || 5,
      "credit",
      reason || "Debug manual points award"
    );
    
    console.log("DEBUG: Points award result:", result);
    
    return res.status(200).json({
      success: true,
      message: "Debug points awarded",
      result: result
    });
  } catch (error) {
    console.error("DEBUG: Error awarding points:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Standard POST endpoint for point transactions
router.post("/get_point_transactions", (req, res) => {
  console.log("POST /get_point_transactions was hit with data:", req.body);
  getPointTransactions(req, res);
});

module.exports = router;
