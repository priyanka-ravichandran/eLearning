// const { number } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//Question Schema
var QuestionSchema = new Schema(
  {
    question: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    date_posted: {
      type: Date,
      default: new Date(),
    },
    question_type: {
      type: String,
    },
    points: {
      type: Number,
    },
    active_from_date: {
      type: Date,
    },
    due_date: {
      type: Date,
    },
    topic: {
      type: String,
    },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: "Student",
    },

    correct_answer: {
      type: String,
    },
    answers: [
      {
        student_id: {
          type: Schema.Types.ObjectId,
          ref: "Student",
        },
        answer: String,
        date: Date,
        points_earned: Number,
        // LLM feedback fields
        is_correct: Boolean,
        score: Number,
        explanation: String,
        solution: String,
        verified: Boolean,
        vote_by: {
          type: Schema.Types.ObjectId,
          ref: "Student",
        },
        vote_to: {
          type: Schema.Types.ObjectId,
          ref: "Student",
        },
        vote: String,
        reactions: [{
          user_id: {
            type: Schema.Types.ObjectId,
            ref: "Student",
            required: true
          },
          emoji: {
            type: String,
            required: true
          },
          date: {
            type: Date,
            default: Date.now
          }
        }],
      },
    ],
  },
  { timestamps: true }
);

const StudentQuestion = mongoose.model("new_questions", QuestionSchema);

module.exports = { StudentQuestion };
