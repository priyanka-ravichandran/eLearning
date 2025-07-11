// Socket.IO server for live quiz
const http = require('http');
const socketio = require('socket.io');
let quizActive = false;
let currentQuestion = null;
let answers = [];

function setupQuizSocket(server) {
  const io = socketio(server, { cors: { origin: '*' } });

  io.on('connection', (socket) => {
    socket.on('joinQuiz', ({ groupId, userId }) => {
      if (quizActive) {
        socket.join(`quiz_${groupId}`);
        socket.emit('quizStarted', { question: currentQuestion });
      } else {
        socket.emit('quizInactive');
      }
    });

    socket.on('submitAnswer', ({ groupId, userId, answer }) => {
      if (quizActive) {
        answers.push({ userId, answer, timestamp: Date.now() });
        io.to(`quiz_${groupId}`).emit('answerUpdate', { userId, answer });
      }
    });
  });
}

function startQuiz(question) {
  quizActive = true;
  currentQuestion = question;
  answers = [];
}

function endQuiz() {
  quizActive = false;
  currentQuestion = null;
  // Optionally process answers here
}

function addTestQuizEndpoint(app) {
  app.get('/test-start-quiz', (req, res) => {
    const testQuestion = {
      text: 'What is the capital of France?',
      options: ['Paris', 'London', 'Berlin', 'Rome'],
      correct: 'Paris'
    };
    startQuiz(testQuestion);
    res.json({ success: true, message: 'Test quiz started!' });
  });
  app.get('/test-end-quiz', (req, res) => {
    endQuiz();
    res.json({ success: true, message: 'Test quiz ended!' });
  });
}

module.exports = { setupQuizSocket, startQuiz, endQuiz, addTestQuizEndpoint };
