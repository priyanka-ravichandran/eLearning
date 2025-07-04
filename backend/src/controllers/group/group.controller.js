const { StatusCodes } = require("http-status-codes");
const { Group } = require("../../model/Group.model");
const { response } = require("../../utils/response");
const groupRepository = require("../../repository/group.repository");
const { Message } = require("../../utils/Message");
const { Student } = require("../../model/Student.model"); // Add this import if not present
const sendMail = require("../../utils/sendEmail");

// Get group details
const getGroupDetails = async (req, res) => {
  try {
    const { group_id, student_id } = req.body;
    console.log("Getting details for group:", group_id);
    
    const group = await Group.findById(group_id)
      .populate("team_members", "name email avatar")
      .populate("leader", "name email avatar");
    
    if (!group) return response(res, 404, false, {}, "Group not found");
    
    // Add avatar URLs to team members
    const avatarRepo = require("../../repository/avatar.repository");
    if (group.team_members) {
      group.team_members.forEach(member => {
        if (member.avatar) {
          member.avatarUrl = avatarRepo.generateAvatarUrl(member.avatar);
        }
      });
    }
    
    // Check if requesting student is the leader
    const isLeader = student_id && group.leader && group.leader._id.toString() === student_id;
    
    // Get leader info for response
    let leaderInfo = null;
    if (group.leader) {
      leaderInfo = {
        id: group.leader._id,
        name: group.leader.name || "Unknown",
        email: group.leader.email
      };
      
      // Add avatar URL to leader info
      if (group.leader.avatar) {
        leaderInfo.avatarUrl = avatarRepo.generateAvatarUrl(group.leader.avatar);
      }
      
      console.log("Group leader info:", leaderInfo);
    } else {
      console.log("No leader set for this group");
    }
    
    return response(res, 200, true, { 
      group,
      is_leader: isLeader,
      leader_info: leaderInfo
    }, "Group details fetched");
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
      // Send passcode email to creator
      const creator = await Student.findById(student_id_1);
      if (creator && creator.email) {
        await sendMail(
          creator.email,
          `Welcome to ${group.name}! Your Group Passcode`,
          `<p>Hello ${creator.name},</p>
           <p>You have created the group <b>${group.name}</b> and are now the group leader.</p>
           <p>Your group passcode is: <b>${group.code}</b></p>
           <p>Share this passcode with your teammates to join the group.</p>
           <p>Best regards,<br/>E-Learning Team</p>`
        );
      }
    }
    return response(res, 201, true, { 
      group,
      is_leader: true // The creator is always the leader
    }, "Group created successfully. You are the group leader.");
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
      // Send passcode email to joining student
      const student = await Student.findById(student_id);
      if (student && student.email) {
        await sendMail(
          student.email,
          `Joined ${group.name}! Your Group Passcode`,
          `<p>Hello ${student.name},</p>
           <p>You have joined the group <b>${group.name}</b>.</p>
           <p>Your group passcode is: <b>${group.code}</b></p>
           <p>Share this passcode with your teammates to join the group.</p>
           <p>Best regards,<br/>E-Learning Team</p>`
        );
      }
    }
    
    // Check if the student is the leader
    const isLeader = group.leader && group.leader.toString() === student_id;
    
    return response(res, 200, true, { 
      group,
      is_leader: isLeader
    }, "Joined group successfully");
  } catch (error) {
    return response(res, 400, false, {}, error.message);
  }
};

