const { StatusCodes } = require("http-status-codes");
const { Question } = require("../../model/Question.model");
const { response } = require("../../utils/response");
const questionRepository = require("../../repository/student_question.repository");
const groupRepo = require("../../repository/group.repository");
const { Message } = require("../../utils/Message");

// Get student Details
const post_a_question = async (req, res) => {
  const { question, description, topic, points, student_id } = req.body;

  try {
    const question_result = await questionRepository.post_a_question(
      question,
      description,
      topic,
      points,
      student_id
    );
    if (!question_result) {
      return response(
        res,
        StatusCodes.NOT_FOUND,
        false,
        {},
        "Question not found"
      );
    }

    return response(res, StatusCodes.OK, true, null, null);
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

// // Update student Dtails
// const updateStudentDetails = async (req, res) => {
//   try {
//     const { village_level, group_id } = req.body
//     // const id = req.params.id
//     let student = {}
//     if (village_level) {
//       student.village_level = village_level
//     }
//     if (group_id) {
//       student.group_id = group_id
//     }

//     if (student) {
//       student.updatedAt = new Date()
//       try {
//         const newUser = await questionRepository.findByIdAndUpdate(id, student)
//         if (!newUser) {
//           return response(
//             res,
//             StatusCodes.BAD_REQUEST,
//             false,
//             {},
//             Message.USER.COULD_NOT_UPDATE_USER
//           )
//         }

//         return response(
//           res,
//           StatusCodes.ACCEPTED,
//           true,
//           { user: newUser },
//           Message.USER.UPDATE_SUCCESS
//         )
//       } catch (error) {
//         return response(
//           res,
//           StatusCodes.INTERNAL_SERVER_ERROR,
//           false,
//           {},
//           error.message
//         )
//       }
//     } else {
//       return response(
//         res,
//         StatusCodes.BAD_REQUEST,
//         false,
//         {},
//         Message.USER.PROVIDE_INFORMATION
//       )
//     }
//   } catch (error) {
//     console.log(error.message)
//     return response(
//       res,
//       StatusCodes.INTERNAL_SERVER_ERROR,
//       false,
//       {},
//       error.message
//     )
//   }
// }

const get_questions_for_week = async (req, res) => {
  try {
    const { start_date, end_date } = req.body;

    // student.updatedAt = new Date()
    try {
      const questions = await questionRepository.get_questions_for_week(
        start_date,
        end_date
      );

      return response(res, StatusCodes.ACCEPTED, true, questions, null);
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

const get_question_details = async (req, res) => {
  try {
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
        { question: question },
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

const submit_answer = async (req, res) => {
  try {
    const { question_id, student_id, answer } = req.body;

    try {
      const inidividual_leaderboard = await questionRepository.submit_answer(
        question_id,
        student_id,
        answer
      );

      return response(
        res,
        StatusCodes.ACCEPTED,
        true,
        null,
        "Answer submitted successfully"
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

const get_my_questions = async (req, res) => {
  try {
    const { start_date, end_date, topic, student_id } = req.body;

    // student.updatedAt = new Date()
    try {
      const questions = await questionRepository.get_my_questions(
        start_date,
        end_date,
        topic,
        student_id
      );

      return response(res, StatusCodes.ACCEPTED, true, questions, null);
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

const get_student_questions_posted = async (req, res) => {
  try {
    const { topic } = req.body;
    // student.updatedAt = new Date()
    try {
      const questions = await questionRepository.get_student_questions_posted(
        topic
      );

      return response(res, StatusCodes.ACCEPTED, true, questions, null);
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
const vote_student_answer = async (req, res) => {
  try {
    const { question_id, vote_by, vote_to, vote } = req.body;

    try {
      await questionRepository.vote_student_answer(
        question_id,
        vote_by,
        vote_to,
        vote
      );
      // {
      //   'student_id': "",
      //   'points': 20,
      //   'transaction_type': "credit",
      //   'reason': ""
      // }
      if (vote === "up") {
        await groupRepo.update_group_points(
          vote_to,
          20,
          "credit",
          "submitted answer was upvoted"
        );
      }

      return response(
        res,
        StatusCodes.ACCEPTED,
        true,
        null,
        "Voted  successfully"
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
const react_to_answer = async (req, res) => {
  try {
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
        "Reacted  successfully"
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
  post_a_question,
  //   updateStudentDetails,
  get_questions_for_week,
  get_question_details,
  submit_answer,
  get_my_questions,
  get_student_questions_posted,
  vote_student_answer,
  react_to_answer,
};
