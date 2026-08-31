const express = require("express");
const router = express.Router();
const holidayController = require("../../controllers/holidayController");

router.post("/", holidayController.create);
router.put("/:id", holidayController.update);
router.delete("/:id", holidayController.remove);

module.exports = router;
