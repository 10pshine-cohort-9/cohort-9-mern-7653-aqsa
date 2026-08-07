import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
export const registerUser=async({username,email,password})=>{
    const usernameExists=await User.findOne({username});
    if(usernameExists){
        throw new ApiError(400,"Username already exists");
    }
    const emailExists=await User.findOne({email});
    if(emailExists){
        throw new ApiError(400,"Email already exists");
    }

    const hashedPassword=await bcrypt.hash(password,10);
    let user;
    try {
        user = await User.create({
        username,
        email,
        password: hashedPassword,
    });
    } catch (error) {
        if (error.code === 11000) {
            throw new ApiError(400, "Username or email already exists");
        }
        throw error;
}
    return user;
};
export const loginUser=async({email,password})=>{
    const user=await User.findOne({email}).select("+password");
    if(!user){
        throw new ApiError(400,"Invalid email or password");
    }
    if(user.provider==="google"){
        throw new ApiError(400,"Please login with Google");
    }
    const isMatch=await bcrypt.compare(password,user.password);
    if(!isMatch){
        throw new ApiError(400,"Invalid email or password");
    }
    return user;
}