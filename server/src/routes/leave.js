const express = require("express");
const router = express.Router();
const leaveController = require("../controllers/leaveController");
const { leaveApplyValidation } = require("../middlewares/validate");

router.post("/apply", leaveApplyValidation, leaveController.apply);
router.get("/my-leaves", leaveController.myLeaves);

module.exports = router;
