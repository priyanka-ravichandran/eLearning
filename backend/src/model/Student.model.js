const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const StudentSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    grade: {
      type: Number,
      validate: {
        validator: (v) => v === undefined || (v >= 1 && v <= 12) || (v >= 0 && v <= 100),
        message: 'Grade must be 1–12 or 0–100',
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
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
        reason: String,
        date: Date,
        type: String,
        points: Number,
      },
    ],
    avatar: {
      seed: {
        type: String,
        default: "sarah",
      },
      hair: {
        type: String,
        default: null,
      },
      eyes: {
        type: String,
        default: null,
      },
      facialHair: {
        type: String,
        default: null,
      },
      mouth: {
        type: String,
        default: null,
      },
      body: {
        type: String,
        default: null,
      },
    },
    purchased_items: {
      seeds: [{
        type: String,
      }],
      hair: [{
        type: String,
      }],
      eyes: [{
        type: String,
      }],
      facialHair: [{
        type: String,
      }],
      mouth: [{
        type: String,
      }],
      body: [{
        type: String,
      }],
    },
  },
  { timestamps: true }
);

const Student = mongoose.model("Student", StudentSchema);

module.exports = { Student };
