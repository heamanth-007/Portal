const express = require("express");
const router = express.Router();
const wfhController = require("../controllers/wfhController");

router.post("/apply", wfhController.apply);
router.get("/my-wfh", wfhController.myWfh);

module.exports = router;
