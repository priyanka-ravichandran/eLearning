const { Router } = require("express");
const {
  post_a_question,
  get_questions_for_week,
  get_question_details,
  submit_answer,
  get_my_questions,
  get_student_questions_posted,
  vote_student_answer,
  react_to_answer,
} = require("../controllers/student_question/question.controller");
const isAuth = require("../middleware/auth");
const router = Router();

router.post("/post_a_question", post_a_question);

router.post("/get_questions_for_week", get_questions_for_week);
router.post("/get_question_details", get_question_details);
router.post("/submit_answer", submit_answer);

router.post("/get_my_questions", get_my_questions);
router.post("/get_student_questions_posted", get_student_questions_posted);
router.post("/vote_student_answer", vote_student_answer);
router.post("/react_to_answer", react_to_answer);
// router.post('/get_student_questions_posted', get_student_questions_posted)

module.exports = router;
