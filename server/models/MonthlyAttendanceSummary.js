const mongoose = require("mongoose");

const monthlySummarySchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    month: { type: String, required: true },
    year: { type: String, required: true },
    totalWorkedDays: { type: Number, default: 0 },
    totalPresent: { type: Number, default: 0 },
    totalAbsent: { type: Number, default: 0 },
    totalLeave: { type: Number, default: 0 },
    totalHoliday: { type: Number, default: 0 },
    totalHours: { type: Number, default: 0 },
  },
  { timestamps: true },
);

monthlySummarySchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model("MonthlyAttendanceSummary", monthlySummarySchema);
