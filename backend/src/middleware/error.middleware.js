import logger from "../config/logger.js";
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  logger.error({
    message: err.message,
    method: req.method,
    url: req.path,
    stack: err.stack,
  });
  res.status(statusCode).json({
    success: false,
    error:
      statusCode >= 500
        ? "Internal Server Error"
        : err.message,
  });
};
export default errorHandler;