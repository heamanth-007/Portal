const mongoose = require("mongoose");

const wfhSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    date: { type: Date, required: true },
    reason: { type: String },
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    approvedAt: { type: Date },
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    rejectedAt: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Wfh", wfhSchema);
