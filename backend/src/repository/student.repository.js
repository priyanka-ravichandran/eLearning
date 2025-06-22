const { Student } = require("../model/Student.model");
const { Group } = require("../model/Group.model");
const mongoose = require("mongoose");

const createStudent = async (student) => {
  return Student.create(student);
};

const findById = async (id) => {
  let student = await Student.findById(id);
  let group = await Group.findOne({ team_members: id }).populate('team_members', 'name');

  let result = {
    student,
    group,
  };

  student["group"] = group;
  console.log("group found", typeof group);

  return result;
};

const findStudentByEmail = async (email) => {
  return Student.findOne({
    email: email,
  });
};

const update_student_points = async (
  student_id,
  points,
  transaction_type,
  reason
) => {
  try {
    // Check if a record with the given userId exists
    const existingStudentDetails = await Student.findById(student_id);

    console.log("existingStudentDetails before", existingStudentDetails);

    if (transaction_type === "credit") {
      existingStudentDetails.total_points_earned += points;
      existingStudentDetails.current_points += points;
    } else if (transaction_type === "debit") {
      existingStudentDetails.current_points -= points;
    }

    existingStudentDetails.achievements.unshift({
      reason: reason,
      date: new Date(),
      type: transaction_type,
      points: points,
    });

    console.log("existingStudentDetails after", existingStudentDetails);

    await existingStudentDetails.save();

    await update_individual_rank();

    return { success: true };
  } catch (error) {
    console.log("error", error);
    throw new Error("Error updating the points");
  }
};

const update_individual_rank = async () => {
  try {
    const students = await Student.find().sort({ total_points_earned: -1 });

    // Update individual ranks based on total_points_earned
    for (let i = 0; i < students.length; i++) {
      await Student.updateOne(
        { _id: students[i]._id },
        { $set: { individual_rank: i + 1 } }
      );
    }

    console.log("Individual ranks updated successfully.");
  } catch (error) {
    throw new Error("Error updating the points");
  }
};

const get_student_achievements = async (student_id) => {
  try {
    // update_individual_rank();

    // Check if a record with the given userId exists
    const studentArr = await Student.find({
      _id: mongoose.Types.ObjectId(student_id),
    });
    let achievements = studentArr.map((std) => std.achievements);

    return {
      success: true,
      student_achievements: achievements?.[0],
    };
  } catch (error) {
    console.log("Errror:", error);
    throw new Error("Error updating the points");
  }
};

const get_inidividual_leaderboard = async () => {
  try {
    update_individual_rank();

    const students = await Student.find().sort({ individual_rank: 1 });

    return {
      success: true,
      individual_leaderboard: students,
    };
  } catch (error) {
    throw new Error("Error updating the points");
  }
};

const findByIdAndDelete = async (id) => {
  return Student.findByIdAndDelete(id);
};

module.exports = {
  createStudent,
  findById,
  findStudentByEmail,
  update_student_points,
  get_student_achievements,
  get_inidividual_leaderboard,
};
