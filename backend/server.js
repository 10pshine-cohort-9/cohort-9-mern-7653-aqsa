import dotenv from 'dotenv';
dotenv.config();
import app from './app.js';
import connectDB from "./src/config/db.js";
import logger from "./src/config/logger.js";
const PORT = process.env.PORT || 5000;
const startServer = async()=>{
    try{
        await connectDB();
        app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
        });
    }catch(error){
        logger.error(error, "Failed to start server");
        process.exit(1);
    }
   
};
startServer().catch((error) => {
    logger.error(error, "Unhandled startup error");
    process.exit(1);
});