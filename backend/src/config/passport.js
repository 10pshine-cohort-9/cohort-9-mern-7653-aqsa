import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/user.model.js";
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "/api/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                let user=await User.findOne({email:profile.emails[0].value});
                if(!user){
                    user=await User.create({
                         username: profile.displayName.replace(/\s+/g, "").toLowerCase(),
                        email: profile.emails[0].value,
                        googleId: profile.id,
                        provider: "google"
                    });
                }else{
                    if (!user.googleId) {
                        user.googleId = profile.id;
                      user.provider = "google";
                        await user.save();
                    }
                }
                done(null, user);
                
            }catch (error) {
                 done(error, null);
            }
    })
);
export default passport;