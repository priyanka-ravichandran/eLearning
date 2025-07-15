const { Group } = require("../model/Group.model");
const mongoose = require("mongoose");

const findById = async (id) => {
  return Group.findById(id);
};

const generateGroupCode = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

const create_group = async (name, student_id_1, student_id_2, student_id_3) => {
  // Find the highest group_no and increment
  const lastGroup = await Group.findOne().sort({ group_no: -1 });
  const newGroupNo = lastGroup ? lastGroup.group_no + 1 : 1;
  
  // Set student_id_1 (creator) as the leader
  const group = {
    name,
    code: generateGroupCode(),
    group_no: newGroupNo,
    leader: student_id_1, // Set the leader to the creator of the group
    team_members: [student_id_1, student_id_2, student_id_3].filter(Boolean),
    total_points_earned: 0,
    current_points: 0,
    village_level: 1,
    achievements: [],
    group_rank: 0,
  };
  return Group.create(group);
};

const update_group_points = async (
  student_id,
  points,
  transaction_type,
  reason
) => {
  try {
    // Check if a record with the given userId exists
    let group = await Group.findOne({ team_members: student_id });
    console.log("group", group);
    
    if (!group) {
      throw new Error("Group not found for student");
    }
    
    if (transaction_type === "credit") {
      group.total_points_earned += points;
      group.current_points += points;
    } else if (transaction_type === "debit") {
      group.current_points -= points;
    }

    group.achievements.unshift({
      reason: reason,
      student_id: student_id,
      date: new Date(),
      type: transaction_type,
      points: points,
    });

    await group.save();
    
    // Auto-sync village level based on new points
    await syncVillageLevel(group._id);

    await update_group_rank();

    return { success: true };
  } catch (error) {
    console.log(error);
    throw new Error("Error updating the points");
  }
};

const update_group_rank = async () => {
  try {
    const groups = await Group.find().sort({
      total_points_earned: -1,
      village_level: -1,
    }); // Sort students by total_points_earned in descending order, and then by village_level in descending order

    let previousPoints = null;
    let rank = 0;

    for (const group of groups) {
      if (group.total_points_earned !== previousPoints) {
        // If the total_points_earned is different from the previous student, increment the rank
        rank++;
      }
      // Update the individual_rank for the current student
      await Group.updateOne(
        { _id: group._id },
        {
          $set: {
            group_rank: rank,
          },
        }
      );
      // Update the previousPoints for comparison with the next student
      previousPoints = group.total_points_earned;
    }

    console.log("Individual ranks updated successfully.");
  } catch (error) {
    throw new Error("Error updating the points");
  }
};

const get_group_achievements = async (group_id) => {
  try {
    // update_individual_rank();

    // Check if a record with the given userId exists
    const existingGroupDetails = await Group.findOne({
      _id: mongoose.Types.ObjectId(group_id),
    }).populate({ path: "team_members", select: "name avatar" });
    
    // Generate avatar URLs for team members
    if (existingGroupDetails && existingGroupDetails.team_members) {
      const avatarRepo = require("./avatar.repository");
      existingGroupDetails.team_members.forEach(member => {
        if (member.avatar) {
          member.avatarUrl = avatarRepo.generateAvatarUrl(member.avatar);
        }
      });
    }
    
    // const team_members = existingGroupDetails.team_members.filter(
    //   (mem) => mem
    // );
    console.log("exist data", existingGroupDetails);
    const achievementsData = existingGroupDetails.achievements.map(
      (achievement) => ({
        reason: achievement?.reason,
        date: achievement?.date,
        type: achievement?.type,
        points: achievement?.points,
        team: existingGroupDetails.team_members
          .filter(
            (team) =>
              team?._id?.toString() === achievement?.student_id?.toString()
          )
          .map((team) => team?.name),
      })
    );
    return {
      success: true,
      group_achievements: achievementsData,
    };
  } catch (error) {
    throw new Error("Error updating the points");
  }
};

const get_group_leaderboard = async () => {
  try {
    await update_group_rank();

    const groups = await Group.find()
      .populate({ path: "team_members", select: "name avatar" })
      .sort({ group_rank: 1 });
    
    // Generate avatar URLs for team members
    const avatarRepo = require("./avatar.repository");
    groups.forEach(group => {
      if (group.team_members && group.team_members.length > 0) {
        group.team_members.forEach(member => {
          if (member.avatar) {
            member.avatarUrl = avatarRepo.generateAvatarUrl(member.avatar);
          }
        });
      }
    });
    
    return {
      success: true,
      group_leaderboard: groups,
    };
  } catch (error) {
    throw new Error("Error updating the points");
  }
};

