const Leave = require("../models/Leave");
const Wfh = require("../models/Wfh");
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
    // Fetch pending approvals from approvals collection
    const approvals = await Approval.find({ status: "PENDING" })
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
    // Fetch approved & rejected approvals from approvals collection
    const approvals = await Approval.find({ status: { $in: ["APPROVED", "REJECTED"] } })
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

    // Accept either an Approval id or a direct Leave/WFH id.
    let approval = await Approval.findById(id);
    let request = null;
    let sourceType = null;
    if (approval) {
      sourceType = approval.requestType;
      if (approval.sourceId) {
        if (sourceType === "LEAVE") request = await Leave.findById(approval.sourceId);
        else request = await Wfh.findById(approval.sourceId);
      }
    } else {
      // treat id as source id
      request = await Leave.findById(id);
      sourceType = "LEAVE";
      if (!request) {
        request = await Wfh.findById(id);
        sourceType = "WFH";
      }
      // try to find approval by source
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

    // Update or create Approval document linked to this source
    if (!approval) approval = await Approval.findOne({ sourceId: request._id });
    if (!approval) {
      // create approval record
      approval = new Approval({
        employeeId: request.employeeId,
        requestType: sourceType,
        fromDate: sourceType === "LEAVE" ? request.fromDate : request.date,
        toDate: sourceType === "LEAVE" ? request.toDate : request.date,
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

    // If it's a Leave request, create attendance records for the leave days
    if (request.fromDate && request.toDate) {
      // Leave model: fromDate/toDate
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
    } else if (request.date) {
      // WFH model: single date
      const dateStr = formatDateString(request.date);
      let attendance = await Attendance.findOne({ employeeId: request.employeeId, date: dateStr });
      if (!attendance) {
        attendance = new Attendance({
          employeeId: request.employeeId,
          date: dateStr,
          status: "WFH",
        });
        await attendance.save();
      } else if (!attendance.checkInTime) {
        attendance.status = "WFH";
        await attendance.save();
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

    // Accept Approval id or source id
    let approval = await Approval.findById(id);
    let request = null;
    if (approval) {
      if (approval.sourceId) {
        request = await Leave.findById(approval.sourceId);
        if (!request) request = await Wfh.findById(approval.sourceId);
      }
    } else {
      request = await Leave.findById(id);
      if (!request) request = await Wfh.findById(id);
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

    // Update or create Approval record linked to this source
    if (!approval) approval = await Approval.findOne({ sourceId: request._id });
    if (!approval) {
      approval = new Approval({
        employeeId: request.employeeId,
        requestType: request.fromDate && request.toDate ? "LEAVE" : "WFH",
        fromDate: request.fromDate || request.date,
        toDate: request.toDate || request.date,
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

    // Cleanup any auto-created attendance records (only if no check-in exists)
    if (request.fromDate && request.toDate) {
      // Leave: remove LEAVE attendance if exists and no check-in
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
    } else if (request.date) {
      const dateStr = formatDateString(request.date);
      await Attendance.deleteOne({
        employeeId: request.employeeId,
        date: dateStr,
        status: "WFH",
        checkInTime: { $exists: false },
      });
    }

    return sendSuccess(res, "Request rejected successfully", { record: request });
  } catch (err) {
    console.error("Error rejecting request:", err);
    return sendError(res, "Server error rejecting request", 500);
  }
};
