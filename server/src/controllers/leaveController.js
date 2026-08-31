const Leave = require("../models/Leave");
const Approval = require("../models/Approval");
const { sendSuccess, sendError } = require("../utils/response");

exports.apply = async (req, res) => {
  try {
    const { fromDate, toDate, reason, leaveType } = req.body;
    const employeeId = req.user.id;

    const leave = new Leave({
      employeeId,
      fromDate,
      toDate,
      reason,
      leaveType: leaveType || "CASUAL",
    });
    await leave.save();
    // Create an approval record linking to this leave
    const approval = new Approval({
      employeeId,
      requestType: "LEAVE",
      fromDate,
      toDate,
      reason,
      status: "PENDING",
      sourceId: leave._id,
    });
    await approval.save();
    return sendSuccess(res, "Leave applied", { id: leave._id });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

exports.myLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ employeeId: req.user.id });
    return sendSuccess(res, "My leaves", { leaves });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

exports.pendingForAdmin = async (req, res) => {
  try {
    const leaves = await Leave.find({ status: "PENDING" }).populate("employeeId", "name email");
    return sendSuccess(res, "Pending leaves", { leaves });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

exports.approve = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return sendError(res, "Leave not found", 404);
    leave.status = "APPROVED";
    await leave.save();
    return sendSuccess(res, "Leave approved", { id: leave._id });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

exports.reject = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return sendError(res, "Leave not found", 404);
    leave.status = "REJECTED";
    await leave.save();
    return sendSuccess(res, "Leave rejected", { id: leave._id });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};
