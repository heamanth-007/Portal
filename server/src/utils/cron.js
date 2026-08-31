const cron = require("node-cron");
const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const Wfh = require("../models/Wfh");
const Holiday = require("../models/Holiday");
const Task = require("../models/Task");
const Notification = require("../models/Notification");

const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const initCronJobs = () => {
  // Run every day at 23:55 (11:55 PM) to mark absentees
  cron.schedule("55 23 * * *", async () => {
    try {
      const today = getTodayDateString();
      console.log(`Cron: Running attendance check for ${today}`);

      const employees = await Employee.find({ status: "ACTIVE" });

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      // Check if today is weekend (Saturday = 6, Sunday = 0)
      const dayOfWeek = new Date().getDay();
      if (dayOfWeek === 0) {
        console.log(`Cron: Today is Sunday. Skipping absent marks.`);
        return;
      }

      // Check if today is a holiday
      const holiday = await Holiday.findOne({
        date: { $gte: startOfToday, $lte: endOfToday },
      });

      for (const emp of employees) {
        const employeeId = emp._id;

        // Check if employee has approved leave today
        const activeLeave = await Leave.findOne({
          employeeId,
          status: "APPROVED",
          fromDate: { $lte: endOfToday },
          toDate: { $gte: startOfToday },
        });

        // Check if employee has approved WFH today
        const activeWfh = await Wfh.findOne({
          employeeId,
          status: "APPROVED",
          date: { $gte: startOfToday, $lte: endOfToday },
        });

        // Check attendance record
        let attendance = await Attendance.findOne({ employeeId, date: today });

        if (!attendance) {
          let finalStatus = "ABSENT";
          if (activeLeave) {
            finalStatus = "LEAVE";
          } else if (holiday) {
            finalStatus = "HOLIDAY";
          }

          attendance = new Attendance({
            employeeId,
            date: today,
            status: finalStatus,
          });
          await attendance.save();
        } else {
          // Checked in, but did not check out -> mark as absent
          if (!attendance.checkOutTime) {
            attendance.status = "ABSENT";
            await attendance.save();
          }
        }
      }
      console.log(`Cron: Attendance check completed for ${today}`);
    } catch (err) {
      console.error("Cron: Error running attendance check:", err);
    }
  });

  // Run every day at 00:05 (12:05 AM) to check for overdue tasks and notify admins
  cron.schedule("5 0 * * *", async () => {
    try {
      const todayStr = getTodayDateString();
      console.log(`Cron: Running overdue tasks check for ${todayStr}`);

      // Find all pending tasks that have due dates before today
      const overdueTasks = await Task.find({
        status: "Pending",
        dueDate: { $lt: new Date(todayStr + "T00:00:00.000Z") },
      }).populate("assignedTo", "name");

      if (overdueTasks.length === 0) {
        console.log("Cron: No overdue tasks found.");
        return;
      }

      // Fetch all active admins
      const admins = await Employee.find({ role: "ADMIN", status: "ACTIVE" });
      if (admins.length === 0) {
        console.log("Cron: No active admins found to notify.");
        return;
      }

      for (const task of overdueTasks) {
        // Check if an overdue notification already exists for this task
        const existingNotif = await Notification.findOne({
          type: "TASK_OVERDUE",
          relatedId: task._id,
        });

        if (!existingNotif) {
          const empName = task.assignedTo ? task.assignedTo.name : "Unknown Employee";
          // Create notification for each admin
          for (const admin of admins) {
            const notification = new Notification({
              recipient: admin._id,
              message: `Task "${task.title}" assigned to ${empName} is overdue (due date: ${task.dueDate.toISOString().slice(0, 10)})`,
              type: "TASK_OVERDUE",
              relatedId: task._id,
            });
            await notification.save();
          }
          console.log(`Cron: Created overdue notification for task: "${task.title}"`);
        }
      }
    } catch (err) {
      console.error("Cron: Error checking overdue tasks:", err);
    }
  });
};

module.exports = initCronJobs;
