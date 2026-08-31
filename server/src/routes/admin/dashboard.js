const express = require("express");
const router = express.Router();
const dashboardController = require("../../controllers/dashboardController");

router.get("/overview", dashboardController.overview);
router.get("/wfh-today", dashboardController.wfhToday);

module.exports = router;
