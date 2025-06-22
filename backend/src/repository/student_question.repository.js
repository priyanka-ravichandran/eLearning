const { StudentQuestion: Question } = require("../model/StudentQuestion.model");
const { ObjectId } = require("mongodb");
const { Student } = require("../model/Student.model");

const post_a_question = async (
  question,
  description,
  topic,
  points,
  student_id
) => {
  question.answers = [];
  let date_posted = new Date();
  return Question.create({
    question: question,
    description: description,
    topic: topic,
    points: points,
    date_posted: date_posted,
    created_by: student_id,
    active_from_date: new Date(),
    points: 20,
    question_type: "week",
  });
};

const get_questions_for_week = async (start_date, end_date) => {
  try {
    const questions = await Question.find({
      due_date: { $gte: start_date, $lte: end_date }, // Retrieve questions where due_date is between start_date and end_date
    });

    let daysArray = [];
    let weekObject = {};

    questions.forEach((obj) => {
      if (obj.question_type === "day") {
        daysArray.push(obj);
      } else if (obj.question_type === "week") {
        weekObject = obj;
      }
    });

    daysArray.sort((a, b) => a.due_date - b.due_date);

    return {
      day: daysArray,
      week: weekObject,
    };
  } catch (error) {
    throw new Error("Error updating the points");
  }
};

const get_question_details = async (question_id, student_id) => {
  try {
    var question = await Question.findById(question_id).populate(
      "created_by",
      "name"
    );
    let result = await question.populate({
      path: "answers",
      select: "student_id",
      populate: { path: "student_id", select: "name" },
    });

    console.log("TYPE: " + typeof result, result);

    if (!result) {
      console.log("Question not found.");
      return null;
    } else {
      // Find the answer object containing the provided student_id
      // const answer = result.answers.find(
      //   (answer) => answer.student_id.toString() === student_id.toString()
      // );

      // console.log("answer: " + answer);

      // delete result["answers"];

      // console.log("after deleting answers: " + result);

      // if (answer !== undefined) {
      //   result["student_answer"] = answer;
      // } else {
      //   result["student_answer"] = null;
      // }

      // console.log("after adding student answer:", result);

      // Checking if due_date has passed
      const currentDate = new Date();
      const due_date = new Date(result["due_date"]);
      console.log("current date: " + currentDate, currentDate <= due_date);
      console.log("FINAL", result);
    }

    return result;
  } catch (error) {
    console.log("Error:", error);
    throw new Error("Error updating the points");
  }
};

const submit_answer = async (question_id, student_id, answer) => {
  try {
    let question = await Question.findById(question_id);

    console.log("question", question);

    let answers = question.answers;

    let index = answers.findIndex(
      (answer) => answer["student_id"] == student_id
    );

    if (index !== -1) {
      // Update the value of the existing object
      question.answers[index]["answer"] = answer;
    } else {
      // Create a new object with the specified key-value pair
      let student_answer = {
        student_id: student_id,
        answer: answer,
        date: new Date(),
        points_earned: null,
      };
      question.answers.push(student_answer);
      // let newObj = { [key]: newValue };
      // arr.push(newObj);
    }

    // let student_answer = {
    //   student_id: student_id,
    //   answer: answer,
    //   date: new Date(),
    //   points_earned: null
    // }

    // if (question) {
    //   question.answers.push(student_answer)
    // }

    console.log("questions after:", question);

    // const newQuestion = new Question(questionData); // Create a new instance of your Question model with the provided data
    await question.save();

    return {
      success: true,
    };
  } catch (error) {
    throw new Error("Error updating the points");
  }
};

const get_my_questions = async (start_date, end_date, topic, student_id) => {
  try {
    console.log(topic, student_id);
    //find questions list  with given topic & student_id ,start_date,end_date where student_id is in answers array
    let questions;
    if (topic === "All") {
      questions = await Question.find({
        created_by: student_id,
      });
    } else {
      questions = await Question.find({
        topic: topic,
        // due_date: { $gte: start_date, $lte: end_date },
        created_by: student_id,

        // "answers.student_id": student_id,
      });
    }

    return questions;
  } catch (error) {
    console.log("rErr", error);
    throw new Error("Error updating the points");
  }
};

const get_student_questions_posted = async (
  topic,
  start_date,
  end_date,
  student_id
) => {
  try {
    let questions;
    if (topic === "All") {
      questions = await Question.find({});
      return questions;
    } else {
      questions = await Question.find({
        topic: topic,
      });
    }

    return questions;
  } catch (error) {
    console.log("rErr", error);
    throw new Error("Error updating the points");
  }
};

const vote_student_answer = async (question_id, vote_by, vote_to, vote) => {
  try {
    let question = await Question.findById(question_id);
    let answer = await question.answers.filter(
      (answer) => answer.student_id.toString() === vote_to.toString()
    )[0];

    answer.vote_by = vote_by;
    answer.vote_to = vote_to;
    answer.vote = vote;
    console.log("answer", answer);
    const res = await question.save();
    console.log("res here", res);
    return {
      success: true,
    };
  } catch (error) {
    console.log({ error });
    throw new Error("Error updating the points");
  }
};

const react_to_answer = async (
  question_id,
  reaction_by,
  reaction_for,
  reaction
) => {
  try {
    let question = await Question.findById(question_id);
    let answer = await question.answers.filter(
      (answer) => answer.student_id.toString() === reaction_for.toString()
    )[0];

    answer.reaction_by = reaction_by;
    answer.reaction_for = reaction_for;
    answer.reaction = reaction;
    console.log("answer", answer);
    const res = await question.save();
    console.log("res here", res);
    return {
      success: true,
    };
  } catch (error) {
    console.log({ error });
    throw new Error("Error updating the points");
  }
};
module.exports = {
  post_a_question,
  get_questions_for_week,
  get_question_details,
  submit_answer,
  get_my_questions,
  get_student_questions_posted,
  vote_student_answer,
  react_to_answer,
};
