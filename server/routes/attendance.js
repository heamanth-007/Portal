const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");

router.post("/checkin", attendanceController.checkIn);
router.post("/checkout", attendanceController.checkOut);
router.get("/today", attendanceController.today);
router.get("/monthly", attendanceController.monthly);
router.get("/history", attendanceController.history);
router.get("/monthly-summary", attendanceController.myMonthlySummaries);

module.exports = router;
