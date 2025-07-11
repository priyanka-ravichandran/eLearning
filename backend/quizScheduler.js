// Scheduler for weekly quiz
const cron = require('node-cron');
const { startQuiz, endQuiz } = require('./quizSocket');

// Example question, replace with DB fetch if needed
const weeklyQuestion = {
  text: 'What is the capital of France?',
  options: ['Paris', 'London', 'Berlin', 'Rome'],
  correct: 'Paris'
};

function scheduleWeeklyQuiz() {
  // Every Sunday at 8PM
  cron.schedule('0 20 * * 0', () => {
    startQuiz(weeklyQuestion);
    setTimeout(() => {
      endQuiz();
    }, 15 * 60 * 1000); // 15 minutes
  });
}

module.exports = { scheduleWeeklyQuiz };
