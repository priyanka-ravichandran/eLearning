const { Router } = require("express");
const {
  getGroupDetails,
  updateVillageLevel,
  update_group_points,
  get_group_achievements,
  get_group_leaderboard,
  create_group,
} = require("../controllers/group/group.controller");
const isAuth = require("../middleware/auth");
const router = Router();

router.post("/get_group_details", getGroupDetails);
router.post("/update_village_level", updateVillageLevel);
router.post("/update_group_points", update_group_points);

router.post("/get_group_achievements", get_group_achievements);
router.post("/get_group_leaderboard", get_group_leaderboard);
router.post("/create_group", create_group);

module.exports = router;
