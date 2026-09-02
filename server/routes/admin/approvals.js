const express = require("express");
const router = express.Router();
const approvalController = require("../../controllers/approvalController");

router.get("/pending", approvalController.getPendingApprovals);
router.get("/approved", approvalController.getApprovedRequests);
router.put("/approve/:id", approvalController.approveRequest);
router.put("/reject/:id", approvalController.rejectRequest);

module.exports = router;
