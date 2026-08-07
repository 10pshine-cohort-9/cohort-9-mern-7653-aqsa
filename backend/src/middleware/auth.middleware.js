import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import dotenv from "dotenv";
dotenv.config();
import ApiError from "../utils/ApiError.js";

const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new ApiError(401, "Access denied. No token provided.");
        }
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
            throw new ApiError(404, "User not found.");
        }
        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
};

export default protect;
