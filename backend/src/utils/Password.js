const { hash, compare } = require("bcrypt");
const securePassword = async (password) => {
    const hashedPassword = await hash(password, 9);
    return hashedPassword;
};

const comparePassword = async (password, hashPassword) => {
    return compare(password, hashPassword);
};

module.exports = { securePassword, comparePassword };
