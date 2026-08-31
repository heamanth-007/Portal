const Employee = require("../models/Employee");
const { validationResult } = require("express-validator");
const { sendSuccess, sendError } = require("../utils/response");

const bcrypt = require("bcryptjs");

exports.create = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return sendError(res, "Validation failed", 400, { errors: errors.array() });

    const {
      employeeId,
      name,
      email,
      password,
      phone,
      designation,
      department,
      role,
      dob,
      joiningDate,
      status,
    } = req.body;

    // Check if employeeId already exists
    const existingId = await Employee.findOne({ employeeId });
    if (existingId) return sendError(res, "Employee ID already exists", 400);

    const existing = await Employee.findOne({ email });
    if (existing) return sendError(res, "Email already in use", 400);

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const emp = new Employee({
      employeeId,
      name,
      email,
      password: hashed,
      phone,
      designation,
      department,
      role,
      dob,
      joiningDate,
      status,
    });
    await emp.save();
    return sendSuccess(res, "Employee created", { id: emp._id });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

exports.list = async (req, res) => {
  try {
    const list = await Employee.find().select("-password");
    return sendSuccess(res, "Employees fetched", { employees: list });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

exports.get = async (req, res) => {
  try {
    const emp = await Employee.findById(req.params.id).select("-password");
    if (!emp) return sendError(res, "Employee not found", 404);
    return sendSuccess(res, "Employee fetched", { employee: emp });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

exports.update = async (req, res) => {
  try {
    const emp = await Employee.findById(req.params.id);
    if (!emp) return sendError(res, "Employee not found", 404);

    const updates = req.body;
    // prevent password update here unless hashed — leave to admin via separate flow
    if (updates.password) delete updates.password;

    Object.assign(emp, updates);
    await emp.save();
    return sendSuccess(res, "Employee updated", { id: emp._id });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const emp = await Employee.findById(req.user.id);
    if (!emp) return sendError(res, "Employee not found", 404);

    const allowedPatch = {};
    const allowedFields = [
      "phone",
      "address",
      "emergencyContactName",
      "emergencyContactPhone",
      "avatarUrl",
      "manager",
      "skills",
      "gender",
      "bloodGroup",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        allowedPatch[field] = req.body[field];
      }
    });

    Object.assign(emp, allowedPatch);
    await emp.save();
    return sendSuccess(res, "Profile updated", { employee: emp });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

exports.remove = async (req, res) => {
  try {
    const emp = await Employee.findById(req.params.id);
    if (!emp) return sendError(res, "Employee not found", 404);
    await emp.deleteOne();
    return sendSuccess(res, "Employee deleted", {});
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

exports.upcomingBirthdays = async (req, res) => {
  try {
    const days = parseInt(req.query.days, 10) || 30;
    const today = new Date();
    const end = new Date();
    end.setDate(today.getDate() + days);

    // find all employees and filter by month/day in range
    const employees = await Employee.find({ dob: { $exists: true } }).select("-password");
    const result = employees.filter((e) => {
      const dob = new Date(e.dob);
      const thisYearDob = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
      return thisYearDob >= today && thisYearDob <= end;
    });

    return sendSuccess(res, "Upcoming birthdays", { employees: result });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

exports.changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return sendError(res, "Validation failed", 400, { errors: errors.array() });

    const { currentPassword, newPassword } = req.body;
    const emp = await Employee.findById(req.user.id);
    if (!emp) return sendError(res, "Employee not found", 404);

    const valid = await bcrypt.compare(currentPassword, emp.password);
    if (!valid) return sendError(res, "Invalid current password", 400);

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);

    emp.password = hashed;
    await emp.save();

    return sendSuccess(res, "Password changed successfully", {});
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

exports.adminResetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return sendError(res, "Validation failed", 400, { errors: errors.array() });

    const { newPassword } = req.body;
    const emp = await Employee.findById(req.params.id);
    if (!emp) return sendError(res, "Employee not found", 404);

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);

    emp.password = hashed;
    await emp.save();

    return sendSuccess(res, "Password reset successfully", {});
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};
