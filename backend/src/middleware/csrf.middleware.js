const csrfProtection = (req, res, next) => {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
        const origin = req.get("Origin");

        const allowedOrigins = (process.env.FRONTEND_ORIGINS || "http://localhost:5173")
            .split(",")
            .map((origin) => origin.trim())
            .filter(Boolean);

        if (!origin || !allowedOrigins.includes(origin)) {
            return res.status(403).json({
                success: false,
                message: "CSRF validation failed",
            });
        }
    }

    next();
};

export default csrfProtection;