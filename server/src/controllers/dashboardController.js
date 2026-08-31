const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const { sendSuccess, sendError } = require("../utils/response");

const getTodayDateString = () => {
  return new Date().toISOString().split("T")[0];
};

exports.overview = async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments({});

    const todayDate = new Date();
    const today = getTodayDateString();

    // Count both PRESENT and WFH as present employees
    const presentTodayCount = await Attendance.countDocuments({
      date: today,
      status: { $in: ["PRESENT", "WFH"] },
    });

    const pendingLeavesCount = await Leave.countDocuments({ status: "PENDING" });

    const wfhEmployees = await Attendance.find({ date: today, status: "WFH" })
      .populate("employeeId", "employeeId name designation")
      .sort({ checkInTime: -1 })
      .lean();

    const presentEmployees = await Attendance.find({ date: today, status: "PRESENT" })
      .populate("employeeId", "employeeId name designation")
      .lean();

    // upcoming birthdays next 30 days
    const end = new Date();
    end.setDate(todayDate.getDate() + 30);
    const employees = await Employee.find({ dob: { $exists: true } }).select("name email dob");
    const upcomingBirthdays = employees.filter((e) => {
      const dob = new Date(e.dob);
      const thisYearDob = new Date(todayDate.getFullYear(), dob.getMonth(), dob.getDate());
      return thisYearDob >= todayDate && thisYearDob <= end;
    });

    return sendSuccess(res, "Dashboard overview", {
      totalEmployees,
      presentTodayCount,
      presentEmployees: presentEmployees.length,
      wfhEmployees,
      wfhCount: wfhEmployees.length,
      pendingLeavesCount,
      upcomingBirthdays,
    });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

exports.wfhToday = async (req, res) => {
  try {
    const today = getTodayDateString();
    console.log("Today:", today);

    const wfhEmployees = await Attendance.find({ date: today, status: "WFH" })
      .populate("employeeId", "employeeId name designation")
      .sort({ checkInTime: -1 })
      .lean();

    console.log("WFH Employees:", wfhEmployees);

    if (!wfhEmployees || wfhEmployees.length === 0) {
      return sendSuccess(res, "No employees working from home today", { records: [] });
    }

    return sendSuccess(res, "Today WFH employees", { records: wfhEmployees });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};
