const { Question } = require('../model/Question.model')
const { ObjectId } = require('mongodb')
const studentRepository = require('../repository/student.repository')
const { Configuration, OpenAIApi } = require("openai");
require('dotenv').config();

const post_a_question = async question => {
  question.answers = []
  question.date_posted = new Date()
  return Question.create(question)
}

const get_questions_for_week = async (start_date, end_date) => {
  try {
    const questions = await Question.find({
      due_date: { $gte: start_date, $lte: end_date } // Retrieve questions where due_date is between start_date and end_date
    })

    let daysArray = []
    let weekObject = {}

    questions.forEach(obj => {
      if (obj.question_type === 'day') {
        daysArray.push(obj)
      } else if (obj.question_type === 'week') {
        weekObject = obj
      }
    })

    daysArray.sort((a, b) => a.due_date - b.due_date)

    return {
      day: daysArray,
      week: weekObject
    }
  } catch (error) {
    throw new Error('Error updating the points')
  }
}

const get_question_details = async (question_id, student_id) => {
  try {
    var question = await Question.findById(question_id)

    let result = question.toObject()


    if (!result) {
      console.log('Question not found.')
      return null
    } else {
      // Find the answer object containing the provided student_id
      const answer = result.answers.find(
        answer => answer.student_id.toString() == student_id
      )

      delete result['answers']

      if (answer !== undefined) {
        result['student_answer'] = answer.answer
      } else {
        result['student_answer'] = null
      }

      // Checking if due_date has passed
      const currentDate = new Date()
      const due_date = new Date(result['due_date'])
      result.can_edit = currentDate <= due_date

    }

    return result
  } catch (error) {
    throw new Error('Error updating the points')
  }
}

const verify_answer_with_llm = async (questionText, correctAnswer, studentAnswer) => {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);
  

  const prompt = `You are an expert teacher. Here is a question and a student's answer.\nQuestion: ${questionText}\nCorrect Answer: ${correctAnswer}\nStudent's Answer: ${studentAnswer}\n\nEvaluate the student's answer. If it is fully correct, reply with:\n{"is_correct": true, "score": 20, "explanation": "Perfect answer."}\n\nIf it is partially correct, reply with:\n{"is_correct": false, "score": <score out of 20>, "explanation": "<explain what is missing or wrong>"}`;
  console.log('Calling OpenAI API with prompt:', prompt);
  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
    temperature: 0,
  });

  const text = completion.data.choices[0].message.content.trim();
  try {
    return JSON.parse(text);
  } catch (e) {
    return { is_correct: false, score: 0, explanation: "Could not verify answer." };
  }}
  

const submit_answer = async (question_id, student_id, answer) => {
  try {
    let question = await Question.findById(question_id);
    let answers = question.answers;
    let index = answers.findIndex(ans => ans['student_id'] == student_id);
    let isNew = false;
    if (index !== -1) {
      question.answers[index]['answer'] = answer;
    } else {
      isNew = true;
      question.answers.push({
        student_id,
        answer,
        date: new Date(),
        points_earned: null
      });
      index = question.answers.length - 1;
    }
    console.log('Calling OpenAI API with prompt:')
    // LLM verification
    const llmResult = await verify_answer_with_llm(
      question.question,
      question.correct_answer,
      answer
    );
    question.answers[index]['is_correct'] = llmResult.is_correct;
    question.answers[index]['score'] = llmResult.score;
    question.answers[index]['explanation'] = llmResult.explanation;
    question.answers[index]['verified'] = true;

    // Award points
    if (llmResult.score && llmResult.score > 0) {
      await studentRepository.update_student_points(
        student_id,
        llmResult.score,
        'credit',
        'LLM Answer Scoring'
      );
      question.answers[index]['points_earned'] = llmResult.score;
    }

    await question.save();

    const updatedDetails = await get_question_details(question_id, student_id);
    updatedDetails.llm_verification = llmResult;
    return updatedDetails;
  } catch (error) {
    console.log('error', error);
    throw new Error('Error updating the points')
  }
}

module.exports = {
  post_a_question,
  get_questions_for_week,
  get_question_details,
  submit_answer
};
