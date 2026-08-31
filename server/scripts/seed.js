const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const Employee = require("../src/models/Employee");

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("MONGO_URI must be set in .env to run seed script");
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log("Connected to MongoDB for seeding");

  const email = process.env.SEED_EMAIL || "admin@example.com";
  const password = process.env.SEED_PASSWORD || "password123";
  const name = process.env.SEED_NAME || "Admin User";

  const existingAdmin = await Employee.findOne({ email });
  if (!existingAdmin) {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    const adminUser = new Employee({
      email,
      name,
      password: hashed,
      role: "ADMIN",
      employeeId: "ADM001",
      department: "Management",
    });
    await adminUser.save();
    console.log("Seed admin created:", email);
    console.log("Password:", password);
  } else {
    console.log("Admin already exists:", email);
  }

  const employeeEmail = "employee@example.com";
  const employeePassword = "password123";
  const existingEmployee = await Employee.findOne({ email: employeeEmail });
  if (!existingEmployee) {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(employeePassword, salt);
    const employeeUser = new Employee({
      email: employeeEmail,
      name: "Test Employee",
      password: hashed,
      role: "EMPLOYEE",
      employeeId: "EMP001",
      department: "Engineering",
    });
    await employeeUser.save();
    console.log("Seed employee created:", employeeEmail);
    console.log("Password:", employeePassword);
  } else {
    console.log("Employee already exists:", employeeEmail);
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
