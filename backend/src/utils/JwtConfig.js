const { sign } = require("jsonwebtoken");

const config = {
    secrets: {
        jwt: process.env.JWT_TOKEN_SECRET,
        jwtExp: "30d",
    },
};

const createToken = (student) => {
    return sign(
        {
            _id: student._id,
            email: student.email,
            name: student.name,
            grade: student.grade,
            village_level: student.village_level,
            individual_rank: null,
            group_id: null,
            total_points_earned: 0,
            current_points: 0,
            achievements: []
        },
        config.secrets.jwt,
        {
            expiresIn: config.secrets.jwtExp,
        }
    );
};

module.exports = { createToken, config };
