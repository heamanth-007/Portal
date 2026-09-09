const { sendError } = require("../utils/response");

exports.isAdmin = (req, res, next) => {
  if (!req.user) return sendError(res, "Unauthorized", 401);
  const userRole = (req.user.role || "").toUpperCase();
  if (userRole !== "ADMIN") return sendError(res, "Admin role required", 403);
  next();
};

exports.isEmployee = (req, res, next) => {
  if (!req.user) return sendError(res, "Unauthorized", 401);
  const userRole = (req.user.role || "").toUpperCase();
  if (userRole !== "EMPLOYEE" && userRole !== "ADMIN") return sendError(res, "Employee role required", 403);
  next();
};

exports.allowRoles =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return sendError(res, "Unauthorized", 401);
    if (!roles.includes(req.user.role)) return sendError(res, "Insufficient role", 403);
    next();
  };
