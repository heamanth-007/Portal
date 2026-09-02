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

    const presentTodayCount = await Attendance.countDocuments({
      date: today,
      status: "PRESENT",
    });

    const pendingLeavesCount = await Leave.countDocuments({ status: "PENDING" });

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
      pendingLeavesCount,
      upcomingBirthdays,
    });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};
