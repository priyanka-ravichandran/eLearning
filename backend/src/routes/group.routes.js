const { Router } = require("express");
const {
  getGroupDetails,
  create_group,
  join_group,
  exit_group,
  getGroupByStudent,
  isGroupLeader
} = require("../controllers/group/group.controller");
const isAuth = require("../middleware/auth");
const router = Router();

router.post("/get_group_details", getGroupDetails);
router.post("/get_group_by_student", getGroupByStudent);
router.post("/create_group", create_group);
router.post("/join_group", join_group);
router.post("/exit_group", exit_group);
router.post("/is_group_leader", isGroupLeader);

module.exports = router;
