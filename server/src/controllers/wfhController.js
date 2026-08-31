const Wfh = require("../models/Wfh");
const Attendance = require("../models/Attendance");
const Approval = require("../models/Approval");
const { sendSuccess, sendError } = require("../utils/response");

const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateString = (dateObj) => {
  const d = new Date(dateObj);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

exports.apply = async (req, res) => {
  try {
    const { date, reason } = req.body;
    const employeeId = req.user.id;

    const wfh = new Wfh({ employeeId, date, reason });
    await wfh.save();

    // Create approval record for this WFH
    const approval = new Approval({
      employeeId,
      requestType: "WFH",
      fromDate: date,
      toDate: date,
      reason,
      status: "PENDING",
      sourceId: wfh._id,
    });
    await approval.save();

    return sendSuccess(res, "WFH request created", { id: wfh._id });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

exports.myWfh = async (req, res) => {
  try {
    const wfh = await Wfh.find({ employeeId: req.user.id });
    return sendSuccess(res, "My WFH requests", { wfh });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

exports.pendingForAdmin = async (req, res) => {
  try {
    const wfh = await Wfh.find({ status: "PENDING" }).populate("employeeId", "name email");
    return sendSuccess(res, "Pending WFH requests", { wfh });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

exports.approve = async (req, res) => {
  try {
    const wfh = await Wfh.findById(req.params.id);
    if (!wfh) return sendError(res, "WFH request not found", 404);

    wfh.status = "APPROVED";
    await wfh.save();

    // Create or update attendance record with PRESENT status
    const dateStr = formatDateString(wfh.date);
    let attendance = await Attendance.findOne({
      employeeId: wfh.employeeId,
      date: dateStr,
    });

    if (!attendance) {
      attendance = new Attendance({
        employeeId: wfh.employeeId,
        date: dateStr,
        status: "PRESENT",
      });
      await attendance.save();
    } else if (attendance.status !== "PRESENT") {
      // Only update if it's not already marked as something else
      // Preserve existing check-in/check-out times if employee already checked in
      if (!attendance.checkInTime) {
        attendance.status = "PRESENT";
        await attendance.save();
      }
    }

    return sendSuccess(res, "WFH approved", { id: wfh._id });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

exports.reject = async (req, res) => {
  try {
    const wfh = await Wfh.findById(req.params.id);
    if (!wfh) return sendError(res, "WFH request not found", 404);

    wfh.status = "REJECTED";
    await wfh.save();

    // If attendance was created as PRESENT (from WFH), remove it
    const dateStr = formatDateString(wfh.date);
    await Attendance.deleteOne({
      employeeId: wfh.employeeId,
      date: dateStr,
      status: "PRESENT",
      checkInTime: { $exists: false }, // Only delete if no actual check-in occurred
    });

    return sendSuccess(res, "WFH rejected", { id: wfh._id });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};
