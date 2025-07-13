const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Company = require("./Company");
const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true,
    validate: (value) => {
      if (!validator.isEmail(value)) {
        throw new Error("invalid email");
      }
    },
  },
  password: {
    type: String,
    required: true,
    trim: true,
    validate: (value) => {
      if (
        !validator.isStrongPassword(value, {
          minLength: 8,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1,
        })
      ) {
        throw new Error(
          "password must contain min 1 uppercase 1 number 1 symbols"
        );
      }
    },
  },
  role: {
    type: String,
    required: true,
    trim: true,
    minLength: 5,
  },
  companyName: {
    type: String,
    required: true,
    trim: true,
    minLength: 5,
    lowercase: true,
  },
  noOfEmployees: {
    type: Number,
    require: true,
    validate: (value) => {
      if (!(value >= 10 && value <= 100000)) {
        throw Error("employee count must be above 10");
      }
    },
  },
  waitlistedEmployees: {
    type: Array,
    default: [],
  },
  tokens: [],
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
  if (!this.isModified("password")) return next();
  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

adminSchema.methods.userAuth = async function () {
  const user = this;
  const token = await jwt.sign({ _id: user._id }, process.env.JWT_KEY);
  user.tokens = [...user.tokens, { token }];
  await user.save();
  return token;
};

adminSchema.statics.userLogin = async function (admin) {
  const adminModel = this;
  const adminExists = await adminModel.findOne({ email: admin.email });
  if (adminExists) {
    const correctPassword = await bcrypt.compare(
      admin.password,
      adminExists.password
    );
    if (correctPassword) {
      return adminExists;
    } else {
      throw new Error("Incorrect Password");
    }
  } else {
    throw new Error("User Email doesnt exist please SignIn");
  }
};

adminSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    console.log(this);
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
