const express = require("express");
const Admin = require("../models/Admin");
const Company = require("../models/Company");
const permitUser = require("../middleware/permitUser");
const router = express.Router();

function formatError(err) {
  if (err.name === "ValidationError") {
    const errors = {};
    for (let field in err.errors) {
      errors[field] = err.errors[field].message;
    }
    return { success: false, errors };
  }

  if (err.code === 11000) {
    const errors = {};
    for (let key in err.keyValue) {
      errors[key] = `${key} already exists`;
    }
    return { success: false, errors };
  }

  return {
    success: false,
    errors: { general: err.message || "Something went wrong" },
  };
}

router.post("/register/admin", async (req, res) => {
  try {
    const admin = new Admin(req.body);
    const token = await admin.userAuth();

    const companyName = new Company({
      companyName: req.body.companyName,
      adminId: admin._id,
    });
    await companyName.save();

    return res.status(201).send({ success: true, admin, token });
  } catch (e) {
    return res.status(400).send(formatError(e));
  }
});

router.post("/login/admin", async (req, res) => {
  try {
    const admin = await Admin.userLogin(req.body);
    const token = await admin.userAuth();
    return res.status(200).send({ success: true, admin, token });
  } catch (e) {
    return res.status(400).send(formatError(e));
  }
});

router.get("/profile/admin", permitUser, async (req, res) => {
  try {
    return res.status(200).send({ success: true, admin: req.user });
  } catch (e) {
    return res.status(400).send(formatError(e));
  }
});

router.post("/logout/admin", permitUser, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(
      (token) => req.token !== token.token
    );
    await req.user.save();
    return res
      .status(200)
      .send({ success: true, message: "Logged out successfully" });
  } catch (e) {
    return res.status(400).send(formatError(e));
  }
});

router.patch("/update/admin", permitUser, async (req, res) => {
  const fields = ["name", "email", "password", "companyName"];
  const updateKeys = Object.keys(req.body);
  const isValid = updateKeys.every((key) => fields.includes(key));

  if (!isValid) {
    return res.status(400).send({
      success: false,
      errors: { general: "Invalid updates" },
    });
  }

  try {
    updateKeys.forEach((key) => (req.user[key] = req.body[key]));
    await req.user.save();
    return res.status(200).send({ success: true, admin: req.user });
  } catch (e) {
    return res.status(400).send(formatError(e));
  }
});

router.get("/allusers/admin", permitUser, async (req, res) => {
  try {
    await req.user.populate("emps");
    return res
      .status(200)
      .send({ success: true, users: [req.user, ...req.user.emps] });
  } catch (e) {
    return res.status(400).send(formatError(e));
  }
});

router.delete("/remove/admin", permitUser, async (req, res) => {
  try {
    await req.user.deleteOne();
    return res
      .status(200)
      .send({ success: true, message: "Admin deleted successfully" });
  } catch (e) {
    return res.status(400).send(formatError(e));
  }
});

module.exports = {
  adminRouter: router,
};
