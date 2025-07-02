const express = require("express");
const {
  getAvatarShop,
  getStudentAvatarData,
  updateAvatar,
  purchaseItem,
  getAvatarPreview,
} = require("../controllers/avatar/avatar.controller");

const router = express.Router();

// Get avatar shop items and categories
router.get("/shop", getAvatarShop);

// Get student's current avatar configuration and purchased items
router.post("/my-avatar", getStudentAvatarData);

// Update avatar configuration (equip items)
router.put("/update", updateAvatar);

// Purchase an avatar item
router.post("/purchase", purchaseItem);

// Get avatar preview URL (for trying items before purchase)
router.get("/preview", getAvatarPreview);

module.exports = router;
