const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth");
const adminEmployees = require("./routes/admin/employees");
const adminAttendance = require("./routes/admin/attendance");
const adminLeave = require("./routes/admin/leave");
const adminHolidays = require("./routes/admin/holidays");
const adminDashboard = require("./routes/admin/dashboard");
const adminCompanySettings = require("./routes/admin/companySettings");
const attendanceRoutes = require("./routes/attendance");
const leaveRoutes = require("./routes/leave");
const holidaysRoutes = require("./routes/holidays");
const employeesRoutes = require("./routes/employees");
const companySettingsRoutes = require("./routes/companySettings");
const auth = require("./middlewares/auth");
const { isAdmin } = require("./middlewares/role");
const logger = require("./middlewares/logger");
const errorHandler = require("./middlewares/errorHandler");

dotenv.config();

const app = express();
const corsOptions = {
  origin: process.env.CLIENT_URL
    ? process.env.CLIENT_URL.includes(",")
      ? process.env.CLIENT_URL.split(",").map((url) => url.trim().replace(/\/$/, ""))
      : [process.env.CLIENT_URL, process.env.CLIENT_URL.replace(/\/$/, "")]
    : true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(logger);

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);

// admin routes: protect with auth and isAdmin
app.use("/api/admin/employees", auth, isAdmin, adminEmployees);
app.use("/api/admin/attendance", auth, isAdmin, adminAttendance);
app.use("/api/admin/leave", auth, isAdmin, adminLeave);
app.use("/api/admin/holidays", auth, isAdmin, adminHolidays);
app.use("/api/admin/dashboard", auth, isAdmin, adminDashboard);
app.use("/api/admin/approvals", auth, isAdmin, require("./routes/admin/approvals"));
app.use("/api/admin/company-settings", auth, isAdmin, adminCompanySettings);

// employee routes (require auth)
app.use("/api/attendance", auth, attendanceRoutes);
app.use("/api/leave", auth, leaveRoutes);
app.use("/api/holidays", auth, holidaysRoutes);
app.use("/api/employees", auth, employeesRoutes);
app.use("/api/company-settings", auth, companySettingsRoutes);
app.use("/api/chat", auth, require("./routes/chat"));

// error handler
app.use(errorHandler);

module.exports = app;
