const jwt = require("jsonwebtoken");
const { sendError } = require("../utils/response");
const Employee = require("../models/Employee");

module.exports = async function verifyToken(req, res, next) {
  const header = req.header("Authorization");
  if (!header) return sendError(res, "No token provided", 401);

  const parts = header.split(" ");
  const token = parts.length === 2 ? parts[1] : parts[0];
  if (!token) return sendError(res, "No token provided", 401);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Look up latest user data from DB to avoid stale JWT cached roles/status
    const user = await Employee.findById(payload.id);
    if (!user) return sendError(res, "User no longer exists", 401);
    if (user.status === "INACTIVE") return sendError(res, "User account is inactive", 403);

    req.user = {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
    };
    return next();
  } catch (err) {
    return sendError(res, "Invalid token", 401);
  }
};
