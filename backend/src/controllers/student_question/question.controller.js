// src/controllers/student_question/question.controller.js

const { StatusCodes } = require("http-status-codes");
const { StudentQuestion } = require("../../model/StudentQuestion.model");
const { response } = require("../../utils/response");
const questionRepository = require("../../repository/student_question.repository");
const groupRepo = require("../../repository/group.repository");
const studentRepo = require("../../repository/student.repository");
const { Message } = require("../../utils/Message");

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
    try {
      console.log("Attempting to update points for student:", student_id, "with points:", POINTS_FOR_POSTING);
      const pointsResult = await studentRepo.update_student_points(
        student_id,
        POINTS_FOR_POSTING,
        "credit",
        "Posted a question"
      );
      console.log("Points update result:", pointsResult);
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

    return response(res, StatusCodes.OK, true, question_result, null);
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

    return response(
      res,
      StatusCodes.ACCEPTED,
      true,
      updatedDetails,
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

// React (emoji etc.) to someone’s answer
const react_to_answer = async (req, res) => {
  const { question_id, reaction_by, reaction_for, reaction } = req.body;
  try {
    await questionRepository.react_to_answer(
      question_id,
      reaction_by,
      reaction_for,
      reaction
    );
    return response(
      res,
      StatusCodes.ACCEPTED,
      true,
      null,
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

module.exports = {
  post_a_question,
  get_questions_for_week,
  get_question_details,
  submit_answer,             // ← updated
  get_my_questions,
  get_student_questions_posted,
  vote_student_answer,
  react_to_answer,
};
