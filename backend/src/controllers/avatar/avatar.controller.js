const {
  getShopItems,
  getStudentAvatar,
  updateAvatarConfiguration,
  purchaseAvatarItem,
  generateAvatarUrl,
  getPredefinedSeeds,
} = require("../../repository/avatar.repository");
const { response } = require("../../utils/response");
const { StatusCodes } = require("http-status-codes");

// Get all shop items and categories
const getAvatarShop = async (req, res) => {
  try {
    const shopItems = getShopItems();
    const seeds = getPredefinedSeeds();
    
    return response(res, StatusCodes.OK, true, {
      seeds,
      shop: shopItems,
    }, "Avatar shop items retrieved successfully");
  } catch (error) {
    return response(res, StatusCodes.INTERNAL_SERVER_ERROR, false, {}, error.message);
  }
};

// Get student's current avatar and purchased items
const getStudentAvatarData = async (req, res) => {
  try {
    const { student_id } = req.body;
    
    if (!student_id) {
      return response(res, StatusCodes.BAD_REQUEST, false, {}, "Student ID is required");
    }
    
    const studentData = await getStudentAvatar(student_id);
    
    if (!studentData) {
      return response(res, StatusCodes.NOT_FOUND, false, {}, "Student not found");
    }

    const avatarUrl = generateAvatarUrl(studentData.avatar);
    
    return response(res, StatusCodes.OK, true, {
      avatar: studentData.avatar,
      purchasedItems: studentData.purchased_items,
      currentPoints: studentData.current_points,
      avatarUrl: avatarUrl,
    }, "Student avatar data retrieved successfully");
  } catch (error) {
    return response(res, StatusCodes.INTERNAL_SERVER_ERROR, false, {}, error.message);
  }
};

// Update avatar configuration (equip purchased items)
const updateAvatar = async (req, res) => {
  try {
    const { student_id, seed, hair, eyes, facialHair, mouth, body } = req.body;
    
    if (!student_id) {
      return response(res, StatusCodes.BAD_REQUEST, false, {}, "Student ID is required");
    }
    
    // Validate that only purchased items can be equipped
    const studentData = await getStudentAvatar(student_id);
    if (!studentData) {
      return response(res, StatusCodes.NOT_FOUND, false, {}, "Student not found");
    }

    const purchasedItems = studentData.purchased_items;
    
    // Check if trying to equip unpurchased items (seed is always available since sarah is default)
    if (seed && seed !== 'sarah' && !purchasedItems.seeds.includes(seed)) {
      return response(res, StatusCodes.BAD_REQUEST, false, {}, "Seed not purchased");
    }
    
    if (hair && !purchasedItems.hair.includes(hair)) {
      return response(res, StatusCodes.BAD_REQUEST, false, {}, "Hair style not purchased");
    }
    
    if (eyes && !purchasedItems.eyes.includes(eyes)) {
      return response(res, StatusCodes.BAD_REQUEST, false, {}, "Eyes style not purchased");
    }
    
    if (facialHair && !purchasedItems.facialHair.includes(facialHair)) {
      return response(res, StatusCodes.BAD_REQUEST, false, {}, "Facial hair not purchased");
    }
    
    if (mouth && !purchasedItems.mouth.includes(mouth)) {
      return response(res, StatusCodes.BAD_REQUEST, false, {}, "Mouth style not purchased");
    }
    
    if (body && !purchasedItems.body.includes(body)) {
      return response(res, StatusCodes.BAD_REQUEST, false, {}, "Body style not purchased");
    }

    const avatarConfig = {};
    if (seed !== undefined) avatarConfig.seed = seed;
    if (hair !== undefined) avatarConfig.hair = hair;
    if (eyes !== undefined) avatarConfig.eyes = eyes;
    if (facialHair !== undefined) avatarConfig.facialHair = facialHair;
    if (mouth !== undefined) avatarConfig.mouth = mouth;
    if (body !== undefined) avatarConfig.body = body;
    
    const updatedAvatar = await updateAvatarConfiguration(student_id, avatarConfig);
    const avatarUrl = generateAvatarUrl(updatedAvatar);
    
    return response(res, StatusCodes.OK, true, {
      avatar: updatedAvatar,
      avatarUrl: avatarUrl,
    }, "Avatar updated successfully");
  } catch (error) {
    return response(res, StatusCodes.INTERNAL_SERVER_ERROR, false, {}, error.message);
  }
};

// Purchase an avatar item
const purchaseItem = async (req, res) => {
  try {
    const { student_id, category, itemKey } = req.body;
    
    if (!student_id) {
      return response(res, StatusCodes.BAD_REQUEST, false, {}, "Student ID is required");
    }
    
    if (!category || !itemKey) {
      return response(res, StatusCodes.BAD_REQUEST, false, {}, "Category and item key are required");
    }
    
    const result = await purchaseAvatarItem(student_id, category, itemKey);
    
    return response(res, StatusCodes.OK, true, {
      item: result.item,
      remainingPoints: result.remainingPoints,
      purchasedItems: result.purchasedItems,
    }, result.message);
  } catch (error) {
    if (error.message === 'Student not found') {
      return response(res, StatusCodes.NOT_FOUND, false, {}, error.message);
    }
    
    if (error.message === 'Insufficient points' || 
        error.message === 'Item already purchased' || 
        error.message === 'Item not found in shop') {
      return response(res, StatusCodes.BAD_REQUEST, false, {}, error.message);
    }
    
    return response(res, StatusCodes.INTERNAL_SERVER_ERROR, false, {}, error.message);
  }
};

// Generate avatar preview URL (for trying items before purchase)
const getAvatarPreview = async (req, res) => {
  try {
    const { seed, hair, eyes, facialHair, mouth, body } = req.query;
    
    const avatarConfig = {};
    if (seed) avatarConfig.seed = seed;
    if (hair) avatarConfig.hair = hair;
    if (eyes) avatarConfig.eyes = eyes;
    if (facialHair) avatarConfig.facialHair = facialHair;
    if (mouth) avatarConfig.mouth = mouth;
    if (body) avatarConfig.body = body;
    
    const avatarUrl = generateAvatarUrl(avatarConfig);
    
    return response(res, StatusCodes.OK, true, {
      avatarUrl: avatarUrl,
      config: avatarConfig,
    }, "Avatar preview generated successfully");
  } catch (error) {
    return response(res, StatusCodes.INTERNAL_SERVER_ERROR, false, {}, error.message);
  }
};

module.exports = {
  getAvatarShop,
  getStudentAvatarData,
  updateAvatar,
  purchaseItem,
  getAvatarPreview,
};
