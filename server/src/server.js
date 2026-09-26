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
const { startBillingJob } = require("./jobs/billing");
const { startReminderJob } = require("./jobs/reminders");
const app = express();
app.use(helmet());
app.use(
  cors({
    origin: (process.env.CLIENT_URL || "http://localhost:5173").split(","),
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use("/api", rateLimit({ windowMs: 60000, limit: 300 }), api);
app.use("/api", remaining);
app.use("/api", completion);
app.use("/integration/sarva", admin);
app.get("/api/health", (req, res) => res.json({ success: true, service: "SARVA Hostel API" }));
app.get("/health", (req, res) => res.json({ success: true, service: "SARVA Hostel API" }));
app.use((e, req, res, next) => {
  console.error(e);
  res.status(e.status || 500).json({ message: e.message || "Server error" });
});
db()
  .then(() => {
    startBillingJob();
    startReminderJob();
    app.listen(process.env.PORT || 4000, () =>
      console.log(`SARVA Hostel API :${process.env.PORT || 4000}`),
    );
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
