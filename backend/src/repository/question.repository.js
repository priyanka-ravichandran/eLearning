const { Question } = require('../model/Question.model')
const { ObjectId } = require('mongodb')
const studentRepository = require('../repository/student.repository')

const post_a_question = async question => {
  question.answers = []
  question.date_posted = new Date()
  console.log('question:', question)
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

    console.log('TYPE: ' + typeof result, result)

    if (!result) {
      console.log('Question not found.')
      return null
    } else {
      // Find the answer object containing the provided student_id
      const answer = result.answers.find(
        answer => answer.student_id.toString() == student_id
      )

      console.log('answer: ' + answer)

      delete result['answers']

      console.log('after deleting answers: ' + result)

      if (answer !== undefined) {
        result['student_answer'] = answer.answer
      } else {
        result['student_answer'] = null
      }

      console.log('after adding student answer:', result)

      // Checking if due_date has passed
      const currentDate = new Date()
      const due_date = new Date(result['due_date'])
      console.log('current date: ' + currentDate, currentDate <= due_date)
      result.can_edit = currentDate <= due_date

      console.log('FINAL', result)
    }

    return result
  } catch (error) {
    throw new Error('Error updating the points')
  }
}

const submit_answer = async (question_id, student_id, answer) => {
  try {
    let question = await Question.findById(question_id)

    console.log('question', question)

    let answers = question.answers

    let index = answers.findIndex(answer => answer['student_id'] == student_id)

    if (index !== -1) {
      // Update the value of the existing object
      question.answers[index]['answer'] = answer
    } else {
      // Create a new object with the specified key-value pair
      let student_answer = {
        student_id: student_id,
        answer: answer,
        date: new Date(),
        points_earned: null
      }
      question.answers.push(student_answer)
    }

    console.log('questions after:', question)

    await question.save()

    const updatedDetails = await get_question_details(question_id, student_id)

    console.log('updatedDetails:', updatedDetails);

    const reason = 'Answered Question of the Day/week'

    await studentRepository.update_student_points(
      student_id,
      20,
      'credit',
      'Answered Question of the Day/week'
    )

    return updatedDetails
  } catch (error) {
    console.log('error', error)
    throw new Error('Error updating the points')
  }
}

module.exports = {
  post_a_question,
  get_questions_for_week,
  get_question_details,
  submit_answer
}
