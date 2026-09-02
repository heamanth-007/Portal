const express = require("express");
const router = express.Router();
const companySettingController = require("../controllers/companySettingController");

router.get("/", companySettingController.getSettings);

module.exports = router;
