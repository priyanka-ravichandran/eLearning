// Socket.IO server for live quiz
const http = require('http');
const socketio = require('socket.io');
// Per-group quiz state
const groupQuizState = {}; // { [groupId]: { quizActive, currentQuestion, answers, quizStartTime } }

function setupQuizSocket(server) {
  const io = socketio(server, { cors: { origin: '*' } });

  io.on('connection', (socket) => {
    socket.on('joinQuiz', ({ groupId, userId }) => {
      const groupState = groupQuizState[groupId];
      if (groupState && groupState.quizActive) {
        socket.join(`quiz_${groupId}`);
        socket.emit('quizStarted', {
          question: groupState.currentQuestion,
          quizStartTime: groupState.quizStartTime,
          serverTime: Date.now(),
          answers: groupState.answers.slice()
        });
      } else {
        socket.emit('quizInactive');
      }
    });

    socket.on('submitAnswer', ({ groupId, userId, answer }) => {
      const groupState = groupQuizState[groupId];
      if (groupState && groupState.quizActive) {
        if (groupState.answers.length > 0) {
          return;
        }
        groupState.answers.push({ userId, answer, timestamp: Date.now() });
        io.to(`quiz_${groupId}`).emit('answerUpdate', { answers: groupState.answers.slice() });
      }
    });
  });
}

function startQuiz(question, groupId) {
  if (!groupId) return;
  groupQuizState[groupId] = {
    quizActive: true,
    currentQuestion: question,
    answers: [],
    quizStartTime: Date.now()
  };
}

function endQuiz(groupId) {
  if (!groupId) return;
  if (groupQuizState[groupId]) {
    groupQuizState[groupId].quizActive = false;
    groupQuizState[groupId].currentQuestion = null;
    groupQuizState[groupId].quizStartTime = null;
    // Optionally process answers here
  }
}

function addTestQuizEndpoint(app) {
  app.get('/test-start-quiz', (req, res) => {
    const groupId = req.query.groupId;
    if (!groupId) return res.status(400).json({ success: false, message: 'Missing groupId' });
    const testQuestion = {
      text: 'What is the capital of France?',
      options: ['Paris', 'London', 'Berlin', 'Rome'],
      correct: 'Paris'
    };
    startQuiz(testQuestion, groupId);
    res.json({ success: true, message: 'Test quiz started!' });
  });
  app.get('/test-end-quiz', (req, res) => {
    const groupId = req.query.groupId;
    if (!groupId) return res.status(400).json({ success: false, message: 'Missing groupId' });
    endQuiz(groupId);
    res.json({ success: true, message: 'Test quiz ended!' });
  });
}

module.exports = { setupQuizSocket, startQuiz, endQuiz, addTestQuizEndpoint };
