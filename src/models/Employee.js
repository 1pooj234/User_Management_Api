const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

function throwValidationError(field, message) {
  const error = new mongoose.Error.ValidationError();
  error.addError(field, new mongoose.Error.ValidatorError({ message }));
  throw error;
}

const employeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    minlength: [7, "Name must be at least 7 characters long"],
  },
  email: {
    type: String,
    trim: true,
    unique: true,
    lowercase: true,
    required: [true, "Email is required"],
    validate: {
      validator: (value) => validator.isEmail(value),
      message: "Invalid email address",
    },
  },
  password: {
    type: String,
    trim: true,
    required: [true, "Password is required"],
    validate: {
      validator: (value) =>
        validator.isStrongPassword(value, {
          minSymbols: 1,
          minLength: 8,
          minUppercase: 1,
          minNumbers: 1,
        }),
      message:
        "Password must have at least 1 uppercase letter, 1 number, and 1 special symbol",
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
    required: [true, "Employee company is required"],
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
  },
  tokens: [
    {
      token: { type: String },
    },
  ],
  permitted: {
    type: Boolean,
    default: false,
  },
});

employeeSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

employeeSchema.methods.userAuth = async function () {
  const token = jwt.sign({ _id: this._id }, process.env.JWT_KEY);
  this.tokens.push({ token });
  await this.save();
  return token;
};

employeeSchema.statics.empLogin = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }
  const employee = await Employee.findOne({ email });
  if (!employee) {
    const err = new Error("Invalid email");
    err.field = "email";
    throw err;
  }
  const isMatch = await bcrypt.compare(password, employee.password);
  if (!isMatch) {
    const err = new Error("Invalid password");
    err.field = "password";
    throw err;
  }

  return employee;
};

employeeSchema.methods.toJSON = function () {
  const emp = this.toObject();
  delete emp.tokens;
  delete emp.password;
  return emp;
};

const Employee = mongoose.model("Employee", employeeSchema);
module.exports = Employee;
