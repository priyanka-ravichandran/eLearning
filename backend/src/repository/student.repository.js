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
  console.log("=== UPDATE_STUDENT_POINTS CALLED ===");
  console.log("Input parameters:", { student_id, points, transaction_type, reason });
  
  try {
    // Validate inputs
    if (!student_id) {
      throw new Error("Student ID is required");
    }
    if (!points || isNaN(points)) {
      throw new Error("Valid points value is required");
    }
    if (!transaction_type || !["credit", "debit"].includes(transaction_type)) {
      throw new Error("Transaction type must be 'credit' or 'debit'");
    }
    if (!reason) {
      throw new Error("Reason is required");
    }

    console.log("All validations passed, finding student...");

    // Check if a record with the given userId exists
    const existingStudentDetails = await Student.findById(student_id);

    if (!existingStudentDetails) {
      console.log("Student not found with ID:", student_id);
      throw new Error("Student not found");
    }

    console.log("Student found:", existingStudentDetails.name, existingStudentDetails.email);
    console.log("Current points before update:", {
      total_points_earned: existingStudentDetails.total_points_earned,
      current_points: existingStudentDetails.current_points
    });

    // Initialize achievements array if it doesn't exist
    if (!Array.isArray(existingStudentDetails.achievements)) {
      existingStudentDetails.achievements = [];
    }

    // Initialize points if they don't exist
    if (typeof existingStudentDetails.total_points_earned !== 'number') {
      existingStudentDetails.total_points_earned = 0;
    }
    if (typeof existingStudentDetails.current_points !== 'number') {
      existingStudentDetails.current_points = 0;
    }

    if (transaction_type === "credit") {
      existingStudentDetails.total_points_earned += points;
      existingStudentDetails.current_points += points;
      console.log("Points credited. New totals:", {
        total_points_earned: existingStudentDetails.total_points_earned,
        current_points: existingStudentDetails.current_points
      });
    } else if (transaction_type === "debit") {
      existingStudentDetails.current_points -= points;
      console.log("Points debited. New current_points:", existingStudentDetails.current_points);
    }

    // Create achievement object with proper schema structure
    const achievement = {
      reason: String(reason),
      date: new Date(),
      type: String(transaction_type),
      points: Number(points),
    };

    existingStudentDetails.achievements.unshift(achievement);

    console.log("About to save student with updated points and achievements...");

    await existingStudentDetails.save();
    
    console.log("Student saved successfully! Points should now be updated.");

    // Don't await this as it might cause issues, let it run in background
    update_individual_rank().catch(err => console.log("Rank update error:", err));

    return { success: true };
  } catch (error) {
    console.log("error in update_student_points:", error);
    throw new Error(`Error updating the points: ${error.message}`);
  }
};

const update_individual_rank = async () => {
  try {
    const students = await Student.find()
      .select('_id total_points_earned')
      .sort({ total_points_earned: -1 });

    // Update individual ranks based on total_points_earned
    for (let i = 0; i < students.length; i++) {
      await Student.updateOne(
        { _id: students[i]._id },
        { $set: { individual_rank: i + 1 } }
      );
    }

    console.log("Individual ranks updated successfully.");
  } catch (error) {
    console.log("Error in update_individual_rank:", error);
    throw new Error(`Error updating individual ranks: ${error.message}`);
  }
};

const get_student_achievements = async (student_id) => {
  try {
    // update_individual_rank();

    // Check if a record with the given userId exists
    const studentArr = await Student.find({
      _id: new mongoose.Types.ObjectId(student_id),
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
