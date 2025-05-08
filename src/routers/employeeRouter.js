const express = require("express");
const Employee = require("../models/Employee");
const Company = require("../models/Company");
const permitUser = require("../middleware/permitUser");
const router = express.Router();

router.post("/signup/employee", async (req, res) => {
  try {
    const companyExist = await Company.findOne({
      companyName: req.body.employeeCompany,
    });
    // employee.adminId = companyExist.adminId;
    if (!companyExist) {
      throw new Error("Company does not exist");
    }
    const emp = await new Employee({
      ...req.body,
      adminId: companyExist.adminId,
    });

    const token = await emp.userAuth();
    return res.status(200).send({ emp, token });
  } catch (e) {
    return res.status(400).send();
  }
});

router.post("/login/employee", async (req, res) => {
  try {
    // const emp = await new Employee();
    const employee = await Employee.empLogin(req.body);
    const token = await employee.userAuth();
    return res.status(200).send({ employee, token });
  } catch (e) {
    return res.status(404).send(e);
  }
});

router.get("/profile/employee", permitUser, async (req, res) => {
  try {
    return res.status(200).send(req.user);
  } catch (e) {
    return res.status(404).send(e);
  }
});

router.post("/logout/employee", permitUser, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(404).send();
    }
    req.user.tokens = req.user.tokens.filter(
      (token) => token.token !== req.token
    );
    await req.user.save();
    return res.status(200).send();
  } catch (e) {
    return res.status(400).send(e);
  }
});

router.patch("/update/employee", permitUser, async (req, res) => {
  const updateKeys = Object.keys(req.body);
  const reqKeys = ["name", "email", "password"];
  const isValid = updateKeys.every((key) => reqKeys.includes(key));
  try {
    if (!isValid) {
      throw new Error();
    }
    updateKeys.forEach((key) => {
      req.user[key] = req.body[key];
    });
    await req.user.save();
    return res.status(200).send(req.user);
  } catch (e) {
    return res.status(400).send();
  }
});

router.delete("/remove/employee", permitUser, async (req, res) => {
  try {
    await req.user.deleteOne();
    return res.status(200).send();
  } catch (e) {
    return res.status(404).send();
  }
});

router.get("/allusers/employee", permitUser, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(404).send();
    }
    const allUsers = await Employee.find({ adminId: req.user.adminId });
    res.send(allUsers);
  } catch (e) {
    return res.status(404).send(e);
  }
});

module.exports = router;
