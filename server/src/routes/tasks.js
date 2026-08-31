const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const { isAdmin } = require("../middlewares/role");
const { taskCreateValidation, taskUpdateValidation } = require("../middlewares/validate");

// Admin routes (require admin role)
router.post("/create", isAdmin, taskCreateValidation, taskController.createTask);
router.get("/admin", isAdmin, taskController.getAdminTasks);
router.get("/admin/pending", isAdmin, taskController.getAdminPendingTasks);
router.get("/admin/completed", isAdmin, taskController.getAdminCompletedTasks);
router.put("/:id/update", isAdmin, taskUpdateValidation, taskController.updateTask);
router.delete("/:id", isAdmin, taskController.deleteTask);

// Employee routes (require general authentication, which is applied in app.js)
router.get("/my-tasks", taskController.getMyTasks);
router.get("/my-pending", taskController.getMyPendingTasks);
router.get("/my-completed", taskController.getMyCompletedTasks);
router.put("/:id/complete", taskController.completeTask);

module.exports = router;
