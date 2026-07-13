const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();

const notFoundMiddleware = require("./middlewares/not-found.middleware");
const requestLoggerMiddleware = require("./middlewares/request-logger.middleware");
const errorMiddleware = require("./middlewares/error.middleware");

const authRoutes = require("./routes/auth.routes");
const categoryRoutes = require("./routes/category.routes");
const transactionRoutes = require("./routes/transaction.route");
const budgetRoutes = require("./routes/budget.routes");
const aiRoutes = require("./routes/ai.routes");
const syncRoutes = require("./routes/sync.routes");

app.use(express.json());

app.use(cookieParser());

app.use(requestLoggerMiddleware);

//========================================================
// CORS Configuration (Set up to allow communication between Frontend and Backend)
//========================================================
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000", "http://localhost:5173"];

  app.use(
  cors({
    origin: (origin, callback) => {
      // Cho phép requests không có origin (như Mobile App, Postman hoặc curl)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Blocked by CORS policy"));
      }
    },
    credentials: true,
    methods: "GET,POST,PATCH,DELETE,OPTIONS",
    allowedHeaders: "Content-Type,Authorization,Cookie",
  })
);

// app.use((req, res, next) => {
//   const origin = req.headers.origin;
//   if (origin) {
//     res.setHeader("Access-Control-Allow-Origin", origin);
//   } else {
//     res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "*");
//   }
//   res.setHeader("Access-Control-Allow-Credentials", "true");
//   res.setHeader(
//     "Access-Control-Allow-Methods",
//     "GET,POST,PATCH,DELETE,OPTIONS",
//   );
//   res.setHeader(
//     "Access-Control-Allow-Headers",
//     "Content-Type, Authorization, Cookie",
//   );

//   if (req.method === "OPTIONS") {
//     return res.sendStatus(204);
//   }

//   return next();
// });

//========================================================
// API Routes (API Routes - Linking to Controller Files)
//========================================================

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Backend server is running...",
  });
});

app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "Backend server is running..."
  }
  )
})

app.use("/auth", authRoutes);

app.use("/categories", categoryRoutes);

app.use("/transactions", transactionRoutes);

app.use("/budgets", budgetRoutes);

app.use("/ai", aiRoutes);

app.use("/sync", syncRoutes);

app.use(notFoundMiddleware);

app.use(errorMiddleware);

module.exports = app;
