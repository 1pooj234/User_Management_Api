const express = require("express");

const Admin = require("../models/Admin");
const Company = require("../models/Company");
const permitUser = require("../middleware/permitUser");
const router = express.Router();

router.post("/register/admin", async (req, res) => {
  try {
    const admin = await new Admin(req.body);
    const token = await admin.userAuth();
    const companyName = await new Company({
      companyName: req.body.companyName,
      adminId: admin._id,
    });
    await companyName.save();
    return res.send({ admin, token });
    // await user.save();
    //return res.status(201).send(user);
  } catch (e) {
    return res.status(400).send({ error: e });
  }
});
router.post("/login/admin", async (req, res) => {
  try {
    const admin = await Admin.userLogin(req.body);
    const token = await admin.userAuth();
    return res.status(200).send({ admin, token });
  } catch (e) {
    return res.status(404).send({ error: e.message });
  }
});

router.get("/profile/admin", permitUser, async (req, res) => {
  try {
    // const user = await User.findById(req.params.id);
    // await user.save();
    return res.status(200).send(req.user);
  } catch (e) {
    return res.status(400).send();
  }
});

router.post("/logout/admin", permitUser, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(
      (token) => req.token !== token.token
    );
    await req.user.save();
    return res.status(200).send();
  } catch (e) {
    return res.status(401).send();
  }
});

router.patch("/update/admin", permitUser, async (req, res) => {
  const fields = ["name", "email", "password", "noOfEmployees", "companyName"];
  const updateKeys = Object.keys(req.body);
  const isValid = updateKeys.every((key) => fields.includes(key));
  if (!isValid) {
    return res.status(401).send({ error: "invalid updates" });
  }
  try {
    updateKeys.forEach((key) => (req.user[key] = req.body[key]));
    await req.user.save();
    return res.status(201).send(req.user);
  } catch (e) {
    return res.status(404).send();
  }
});

router.get("/allusers/admin", permitUser, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(404).send();
    }
    // console.log(req.user);
    await req.user.populate("emps");
    res.send([req.user, ...req.user.emps]);
  } catch (e) {
    return res.status(404).send(e);
  }
});

router.delete("/remove/admin", permitUser, async (req, res) => {
  try {
    await req.user.deleteOne();
    return res.status(200).send();
  } catch (e) {
    return res.status(404).send();
  }
});

module.exports = {
  adminRouter: router,
};
