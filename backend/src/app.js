const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const routes = require("./routes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "100kb" }));
if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));

app.get("/health", (req, res) =>
  res.json({ success: true, data: { status: "ok" } }),
);
app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
