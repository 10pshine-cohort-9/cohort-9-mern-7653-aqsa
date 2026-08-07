import asyncHandler from "../utils/asyncHandler.js";
import generateToken from "../utils/generateToken.js";
import { registerUser, loginUser } from "../services/auth.service.js";

export const register = asyncHandler(async(req,res) =>{
    console.log("hitting controller")
    const user=await registerUser(req.body);
    const token=generateToken(user._id);
    res.status(201).json({
        success:true,
        message:"User registered successfully",
        token,
        user:{
            id:user._id,
            username:user.username,
            email:user.email,
        }
    })
});
export const login=asyncHandler(async(req,res)=>{
    const user=await loginUser(req.body);
    const token=generateToken(user._id);
    res.status(200).json({
        success:true,
        message:"User logged in successfully",
        token,
        user:{
            id:user._id,
            username:user.username,
            email:user.email,
        }
    })
})
export const googleCallback = (req, res) => {
    const token = generateToken(req.user._id);
    res.status(200).json({
        success: true,
        message: "Google Login Successful",
        token,
        user: {
            id: req.user._id,
            username: req.user.username,
            email: req.user.email
        }
    });
};
export const getProfile = (req, res) => {
    res.status(200).json({
        success: true,
        user: req.user
    });
};
export const logout = (req, res) => {
    res.status(200).json({
        success: true,
        message: "Logged out successfully. Please remove the token on the client."
    });
};