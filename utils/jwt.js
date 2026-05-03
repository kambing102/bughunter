const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "secret123";

module.exports = {
  sign: (payload) => {
    return jwt.sign(payload, SECRET, {
      expiresIn: "7d"
    });
  },

  verify: (token) => {
    return jwt.verify(token, SECRET);
  }
};
