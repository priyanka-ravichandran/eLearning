// const { number } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define groupAchievementSchema for subdocuments
const groupAchievementSchema = new Schema(
  {
    student_id: {
      type: Schema.Types.ObjectId,
      ref: "Student",
    },
    reason: String,
    date: { type: Date, default: Date.now },
    type: { type: String, enum: ["credit", "debit"] },
    points: Number,
  },
  { _id: false }
);

// Group Schema
var GroupSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
    },
    group_no: {
      type: Number,
      required: true,
    },
    leader: {
      type: Schema.Types.ObjectId,
      ref: "Student",
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
    achievements: { type: [groupAchievementSchema], default: [] },
  },
  { timestamps: true }
);

const Group = mongoose.model("Group", GroupSchema);

module.exports = { Group };
