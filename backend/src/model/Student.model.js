const { number } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//Student Schema
var StudentSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    grade: {
      type: Number,
    },
    email: {
      type: String,
      require: true,
    },
    password: {
      type: String,
      required: true,
    },
    group_id: {
      type: String,
      default: null,
    },

    individual_rank: {
      type: Number,
      default: 0,
    },
    total_points_earned: {
      type: Number,
      default: 0,
    },
    current_points: {
      type: Number,
      default: 0,
    },
    achievements: [
      {
        reason: {
          type: String,
        },
        date: { type: Date },
        type: { type: String },
        points: { type: Number },
      },
    ],
  },
  { timestamps: true }
);

const Student = mongoose.model("Student", StudentSchema);

module.exports = { Student };
