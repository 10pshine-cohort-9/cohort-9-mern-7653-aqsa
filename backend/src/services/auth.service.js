import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";

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