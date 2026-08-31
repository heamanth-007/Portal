const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const Employee = require("../models/Employee");
const { sendSuccess, sendError } = require("../utils/response");

exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return sendError(res, "Validation failed", 400, { errors: errors.array() });

    const { name, email, password, phone, designation, department, role, dob, joiningDate } =
      req.body;

    // only admins can register new users — this should be enforced by route middleware
    const existing = await Employee.findOne({ email });
    if (existing) return sendError(res, "Email already in use", 400);

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const emp = new Employee({
      name,
      email,
      password: hashed,
      phone,
      designation,
      department,
      role,
      dob,
      joiningDate,
    });
    await emp.save();

    return sendSuccess(res, "User registered", { id: emp._id, email: emp.email, name: emp.name });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return sendError(res, "Validation failed", 400, { errors: errors.array() });

    const { email, password } = req.body;
    const user = await Employee.findOne({ email });
    if (!user) return sendError(res, "Invalid credentials", 400);

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return sendError(res, "Invalid credentials", 400);

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    return sendSuccess(res, "Logged in", {
      token,
      user: { id: user._id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

exports.me = async (req, res) => {
  try {
    const user = await Employee.findById(req.user.id).select("-password");
    return sendSuccess(res, "Profile", { user });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};
