const { StatusCodes } = require("http-status-codes");
const { response } = require("../../utils/response");
const individualQuestionRepo = require("../../repository/individual_daily_question.repository");
const studentRepo = require("../../repository/student.repository");
const { Student } = require("../../model/Student.model");

// Get today's individual question
const getTodaysIndividualQuestion = async (req, res) => {
  try {
    const question = await individualQuestionRepo.getTodaysIndividualQuestion();
    
    if (!question) {
      return response(
        res,
        StatusCodes.NOT_FOUND,
        false,
        {},
        "No individual question found for today"
      );
    }
    
    // Don't send correct answer and individual answers to client
    const sanitizedQuestion = {
      _id: question._id,
      question: question.question,
      topic: question.topic,
      difficulty_level: question.difficulty_level,
      question_date: question.question_date,
      start_time: question.start_time,
      end_time: question.end_time,
      status: question.status,
      total_participants: question.total_participants,
      is_active: question.status === 'active'
    };
    
    return response(
      res,
      StatusCodes.OK,
      true,
      { question: sanitizedQuestion },
      "Today's individual question retrieved successfully"
    );
  } catch (error) {
    console.error("Error getting today's individual question:", error);
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      error.message
    );
  }
};

// Get active individual question
const getActiveIndividualQuestion = async (req, res) => {
  try {
    const question = await individualQuestionRepo.getActiveIndividualQuestion();
    
    if (!question) {
      return response(
        res,
        StatusCodes.NOT_FOUND,
        false,
        {},
        "No active individual question found"
      );
    }
    
    // Don't send correct answer to client
    const sanitizedQuestion = {
      _id: question._id,
      question: question.question,
      topic: question.topic,
      difficulty_level: question.difficulty_level,
      question_date: question.question_date,
      start_time: question.start_time,
      end_time: question.end_time,
      status: question.status,
      total_participants: question.total_participants,
      is_active: true
    };
    
    return response(
      res,
      StatusCodes.OK,
      true,
      { question: sanitizedQuestion },
      "Active individual question retrieved successfully"
    );
  } catch (error) {
    console.error("Error getting active individual question:", error);
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      error.message
    );
  }
};

// Submit individual answer
const submitIndividualAnswer = async (req, res) => {
  const { question_id, student_id, answer } = req.body;
  
  console.log("SUBMIT INDIVIDUAL ANSWER - Request body:", req.body);
  
  try {
    // Validate required fields
    if (!question_id || !student_id || !answer) {
      return response(
        res,
        StatusCodes.BAD_REQUEST,
        false,
        {},
        "Missing required fields: question_id, student_id, answer"
      );
    }
    
    // Verify student exists
    const student = await Student.findById(student_id);
    if (!student) {
      return response(
        res,
        StatusCodes.NOT_FOUND,
        false,
        {},
        "Student not found"
      );
    }
    
    const result = await individualQuestionRepo.submitIndividualAnswer(
      question_id,
      student_id,
      answer
    );
    
    console.log("✅ Individual answer submitted successfully");
    
    // Award points to the student
    let achievementInfo = null;
    try {
      const pointsEarned = result.points_earned;
      
      if (pointsEarned > 0) {
        const pointsResult = await studentRepo.update_student_points(
          student_id,
          pointsEarned,
          "credit",
          `Daily Math Question: ${result.llm_result.score}/10 (${result.llm_result.is_correct ? 'Correct' : 'Incorrect'})`
        );
        
        if (pointsResult.success) {
          console.log("✅ Points awarded for individual daily question");
          
          // Update individual daily question points breakdown
          await Student.findByIdAndUpdate(
            student_id,
            { $inc: { "points_breakdown.individual_daily_question_points": pointsEarned } }
          );
          
          achievementInfo = {
            reason: `Daily Math Question: ${result.llm_result.score}/10 score`,
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
      console.error("Error awarding points for individual daily question:", pointsError);
    }
    
    return response(
      res,
      StatusCodes.OK,
      true,
      {
        submission: {
          answer: result.submission.answer,
          submission_time: result.submission.submission_time,
          llm_score: result.llm_result.score,
          points_earned: result.points_earned,
          time_taken_minutes: result.time_taken_minutes
        },
        llm_feedback: result.llm_result,
        achievement: achievementInfo
      },
      achievementInfo ? 
        `Answer submitted! You earned ${achievementInfo.points} points.` :
        "Answer submitted successfully!"
    );
  } catch (error) {
    console.error("Error submitting individual answer:", error);
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      error.message
    );
  }
};

// Get student's answer for today (check if already answered)
const getStudentAnswerForToday = async (req, res) => {
  const { student_id } = req.params;
  
  try {
    if (!student_id) {
      return response(
        res,
        StatusCodes.BAD_REQUEST,
        false,
        {},
        "Student ID is required"
      );
    }
    
    const studentAnswer = await individualQuestionRepo.getStudentAnswerForToday(student_id);
    
    return response(
      res,
      StatusCodes.OK,
      true,
      { 
        has_answered: !!studentAnswer,
        answer_details: studentAnswer ? {
          answer: studentAnswer.answer,
          submission_time: studentAnswer.submission_time,
          llm_score: studentAnswer.llm_score,
          points_earned: studentAnswer.points_earned,
          llm_feedback: studentAnswer.llm_feedback
        } : null
      },
      studentAnswer ? "Student has answered today's question" : "Student has not answered today's question"
    );
  } catch (error) {
    console.error("Error checking student answer:", error);
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      error.message
    );
  }
};

// Get individual question by ID
const getIndividualQuestionById = async (req, res) => {
  const { question_id } = req.params;
  
  console.log("GET INDIVIDUAL QUESTION BY ID - ID:", question_id);
  
  try {
    const question = await individualQuestionRepo.getIndividualQuestionById(question_id);
    
    if (!question) {
      return response(
        res,
        StatusCodes.NOT_FOUND,
        false,
        {},
        "Question not found"
      );
    }
    
    // Include answers for admin view but sanitize for regular view
    const questionData = {
      _id: question._id,
      question: question.question,
      topic: question.topic,
      difficulty_level: question.difficulty_level,
      question_date: question.question_date,
      start_time: question.start_time,
      end_time: question.end_time,
      status: question.status,
      total_participants: question.total_participants,
      individual_answers: question.individual_answers.map(ans => ({
        student_name: ans.student_id.name,
        answer: ans.answer,
        submission_time: ans.submission_time,
        llm_score: ans.llm_score,
        points_earned: ans.points_earned
      }))
    };
    
    console.log("✅ Individual question found:", question_id);
    
    return response(
      res,
      StatusCodes.OK,
      true,
      { question: questionData },
      "Individual question retrieved successfully"
    );
  } catch (error) {
    console.error("Error getting individual question by ID:", error);
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      error.message
    );
  }
};

// Post individual daily question (for admin/system use)
const postIndividualDailyQuestion = async (req, res) => {
  try {
    const result = await individualQuestionRepo.postTodaysIndividualQuestion();
    
    if (result.success) {
      return response(
        res,
        StatusCodes.CREATED,
        true,
        { question: result.question, action: result.action },
        `Individual daily question ${result.action} successfully`
      );
    } else {
      return response(
        res,
        StatusCodes.BAD_REQUEST,
        false,
        {},
        result.message
      );
    }
  } catch (error) {
    console.error("Error posting individual daily question:", error);
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
  getTodaysIndividualQuestion,
  getActiveIndividualQuestion,
  submitIndividualAnswer,
  getStudentAnswerForToday,
  getIndividualQuestionById,
  postIndividualDailyQuestion
};
