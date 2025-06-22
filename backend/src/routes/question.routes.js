const { Router } = require("express");
const {
  post_a_question,
  get_questions_for_week,
  get_question_details,
  submit_answer,
} = require("../controllers/question/question.controller");
const router = Router();

router.post("/post_a_question", post_a_question);
router.post("/get_questions_for_week", get_questions_for_week);
router.post("/get_question_details", get_question_details);
router.post("/submit_answer", submit_answer);

module.exports = router;
