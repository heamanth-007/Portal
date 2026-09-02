const { body } = require("express-validator");

exports.registerValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email required"),
  body("password").isLength({ min: 6 }).withMessage("Password min 6 chars"),
];

exports.loginValidation = [
  body("email").isEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password required"),
];

exports.employeeCreateValidation = [
  body("employeeId").notEmpty().withMessage("Employee ID required"),
  body("name").notEmpty().withMessage("Name required"),
  body("email").isEmail().withMessage("Valid email required"),
  body("password").isLength({ min: 6 }).withMessage("Password min 6 chars"),
  body("department").notEmpty().withMessage("Department is required"),
  body("role").optional().isIn(["ADMIN", "EMPLOYEE"]).withMessage("Invalid role"),
];

exports.employeeUpdateValidation = [
  body("department").notEmpty().withMessage("Department is required"),
];

exports.leaveApplyValidation = [
  body("fromDate").notEmpty(),
  body("toDate").notEmpty(),
  body("leaveType").isIn(["CASUAL", "SICK", "EARNED"]),
];

exports.holidayValidation = [body("name").notEmpty(), body("date").notEmpty()];

exports.attendanceMarkValidation = [
  body("status").isIn(["PRESENT", "ABSENT", "LEAVE"]).withMessage("Invalid status"),
];

exports.changePasswordValidation = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword").isLength({ min: 8 }).withMessage("New password must be at least 8 characters"),
];

exports.resetPasswordValidation = [
  body("newPassword").isLength({ min: 8 }).withMessage("New password must be at least 8 characters"),
];
