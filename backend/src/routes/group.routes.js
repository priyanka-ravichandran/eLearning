const { Router } = require("express");
const {
  getGroupDetails,
  create_group,
  join_group,
  exit_group,
  getGroupByStudent,
  isGroupLeader,
  updateVillageLevel,
  update_group_points,
  getVillageMilestones
} = require("../controllers/group/group.controller");
const { getGroupMembers } = require("../controllers/groupMembers.controller");
const isAuth = require("../middleware/auth");
const router = Router();

router.post("/get_group_details", getGroupDetails);
router.post("/get_group_by_student", getGroupByStudent);
router.post("/create_group", create_group);
router.post("/join_group", join_group);
router.post("/exit_group", exit_group);
router.post("/is_group_leader", isGroupLeader);
router.post("/update_village_level", updateVillageLevel);
router.post("/update_group_points", update_group_points);
router.post("/get_village_milestones", getVillageMilestones);
router.get("/members/:groupId", getGroupMembers);

module.exports = router;
