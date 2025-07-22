// Scheduler for weekly quiz
const cron = require('node-cron');
const { startQuiz, endQuiz } = require('./quizSocket');
const { exec } = require('child_process');

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

function scheduleDailyChallenge() {
  // Every day at 1:20pm
  cron.schedule('20 13 * * *', () => {
    console.log('[CRON] Posting daily challenge at 1:20pm...');
    exec('node post_daily_challenge_now.js', (error, stdout, stderr) => {
      if (error) {
        console.error(`[CRON] Error posting daily challenge: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`[CRON] Stderr: ${stderr}`);
      }
      console.log(`[CRON] Daily challenge posted. Output:\n${stdout}`);
    });
  });
}

module.exports = { scheduleWeeklyQuiz, scheduleDailyChallenge };
