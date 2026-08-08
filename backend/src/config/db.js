import mongoose from "mongoose";
import logger from "./logger.js";

const connectDB = async()=>{
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        logger.info(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        logger.error(error, "Error connecting to MongoDB");
        process.exit(1);
    }
};

export default connectDB;