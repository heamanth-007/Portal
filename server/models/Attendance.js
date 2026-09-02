const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    date: { type: String, required: true }, // "YYYY-MM-DD"
    status: { type: String, enum: ["PRESENT", "ABSENT", "LEAVE", "HOLIDAY"], required: true },
    checkInTime: { type: Date },
    checkOutTime: { type: Date },
    totalHours: { type: Number },

    // Check-In Location & Security details
    checkInLatitude: { type: Number },
    checkInLongitude: { type: Number },
    checkInDistance: { type: Number }, // in meters from office
    checkInAccuracy: { type: Number }, // in meters
    checkInOutsideRadius: { type: Boolean },
    checkInIpAddress: { type: String },
    checkInDeviceInfo: { type: String },
    checkInBrowserDetails: { type: String },

    // Check-Out Location & Security details
    checkOutLatitude: { type: Number },
    checkOutLongitude: { type: Number },
    checkOutDistance: { type: Number },
    checkOutAccuracy: { type: Number },
    checkOutOutsideRadius: { type: Boolean },
    checkOutIpAddress: { type: String },
    checkOutDeviceInfo: { type: String },
    checkOutBrowserDetails: { type: String },
  },
  { timestamps: true },
);

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
