import asyncHandler from "../utils/asyncHandler.js";
import generateToken from "../utils/generateToken.js";
import {registerUser,loginUser,forgotPasswordService,resetPasswordService,} from "../services/auth.service.js";

export const register = asyncHandler(async (req, res) => {
  const user = await registerUser(req.body);
  const token = generateToken(user._id);

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
    },
  });
});

export const login = asyncHandler(async (req, res) => {
  const user = await loginUser(req.body);
  const token = generateToken(user._id);

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    success: true,
    message: "User logged in successfully",
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
    },
  });
});

export const googleCallback = (req, res) => {
  const token = generateToken(req.user._id);

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  if (process.env.FRONTEND_URL) {
    return res.redirect(`${process.env.FRONTEND_URL}/google-success`);
  }

  return res.status(200).json({
    success: true,
    message: "Google Login Successful",
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
    },
  });
};

export const getProfile = (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

export const forgotPassword = asyncHandler(async (req, res) => {
  await forgotPasswordService(req.body.email);

  res.status(200).json({
    success: true,
    message: "If an account with that email exists, a password reset otp has been sent.",
  });
});

export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, password } = req.body;
    await resetPasswordService(email, otp, password);

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};