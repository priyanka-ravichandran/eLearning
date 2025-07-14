// Socket.IO server for live quiz
const http = require('http');
const socketio = require('socket.io');
// Per-group quiz state
const groupQuizState = {}; // { [groupId]: { quizActive, currentQuestionIdx, answers, quizStartTime } }

function setupQuizSocket(server) {
  // Allow CORS only from frontend (localhost:3001)
  const io = socketio(server, { cors: { origin: 'http://localhost:3001', methods: ['GET', 'POST'] } });

  io.on('connection', (socket) => {
    // Always join the room on every event to ensure correct room membership
    function joinRoom(groupId) {
      if (groupId) socket.join(`quiz_${groupId}`);
    }

    socket.on('joinQuiz', ({ groupId, userId }) => {
      joinRoom(groupId);
      let groupState = groupQuizState[groupId];
      if (groupState && groupState.quizActive) {
        socket.emit('quizState', {
          currentQuestionIdx: groupState.currentQuestionIdx,
          answers: groupState.answers,
          quizStartTime: groupState.quizStartTime,
          quizActive: true
        });
      } else {
        socket.emit('quizInactive');
      }
    });

    // User selects an answer for a question
    socket.on('answerSelected', ({ groupId, userId, questionIdx, answer }) => {
      joinRoom(groupId);
      let groupState = groupQuizState[groupId];
      if (!groupState || !groupState.quizActive) return;
      if (!groupState.answers[questionIdx]) groupState.answers[questionIdx] = {};
      // If any user has already answered this question, block further answers
      if (Object.keys(groupState.answers[questionIdx]).length > 0) {
        // Do not update state or broadcast
        socket.emit('answerBlocked', { questionIdx });
        return;
      }
      groupState.answers[questionIdx][userId] = answer;
      io.to(`quiz_${groupId}`).emit('quizState', {
        currentQuestionIdx: groupState.currentQuestionIdx,
        answers: groupState.answers,
        quizStartTime: groupState.quizStartTime,
        quizActive: true
      });
    });

    // User navigates to a different question
    socket.on('navigateQuestion', ({ groupId, questionIdx }) => {
      joinRoom(groupId);
      let groupState = groupQuizState[groupId];
      if (!groupState || !groupState.quizActive) return;
      groupState.currentQuestionIdx = questionIdx;
      io.to(`quiz_${groupId}`).emit('quizState', {
        currentQuestionIdx: groupState.currentQuestionIdx,
        answers: groupState.answers,
        quizStartTime: groupState.quizStartTime,
        quizActive: true
      });
    });
  });
}

// Start a new quiz session for a group
function startQuiz(groupId, numQuestions = 5) {
  if (!groupId) return;
  groupQuizState[groupId] = {
    quizActive: true,
    currentQuestionIdx: 0,
    answers: Array.from({ length: numQuestions }, () => ({})), // Fix: new object for each question
    quizStartTime: Date.now()
  };
}

function endQuiz(groupId) {
  if (!groupId) return;
  if (groupQuizState[groupId]) {
    groupQuizState[groupId].quizActive = false;
    groupQuizState[groupId].currentQuestionIdx = null;
    groupQuizState[groupId].quizStartTime = null;
    // Optionally process answers here
  }
}

function addTestQuizEndpoint(app) {
  app.get('/test-start-quiz', (req, res) => {
    const groupId = req.query.groupId;
    if (!groupId) return res.status(400).json({ success: false, message: 'Missing groupId' });
    startQuiz(groupId, 5);
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
