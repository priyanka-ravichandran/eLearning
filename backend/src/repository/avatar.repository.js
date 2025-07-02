const { Student } = require("../model/Student.model");

// Avatar shop items with prices (based on DiceBear Personas style)
const AVATAR_SHOP_ITEMS = {
  seeds: {
    // Girls
    "sarah": { name: "Sarah", price: 0, gender: "girl" },
    "maya": { name: "Maya", price: 100, gender: "girl" },
    "zoe": { name: "Zoe", price: 100, gender: "girl" },
    "luna": { name: "Luna", price: 100, gender: "girl" },
    // Boys
    "alex": { name: "Alex", price: 100, gender: "boy" },
    "leo": { name: "Leo", price: 100, gender: "boy" },
    "max": { name: "Max", price: 100, gender: "boy" },
    "noah": { name: "Noah", price: 100, gender: "boy" },
  },
  hair: {
    "bald": { name: "Bald", price: 30 },
    "balding": { name: "Balding", price: 30 },
    "beanie": { name: "Beanie", price: 50 },
    "bobBangs": { name: "Bob with Bangs", price: 60 },
    "bobCut": { name: "Bob Cut", price: 55 },
    "bunUndercut": { name: "Bun Undercut", price: 70 },
    "buzzcut": { name: "Buzz Cut", price: 35 },
    "cap": { name: "Cap", price: 45 },
    "curly": { name: "Curly Hair", price: 65 },
    "curlyBun": { name: "Curly Bun", price: 75 },
    "curlyHighTop": { name: "Curly High Top", price: 80 },
    "extraLong": { name: "Extra Long Hair", price: 90 },
    "fade": { name: "Fade Cut", price: 50 },
    "long": { name: "Long Hair", price: 60 },
    "mohawk": { name: "Mohawk", price: 85 },
    "pigtails": { name: "Pigtails", price: 70 },
    "shortCombover": { name: "Short Combover", price: 45 },
    "shortComboverChops": { name: "Short Combover with Chops", price: 55 },
    "sideShave": { name: "Side Shave", price: 65 },
    "straightBun": { name: "Straight Bun", price: 70 },
  },
  eyes: {
    "glasses": { name: "Glasses", price: 40 },
    "happy": { name: "Happy Eyes", price: 35 },
    "open": { name: "Open Eyes", price: 30 },
    "sleep": { name: "Sleepy Eyes", price: 35 },
    "sunglasses": { name: "Sunglasses", price: 60 },
    "wink": { name: "Winking Eye", price: 45 },
  },
  facialHair: {
    "beardMustache": { name: "Beard & Mustache", price: 50 },
    "goatee": { name: "Goatee", price: 45 },
    "pyramid": { name: "Pyramid Beard", price: 55 },
    "shadow": { name: "Shadow Beard", price: 40 },
    "soulPatch": { name: "Soul Patch", price: 35 },
    "walrus": { name: "Walrus Mustache", price: 60 },
  },
  mouth: {
    "bigSmile": { name: "Big Smile", price: 40 },
    "frown": { name: "Frown", price: 35 },
    "lips": { name: "Lips", price: 45 },
    "pacifier": { name: "Pacifier", price: 50 },
    "smile": { name: "Smile", price: 35 },
    "smirk": { name: "Smirk", price: 40 },
    "surprise": { name: "Surprised", price: 45 },
  },
  body: {
    "checkered": { name: "Checkered Body", price: 70 },
    "rounded": { name: "Rounded Body", price: 60 },
    "small": { name: "Small Body", price: 50 },
    "squared": { name: "Squared Body", price: 65 },
  },
};

// Get all shop items
const getShopItems = () => {
  return AVATAR_SHOP_ITEMS;
};

// Get student's current avatar configuration
const getStudentAvatar = async (studentId) => {
  const student = await Student.findById(studentId).select('avatar purchased_items current_points');
  return student;
};

// Update student's avatar configuration
const updateAvatarConfiguration = async (studentId, avatarConfig) => {
  const student = await Student.findById(studentId);
  if (!student) {
    throw new Error('Student not found');
  }

  // Update avatar configuration
  student.avatar = { ...student.avatar.toObject(), ...avatarConfig };
  await student.save();
  
  return student.avatar;
};

// Purchase an avatar item
const purchaseAvatarItem = async (studentId, category, itemKey) => {
  const student = await Student.findById(studentId);
  if (!student) {
    throw new Error('Student not found');
  }

  // Check if item exists in shop
  if (!AVATAR_SHOP_ITEMS[category] || !AVATAR_SHOP_ITEMS[category][itemKey]) {
    throw new Error('Item not found in shop');
  }

  const item = AVATAR_SHOP_ITEMS[category][itemKey];
  
  // Check if student has enough points
  if (student.current_points < item.price) {
    throw new Error('Insufficient points');
  }

  // Check if item is already purchased
  if (student.purchased_items[category].includes(itemKey)) {
    throw new Error('Item already purchased');
  }

  // Deduct points and add item to purchased items
  student.current_points -= item.price;
  student.purchased_items[category].push(itemKey);

  await student.save();
  
  return {
    message: 'Item purchased successfully',
    item: item,
    remainingPoints: student.current_points,
    purchasedItems: student.purchased_items,
  };
};

// Generate DiceBear avatar URL using Personas style
const generateAvatarUrl = (avatarConfig) => {
  const baseUrl = 'https://api.dicebear.com/9.x/personas/svg';
  const params = new URLSearchParams();
  
  // Add seed
  if (avatarConfig.seed) {
    params.append('seed', avatarConfig.seed);
  }
  
  // Add customizations based on Personas style options
  if (avatarConfig.hair) {
    params.append('hair', avatarConfig.hair);
  }
  if (avatarConfig.eyes) {
    params.append('eyes', avatarConfig.eyes);
  }
  if (avatarConfig.facialHair) {
    params.append('facialHair', avatarConfig.facialHair);
  }
  if (avatarConfig.mouth) {
    params.append('mouth', avatarConfig.mouth);
  }
  if (avatarConfig.body) {
    params.append('body', avatarConfig.body);
  }
  
  return `${baseUrl}?${params.toString()}`;
};

// Get predefined seeds for shop preview (sarah is free, others need to be purchased)
const getPredefinedSeeds = () => {
  return [
    // Default free seed
    { name: 'Sarah', value: 'sarah', isDefault: true, price: 0, gender: 'girl' },
    // Purchasable seeds - Girls
    { name: 'Maya', value: 'maya', isDefault: false, price: 100, gender: 'girl' },
    { name: 'Zoe', value: 'zoe', isDefault: false, price: 100, gender: 'girl' },
    { name: 'Luna', value: 'luna', isDefault: false, price: 100, gender: 'girl' },
    // Purchasable seeds - Boys
    { name: 'Alex', value: 'alex', isDefault: false, price: 100, gender: 'boy' },
    { name: 'Leo', value: 'leo', isDefault: false, price: 100, gender: 'boy' },
    { name: 'Max', value: 'max', isDefault: false, price: 100, gender: 'boy' },
    { name: 'Noah', value: 'noah', isDefault: false, price: 100, gender: 'boy' },
  ];
};

module.exports = {
  getShopItems,
  getStudentAvatar,
  updateAvatarConfiguration,
  purchaseAvatarItem,
  generateAvatarUrl,
  getPredefinedSeeds,
  AVATAR_SHOP_ITEMS,
};
