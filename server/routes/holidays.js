const express = require("express");
const router = express.Router();
const holidayController = require("../controllers/holidayController");

router.get("/", holidayController.list);

module.exports = router;
