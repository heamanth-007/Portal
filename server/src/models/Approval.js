const mongoose = require("mongoose");

const approvalSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    requestType: { type: String, enum: ["LEAVE"], required: true },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    reason: { type: String },
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
    appliedDate: { type: Date, default: Date.now },
    approvedDate: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    rejectedAt: { type: Date },
    sourceId: { type: mongoose.Schema.Types.ObjectId },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Approval", approvalSchema);
