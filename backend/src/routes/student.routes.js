const { Router } = require("express");
const {
  getStudentDetails,
  updateStudentPoints,
  getStudentAchievements,
  getIndividualLeaderboard,
} = require("../controllers/student/student.controller");
const isAuth = require("../middleware/auth");
const router = Router();

router.post("/get_student_details", getStudentDetails);

// router.put('/updateStudentDetails', isAuth, updateStudentDetails)
// router.put('/createStudent', createStudent)
router.post("/update_student_points", updateStudentPoints);

router.post("/get_student_achievements", getStudentAchievements);
router.post("/get_inidividual_leaderboard", getIndividualLeaderboard);

module.exports = router;
