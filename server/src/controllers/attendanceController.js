const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");
const MonthlyAttendanceSummary = require("../models/MonthlyAttendanceSummary");
const CompanySetting = require("../models/CompanySetting");
const { sendSuccess, sendError } = require("../utils/response");
const geolib = require("geolib");

const getTodayDateString = () => {
  const d = new Date();
  // Ensure we get a consistent YYYY-MM-DD for local time, simple approach for now:
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

exports.checkIn = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const date = getTodayDateString();
    const { latitude, longitude, accuracy, deviceInfo, browserDetails } = req.body;

    // Check for approved leave
    const Leave = require("../models/Leave");
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999,
    );

    const activeLeave = await Leave.findOne({
      employeeId,
      status: "APPROVED",
      fromDate: { $lte: endOfToday },
      toDate: { $gte: startOfToday },
    });

    if (activeLeave) {
      return sendError(res, "You are on approved leave today. Cannot check in.", 400);
    }

    // Geo-Fencing calculations
    const settings = await CompanySetting.findOne();
    let distance = 0;
    let outsideRadius = false;

    if (settings) {
      if (latitude === undefined || longitude === undefined) {
        return sendError(res, "GPS location details are required to check in.", 400);
      }

      distance = geolib.getDistance(
        { latitude: Number(latitude), longitude: Number(longitude) },
        { latitude: settings.latitude, longitude: settings.longitude },
      );

      outsideRadius = distance > settings.allowedRadius;

      // Block check-in if outside AND geofencing is enforced
      if (outsideRadius && settings.enforceGeofencing) {
        return sendError(res, "You are outside the company location. Check-In not allowed.", 400);
      }
    }

    const ipAddress =
      req.headers["x-forwarded-for"] || req.ip || req.socket.remoteAddress || "Unknown IP";
    const status = "PRESENT";

    let attendance = await Attendance.findOne({ employeeId, date });
    if (attendance) {
      if (attendance.checkInTime) {
        return sendError(res, "Already checked in for today", 400);
      } else {
        attendance.checkInTime = new Date();
        attendance.status = status;
        attendance.checkInLatitude = latitude ? Number(latitude) : undefined;
        attendance.checkInLongitude = longitude ? Number(longitude) : undefined;
        attendance.checkInDistance = distance;
        attendance.checkInAccuracy = accuracy ? Number(accuracy) : undefined;
        attendance.checkInOutsideRadius = outsideRadius;
        attendance.checkInIpAddress = ipAddress;
        attendance.checkInDeviceInfo = deviceInfo || "Unknown Device";
        attendance.checkInBrowserDetails = browserDetails || "Unknown Browser";

        await attendance.save();
        return sendSuccess(res, "Checked in successfully", { attendance });
      }
    }

    attendance = new Attendance({
      employeeId,
      date,
      status,
      checkInTime: new Date(),
      checkInLatitude: latitude ? Number(latitude) : undefined,
      checkInLongitude: longitude ? Number(longitude) : undefined,
      checkInDistance: distance,
      checkInAccuracy: accuracy ? Number(accuracy) : undefined,
      checkInOutsideRadius: outsideRadius,
      checkInIpAddress: ipAddress,
      checkInDeviceInfo: deviceInfo || "Unknown Device",
      checkInBrowserDetails: browserDetails || "Unknown Browser",
    });
    await attendance.save();

    return sendSuccess(res, "Checked in successfully", { attendance });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

