const express = require("express");

const app = express();

const notFoundMiddleware = require("./middlewares/not-found.middleware");
const requestLoggerMiddleware = require("./middlewares/request-logger.middleware");
const errorMiddleware = require("./middlewares/error.middleware");

const authRoutes = require("./routes/auth.routes");

app.use(express.json());

app.use(requestLoggerMiddleware);

//========================================================
// CORS Configuration (Set up to allow communication between Frontend and Backend)
//========================================================
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PATCH,DELETE,OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  return next();
});


//========================================================
// API Routes (API Routes - Linking to Controller Files)
//========================================================

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Backend server is running..."
  });
});

app.use("/auth", authRoutes);

app.use(notFoundMiddleware);

app.use(errorMiddleware);

module.exports = app;