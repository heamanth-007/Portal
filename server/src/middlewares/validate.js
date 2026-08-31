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
  body("status").isIn(["PRESENT", "ABSENT", "LEAVE", "WFH"]).withMessage("Invalid status"),
];

exports.taskCreateValidation = [
  body("title").notEmpty().withMessage("Task title is required").trim(),
  body("priority")
    .isIn(["Low", "Medium", "High"])
    .withMessage("Priority must be Low, Medium, or High"),
  body("assignedTo").isMongoId().withMessage("Assigned employee ID must be a valid ID"),
  body("dueDate")
    .notEmpty()
    .withMessage("Due date is required")
    .isISO8601()
    .withMessage("Invalid due date format"),
];

exports.taskUpdateValidation = [
  body("title").optional().notEmpty().withMessage("Task title cannot be empty").trim(),
  body("priority")
    .optional()
    .isIn(["Low", "Medium", "High"])
    .withMessage("Priority must be Low, Medium, or High"),
  body("assignedTo").optional().isMongoId().withMessage("Assigned employee ID must be a valid ID"),
  body("dueDate")
    .optional()
    .notEmpty()
    .withMessage("Due date cannot be empty")
    .isISO8601()
    .withMessage("Invalid due date format"),
];

exports.changePasswordValidation = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword").isLength({ min: 8 }).withMessage("New password must be at least 8 characters"),
];

exports.resetPasswordValidation = [
  body("newPassword").isLength({ min: 8 }).withMessage("New password must be at least 8 characters"),
];
