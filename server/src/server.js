const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const initCronJobs = require("./utils/cron");

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

async function start() {
  try {
    await connectDB(MONGO_URI);
    console.log("Connected to MongoDB");

    // Initialize cron jobs
    initCronJobs();

    const server = http.createServer(app);

    const io = require("socket.io")(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        credentials: true,
      },
    });
    app.set("io", io);

    io.on("connection", (socket) => {
      console.log("socket connected:", socket.id);
      socket.on("disconnect", () => {
        console.log("socket disconnected:", socket.id);
      });
    });

    server.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server", err);
    process.exit(1);
  }
}

start();
