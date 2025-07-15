const groupRepo = require("../repository/group.repository");

// Get all group members with names for a group
// GET /api/group-members/:groupId
async function getGroupMembers(req, res) {
  const groupId = req.params.groupId;
  if (!groupId) {
    return res.status(400).json({ success: false, message: "Missing groupId" });
  }
  try {
    const group = await groupRepo.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }
    // Populate team_members with name and _id
    await group.populate({ path: "team_members", select: "name _id" });
    const members = group.team_members.map(m => ({ id: m._id, name: m.name }));
    return res.json({ success: true, members });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getGroupMembers };
