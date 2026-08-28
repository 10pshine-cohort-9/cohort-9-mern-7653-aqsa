import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";

export const registerUser = async ({ username, email, password }) => {
  try {
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      throw new ApiError(400, "Username already exists");
    }
  const emailExists = await User.findOne({ email });
    if (emailExists) {
      throw new ApiError(400, "Email already exists");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });
    return user;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error.code === 11000) {
      throw new ApiError(400, "Username or email already exists");
    }
    throw error;
  }
};
export const loginUser = async ({ email, password }) => {
  try {
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      throw new ApiError(400, "Invalid email or password");
    }
    if (user.provider === "google") {
      throw new ApiError(400, "Please login with Google");
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new ApiError(400, "Invalid email or password");
    }
    return user;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw error;
  }
};

export const forgotPasswordService = async (email) => {
  const user = await User.findOne({ email });
  if (!user || user.provider === "google") {
    return true;
  }
  const otp = crypto.randomInt(100000, 1000000).toString();
  user.resetPasswordOtp = await bcrypt.hash(otp, 10);
  user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  user.resetPasswordAttempts = 0;
  await user.save();
  try {
    await sendEmail({
      email: user.email,
      subject: "Password Reset OTP",
      message: `Your password reset OTP is ${otp}. It expires in 15 minutes.`,
    });
  } catch (error) {
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    throw error;
  }
  return true;
};
export const resetPasswordService = async (email,otp,password) => {
  const user = await User.findOneAndUpdate(
    {
      email,
      resetPasswordExpire: {
        $gt: Date.now(),
      },
      resetPasswordAttempts: {
        $lt: 5,
      },
    },
    {
      $inc: {
        resetPasswordAttempts: 1,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  ).select("+password +resetPasswordOtp +resetPasswordAttempts");
  if (!user) {
    throw new ApiError(
      429,
      "Too many OTP attempts. Please request a new OTP."
    );
  }
  const isValidOtp = await bcrypt.compare(
    otp,
    user.resetPasswordOtp
  );
  if (!isValidOtp) {
    throw new ApiError(
      400,
      "Invalid or expired OTP"
    );
  }
  user.password = await bcrypt.hash(
    password,
    10
  );
  user.resetPasswordOtp = undefined;
  user.resetPasswordExpire = undefined;
  user.resetPasswordAttempts = 0;
  await user.save();
  return true;
};