// Exit group
const exit_group = async (req, res) => {
  try {
    const { group_id, student_id } = req.body;
    
    // Check if the student is the leader before exiting
    const group = await Group.findById(group_id);
    if (!group) {
      return response(res, 404, false, {}, "Group not found");
    }
    
    const wasLeader = group.leader && group.leader.toString() === student_id;
    let leadershipTransferred = false;
    
    // Process the exit
    const updatedGroup = await groupRepository.exit_group(group_id, student_id);
    await Student.findByIdAndUpdate(student_id, { group: null });
    
    // Check if leadership was transferred
    if (wasLeader && updatedGroup.leader && updatedGroup.leader.toString() !== student_id) {
      leadershipTransferred = true;
      
      // Notify the new leader
      const newLeader = await Student.findById(updatedGroup.leader);
      if (newLeader && newLeader.email) {
        await sendMail(
          newLeader.email,
          `Leadership Transfer for ${group.name}`,
          `<p>Hello ${newLeader.name},</p>
           <p>You have been appointed as the new leader of group <b>${updatedGroup.name}</b>.</p>
           <p>Best regards,<br/>E-Learning Team</p>`
        );
      }
    }
    
    const message = wasLeader && leadershipTransferred 
      ? "Exited group successfully. Leadership has been transferred."
      : "Exited group successfully";
    
    return response(res, 200, true, { 
      leadership_transferred: leadershipTransferred,
      new_leader: leadershipTransferred ? updatedGroup.leader : null
    }, message);
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
    console.log("Getting group details for student:", student_id);
    
    // Find the student and populate their group with team members and leader
    const student = await Student.findById(student_id).populate({
      path: "group",
      populate: [
        { path: "team_members", select: "name email avatar" },
        { path: "leader", select: "name email avatar" }
      ]
    });
    
    if (!student || !student.group) {
      return response(res, 404, false, {}, "Student is not in any group");
    }
    
    // Add avatar URLs to team members
    const avatarRepo = require("../../repository/avatar.repository");
    if (student.group.team_members) {
      student.group.team_members.forEach(member => {
        if (member.avatar) {
          member.avatarUrl = avatarRepo.generateAvatarUrl(member.avatar);
        }
      });
    }
    
    // Check if this student is the leader
    const isLeader = student.group.leader && 
                    student.group.leader._id && 
                    student.group.leader._id.toString() === student_id;
    
    // Get leader info for response
    let leaderInfo = null;
    if (student.group.leader) {
      leaderInfo = {
        id: student.group.leader._id,
        name: student.group.leader.name || "Unknown",
        email: student.group.leader.email
      };
      
      // Add avatar URL to leader info
      if (student.group.leader.avatar) {
        leaderInfo.avatarUrl = avatarRepo.generateAvatarUrl(student.group.leader.avatar);
      }
    }
    
    console.log("Student group info:", {
      student_id,
      leader_id: student.group.leader ? student.group.leader._id : "No leader set",
      leader_name: leaderInfo?.name,
      isLeader
    });
    
    return response(res, 200, true, { 
      group: student.group,
      is_leader: isLeader,
      leader_info: leaderInfo
    }, "Group details fetched");
  } catch (error) {
    console.error("Error fetching group by student:", error);
    return response(res, 500, false, {}, error.message);
  }
};

// Check if student is the group leader
const isGroupLeader = async (req, res) => {
  try {
    const { student_id, group_id } = req.body;
    
    if (!student_id || !group_id) {
      return response(res, 400, false, {}, "Missing required parameters");
    }
    
    const group = await Group.findById(group_id);
    if (!group) {
      return response(res, 404, false, {}, "Group not found");
    }
    
    const isLeader = group.leader && group.leader.toString() === student_id;
    
    return response(res, 200, true, { 
      is_leader: isLeader,
      leader_id: group.leader || null,
      group_name: group.name
    }, isLeader ? "Student is the group leader" : "Student is not the group leader");
  } catch (error) {
    console.error("Error checking group leadership:", error);
    return response(res, 500, false, {}, error.message);
  }
};

// Get village milestone information
const getVillageMilestones = async (req, res) => {
  try {
    const { group_id } = req.body;
    
    if (!group_id) {
      return response(res, StatusCodes.BAD_REQUEST, false, {}, "Group ID is required");
    }

    const group = await Group.findById(group_id);
    if (!group) {
      return response(res, StatusCodes.NOT_FOUND, false, {}, "Group not found");
    }

    const { 
      getVillageMilestone, 
      getAllMilestones 
    } = require("../../utils/villageSystem");
    
    const currentMilestone = getVillageMilestone(group.current_points, group.village_level);
    const allMilestones = getAllMilestones();
    
    const responseData = {
      group: {
        id: group._id,
        name: group.name,
        current_points: group.current_points,
        village_level: group.village_level
      },
      milestone: currentMilestone,
      all_milestones: allMilestones
    };

    return response(res, StatusCodes.OK, true, responseData);
  } catch (error) {
    console.error("Error getting village milestones:", error);
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
  create_group,
  join_group,
  exit_group,
  updateVillageLevel,
  update_group_points,
  get_group_achievements,
  get_group_leaderboard,
  getGroupByStudent,
  isGroupLeader,
  getVillageMilestones
};
