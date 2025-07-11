require("./src/config/conn");
const { DailyChallenge } = require("./src/model/DailyChallenge.model");

async function updateTodaysChallengePoints() {
  console.log("🔧 Updating today's challenge points from 50 to 10...");
  
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const result = await DailyChallenge.updateOne(
      {
        challenge_date: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      {
        $set: { points: 10 }
      }
    );
    
    console.log("✅ Update result:", result);
    
    // Verify the update
    const updatedChallenge = await DailyChallenge.findOne({
      challenge_date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });
    
    if (updatedChallenge) {
      console.log("🎯 Updated points:", updatedChallenge.points);
      console.log("✅ Challenge points successfully updated to 10!");
    }
    
  } catch (error) {
    console.error("❌ Error updating challenge points:", error);
  }
  
  console.log("🏁 Script completed. Exiting...");
  process.exit(0);
}

updateTodaysChallengePoints();
