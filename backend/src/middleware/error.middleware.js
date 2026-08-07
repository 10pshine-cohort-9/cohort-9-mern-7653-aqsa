import logger from '../config/logger.js';
const errorHandler = (err, req, res, next) => {
    logger.error({
        message:err.message,
        method:req.method,
        url:req.originalUrl,
        stack:err.stack
    });
    res.status(err.statusCode|| 500).json({
        success: false,
        error: err.message ||'Internal Server Error'
    });
};
export default errorHandler;