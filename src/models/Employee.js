const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const Company = require("./Company");
const jwt = require("jsonwebtoken");
const employeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlenght: 7,
  },
  email: {
    type: String,
    trim: true,
    unique: true,
    lowercase: true,
    required: true,
    validate: (value) => {
      if (!validator.isEmail(value)) {
        throw new Error("invalid email");
      }
    },
  },
  password: {
    type: String,
    trim: true,
    required: true,
    validate: (value) => {
      if (
        !validator.isStrongPassword(value, {
          minSymbols: 1,
          minLength: 8,
          minUppercase: 1,
          minNumbers: 1,
        })
      ) {
        throw new Error("invalid password");
      }
    },
  },
  role: {
    type: String,
    default: "Employee",
  },
  employeeCompany: {
    type: String,
    trim: true,
    lowercase: true,
    required: true,
  },
  adminId: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "Admin",
  },
  tokens: [],
  permitted: {
    type: Boolean,
    default: false,
  },
});

employeeSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});


employeeSchema.methods.userAuth = async function () {
  const emp = this;
  const token = await jwt.sign({ _id: emp._id }, process.env.JWT_KEY);
  emp.tokens = [...emp.tokens, { token }];
  await emp.save();
  return token;
};

employeeSchema.statics.empLogin = async (emp) => {
  const employeeExists = await Employee.findOne({ email: emp.email });
  const passwordMatch = await bcrypt.compare(
    emp.password,
    employeeExists.password
  );
  if (employeeExists) {
    if (passwordMatch) {
      return employeeExists;
    } else {
      throw new Error("incorrect password");
    }
  } else {
    throw new Error("user doesnt exist");
  }
};

employeeSchema.pre(
  "deleteOne",
  { query: false, document: true },
  async function (next) {
    next();
  }
);

employeeSchema.methods.toJSON = function () {
  const emp = this.toObject();
  delete emp.tokens;
  delete emp.password;
  return emp;
};

const Employee = mongoose.model("Employee", employeeSchema);
module.exports = Employee;
