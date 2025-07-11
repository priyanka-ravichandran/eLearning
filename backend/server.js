require("./src/config/conn");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const fileUpload = require("express-fileupload");
const { connect } = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const cron = require("node-cron");
const dailyChallengeRepo = require("./src/repository/daily_challenge.repository");
const individualQuestionRepo = require("./src/repository/individual_daily_question.repository");
const http = require('http');
const { setupQuizSocket, addTestQuizEndpoint } = require('./quizSocket');
const { scheduleWeeklyQuiz } = require('./quizScheduler');

const app = express();

app.use(fileUpload());
app.use(cors());

app.use(express.static(path.join(__dirname, "/uploads")));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

if (process.env.NODE_ENV === "production") {
  app.use(morgan("combined"));
} else {
  app.use(morgan("dev"));
}

const authRouter = require("./src/routes/auth.routes");
const studentRouter = require("./src/routes/student.routes");
const studentQuestion = require("./src/routes/student_question.routes");
const groupRouter = require("./src/routes/group.routes");
const avatarRoutes = require("./src/routes/avatar.routes");
const dailyChallengeRoutes = require("./src/routes/daily_challenge.routes");
const individualDailyQuestionRoutes = require("./src/routes/individual_daily_question.routes");

app.use("/auth", authRouter);
app.use("/student", studentRouter);
app.use("/student_question", studentQuestion);
app.use("/group", groupRouter);
app.use("/avatar", avatarRoutes);
app.use("/daily-challenge", dailyChallengeRoutes);
app.use("/individual-question", individualDailyQuestionRoutes);
// Serve React build static files
app.use(express.static(path.join(__dirname, "../frontend/build")));

// Register quiz endpoints BEFORE the catch-all route
addTestQuizEndpoint(app);

// Serve React app for any unknown route (except API and uploads)
app.get("*", (req, res) => {
  // If the request is for an API or uploads, skip
  if (
    req.path.startsWith("/auth") ||
    req.path.startsWith("/student") ||
    req.path.startsWith("/student_question") ||
    req.path.startsWith("/group") ||
    req.path.startsWith("/avatar") ||
    req.path.startsWith("/daily-challenge") ||
    req.path.startsWith("/uploads")
  ) {
    return res.status(404).send("Not Found");
  }
  res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
});

var port = process.env.PORT || 3000;
const server = http.createServer(app);
setupQuizSocket(server);
scheduleWeeklyQuiz();
server.listen(port, () => {
  console.log("Server is Running on " + port);
});

// Daily cron jobs for automated challenge management
// Every day at 10:00 AM - Activate today's challenge
cron.schedule("0 10 * * *", async () => {
  console.log("🕙 10:00 AM - Activating today's daily challenge...");
  try {
    await dailyChallengeRepo.activateTodaysChallenge();
    console.log("✅ Today's challenge has been activated");
  } catch (error) {
    console.error("❌ Error activating today's challenge:", error.message);
  }
});

// Every day at 11:52 AM - Generate daily challenge (for testing - will change to 12:01 AM)
cron.schedule("52 11 * * *", async () => {
  console.log("🕚 11:52 AM - Generating today's daily challenge...");
  try {
    const result = await dailyChallengeRepo.generateAndPostDailyChallenge();
    if (result.success) {
      console.log(`✅ Today's daily challenge has been generated: "${result.challenge.question}"`);
    } else {
      console.log("❌ Failed to generate today's daily challenge:", result.message);
    }
  } catch (error) {
    console.error("❌ Error generating today's daily challenge:", error.message);
  }
});

// Every day at 12:01 AM - Generate and activate today's individual math question
cron.schedule("1 0 * * *", async () => {
  console.log("� 12:01 AM - Generating and activating today's individual math question...");
  try {
    const result = await individualQuestionRepo.activateTodaysIndividualQuestion();
    if (result.success) {
      console.log(`✅ Today's individual question has been activated: "${result.question.question}"`);
    } else {
      console.log("❌ Failed to activate today's individual question:", result.message);
    }
  } catch (error) {
    console.error("❌ Error activating today's individual question:", error.message);
  }
});

// Every day at 10:00 PM - Close today's challenge and determine winner
cron.schedule("0 22 * * *", async () => {
  console.log("🕙 10:00 PM - Closing today's daily challenge...");
  try {
    const result = await dailyChallengeRepo.closeTodaysChallenge();
    if (result.winner) {
      console.log(`🏆 Today's challenge winner: Group ${result.winner.group_id} with score ${result.winner.final_score}`);
    } else {
      console.log("❌ No submissions found for today's challenge");
    }
  } catch (error) {
    console.error("❌ Error closing today's challenge:", error.message);
  }
});

// Every day at 11:59 PM - Close today's individual question
cron.schedule("59 23 * * *", async () => {
  console.log("� 11:59 PM - Closing today's individual math question...");
  try {
    const result = await individualQuestionRepo.closeTodaysIndividualQuestion();
    if (result.success) {
      console.log(`✅ Today's individual question closed. Total participants: ${result.total_participants}`);
    } else {
      console.log("❌ No active individual question found to close");
    }
  } catch (error) {
    console.error("❌ Error closing today's individual question:", error.message);
  }
});

// Legacy cron job
cron.schedule("0 0 * * *", () => {
  sendReminders();
});
