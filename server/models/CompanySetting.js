const mongoose = require("mongoose");

const companySettingSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, default: "Mahes Bankers" },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    allowedRadius: { type: Number, required: true, default: 100 }, // in meters
    enforceGeofencing: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("CompanySetting", companySettingSchema);
