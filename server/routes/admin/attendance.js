const express = require("express");
const router = express.Router();
const attendanceController = require("../../controllers/attendanceController");

router.get("/today", attendanceController.todayForAdmin);
router.get("/monthly", attendanceController.monthlyForAdmin);
router.post("/monthly-summary/generate", attendanceController.generateMonthlySummary);
router.get("/monthly-summary", attendanceController.getMonthlySummaries);
router.get("/date", attendanceController.dateForAdmin);
router.get("/history", attendanceController.historyForAdmin);
router.get("/all", attendanceController.allForAdmin);

module.exports = router;
