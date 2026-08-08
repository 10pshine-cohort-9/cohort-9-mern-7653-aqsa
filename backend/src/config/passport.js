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
        let user = await User.findOne({
          email: profile.emails[0].value,
        });
        if (!user) {
            let username =profile.displayName?.trim().replace(/\s+/g, "").toLowerCase() || "user";
            username = username.substring(0, 20);
            const baseUsername = username;
            let counter = 1;
            while (await User.findOne({ username })) {
              const suffix = String(counter);
              const maxBaseLength = 20 - suffix.length;
              username = `${baseUsername.substring(0, maxBaseLength)}${suffix}`;
              counter++;
  }
  user = await User.create({
    username,
    email: profile.emails[0].value,
    googleId: profile.id,
    provider: "google",
  });
        } else {
          if (user.googleId && user.googleId !== profile.id) {
            return done(
              new Error(
                "This email is already linked to another Google account."
              ),
              null
            );
          }
          if (!user.googleId) {
            user.googleId = profile.id;
          }
          if (user.provider !== "local") {
            user.provider = "google";
          }
          await user.save();
        }
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);
export default passport;