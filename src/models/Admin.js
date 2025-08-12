const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Company = require("./Company");

function throwValidationError(field, message) {
  const error = new mongoose.Error.ValidationError();
  error.addError(field, new mongoose.Error.ValidatorError({ message }));
  throw error;
}

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    minlength: [5, "Name must be at least 5 characters long"],
  },
  email: {
    type: String,
    unique: true,
    required: [true, "Email is required"],
    lowercase: true,
    trim: true,
    validate: {
      validator: (value) => validator.isEmail(value),
      message: "Invalid email address",
    },
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    trim: true,
    validate: {
      validator: (value) =>
        validator.isStrongPassword(value, {
          minLength: 8,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1,
        }),
      message:
        "Password must have at least 1 uppercase, 1 number, and 1 symbol",
    },
  },
  role: {
    type: String,
    required: [true, "Role is required"],
    trim: true,
    minlength: [5, "Role must be at least 5 characters"],
  },
  companyName: {
    type: String,
    required: [true, "Company name is required"],
    trim: true,
    minlength: [5, "Company name must be at least 5 characters"],
    lowercase: true,
  },
  noOfEmployees: {
    type: Number,
    required: [true, "Number of employees is required"],
    validate: {
      validator: (value) => value >= 10 && value <= 100000,
      message: "Employee count must be between 10 and 100,000",
    },
  },
  waitlistedEmployees: {
    type: Array,
    default: [],
  },
  tokens: [
    {
      token: {
        type: String,
      },
    },
  ],
  plan: {
    type: String,
    required: true,
    default: "basic",
  },
});

adminSchema.virtual("emps", {
  ref: "Employee",
  localField: "_id",
  foreignField: "adminId",
});

adminSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

adminSchema.methods.userAuth = async function () {
  const token = jwt.sign({ _id: this._id }, process.env.JWT_KEY);
  this.tokens.push({ token });
  await this.save();
  return token;
};

adminSchema.statics.userLogin = async function ({ email, password }) {
  const admin = await this.findOne({ email });
  if (!admin) {
    throwValidationError("email", "Email does not exist. Please sign up.");
  }

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) {
    throwValidationError("password", "Incorrect password");
  }

  return admin;
};

adminSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    await Company.deleteOne({ companyName: this.companyName });
    next();
  }
);

adminSchema.methods.toJSON = function () {
  const admin = this.toObject();
  delete admin.tokens;
  delete admin.password;
  delete admin.plan;
  return admin;
};

const Admin = mongoose.model("Admin", adminSchema);
module.exports = Admin;
