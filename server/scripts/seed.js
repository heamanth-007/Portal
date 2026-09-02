const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const Employee = require("../src/models/Employee");

// Load .env from server directory first, fallback to cwd
dotenv.config({ path: path.join(__dirname, "../.env") });
if (!process.env.MONGO_URI) {
  dotenv.config();
}

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("MONGO_URI must be set in .env to run seed script");
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log("Connected to MongoDB for seeding");

  const email = (process.env.SEED_EMAIL || "admin@example.com").trim().toLowerCase();
  const password = process.env.SEED_PASSWORD || "password123";
  const name = process.env.SEED_NAME || "Admin User";

  const existingAdmin = await Employee.findOne({ email });
  if (!existingAdmin) {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    const adminUser = new Employee({
      employeeId: "ADM001",
      name,
      email,
      password: hashed,
      role: "ADMIN",
      department: "Management",
      designation: "Administrator",
      status: "ACTIVE",
      joiningDate: new Date(),
    });
    await adminUser.save();
    console.log("Seed admin created successfully:");
    console.log(`  - Email: ${email}`);
    console.log(`  - Password: ${password}`);
    console.log(`  - Role: ADMIN`);
  } else {
    console.log(`Admin already exists: ${email}`);
  }

  const employeeEmail = "employee@example.com";
  const employeePassword = "password123";
  const existingEmployee = await Employee.findOne({ email: employeeEmail });
  if (!existingEmployee) {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(employeePassword, salt);
    const employeeUser = new Employee({
      employeeId: "EMP001",
      name: "Test Employee",
      email: employeeEmail,
      password: hashed,
      role: "EMPLOYEE",
      department: "Engineering",
      designation: "Software Engineer",
      status: "ACTIVE",
      joiningDate: new Date(),
    });
    await employeeUser.save();
    console.log("Seed employee created successfully:");
    console.log(`  - Email: ${employeeEmail}`);
    console.log(`  - Password: ${employeePassword}`);
    console.log(`  - Role: EMPLOYEE`);
  } else {
    console.log(`Employee already exists: ${employeeEmail}`);
  }

  await mongoose.disconnect();
  console.log("MongoDB connection closed. Seeding completed.");
  process.exit(0);
}

run().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});

