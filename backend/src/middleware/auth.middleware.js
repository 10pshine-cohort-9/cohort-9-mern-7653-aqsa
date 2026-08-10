import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";

const protect = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            throw new ApiError(401, "Access denied. Please log in.");
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
            throw new ApiError(404, "User not found.");
        }
        req.user = user;
        next();
    } catch (error) {
        if (
            error instanceof jwt.JsonWebTokenError ||
            error instanceof jwt.TokenExpiredError
        ) {
            error.statusCode = 401;
            error.message = "Invalid or expired token";
        }

        next(error);
    }
};
export default protect;