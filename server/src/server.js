const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const rootEnv = path.resolve(__dirname, "../../.env");
const serverEnv = path.resolve(__dirname, "../.env");
const envPath = fs.existsSync(rootEnv) ? rootEnv : serverEnv;
dotenv.config({ path: envPath });
const express = require("express"),
  cors = require("cors"),
  helmet = require("helmet"),
  rateLimit = require("express-rate-limit");
const db = require("./config/db");
const api = require("./routes/api");
const remaining = require("./routes/remaining");
const completion = require("./routes/completion");
const admin = require("./routes/adminIntegration");
const admissions = require("./routes/admissions");
const { startBillingJob } = require("./jobs/billing");
const { startReminderJob } = require("./jobs/reminders");
const { startLateFeeJob } = require("./jobs/lateFees");
const mongoose = require("mongoose");
const app = express();
app.use(helmet());
app.use(
  cors({
    origin: (process.env.CLIENT_URL || "http://localhost:5173").split(","),
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));
const apiLimiter = rateLimit({ windowMs: 60000, limit: 300 });
app.use("/api", apiLimiter);
app.use("/api", admissions);
app.use("/api", api);
app.use("/api", remaining);
app.use("/api", completion);
app.use("/integration/sarva", admin);
const health = (req, res) => {
  const dbState = mongoose.connection.readyState;
  const database = dbState === 1 ? "connected" : dbState === 2 ? "connecting" : "disconnected";
  const healthy = dbState === 1;
  res.set("Cache-Control", "no-store");
  res.status(healthy ? 200 : 503).json({
    success: healthy,
    service: "SARVA Hostel API",
    status: healthy ? "ok" : "degraded",
    database,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
};
app.get("/api/health", health);
app.get("/health", health);
app.use((e, req, res, next) => {
  console.error(e);
  res.status(e.status || 500).json({ message: e.message || "Server error" });
});
db()
  .then(() => {
    startBillingJob();
    startReminderJob();
    startLateFeeJob();
    app.listen(process.env.PORT || 4000, () =>
      console.log(`SARVA Hostel API :${process.env.PORT || 4000}`),
    );
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
