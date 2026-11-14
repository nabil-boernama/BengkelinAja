const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const routes = require("./routes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

// Percaya header dari reverse proxy (Render, Railway, dsb.)
// supaya rate limiter membaca IP asli, bukan IP proxy.
app.set("trust proxy", 1);

app.use(helmet());

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((s) => s.trim())
  : true; // development: izinkan semua

app.use(
  cors({
    origin: allowedOrigins,
    exposedHeaders: ["RateLimit-Limit", "RateLimit-Remaining", "RateLimit-Reset", "Retry-After"],
  })
);

app.use(express.json({ limit: "100kb" }));
if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));

app.get("/health", (req, res) =>
  res.json({ success: true, data: { status: "ok" } }),
);
app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;