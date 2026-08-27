import express from 'express';
import protect from '../middleware/auth.middleware.js';
import { login, register,googleCallback,getProfile,logout,forgotPassword,resetPassword } from '../controller/authController.js';
import passport from "passport";

import validate from "../middleware/validate.middleware.js";
import {registerValidations,loginValidations} from "../validations/auth.validation.js";
const router=express.Router();
router.post('/register',
    registerValidations,validate,
    register
)
router.post('/login',
    loginValidations,validate,login
)
router.get(
    "/google",
    passport.authenticate("google", {
        scope: ["profile", "email"],
        state:true,
    })
);
router.get(
    "/google/callback",
    passport.authenticate("google", {
        session: false,
        failureRedirect: `${process.env.FRONTEND_URL}/login`,
    }),
    googleCallback
);
router.get(
    "/profile",
    protect,
    getProfile
);
router.post(
  "/forgot-password",
  forgotPassword
);
router.post(
  "/reset-password",
  resetPassword
);
router.post(
    "/logout",
    protect,
    logout
);
export default router;