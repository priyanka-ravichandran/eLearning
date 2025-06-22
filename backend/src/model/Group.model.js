// const { number } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//Group Schema
var GroupSchema = new Schema(
  {
    group_no: {
      type: Number,
      required: true,
    },
    team_members: [
      {
        type: Schema.Types.ObjectId,
        ref: "Student",
        required: true,
      },
    ],
    total_points_earned: {
      type: Number,
      default: 0,
    },
    current_points: {
      type: Number,
      default: 0,
    },
    group_rank: {
      type: Number,
      default: null,
    },
    village_level: {
      type: Number,
      default: 1,
    },
    achievements: [
      {
        student_id: {
          type: Schema.Types.ObjectId,
          ref: "Student",
        },
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

const Group = mongoose.model("Group", GroupSchema);

module.exports = { Group };
