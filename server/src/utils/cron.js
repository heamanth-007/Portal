const cron = require("node-cron");
const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const Holiday = require("../models/Holiday");

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
};

module.exports = initCronJobs;
