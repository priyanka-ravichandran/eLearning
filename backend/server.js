require("./src/config/conn");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const fileUpload = require("express-fileupload");
const { connect } = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const cron = require("node-cron");

const app = express();

app.use(fileUpload());
app.use(cors());

app.use(express.static(path.join(__dirname, "/uploads")));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

if (process.env.NODE_ENV === "production") {
  // Production logger format
  app.use(morgan("combined"));
} else {
  // Development logger format
  app.use(morgan("dev"));
}

const authRouter = require("./src/routes/auth.routes");
const studentRouter = require("./src/routes/student.routes");
const questionRouter = require("./src/routes/question.routes");
const studentQuestion = require("./src/routes/student_question.routes");
const groupRouter = require("./src/routes/group.routes");

app.use("/auth", authRouter);
app.use("/student", studentRouter);
app.use("/question", questionRouter);
app.use("/student_question", studentQuestion);
app.use("/group", groupRouter);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/src/view/serverRunning.html"));
});

var port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("Server is Running on " + port);
});

cron.schedule("0 0 * * *", () => {
  sendReminders();
});
