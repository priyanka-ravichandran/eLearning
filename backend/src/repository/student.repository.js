const { Student } = require("../model/Student.model");
const { Group } = require("../model/Group.model");
const mongoose = require("mongoose");

const createStudent = async (student) => {
  return Student.create(student);
};

const findById = async (id) => {
  let student = await Student.findById(id);
  let group = await Group.findOne({ team_members: id }).populate('team_members', 'name');

  // Generate avatar URL for consistent display across all pages
  const avatarRepo = require("./avatar.repository");
  let avatarUrl = null;
  if (student && student.avatar) {
    avatarUrl = avatarRepo.generateAvatarUrl(student.avatar);
  }

  let result = {
    student: {
      ...student.toObject(),
      avatarUrl: avatarUrl // Add the generated avatar URL
    },
    group,
  };

  student["group"] = group;
  student["avatarUrl"] = avatarUrl; // Also add to the student object directly
  console.log("group found", typeof group);
  console.log("avatar URL generated:", avatarUrl);

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
  console.log("Stack trace:", new Error().stack);
  
  try {
    // Validate inputs
    if (!student_id) {
      console.log("Student ID is required");
      return { success: false, error: "Student ID is required" };
    }
    if (!points || isNaN(points)) {
      console.log("Valid points value is required");
      return { success: false, error: "Valid points value is required" };
    }
    if (!transaction_type || !["credit", "debit"].includes(transaction_type)) {
      console.log("Transaction type must be 'credit' or 'debit'");
      return { success: false, error: "Transaction type must be 'credit' or 'debit'" };
    }
    if (!reason) {
      console.log("Reason is required");
      return { success: false, error: "Reason is required" };
    }

    console.log("All validations passed, finding student...");

    // Check if ID is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(student_id)) {
      console.log("Invalid student ID format:", student_id);
      return { success: false, error: "Invalid student ID format" };
    }

    // First get the current student data
    const currentStudent = await Student.findById(student_id);
    if (!currentStudent) {
      console.log("Student not found with ID:", student_id);
      return { success: false, error: "Student not found" };
    }

    // Calculate new points value
    let newPoints = currentStudent.current_points || 0;
    
    if (transaction_type === "credit") {
      newPoints += points;
    } else if (transaction_type === "debit") {
      newPoints -= points;
    }

    console.log("Updating points from", currentStudent.current_points, "to", newPoints);

    // Step 1: Update points first
    let pointsUpdateObj = { 
      $set: { current_points: newPoints }
    };
    
    // If it's a credit transaction, also update total_points_earned
    if (transaction_type === "credit") {
      pointsUpdateObj.$inc = { total_points_earned: points };
    }
    
    console.log("Step 1: Updating points...");
    let updatedStudent = await Student.findByIdAndUpdate(
      student_id,
      pointsUpdateObj,
      { new: true, runValidators: true }
    );
    
    if (!updatedStudent) {
      console.log("Failed to update student points");
      return { success: false, error: "Failed to update student points" };
    }
    
    // Step 2: Add achievement separately
    console.log("Step 2: Adding achievement...");
    try {
      const achievementUpdate = await Student.findByIdAndUpdate(
        student_id,
        {
          $push: {
            achievements: {
              reason: reason,
              date: new Date(),
              type: transaction_type,
              points: points
            }
          }
        },
        { new: true, runValidators: true }
      );
      
      if (!achievementUpdate) {
        console.log("Failed to add achievement but points were updated");
        // Points were updated successfully, so we still return success
      } else {
        console.log("✅ Achievement added successfully");
      }
    } catch (achievementError) {
      console.error("Achievement add error:", achievementError.message);
      // Points were updated successfully, so we still return success
      console.log("Points updated but achievement failed - continuing...");
    }

    if (!updatedStudent) {
      console.log("Failed to update student");
      return { success: false, error: "Failed to update student" };
    }

    console.log("Points updated successfully! New total:", {
      current_points: updatedStudent.current_points
    });

    // Don't await this as it might cause issues, let it run in background
    update_individual_rank().catch(err => console.log("Rank update error:", err));

    return { success: true, points: newPoints };
  } catch (error) {
    console.log("error in update_student_points:", error);
    return { success: false, error: `Error updating the points: ${error.message}` };
  }
};

