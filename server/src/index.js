const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const corsOptions = {
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("MONGO_URI is not set. Set it in the .env file.");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Mount auth routes
const authRoutes = require("./routes/auth");
const authMiddleware = require("./middleware/auth");
const employeeRoutes = require("./routes/employees");

app.use("/api/auth", authRoutes);
app.use("/api/employees", authMiddleware.auth, employeeRoutes);

app.get("/health", (req, res) => res.json({ status: "ok" }));

// example protected route
app.get("/me", authMiddleware.auth, async (req, res) => {
  res.json({ user: req.user });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
