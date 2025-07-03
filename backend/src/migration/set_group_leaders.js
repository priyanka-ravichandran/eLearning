// Migration script to set group leaders for existing groups
const mongoose = require("mongoose");
require("../config/conn");

// Import models
const { Group } = require("../model/Group.model");
const { Student } = require("../model/Student.model");

async function setGroupLeaders() {
  try {
    console.log("Connected to MongoDB for migration");
    
    // Find all groups
    const groups = await Group.find({});
    console.log(`Found ${groups.length} groups to process`);
    
    let leaderSetCount = 0;
    
    // Process each group
    for (const group of groups) {
      // Skip if leader is already set
      if (group.leader) {
        console.log(`Group ${group.name} (${group._id}) already has a leader: ${group.leader}`);
        continue;
      }
      
      // Skip if no team members
      if (!group.team_members || group.team_members.length === 0) {
        console.log(`Group ${group.name} (${group._id}) has no members`);
        continue;
      }
      
      // Set first team member as leader
      const leaderId = group.team_members[0];
      group.leader = leaderId;
      await group.save();
      
      console.log(`Set leader for group ${group.name} (${group._id}): ${leaderId}`);
      leaderSetCount++;
    }
    
    console.log(`Migration complete! Set leaders for ${leaderSetCount} groups`);
    
    // Verify all groups have leaders now
    const groupsAfter = await Group.find({}).populate("leader", "name");
    console.log("\nVerification:");
    for (const group of groupsAfter) {
      console.log(`Group: ${group.name} - Leader: ${group.leader ? group.leader.name : 'None'}`);
    }
    
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

// Run the migration
setGroupLeaders()
  .then(() => {
    console.log("Leader migration finished successfully!");
    setTimeout(() => process.exit(0), 1000); // Give time for any pending operations
  })
  .catch(err => {
    console.error("Migration error:", err);
    setTimeout(() => process.exit(1), 1000);
  });
