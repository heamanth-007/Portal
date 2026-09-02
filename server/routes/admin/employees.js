const express = require("express");
const router = express.Router();
const employeeController = require("../../controllers/employeeController");
const {
  employeeCreateValidation,
  employeeUpdateValidation,
  resetPasswordValidation,
} = require("../../middlewares/validate");

// All admin routes should be mounted with auth and isAdmin in the parent
router.post("/", employeeCreateValidation, employeeController.create);
router.get("/", employeeController.list);
router.get("/:id", employeeController.get);
router.put("/:id/reset-password", resetPasswordValidation, employeeController.adminResetPassword);
router.put("/:id", employeeUpdateValidation, employeeController.update);
router.delete("/:id", employeeController.remove);

module.exports = router;
