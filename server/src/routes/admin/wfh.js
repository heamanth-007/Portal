const express = require("express");
const router = express.Router();
const wfhController = require("../../controllers/wfhController");

router.get("/pending", wfhController.pendingForAdmin);
router.put("/approve/:id", wfhController.approve);
router.put("/reject/:id", wfhController.reject);

module.exports = router;