exports.checkOut = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const date = getTodayDateString();
    const { latitude, longitude, accuracy, deviceInfo, browserDetails } = req.body;

    const attendance = await Attendance.findOne({ employeeId, date });
    if (!attendance || !attendance.checkInTime) {
      return sendError(res, "No check-in found for today", 400);
    }
    if (attendance.checkOutTime) {
      return sendError(res, "Already checked out for today", 400);
    }

    // Geo-Fencing calculations for checkout (for auditing)
    const settings = await CompanySetting.findOne();
    let distance = 0;
    let outsideRadius = false;

    if (settings && latitude !== undefined && longitude !== undefined) {
      distance = geolib.getDistance(
        { latitude: Number(latitude), longitude: Number(longitude) },
        { latitude: settings.latitude, longitude: settings.longitude },
      );
      outsideRadius = distance > settings.allowedRadius;
    }

    const ipAddress =
      req.headers["x-forwarded-for"] || req.ip || req.socket.remoteAddress || "Unknown IP";

    attendance.checkOutTime = new Date();

    // calculate total hours
    const msDiff = attendance.checkOutTime.getTime() - attendance.checkInTime.getTime();
    attendance.totalHours = parseFloat((msDiff / (1000 * 60 * 60)).toFixed(2));

    // save checkout location and security logs
    attendance.checkOutLatitude = latitude ? Number(latitude) : undefined;
    attendance.checkOutLongitude = longitude ? Number(longitude) : undefined;
    attendance.checkOutDistance = distance;
    attendance.checkOutAccuracy = accuracy ? Number(accuracy) : undefined;
    attendance.checkOutOutsideRadius = outsideRadius;
    attendance.checkOutIpAddress = ipAddress;
    attendance.checkOutDeviceInfo = deviceInfo || "Unknown Device";
    attendance.checkOutBrowserDetails = browserDetails || "Unknown Browser";

    await attendance.save();

    return sendSuccess(res, "Checked out successfully", { attendance });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

exports.today = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const date = getTodayDateString();

    const attendance = await Attendance.findOne({ employeeId, date });
    return sendSuccess(res, "Today attendance", { attendance });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

exports.monthly = async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) return sendError(res, "month and year required", 400);

    const employeeId = req.user.id;

    // create a regex for YYYY-MM
    const paddedMonth = month.toString().padStart(2, "0");
    const prefix = `${year}-${paddedMonth}`;

    const records = await Attendance.find({
      employeeId,
      date: { $regex: `^${prefix}` },
    }).sort({ date: 1 });

    return sendSuccess(res, "Monthly attendance", { records });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

exports.history = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const records = await Attendance.find({ employeeId })
      .populate("employeeId", "name designation")
      .sort({ date: -1, checkInTime: -1 });

    return sendSuccess(res, "Employee attendance history", { records });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

exports.myMonthlySummaries = async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) return sendError(res, "month and year required", 400);

    const paddedMonth = month.toString().padStart(2, "0");
    const employeeId = req.user.id;
    const prefix = `${year}-${paddedMonth}`;

    // Find all attendance records for the given month and employee
    const records = await Attendance.find({
      employeeId,
      date: { $regex: `^${prefix}` },
    }).populate("employeeId", "name designation");

    let totalWorkedDays = 0;
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLeave = 0;
    let totalHoliday = 0;
    let totalHours = 0;

    records.forEach((record) => {
      if (record.status === "PRESENT") {
        totalPresent += 1;
        totalWorkedDays += 1;
      } else if (record.status === "ABSENT") {
        totalAbsent += 1;
      } else if (record.status === "LEAVE") {
        totalLeave += 1;
      } else if (record.status === "HOLIDAY") {
        totalHoliday += 1;
      }

      if (record.totalHours) {
        totalHours += record.totalHours;
      }
    });

    const summary = {
      _id: `${employeeId}-${prefix}`,
      employeeId: records.length > 0 ? records[0].employeeId : null,
      month: paddedMonth,
      year: year.toString(),
      totalWorkedDays,
      totalPresent,
      totalAbsent,
      totalLeave,
      totalHoliday,
      totalHours: parseFloat(totalHours.toFixed(2)),
    };

    const summaries = [summary];

    return sendSuccess(res, "Monthly summaries retrieved successfully", { summaries });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

