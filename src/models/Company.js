const mongoose = require("mongoose");

const CompanySchema = new mongoose.Schema({
  companyName: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
  },
  adminId: {
    type: mongoose.SchemaTypes.ObjectId,
    required: true,
    ref: "Admin",
  },
});

const Company = mongoose.model("Company", CompanySchema);

module.exports = Company;
