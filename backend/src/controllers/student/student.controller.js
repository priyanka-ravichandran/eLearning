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

    try {
      const student_achievements =
        await studentRepository.get_student_achievements(student_id);

      return response(
        res,
        StatusCodes.ACCEPTED,
        true,
        { payload: student_achievements },
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

module.exports = {
  getStudentDetails,
  updateStudentPoints,
  getStudentAchievements,
  getIndividualLeaderboard,
};
