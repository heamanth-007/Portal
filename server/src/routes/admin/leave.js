const express = require("express");
const router = express.Router();
const leaveController = require("../../controllers/leaveController");

router.get("/pending", leaveController.pendingForAdmin);
router.put("/approve/:id", leaveController.approve);
router.put("/reject/:id", leaveController.reject);

module.exports = router;
