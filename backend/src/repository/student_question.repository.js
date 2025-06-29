// src/repository/student_question.repository.js
require("dotenv").config();
const OpenAI = require("openai");
const { StudentQuestion: Question } = require("../model/StudentQuestion.model");
const { Student } = require("../model/Student.model");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Calls OpenAI with a prompt that:
 *  1) Solves the equation step by step.
 *  2) Parses out the numeric piece of the student's answer.
 *  3) Compares and deducts 2 points for each missing step.
 */
async function verifyAnswerWithLLM(qText, correctAns = "", studentAns = "") {
  // 1) Solve yourself, 2) extract student number, 3) compare & deduct for missing steps
  const prompt = `
You are an experienced math teacher.  Here is a one-line equation and a student's answer.

Equation: ${qText}
Correct Answer (for reference): ${correctAns || "N/A"}
Student's Answer (raw): ${studentAns}

TASK:

1) Solve the equation yourself, showing every single algebraic manipulation as separate lines:
   e.g. 
     2x = 5 - 4
     2x = 1
     x = 1/2
   Conclude with: Therefore, x = <your result>.

2) From the student's raw answer, extract just the numeric part (it could be "1/2", "0.5", etc.) and convert to a single decimal or fraction.

3) If the student's number equals your computed result:
     - is_correct = true
     - score = 10
     - explanation = "Perfect answer."
   Otherwise:
     - is_correct = false
     - score = 0
     - explanation = "Student's numeric answer is incorrect."

4) Next, count how many lines of work **you** wrote in step 1 (excluding the final summary line).  
   Count how many lines of work the **student** showed (by detecting line-breaks or explicit equalities).  
   For each line the student **did not** include that you did, deduct 2 points (minimum score = 0).

5) If the student wrote no intermediate lines at all but did get the number right, deduct 2 points for “missing intermediate steps.”  

OUTPUT **only** valid JSON with exactly these four keys:
{
  "is_correct": <true|false>,
  "score": <integer between 0 and 10>,
  "explanation": "<semicolon-separated deductions>",
  "solution": "<your full worked step-by-step solution ending with 'Therefore, x = …'>"
}
`.trim();

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    temperature: 0,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = completion.choices[0].message.content.trim();
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error("LLM parse error:", raw);
    return {
      is_correct: false,
      score: 0,
      explanation: "Could not parse LLM response.",
      solution: correctAns || "Solution unavailable."
    };
  }
}

// … your existing CRUD below …

module.exports = {
  post_a_question: async (question, description, topic, points, student_id) => {
    return Question.create({
      question,
      description,
      topic,
      points,
      date_posted: new Date(),
      created_by: student_id,
      active_from_date: new Date(),
      question_type: "week",
    });
  },

  get_questions_for_week: async (start_date, end_date) => {
    const qs = await Question.find({
      due_date: { $gte: start_date, $lte: end_date }
    });
    return {
      day: qs.filter(q => q.question_type === "day").sort((a,b)=>a.due_date-b.due_date),
      week: qs.find(q => q.question_type === "week") || {}
    };
  },

  get_question_details: async (question_id) => {
    return Question.findById(question_id)
      .populate("created_by", "name")
      .populate({
        path: "answers",
        populate: { path: "student_id", select: "name" }
      });
  },

  submit_answer: async (question_id, student_id, answer) => {
    const q = await Question.findById(question_id);
    if (!q) throw new Error("Question not found");

    // Upsert
    let idx = q.answers.findIndex(a => String(a.student_id) === String(student_id));
    if (idx === -1) {
      q.answers.push({ student_id, answer, date: new Date() });
      idx = q.answers.length - 1;
    } else {
      q.answers[idx].answer = answer;
      q.answers[idx].date = new Date();
    }

    // LLM scoring
    const llm = await verifyAnswerWithLLM(q.question, q.correct_answer || "", answer);

    Object.assign(q.answers[idx], {
      is_correct:   llm.is_correct,
      score:        llm.score,
      explanation:  llm.explanation,
      solution:     llm.solution,
      verified:     true,
      points_earned: llm.score
    });

    if (llm.score > 0) {
      await Student.updateOne(
        { _id: student_id },
        { $inc: { current_points: llm.score, total_points_earned: llm.score } }
      );
    }

    await q.save();
    return { success: true, llm };
  },

  // GET only this student’s questions
  get_my_questions: (start_date, end_date, topic, student_id) => {
    const filter = topic === "All"
      ? { created_by: student_id }
      : { topic, created_by: student_id };
    return Question.find(filter);
  },

  // GET all posted (or by topic)
  get_student_questions_posted: (topic) => {
    return topic === "All"
      ? Question.find({})
      : Question.find({ topic });
  },

  // simple vote / react handlers
  vote_student_answer: async (question_id, vote_by, vote_to, vote) => {
    const q = await Question.findById(question_id);
    const ans = q.answers.find(a => String(a.student_id) === String(vote_to));
    Object.assign(ans, { vote_by, vote_to, vote });
    await q.save();
    return { success: true };
  },

  react_to_answer: async (question_id, reaction_by, reaction_for, reaction) => {
    const q = await Question.findById(question_id);
    const ans = q.answers.find(a => String(a.student_id) === String(reaction_for));
    Object.assign(ans, { reaction_by, reaction_for, reaction });
    await q.save();
    return { success: true };
  }
};
