// src/routes/daily_challenge.routes.js
const express = require("express");
const router = express.Router();
const dailyChallengeController = require("../controllers/daily_challenge/daily_challenge.controller");

// Teacher posts a daily challenge
router.post("/post", dailyChallengeController.postDailyChallenge);

// Get today's challenge
router.get("/today", dailyChallengeController.getTodaysChallenge);

// Get active challenge
router.get("/active", dailyChallengeController.getActiveChallenge);

// Submit group answer to daily challenge
router.post("/submit", dailyChallengeController.submitGroupAnswer);

// Get challenge by date
router.get("/date/:date", dailyChallengeController.getDailyChallengeByDate);

// Get challenge by ID
router.get("/:challenge_id", dailyChallengeController.getDailyChallengeById);

// Get challenge leaderboard
router.get("/leaderboard/:challenge_id", dailyChallengeController.getChallengeLeaderboard);

// Get challenge history
router.get("/history", dailyChallengeController.getChallengeHistory);

// Update challenge status (for automated scheduler)
router.post("/update-status", dailyChallengeController.updateChallengeStatus);

// Get group's submission for a challenge
router.get("/submission/:challenge_id/:group_id", dailyChallengeController.getGroupSubmission);

module.exports = router;
