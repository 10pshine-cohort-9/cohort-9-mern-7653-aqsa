import dotenv from 'dotenv';
dotenv.config();
import app from './app.js';
import connectDB from "./src/config/db.js";
import logger from "./src/config/logger.js";
const PORT = process.env.PORT || 5000;
const startServer = async()=>{
    await connectDB();
    app.listen(PORT, () => {
        logger.info(`Server running on port ${PORT}`);
    });
};
startServer();