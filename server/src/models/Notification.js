const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["TASK_ASSIGNED", "TASK_OVERDUE", "TASK_COMPLETED"],
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Notification", notificationSchema);
