
const { verify } = require("jsonwebtoken");

const isAuth = (req, res, next) => {
  const token =
    req.body.token || req.query.token || req.headers["authorization"];
  if (!token) {
    return res.status(401).send("Invalid Token");
  }
  const jwt = token.split(" ")[1];
  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }
  try {
    const decoded = verify(jwt, process.env.JWT_TOKEN_SECRET);
    req.user = decoded;
  } catch (err) {
    console.log(err);
    return res.status(401).send("Invalid Token");
  }
  return next();
};

module.exports = isAuth;
