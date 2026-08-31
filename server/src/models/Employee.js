const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    designation: { type: String },
    department: { type: String, required: true },
    role: { type: String, enum: ["ADMIN", "EMPLOYEE"], default: "EMPLOYEE" },
    dob: { type: Date },
    joiningDate: { type: Date, default: Date.now },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
    manager: { type: String },
    skills: { type: [String], default: [] },
    emergencyContactName: { type: String },
    emergencyContactPhone: { type: String },
    avatarUrl: { type: String },
    address: { type: String },
    gender: { type: String, enum: ["male", "female", "other"] },
    bloodGroup: { type: String },
    dateOfBirth: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Employee", employeeSchema);
