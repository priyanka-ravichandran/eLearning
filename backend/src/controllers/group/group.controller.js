const { StatusCodes } = require("http-status-codes");
const { Group } = require("../../model/Group.model");
const { response } = require("../../utils/response");
const groupRepository = require("../../repository/group.repository");
const { Message } = require("../../utils/Message");

// Get student Details
const getGroupDetails = async (req, res) => {
  const { group_id } = req.body;

  try {
    const group = await groupRepository.findById(group_id);
    if (!group) {
      return response(
        res,
        StatusCodes.NOT_FOUND,
        false,
        {},
        Message.USER.NOT_FOUND
      );
    }

    return response(res, StatusCodes.OK, true, { group: group }, null);
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

// create group
const create_group = async (req, res) => {
  try {
    const { student_id_1, student_id_2, student_id_3 } = req.body;

    try {
      await groupRepository.create_group(
        student_id_1,
        student_id_2,
        student_id_3
      );

      return response(res, StatusCodes.OK, true, null);
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

module.exports = {
  getGroupDetails,
  updateVillageLevel,
  update_group_points,
  get_group_achievements,
  get_group_leaderboard,
  create_group,
};
