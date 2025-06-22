const { Group } = require("../model/Group.model");
const mongoose = require("mongoose");

const findById = async (id) => {
  return Group.findById(id);
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
    // const existingStudentDetails = await Group.findById(group_id)
    console.log("group", group);
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
    }).populate({ path: "team_members", select: "name" });
    // const team_members = existingGroupDetails.team_members.filter(
    //   (mem) => mem
    // );
    console.log('exist data',existingGroupDetails)
    const achievementsData = existingGroupDetails.achievements.map(
      (achievement) => ({
        reason: achievement?.reason,
        date: achievement?.date,
        type: achievement?.type,
        points: achievement?.points,
        team:existingGroupDetails.team_members.filter(team=>team?._id?.toString()===achievement?.student_id?.toString()).map(team=>team?.name),
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
      .populate({ path: "team_members", select: "name" })
      .sort({ group_rank: 1 });
    return {
      success: true,
      group_leaderboard: groups,
    };
  } catch (error) {
    throw new Error("Error updating the points");
  }
};

const updateVillageLevel = async (group_id, points_debited) => {
  {
    try {
      // Check if a record with the given userId exists
      const groupDetails = await Group.findById(group_id);

      groupDetails.village_level += 1;

      groupDetails.current_points -= points_debited;

      groupDetails.save();

      return groupDetails;
    } catch (error) {
      console.log(error);

      throw new Error("Error updating the points");
    }
  }
};

const create_group = async (student_id_1, student_id_2, student_id_3) => {
  // Find the maximum group number in the collection
  const maxGroup = await Group.findOne({}, { group_no: 1 }).sort({
    group_no: -1,
  });

  // Calculate the new group number (increment the maximum group number)
  const newGroupNo = maxGroup ? maxGroup.group_no + 1 : 1;

  const group = {
    group_no: newGroupNo,
    team_members: [student_id_1, student_id_2, student_id_3],
    total_points_earned: 0,
    current_points: 0,
    village_level: 1,
    achievements: [],
    group_rank: 0,
  };

  //  // Create a new group document with the calculated group number
  //  const newGroup = new Group({ group_no: newGroupNo });

  //  // Save the new group document to the database
  //  await newGroup.save();

  return Group.create(group);
};

module.exports = {
  findById,
  update_group_points,
  get_group_achievements,
  get_group_leaderboard,
  create_group,
  updateVillageLevel,
};