// Admin Endpoints
exports.todayForAdmin = async (req, res) => {
  try {
    const date = getTodayDateString();
    const records = await Attendance.find({ date }).populate("employeeId", "name email");
    return sendSuccess(res, "Today attendance", { records });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

exports.monthlyForAdmin = async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) return sendError(res, "month and year required", 400);

    const paddedMonth = month.toString().padStart(2, "0");
    const prefix = `${year}-${paddedMonth}`;

    const records = await Attendance.find({ date: { $regex: `^${prefix}` } })
      .populate("employeeId", "name designation")
      .sort({ date: -1, checkInTime: -1 });

    return sendSuccess(res, "Monthly attendance", { records });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

exports.dateForAdmin = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return sendError(res, "date is required", 400);

    const records = await Attendance.find({ date })
      .populate("employeeId", "name designation")
      .sort({ checkInTime: -1 });

    return sendSuccess(res, "Date attendance", { records });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

exports.historyForAdmin = async (req, res) => {
  try {
    const { employeeId } = req.query;
    if (!employeeId) return sendError(res, "employeeId is required", 400);

    const records = await Attendance.find({ employeeId })
      .populate("employeeId", "name designation")
      .sort({ date: -1 });

    return sendSuccess(res, "Employee attendance history", { records });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

exports.allForAdmin = async (req, res) => {
  try {
    const records = await Attendance.find({})
      .populate("employeeId", "name designation")
      .sort({ date: -1, checkInTime: -1 });

    return sendSuccess(res, "All attendance records", { records });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

exports.generateMonthlySummary = async (req, res) => {
  try {
    const { month, year } = req.body;
    if (!month || !year) return sendError(res, "month and year required", 400);

    const paddedMonth = month.toString().padStart(2, "0");
    const prefix = `${year}-${paddedMonth}`;

    // Find all attendance records for the given month
    const records = await Attendance.find({ date: { $regex: `^${prefix}` } });

    // Calculate totals per employee
    const summaryMap = {};

    records.forEach((record) => {
      const empId = record.employeeId.toString();
      if (!summaryMap[empId]) {
        summaryMap[empId] = {
          employeeId: record.employeeId,
          month: paddedMonth,
          year: year.toString(),
          totalWorkedDays: 0,
          totalPresent: 0,
          totalAbsent: 0,
          totalLeave: 0,
          totalHoliday: 0,
          totalHours: 0,
        };
      }

      const sum = summaryMap[empId];
      if (record.status === "PRESENT") {
        sum.totalPresent += 1;
        sum.totalWorkedDays += 1;
      } else if (record.status === "ABSENT") {
        sum.totalAbsent += 1;
      } else if (record.status === "LEAVE") {
        sum.totalLeave += 1;
      } else if (record.status === "HOLIDAY") {
        sum.totalHoliday += 1;
      }

      if (record.totalHours) {
        sum.totalHours += record.totalHours;
      }
    });

    // Save to DB
    const summaries = Object.values(summaryMap);
    for (const data of summaries) {
      data.totalHours = parseFloat(data.totalHours.toFixed(2));
      await MonthlyAttendanceSummary.findOneAndUpdate(
        { employeeId: data.employeeId, month: data.month, year: data.year },
        { $set: data },
        { upsert: true, new: true },
      );
    }

    const updatedSummaries = await MonthlyAttendanceSummary.find({
      month: paddedMonth,
      year: year.toString(),
    }).populate("employeeId", "name designation");

    return sendSuccess(res, "Monthly summary generated and stored successfully", {
      summaries: updatedSummaries,
    });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

exports.getMonthlySummaries = async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) return sendError(res, "month and year required", 400);

    const paddedMonth = month.toString().padStart(2, "0");
    const summaries = await MonthlyAttendanceSummary.find({
      month: paddedMonth,
      year: year.toString(),
    }).populate("employeeId", "name designation");

    return sendSuccess(res, "Monthly summaries retrieved successfully", { summaries });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};
