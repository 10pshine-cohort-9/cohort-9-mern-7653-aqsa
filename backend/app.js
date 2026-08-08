import express from "express";
import cors from 'cors';
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from 'pino-http';
import logger from './src/config/logger.js';
import errorHandler from './src/middleware/error.middleware.js';
import authRoutes from './src/routes/auth.routes.js';
import passport from './src/config/passport.js';
const app = express();
app.use(helmet());
app.use(
  cors({
    origin: "http://localhost:5173",
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
            }
        }
    })
);
app.use(passport.initialize());

app.get("/",(req, res)=>{
    req.log.info("Root endpoint called");
    res.json({
        success: true,
        message: "API is running"
    });
});
app.use("/api/auth", authRoutes);
app.use(errorHandler);
export default app;