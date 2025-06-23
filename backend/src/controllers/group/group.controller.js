const { StatusCodes } = require("http-status-codes");
const { Group } = require("../../model/Group.model");
const { response } = require("../../utils/response");
const groupRepository = require("../../repository/group.repository");
const { Message } = require("../../utils/Message");
const { Student } = require("../../model/Student.model"); // Add this import if not present

// Get group details
const getGroupDetails = async (req, res) => {
  try {
    const { group_id } = req.body;
    const group = await Group.findById(group_id).populate("team_members");
    if (!group) return response(res, 404, false, {}, "Group not found");
    return response(res, 200, true, { group }, "Group details fetched");
  } catch (error) {
    return response(res, 500, false, {}, error.message);
  }
};

// Create group
const create_group = async (req, res) => {
  try {
    const { name, student_id_1, student_id_2, student_id_3 } = req.body;
    const group = await groupRepository.create_group(name, student_id_1, student_id_2, student_id_3);
    // Update the creator's group field in Student schema
    if (group && group._id && student_id_1) {
      await Student.findByIdAndUpdate(student_id_1, { group: group._id });
    }
    return response(res, 201, true, { group }, "Group created successfully");
  } catch (error) {
    return response(res, 500, false, {}, error.message);
  }
};

// Join group
const join_group = async (req, res) => {
  try {
    const { code, student_id } = req.body;
    const group = await groupRepository.join_group(code, student_id);
    // Update the joining student's group field in Student schema
    if (group && group._id && student_id) {
      await Student.findByIdAndUpdate(student_id, { group: group._id });
    }
    return response(res, 200, true, { group }, "Joined group successfully");
  } catch (error) {
    return response(res, 400, false, {}, error.message);
  }
};

// Exit group
const exit_group = async (req, res) => {
  try {
    const { group_id, student_id } = req.body;
    await groupRepository.exit_group(group_id, student_id);
    return response(res, 200, true, {}, "Exited group successfully");
  } catch (error) {
    return response(res, 400, false, {}, error.message);
  }
};

// Update student Dtails
const updateVillageLevel = async (req, res) => {
  try {
    const { group_id, points_debited } = req.body;

    try {
      const group_details = await groupRepository.updateVillageLevel(
        group_id,
        points_debited
      );

      return response(res, StatusCodes.ACCEPTED, true, group_details);
    } catch (error) {
      return response(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        false,
        {},
        error.message
      );
    }
  } catch (error) {
    console.log(error.message);
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      error.message
    );
  }
};

const update_group_points = async (req, res) => {
  try {
    const { student_id, points, transaction_type, reason } = req.body;

    try {
      const current_points = await groupRepository.update_group_points(
        student_id,
        points,
        transaction_type,
        reason
      );

      return response(
        res,
        StatusCodes.ACCEPTED,
        true,
        { current_points: current_points },
        "Points updated successfully"
      );
    } catch (error) {
      return response(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        false,
        {},
        error.message
      );
    }
  } catch (error) {
    console.log(error.message);
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      error.message
    );
  }
};

const get_group_achievements = async (req, res) => {
  try {
    const { group_id } = req.body;
    console.log("group_id", group_id);
    try {
      const group_achievements = await groupRepository.get_group_achievements(
        group_id
      );
      console.log("group_achievements", group_achievements);

      return response(
        res,
        StatusCodes.ACCEPTED,
        true,
        { payload: group_achievements },
        "Achievements fetched successfully"
      );
    } catch (error) {
      return response(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        false,
        {},
        error.message
      );
    }
  } catch (error) {
    console.log(error.message);
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      error.message
    );
  }
};

const get_group_leaderboard = async (req, res) => {
  try {
    try {
      const group_leaderboard = await groupRepository.get_group_leaderboard();

      return response(
        res,
        StatusCodes.ACCEPTED,
        true,
        { payload: group_leaderboard },
        null
      );
    } catch (error) {
      return response(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        false,
        {},
        error.message
      );
    }
  } catch (error) {
    console.log(error.message);
    return response(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      {},
      error.message
    );
  }
};

// Get group details by student ID
const getGroupByStudent = async (req, res) => {
  try {
    const { student_id } = req.body;
    // Find the student and populate their group
    const student = await Student.findById(student_id).populate({
      path: "group",
      populate: { path: "team_members" }
    });
    if (!student || !student.group) {
      return response(res, 404, false, {}, "Student is not in any group");
    }
    return response(res, 200, true, { group: student.group }, "Group details fetched");
  } catch (error) {
    return response(res, 500, false, {}, error.message);
  }
};

module.exports = {
  getGroupDetails,
  create_group,
  join_group,
  exit_group,
  updateVillageLevel,
  update_group_points,
  get_group_achievements,
  get_group_leaderboard,
  getGroupByStudent
};
