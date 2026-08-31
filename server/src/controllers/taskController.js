const Task = require("../models/Task");
const Employee = require("../models/Employee");
const { validationResult } = require("express-validator");
const { sendSuccess, sendError } = require("../utils/response");

// Create Task (Admin only)
exports.createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, "Validation failed", 400, { errors: errors.array() });
    }

    const { title, description, priority, assignedTo, dueDate } = req.body;

    // Verify employee exists and is active
    const employee = await Employee.findById(assignedTo);
    if (!employee) {
      return sendError(res, "Employee not found", 404);
    }
    if (employee.status === "INACTIVE") {
      return sendError(res, "Cannot assign task to an inactive employee", 400);
    }

    // Prevent duplicate task submissions (same title, description, assignedTo, and status = Pending)
    const duplicate = await Task.findOne({
      title: title.trim(),
      description: description ? description.trim() : undefined,
      assignedTo,
      status: "Pending",
    });
    if (duplicate) {
      return sendError(
        res,
        "A pending task with the same title is already assigned to this employee",
        400,
      );
    }

    const task = new Task({
      title: title.trim(),
      description: description ? description.trim() : "",
      priority,
      assignedTo,
      assignedBy: req.user.id,
      dueDate,
    });

    await task.save();

    // Create notification for employee
    const Notification = require("../models/Notification");
    const adminUser = await Employee.findById(req.user.id);
    const adminName = adminUser ? adminUser.name : "Admin";
    const notification = new Notification({
      recipient: assignedTo,
      message: `Admin ${adminName} assigned you a new task: "${task.title}"`,
      type: "TASK_ASSIGNED",
      relatedId: task._id,
    });
    await notification.save();

    // Populate employee details for response
    await task.populate("assignedTo", "name email employeeId designation department avatarUrl");
    await task.populate("assignedBy", "name email designation");

    return sendSuccess(res, "Task assigned successfully", { task });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

// Get All Tasks (Admin only)
// Supports search by employee name, filter by priority, status, and pagination
exports.getAdminTasks = async (req, res) => {
  try {
    const { search, priority, status, page = 1, limit = 10 } = req.query;
    const query = {};

    // Filter by priority
    if (priority) {
      query.priority = priority;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Search by employee name
    if (search) {
      const employees = await Employee.find({
        name: { $regex: search, $options: "i" },
      }).select("_id");
      const employeeIds = employees.map((emp) => emp._id);
      query.assignedTo = { $in: employeeIds };
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skipNum = (pageNum - 1) * limitNum;

    const tasks = await Task.find(query)
      .populate("assignedTo", "name email employeeId designation department avatarUrl")
      .populate("assignedBy", "name email designation")
      .sort({ createdAt: -1 })
      .skip(skipNum)
      .limit(limitNum);

    const total = await Task.countDocuments(query);

    return sendSuccess(res, "Tasks fetched successfully", {
      tasks,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

// Get Pending Tasks (Admin only)
exports.getAdminPendingTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ status: "Pending" })
      .populate("assignedTo", "name email employeeId designation department avatarUrl")
      .populate("assignedBy", "name email designation")
      .sort({ createdAt: -1 });

    return sendSuccess(res, "Pending tasks fetched successfully", { tasks });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

// Get Completed Tasks (Admin only)
exports.getAdminCompletedTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ status: "Completed" })
      .populate("assignedTo", "name email employeeId designation department avatarUrl")
      .populate("assignedBy", "name email designation")
      .sort({ completedDate: -1 });

    return sendSuccess(res, "Completed tasks fetched successfully", { tasks });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

// Update Task (Admin only)
exports.updateTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, "Validation failed", 400, { errors: errors.array() });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return sendError(res, "Task not found", 404);
    }

    const { title, description, priority, assignedTo, dueDate } = req.body;

    const Notification = require("../models/Notification");
    let assigneeChanged = false;
    if (assignedTo && task.assignedTo.toString() !== assignedTo) {
      assigneeChanged = true;
    }

    if (assignedTo) {
      const employee = await Employee.findById(assignedTo);
      if (!employee) {
        return sendError(res, "Employee not found", 404);
      }
      task.assignedTo = assignedTo;
    }

    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description ? description.trim() : "";
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;

    await task.save();

    if (assigneeChanged) {
      const adminUser = await Employee.findById(req.user.id);
      const adminName = adminUser ? adminUser.name : "Admin";
      const notification = new Notification({
        recipient: task.assignedTo,
        message: `Admin ${adminName} assigned you a new task: "${task.title}"`,
        type: "TASK_ASSIGNED",
        relatedId: task._id,
      });
      await notification.save();
    }

    await task.populate("assignedTo", "name email employeeId designation department avatarUrl");
    await task.populate("assignedBy", "name email designation");

    return sendSuccess(res, "Task updated successfully", { task });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

// Delete Task (Admin only)
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return sendError(res, "Task not found", 404);
    }

    await task.deleteOne();
    return sendSuccess(res, "Task deleted successfully", {});
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

// Get My Tasks (Employee only)
exports.getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user.id })
      .populate("assignedBy", "name email designation")
      .sort({ createdAt: -1 });

    return sendSuccess(res, "My tasks fetched successfully", { tasks });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

// Get My Pending Tasks (Employee only)
exports.getMyPendingTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user.id, status: "Pending" })
      .populate("assignedBy", "name email designation")
      .sort({ createdAt: -1 });

    return sendSuccess(res, "My pending tasks fetched successfully", { tasks });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

// Get My Completed Tasks (Employee only)
exports.getMyCompletedTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user.id, status: "Completed" })
      .populate("assignedBy", "name email designation")
      .sort({ completedDate: -1 });

    return sendSuccess(res, "My completed tasks fetched successfully", { tasks });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

// Complete Task (Employee only)
exports.completeTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return sendError(res, "Task not found", 404);
    }

    // Verify task belongs to logged in employee
    if (task.assignedTo.toString() !== req.user.id) {
      return sendError(res, "Unauthorized to complete this task", 403);
    }

    if (task.status === "Completed") {
      return sendError(res, "Task is already marked as completed", 400);
    }

    task.status = "Completed";
    task.completedDate = new Date();

    await task.save();

    // Notify the admin who assigned the task
    if (task.assignedBy) {
      const Notification = require("../models/Notification");
      const employee = await Employee.findById(req.user.id);
      const employeeName = employee ? employee.name : "Employee";

      const notification = new Notification({
        recipient: task.assignedBy,
        message: `${employeeName} completed the task: "${task.title}"`,
        type: "TASK_COMPLETED",
        relatedId: task._id,
      });
      await notification.save();
    }

    await task.populate("assignedTo", "name email employeeId designation department avatarUrl");
    await task.populate("assignedBy", "name email designation");

    return sendSuccess(res, "Task marked as completed", { task });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};
