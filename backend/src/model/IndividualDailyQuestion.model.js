const mongoose = require("mongoose");

const individualDailyQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  topic: {
    type: String,
    required: true,
    default: "Mathematics"
  },
  difficulty_level: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "medium"
  },
  correct_answer: {
    type: String,
    required: true,
  },
  question_date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  start_time: {
    type: Date,
    required: true, // 10:05 AM
  },
  end_time: {
    type: Date,
    required: true, // 12:00 AM next day
  },
  status: {
    type: String,
    enum: ["scheduled", "active", "closed"],
    default: "scheduled",
  },
  posted_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true, // System/AI generated
  },
  individual_answers: [{
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    answer: {
      type: String,
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
      type: Number, // Minutes from question start to submission
      default: 0,
    },
    points_earned: {
      type: Number, // Points awarded based on LLM score
      default: 0,
    }
  }],
  total_participants: {
    type: Number,
    default: 0,
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
individualDailyQuestionSchema.index({ question_date: 1 });
individualDailyQuestionSchema.index({ status: 1 });
individualDailyQuestionSchema.index({ start_time: 1, end_time: 1 });

// Pre-save middleware to update the updated_at field
individualDailyQuestionSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

// Static method to get today's question
individualDailyQuestionSchema.statics.getTodaysQuestion = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return this.findOne({
    question_date: {
      $gte: today,
      $lt: tomorrow
    }
  }).populate('posted_by', 'name email')
    .populate('individual_answers.student_id', 'name email');
};

// Static method to get active question
individualDailyQuestionSchema.statics.getActiveQuestion = function() {
  const now = new Date();
  return this.findOne({
    status: 'active',
    start_time: { $lte: now },
    end_time: { $gte: now }
  }).populate('posted_by', 'name email')
    .populate('individual_answers.student_id', 'name email');
};

const IndividualDailyQuestion = mongoose.model("IndividualDailyQuestion", individualDailyQuestionSchema);

module.exports = { IndividualDailyQuestion };
