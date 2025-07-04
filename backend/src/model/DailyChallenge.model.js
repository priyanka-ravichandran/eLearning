const mongoose = require("mongoose");

const dailyChallengeSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  topic: {
    type: String,
    required: true,
  },
  correct_answer: {
    type: String,
    required: true,
  },
  points: {
    type: Number,
    default: 50, // Higher points for daily challenges
  },
  posted_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true, // Teacher who posted the challenge
  },
  challenge_date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  start_time: {
    type: Date,
    required: true, // 10:00 AM
  },
  end_time: {
    type: Date,
    required: true, // 10:00 PM
  },
  status: {
    type: String,
    enum: ["scheduled", "active", "closed"],
    default: "scheduled",
  },
  group_submissions: [{
    group_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
    submitted_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student", // Which student from the group submitted
      required: true,
    },
    submission_time: {
      type: Date,
      default: Date.now,
    },
    llm_score: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    llm_feedback: {
      is_correct: Boolean,
      explanation: String,
      solution: String,
    },
    time_taken_minutes: {
      type: Number, // Minutes from challenge start to submission
      default: 0,
    },
    final_score: {
      type: Number, // Combined score (LLM + time bonus)
      default: 0,
    }
  }],
  winner: {
    group_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },
    final_score: Number,
    submission_time: Date,
    time_taken_minutes: Number,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  }
});

// Index for efficient queries
dailyChallengeSchema.index({ challenge_date: 1 });
dailyChallengeSchema.index({ status: 1 });
dailyChallengeSchema.index({ start_time: 1, end_time: 1 });

// Pre-save middleware to update the updated_at field
dailyChallengeSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

// Static method to get today's challenge
dailyChallengeSchema.statics.getTodaysChallenge = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return this.findOne({
    challenge_date: {
      $gte: today,
      $lt: tomorrow
    }
  }).populate('posted_by', 'name email')
    .populate('group_submissions.group_id', 'name team_members')
    .populate('group_submissions.submitted_by', 'name email')
    .populate('winner.group_id', 'name team_members');
};

// Static method to get active challenge
dailyChallengeSchema.statics.getActiveChallenge = function() {
  const now = new Date();
  return this.findOne({
    status: 'active',
    start_time: { $lte: now },
    end_time: { $gte: now }
  }).populate('posted_by', 'name email')
    .populate('group_submissions.group_id', 'name team_members')
    .populate('group_submissions.submitted_by', 'name email');
};

const DailyChallenge = mongoose.model("DailyChallenge", dailyChallengeSchema);

module.exports = { DailyChallenge };
