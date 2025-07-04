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

app.use("/auth", authRouter);
app.use("/student", studentRouter);
app.use("/student_question", studentQuestion);
app.use("/group", groupRouter);
app.use("/avatar", avatarRoutes);
app.use("/api/v1/daily-challenge", dailyChallengeRoutes);
// Serve React build static files
app.use(express.static(path.join(__dirname, "../frontend/build")));

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

app.listen(port, () => {
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

// Legacy cron job
cron.schedule("0 0 * * *", () => {
  sendReminders();
});
