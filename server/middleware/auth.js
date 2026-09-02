const jwt = require("jsonwebtoken");
const Employee = require("../models/Employee");

async function auth(req, res, next) {
  const header = req.header("Authorization");
  if (!header) return res.status(401).json({ message: "No token provided" });

  const parts = header.split(" ");
  const token = parts.length === 2 ? parts[1] : parts[0];
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Look up latest user data from DB to avoid stale JWT cached roles/status
    const user = await Employee.findById(payload.id);
    if (!user) return res.status(401).json({ message: "User no longer exists" });
    if (user.status === "INACTIVE")
      return res.status(403).json({ message: "User account is inactive" });

    req.user = {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function restrictEmployeeProfileUpdates(req, res, next) {
  if (req.user?.role === "EMPLOYEE") {
    const forbiddenFields = [
      "employeeId",
      "department",
      "designation",
      "role",
      "joiningDate",
      "status",
    ];
    forbiddenFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        delete req.body[field];
      }
    });
  }
  next();
}

module.exports = {
  auth,
  restrictEmployeeProfileUpdates,
};
