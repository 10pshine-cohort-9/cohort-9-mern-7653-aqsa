import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
  username:{
    type: String,
    required: [true, "Username is required"],
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
  },

  email:{
    type: String,
    required: [true, "Email is required"],
    unique: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
  },

  password: {
    type: String,
    required: function(){
      return this.provider === "local";
    },
    minlength:[6, "Password must be at least 6 characters long"],
    select: false,
  },

  googleId:{
    type:String,
    default:null,
  },

  provider:{
    type:String,
    enum:["local","google"],
    default:"local",
  },

  resetPasswordOtp:{
    type:String,
    select:false,
  },

  resetPasswordExpire:{
    type:Date,
    select:false,
  },
  resetPasswordAttempts: {
  type: Number,
  default: 0,
  select: false,
},
}, {
  timestamps: true,
});
const User=mongoose.model("User",userSchema);
export default User;