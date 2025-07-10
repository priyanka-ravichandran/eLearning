const express = require("express");
const router = express.Router();
const individualQuestionController = require("../controllers/individual_daily_question/individual_daily_question.controller");

// Get today's individual question
router.get("/today", individualQuestionController.getTodaysIndividualQuestion);

// Get active individual question
router.get("/active", individualQuestionController.getActiveIndividualQuestion);

// Submit individual answer
router.post("/submit", individualQuestionController.submitIndividualAnswer);

// Get student's answer for today (check if already answered)
router.get("/student/:student_id/answer", individualQuestionController.getStudentAnswerForToday);

// Get individual question by ID
router.get("/:question_id", individualQuestionController.getIndividualQuestionById);

// Post individual daily question (for admin/system use)
router.post("/post", individualQuestionController.postIndividualDailyQuestion);

module.exports = router;
