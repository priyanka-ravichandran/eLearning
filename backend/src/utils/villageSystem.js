// Village milestone system
// Every 50 points unlocks a new village level
const POINTS_PER_LEVEL = 50;
const MAX_VILLAGE_LEVEL = 7;

/**
 * Calculate what village level should be unlocked based on total points earned
 * @param {number} totalPointsEarned - Total points earned by the group
 * @returns {number} - Village level that should be unlocked (1-7)
 */
const calculateVillageLevel = (totalPointsEarned) => {
  if (totalPointsEarned < 0) return 1;
  
  // Calculate level based on total points earned (50 points per level)
  const calculatedLevel = Math.floor(totalPointsEarned / POINTS_PER_LEVEL) + 1;
  
  // Cap at maximum level
  return Math.min(calculatedLevel, MAX_VILLAGE_LEVEL);
};

/**
 * Calculate how many points are needed for the next village level
 * @param {number} currentLevel - Current village level
 * @returns {number} - Points needed for next level (0 if at max level)
 */
const getPointsForNextLevel = (currentLevel) => {
  if (currentLevel >= MAX_VILLAGE_LEVEL) return 0;
  return currentLevel * POINTS_PER_LEVEL;
};

/**
 * Get village milestone information
 * @param {number} currentPoints - Current group points
 * @param {number} currentLevel - Current village level
 * @returns {object} - Milestone information
 */
const getVillageMilestone = (currentPoints, currentLevel) => {
  const targetLevel = calculateVillageLevel(currentPoints);
  const pointsForNextLevel = getPointsForNextLevel(currentLevel);
  const pointsNeeded = pointsForNextLevel - currentPoints;
  
  return {
    currentLevel,
    targetLevel,
    canUpgrade: targetLevel > currentLevel,
    pointsForNextLevel,
    pointsNeeded: Math.max(0, pointsNeeded),
    maxLevel: MAX_VILLAGE_LEVEL,
    pointsPerLevel: POINTS_PER_LEVEL
  };
};

/**
 * Get list of all village milestones with their requirements
 * @returns {array} - Array of milestone objects
 */
const getAllMilestones = () => {
  const milestones = [];
  for (let level = 1; level <= MAX_VILLAGE_LEVEL; level++) {
    milestones.push({
      level,
      pointsRequired: (level - 1) * POINTS_PER_LEVEL,
      description: `Village Level ${level}`,
      items: getVillageItemsForLevel(level)
    });
  }
  return milestones;
};

/**
 * Get the items/features unlocked at each village level
 * @param {number} level - Village level
 * @returns {array} - Array of items/features for that level
 */
const getVillageItemsForLevel = (level) => {
  const items = {
    1: ['Basic huts', 'Starting village'],
    2: ['River', 'Water source'],
    3: ['Trees', 'Forest area'],
    4: ['Hut upgrades', 'Better housing'],
    5: ['Grasses', 'Green spaces'],
    6: ['Drum', 'Communication center'],
    7: ['Shield', 'Defense system', 'Complete village']
  };
  
  return items[level] || [];
};

module.exports = {
  calculateVillageLevel,
  getPointsForNextLevel,
  getVillageMilestone,
  getAllMilestones,
  getVillageItemsForLevel,
  POINTS_PER_LEVEL,
  MAX_VILLAGE_LEVEL
};
