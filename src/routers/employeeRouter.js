const express = require("express");
const Employee = require("../models/Employee");
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

router.post("/signup/employee", async (req, res) => {
  try {
    const companyExist = await Company.findOne({
      companyName: req.body.employeeCompany,
    });

    if (!companyExist) {
      return res.status(400).send({
        success: false,
        errors: { employeeCompany: "Company does not exist" },
      });
    }

    const emp = new Employee({
      ...req.body,
      adminId: companyExist.adminId,
    });

    const token = await emp.userAuth();
    return res.status(201).send({ success: true, employee: emp, token });
  } catch (e) {
    return res.status(400).send(formatError(e));
  }
});

router.post("/login/employee", async (req, res) => {
  try {
    const employee = await Employee.empLogin(req.body);
    const token = await employee.userAuth();
    res.status(200).send({ success: true, employee, token });
  } catch (err) {
    res.status(400).send({
      success: false,
      errors: {
        [err.field || "general"]: err.message,
      },
    });
  }
});

router.get("/profile/employee", permitUser, async (req, res) => {
  try {
    return res.status(200).send({ success: true, employee: req.user });
  } catch (e) {
    return res.status(400).send(formatError(e));
  }
});

router.post("/logout/employee", permitUser, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(
      (token) => token.token !== req.token
    );
    await req.user.save();
    return res
      .status(200)
      .send({ success: true, message: "Logged out successfully" });
  } catch (e) {
    return res.status(400).send(formatError(e));
  }
});

router.patch("/update/employee", permitUser, async (req, res) => {
  const updateKeys = Object.keys(req.body);
  const allowedKeys = ["name", "email", "password"];
  const isValid = updateKeys.every((key) => allowedKeys.includes(key));

  if (!isValid) {
    return res.status(400).send({
      success: false,
      errors: { general: "Invalid updates" },
    });
  }

  try {
    updateKeys.forEach((key) => {
      req.user[key] = req.body[key];
    });
    await req.user.save();
    return res.status(200).send({ success: true, employee: req.user });
  } catch (e) {
    return res.status(400).send(formatError(e));
  }
});

router.delete("/remove/employee", permitUser, async (req, res) => {
  try {
    await req.user.deleteOne();
    return res
      .status(200)
      .send({ success: true, message: "Employee deleted successfully" });
  } catch (e) {
    return res.status(400).send(formatError(e));
  }
});

router.get("/allusers/employee", permitUser, async (req, res) => {
  try {
    const allUsers = await Employee.find({ adminId: req.user.adminId });
    return res.status(200).send({ success: true, employees: allUsers });
  } catch (e) {
    return res.status(400).send(formatError(e));
  }
});

module.exports = router;