const update_individual_rank = async () => {
  try {
    const students = await Student.find()
      .select('_id current_points')
      .sort({ current_points: -1 });

    // Update individual ranks based on current_points
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
    console.log("Getting achievements for student ID:", student_id);
    
    // Check if ID is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(student_id)) {
      console.log("Invalid student ID format:", student_id);
      throw new Error("Invalid student ID format");
    }
    
    // Get student with achievements
    const student = await Student.findById(student_id);
    
    if (!student) {
      console.log("Student not found with ID:", student_id);
      throw new Error("Student not found");
    }
    
    // Format achievements for display
    let formattedAchievements = [];
    if (student.achievements && student.achievements.length > 0) {
      formattedAchievements = student.achievements.map(achievement => {
        return {
          reason: achievement.reason,
          date: achievement.date,
          formatted_date: new Date(achievement.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long', 
            day: 'numeric'
          }),
          type: achievement.type,
          points: achievement.type === 'credit' ? 
            `+${achievement.points}` : 
            `-${achievement.points}`,
          points_value: achievement.points
        };
      });
      
      // Sort by date (newest first)
      formattedAchievements.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    console.log(`Found ${formattedAchievements.length} achievements for student`);
    
    return {
      success: true,
      student_achievements: formattedAchievements,
      points_info: {
        current_points: student.current_points || 0,
        total_points_earned: student.total_points_earned || 0,
        points_breakdown: student.points_breakdown || {},
        individual_rank: student.individual_rank || 0
      }
    };
  } catch (error) {
    console.log("Error in get_student_achievements:", error);
    throw new Error(`Error fetching achievements: ${error.message}`);
  }
};

const get_point_transactions = async (student_id) => {
  try {
    console.log("Getting point transactions for student ID:", student_id);
    
    // Check if ID is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(student_id)) {
      console.log("Invalid student ID format:", student_id);
      throw new Error("Invalid student ID format");
    }
    
    // Get student with achievements (which are our point transactions)
    const student = await Student.findById(student_id);
    
    if (!student) {
      console.log("Student not found with ID:", student_id);
      throw new Error("Student not found");
    }
    
    // Format transactions for display
    let formattedTransactions = [];
    if (student.achievements && student.achievements.length > 0) {
      formattedTransactions = student.achievements.map(achievement => {
        return {
          reason: achievement.reason,
          date: achievement.date,
          created_at: achievement.date, // Add created_at for frontend compatibility
          formatted_date: new Date(achievement.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long', 
            day: 'numeric'
          }),
          type: achievement.type,
          points: achievement.type === 'credit' ? 
            `+${achievement.points}` : 
            `-${achievement.points}`,
          points_value: achievement.points,
          // Add amount field to match what frontend expects
          amount: achievement.points
        };
      });
      
      // Sort by date (newest first)
      formattedTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    console.log(`Found ${formattedTransactions.length} point transactions for student ${student_id}`);
    
    return {
      success: true,
      transactions: formattedTransactions,
      points_info: {
        current_points: student.current_points || 0,
        total_points_earned: student.total_points_earned || 0
      }
    };
  } catch (error) {
    console.log("Error in get_point_transactions:", error);
    throw new Error(`Error fetching point transactions: ${error.message}`);
  }
};

const get_inidividual_leaderboard = async () => {
  try {
    update_individual_rank();

    const students = await Student.find()
      .select('_id name current_points individual_rank avatar') // Include avatar field
      .sort({ individual_rank: 1 });

    // Generate avatar URLs for each student
    const avatarRepo = require("./avatar.repository");
    const studentsWithAvatars = students.map(student => {
      const studentObj = student.toObject();
      if (student.avatar) {
        studentObj.avatarUrl = avatarRepo.generateAvatarUrl(student.avatar);
      }
      return studentObj;
    });

    return {
      success: true,
      individual_leaderboard: studentsWithAvatars,
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
  get_point_transactions,
  get_inidividual_leaderboard,
};
