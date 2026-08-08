import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import logger from "./src/config/logger.js";
import errorHandler from "./src/middleware/error.middleware.js";
import notFound from "./src/middleware/notFound.middleware.js";
import authRoutes from "./src/routes/auth.routes.js";
import passport from "./src/config/passport.js";

const app = express();
app.use(helmet());
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.raw?.path ?? req.path,
        };
      },
    },
  })
);
app.use(passport.initialize());
app.get("/", (req, res) => {
  req.log.info("Root endpoint called");

  res.json({
    success: true,
    message: "API is running",
  });
});
app.use("/api/auth", authRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;