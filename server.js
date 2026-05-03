// ========================
// LOAD ENV + DB
// ========================
require("dotenv").config();
require("./config/db");

const express = require("express");
const app = express();

// ========================
// SECURITY & MIDDLEWARE
// ========================
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

// Security headers
app.use(helmet());

// Logging (request log)
app.use(morgan("combined"));

// Body parser
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// ========================
// GLOBAL RATE LIMIT
// ========================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100, // max request per IP
  message: {
    error: "Too many requests, slow down"
  }
});

app.use(limiter);

// ========================
// ROUTES
// ========================
app.use("/api", require("./routes/api"));

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "SaaS API",
    uptime: process.uptime()
  });
});

// ========================
// 404 HANDLER
// ========================
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found"
  });
});

// ========================
// ERROR HANDLER (GLOBAL)
// ========================
app.use((err, req, res, next) => {
  console.error("ERROR:", err);

  res.status(err.status || 500).json({
    error: "Internal Server Error"
  });
});

// ========================
// START SERVER
// ========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
