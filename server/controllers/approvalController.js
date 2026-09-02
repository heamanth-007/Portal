const Leave = require("../models/Leave");
const Attendance = require("../models/Attendance");
const Approval = require("../models/Approval");
const { sendSuccess, sendError } = require("../utils/response");

const formatDateString = (d) => {
  const dt = new Date(d);
  const year = dt.getFullYear();
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

exports.getPendingApprovals = async (req, res) => {
  try {
    const approvals = await Approval.find({ status: "PENDING", requestType: "LEAVE" })
      .populate("employeeId", "name designation")
      .lean();

    const records = approvals.map((a) => ({
      _id: a._id,
      requestType: a.requestType,
      employeeId: a.employeeId,
      fromDate: a.fromDate,
      toDate: a.toDate,
      reason: a.reason,
      status: a.status,
      appliedDate: a.appliedDate || a.createdAt,
      sourceId: a.sourceId || null,
    }));

    return sendSuccess(res, "Pending approvals fetched successfully", { records });
  } catch (err) {
    console.error("Error fetching pending approvals:", err);
    return sendError(res, "Server error fetching pending approvals", 500);
  }
};

exports.getApprovedRequests = async (req, res) => {
  try {
    const approvals = await Approval.find({
      status: { $in: ["APPROVED", "REJECTED"] },
      requestType: "LEAVE",
    })
      .populate("employeeId", "name designation")
      .populate("approvedBy", "name")
      .populate("rejectedBy", "name")
      .lean();

    const records = approvals.map((a) => {
      const isApproved = a.status === "APPROVED";
      return {
        _id: a._id,
        requestType: a.requestType,
        employeeId: a.employeeId,
        fromDate: a.fromDate,
        toDate: a.toDate,
        reason: a.reason,
        status: a.status,
        appliedDate: a.appliedDate || a.createdAt,
        approvedDate: isApproved ? a.approvedDate || a.updatedAt : a.rejectedAt || a.updatedAt,
        approvedBy: isApproved ? a.approvedBy || null : a.rejectedBy || null,
        sourceId: a.sourceId || null,
      };
    });
    records.sort((a, b) => new Date(b.approvedDate) - new Date(a.approvedDate));

    return sendSuccess(res, "Approved/rejected requests fetched successfully", { records });
  } catch (err) {
    console.error("Error fetching approved/rejected requests:", err);
    return sendError(res, "Server error fetching approved/rejected requests", 500);
  }
};

exports.approveRequest = async (req, res) => {
  try {
    const { id } = req.params;

    let approval = await Approval.findById(id);
    let request = null;
    if (approval) {
      if (approval.sourceId) {
        request = await Leave.findById(approval.sourceId);
      }
    } else {
      request = await Leave.findById(id);
      if (request) approval = await Approval.findOne({ sourceId: request._id });
    }

    if (!request) return sendError(res, "Request not found", 404);
    if (request.status !== "PENDING")
      return sendError(res, "Only pending requests can be approved", 400);

    const approverId = req.user && req.user.id ? req.user.id : null;

    request.status = "APPROVED";
    request.approvedBy = approverId;
    request.approvedAt = new Date();
    await request.save();

    if (!approval) approval = await Approval.findOne({ sourceId: request._id });
    if (!approval) {
      approval = new Approval({
        employeeId: request.employeeId,
        requestType: "LEAVE",
        fromDate: request.fromDate,
        toDate: request.toDate,
        reason: request.reason,
        status: "APPROVED",
        appliedDate: request.createdAt || new Date(),
        approvedDate: new Date(),
        approvedBy: approverId,
        sourceId: request._id,
      });
      await approval.save();
    } else {
      approval.status = "APPROVED";
      approval.approvedBy = approverId;
      approval.approvedDate = new Date();
      await approval.save();
    }

    // Create attendance records for the leave days
    if (request.fromDate && request.toDate) {
      let cur = new Date(request.fromDate);
      const end = new Date(request.toDate);
      while (cur <= end) {
        const dateStr = formatDateString(cur);
        const existing = await Attendance.findOne({
          employeeId: request.employeeId,
          date: dateStr,
        });
        if (!existing) {
          const att = new Attendance({
            employeeId: request.employeeId,
            date: dateStr,
            status: "LEAVE",
          });
          await att.save();
        }
        cur.setDate(cur.getDate() + 1);
      }
    }

    return sendSuccess(res, "Request approved successfully", { record: request });
  } catch (err) {
    console.error("Error approving request:", err);
    return sendError(res, "Server error approving request", 500);
  }
};

exports.rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;

    let approval = await Approval.findById(id);
    let request = null;
    if (approval) {
      if (approval.sourceId) {
        request = await Leave.findById(approval.sourceId);
      }
    } else {
      request = await Leave.findById(id);
      if (request) approval = await Approval.findOne({ sourceId: request._id });
    }

    if (!request) return sendError(res, "Request not found", 404);
    if (request.status !== "PENDING")
      return sendError(res, "Only pending requests can be rejected", 400);

    const rejectorId = req.user && req.user.id ? req.user.id : null;

    request.status = "REJECTED";
    request.rejectedBy = rejectorId;
    request.rejectedAt = new Date();
    await request.save();

    if (!approval) approval = await Approval.findOne({ sourceId: request._id });
    if (!approval) {
      approval = new Approval({
        employeeId: request.employeeId,
        requestType: "LEAVE",
        fromDate: request.fromDate,
        toDate: request.toDate,
        reason: request.reason,
        status: "REJECTED",
        appliedDate: request.createdAt || new Date(),
        rejectedAt: new Date(),
        rejectedBy: rejectorId,
        sourceId: request._id,
      });
      await approval.save();
    } else {
      approval.status = "REJECTED";
      approval.rejectedBy = rejectorId;
      approval.rejectedAt = new Date();
      await approval.save();
    }

    // Cleanup any auto-created attendance records
    if (request.fromDate && request.toDate) {
      let cur = new Date(request.fromDate);
      const end = new Date(request.toDate);
      while (cur <= end) {
        const dateStr = formatDateString(cur);
        await Attendance.deleteOne({
          employeeId: request.employeeId,
          date: dateStr,
          status: "LEAVE",
          checkInTime: { $exists: false },
        });
        cur.setDate(cur.getDate() + 1);
      }
    }

    return sendSuccess(res, "Request rejected successfully", { record: request });
  } catch (err) {
    console.error("Error rejecting request:", err);
    return sendError(res, "Server error rejecting request", 500);
  }
};
