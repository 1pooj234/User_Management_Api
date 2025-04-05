const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const Employee = require("../models/Employee");
const permitUser = async (req, res, next) => {
  try {
    const authToken = req.header("Authorization");
    const jwtToken = authToken.replace("Bearer ", "");
    const userId = await jwt.verify(jwtToken, process.env.JWT_KEY);

    if (!userId) {
      throw new Error();
    }
    let user;
    if (req.originalUrl.includes("admin")) {
      user = await Admin.findOne({
        _id: userId._id,
        "tokens.token": jwtToken,
      });
    } else {
      user = await Employee.findOne({
        _id: userId._id,
        "tokens.token": jwtToken,
      });
    }
    if (!user) {
      throw new Error();
    }
    req.user = user;
    req.token = jwtToken;
  } catch (e) {
    res.status(401).send({ error: "please authenticate" });
  }
  next();
};

module.exports = permitUser;
