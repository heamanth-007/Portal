const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employeeController");
const auth = require("../middleware/auth");

const { changePasswordValidation } = require("../middlewares/validate");

router.put(
  "/profile/update",
  auth.restrictEmployeeProfileUpdates,
  employeeController.updateProfile,
);
router.put(
  "/change-password",
  changePasswordValidation,
  employeeController.changePassword,
);
router.get("/upcoming-birthdays", employeeController.upcomingBirthdays);
router.get("/directory", employeeController.list);

module.exports = router;
