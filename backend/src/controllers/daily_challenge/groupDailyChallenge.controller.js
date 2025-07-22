// Controller for posting group daily challenge
const { DailyChallenge } = require('../../model/DailyChallenge.model');
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const { update_group_points } = require('../../repository/group.repository');

async function postGroupDailyChallenge(subject) {
  // Generate challenge (replace with your logic)
  const challenge = {
    subject,
    text: `Today's group challenge for ${subject}!`,
    date: new Date(),
    type: 'group',
  };
  // Store in DB
  await DailyChallenge.create(challenge);
}

// Get today's group daily challenge
async function getTodaysGroupDailyChallenge(req, res) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const challenge = await DailyChallenge.findOne({
      type: 'group',
      date: { $gte: today, $lt: tomorrow }
    });
    if (!challenge) {
      return res.status(404).json({ success: false, message: 'No group daily challenge found for today.' });
    }
    res.json({ success: true, challenge });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching group daily challenge.', error: err.message });
  }
}

// Submit group answer for today's challenge
async function submitGroupDailyChallengeAnswer(req, res) {
  try {
    const { groupId, answer, prizePoints } = req.body;
    console.log("[GroupDailyChallenge] submitGroupDailyChallengeAnswer called", { groupId, answer, prizePoints });
    if (!groupId || answer === undefined) {
      return res.status(400).json({ success: false, message: 'Missing groupId or answer.' });
    }
    // Find today's group challenge
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const challenge = await DailyChallenge.findOne({
      type: 'group',
      date: { $gte: today, $lt: tomorrow }
    });
    if (!challenge) {
      return res.status(404).json({ success: false, message: 'No group daily challenge found for today.' });
    }
    // If prizePoints is present, allow awarding points even if already submitted
    if (req.body.prizePoints) {
      const points = parseInt(req.body.prizePoints, 10);
      if (!isNaN(points) && points > 0) {
        const updateResult = await update_group_points(groupId, points, 'credit', 'Group Daily Challenge Prize Wheel');
        console.log("[GroupDailyChallenge] update_group_points result (prize only):", updateResult);
        return res.json({ success: true, prizeAwarded: true });
      }
    }
    // Otherwise, block if already submitted
    if (challenge.submissions && challenge.submissions[groupId]) {
      return res.status(403).json({ success: false, message: 'Group has already submitted an answer for today.' });
    }
    // LLM evaluation
    let analysis = '';
    let isCorrect = false;
    try {
      const prompt = `Question: ${challenge.text}\nCorrect Answer: ${challenge.correct_answer}\nSubmitted Answer: ${answer}\nIs the answer correct? Reply with 'Right' or 'Wrong' and a short analysis.`;
      const response = await openai.completions.create({
        model: 'gpt-3.5-turbo-instruct',
        prompt,
        max_tokens: 100,
        temperature: 0
      });
      analysis = response.choices[0].text.trim();
      isCorrect = analysis.toLowerCase().includes('right');
    } catch (err) {
      analysis = 'LLM evaluation failed.';
    }
    // Store submission
    if (!challenge.submissions) challenge.submissions = {};
    challenge.submissions[groupId] = { answer, isCorrect, analysis };
    await challenge.save();

    // Award prize points if correct and points are provided (for first submission)
    if (isCorrect && req.body.prizePoints) {
      const points = parseInt(req.body.prizePoints, 10);
      if (!isNaN(points) && points > 0) {
        const updateResult = await update_group_points(groupId, points, 'credit', 'Group Daily Challenge Prize Wheel');
        console.log("[GroupDailyChallenge] update_group_points result:", updateResult);
      }
    }
    res.json({ success: true, isCorrect, analysis });
  } catch (err) {
    console.error("[GroupDailyChallenge] Error submitting answer:", err);
    res.status(500).json({ success: false, message: 'Error submitting answer.', error: err.message });
  }
}

// Get group submission for today's group daily challenge
async function getGroupSubmission(req, res) {
  try {
    const { groupId } = req.query;
    if (!groupId) {
      return res.status(400).json({ success: false, message: 'Missing groupId.' });
    }
    // Find today's group challenge
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const challenge = await DailyChallenge.findOne({
      type: 'group',
      date: { $gte: today, $lt: tomorrow }
    });
    if (!challenge || !Array.isArray(challenge.group_submissions)) {
      return res.status(404).json({ success: false, message: 'No group daily challenge or submissions found for today.' });
    }
    const submission = challenge.group_submissions.find(sub => String(sub.group_id) === String(groupId));
    if (!submission) {
      return res.status(404).json({ success: false, message: 'No submission found for this group today.' });
    }
    res.json({ success: true, submission });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching group submission.', error: err.message });
  }
}

module.exports = {
  postGroupDailyChallenge,
  getTodaysGroupDailyChallenge,
  submitGroupDailyChallengeAnswer,
  getGroupSubmission
};