const updateVillageLevel = async (group_id, points_debited) => {
  try {
    // Get the current group
    const groupDetails = await Group.findById(group_id);
    if (!groupDetails) {
      throw new Error("Group not found");
    }

    // Check if user has enough current points
    if (groupDetails.current_points < points_debited) {
      throw new Error("Insufficient points");
    }
    
    // Debit the points
    groupDetails.current_points -= points_debited;
    
    // Simple increment: each purchase increases village level by 1
    // This matches the original game logic where you buy your way up
    groupDetails.village_level += 1;
    
    // Cap at maximum level 7
    if (groupDetails.village_level > 7) {
      groupDetails.village_level = 7;
    }
    
    await groupDetails.save();

    console.log(`🏠 Village level updated: ${group_id}`);
    console.log(`   Points spent: ${points_debited}`);
    console.log(`   Current points: ${groupDetails.current_points}`);
    console.log(`   Village Level: ${groupDetails.village_level}`);

    return groupDetails;
  } catch (error) {
    console.error("Error updating village level:", error);
    throw new Error("Error updating the village level: " + error.message);
  }
};

const join_group = async (code, student_id) => {
  const group = await Group.findOne({ code });
  if (!group) throw new Error("Group not found");
  if (group.team_members.length >= 3) throw new Error("Group is full");
  if (group.team_members.includes(student_id))
    throw new Error("Already in group");
  group.team_members.push(student_id);
  await group.save();
  return group;
};

const exit_group = async (group_id, student_id) => {
  const group = await Group.findById(group_id);
  if (!group) throw new Error("Group not found");
  
  // Check if the student is the group leader
  const isLeader = group.leader && group.leader.toString() === student_id;
  
  // Remove the student from the team members
  group.team_members = group.team_members.filter(
    (id) => id.toString() !== student_id
  );
  
  // If the student was the leader, assign leadership to another member if any remain
  if (isLeader && group.team_members.length > 0) {
    // Assign the first remaining member as the new leader
    group.leader = group.team_members[0];
    console.log("Group leadership transferred to", group.leader);
  } else if (isLeader) {
    // If no members left, remove leader
    group.leader = null;
  }
  
  await group.save();
  return group;
};

// Auto-sync village level based on total points earned (called when points are updated)
const syncVillageLevel = async (group_id) => {
  try {
    const { calculateVillageLevel } = require("../utils/villageSystem");
    
    const groupDetails = await Group.findById(group_id);
    if (!groupDetails) {
      throw new Error("Group not found");
    }

    // Calculate what the village level should be based on TOTAL points earned
    const correctVillageLevel = calculateVillageLevel(groupDetails.total_points_earned);
    
    // Update if different
    if (groupDetails.village_level !== correctVillageLevel) {
      const oldLevel = groupDetails.village_level;
      groupDetails.village_level = correctVillageLevel;
      await groupDetails.save();
      
      console.log(`🏠 Auto-synced village level: ${group_id}`);
      console.log(`   Current Points: ${groupDetails.current_points}`);
      console.log(`   Total Points Earned: ${groupDetails.total_points_earned}`);
      console.log(`   Village Level: ${oldLevel} -> ${correctVillageLevel}`);
    }

    return groupDetails;
  } catch (error) {
    console.error("Error syncing village level:", error);
    throw new Error("Error syncing village level");
  }
};

const addPointsToGroup = async (groupId, points) => {
  try {
    const group = await Group.findById(groupId);
    if (!group) throw new Error('Group not found');
    group.total_points_earned += points;
    group.current_points += points;
    await group.save();
    await syncVillageLevel(groupId);
    await update_group_rank();
    return { success: true };
  } catch (error) {
    console.error(error);
    throw new Error('Error adding points to group');
  }
};

module.exports = {
  findById,
  create_group,
  join_group,
  exit_group,
  update_group_points,
  get_group_achievements,
  get_group_leaderboard,
  updateVillageLevel,
  syncVillageLevel,
  addPointsToGroup,
};
