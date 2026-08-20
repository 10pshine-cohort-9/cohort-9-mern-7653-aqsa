import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import logger from "./src/config/logger.js";
import errorHandler from "./src/middleware/error.middleware.js";
import notFound from "./src/middleware/notFound.middleware.js";
import csrfProtection from "./src/middleware/csrf.middleware.js";
import authRoutes from "./src/routes/auth.routes.js";
import passport from "./src/config/passport.js";
import noteRoutes from "./src/routes/note.routes.js"
import mediaRoutes from "./src/routes/media.routes.js"
import categoryRoutes from "./src/routes/category.routes.js";
import folderRoutes from "./src/routes/folder.routes.js"
import taskRoutes from "./src/routes/task.routes.js"
import stickyRoutes from './src/routes/sticky.routes.js'

const app = express();
app.use(helmet());
const allowedOrigins = (process.env.FRONTEND_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());
app.use(csrfProtection);
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
app.use("/api/notes", noteRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/folders", folderRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/sticky", stickyRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;