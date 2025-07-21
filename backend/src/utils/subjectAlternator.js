// Utility to alternate subjects daily
const subjects = ['Math', 'Science'];
const fs = require('fs');
const path = require('path');
const stateFile = path.join(__dirname, 'subject_state.json');

function getNextSubject() {
  let idx = 0;
  if (fs.existsSync(stateFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
      idx = (data.lastIdx + 1) % subjects.length;
    } catch {
      idx = 0;
    }
  }
  fs.writeFileSync(stateFile, JSON.stringify({ lastIdx: idx }));
  return subjects[idx];
}

module.exports = { getNextSubject };
