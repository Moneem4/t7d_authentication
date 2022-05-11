const passport = require("passport");
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

//Discord auth strategy
var DiscordStrategy = require("passport-discord").Strategy;
console.log(process.env.CLIENT_REDIRECT_DISCORD);
var scopes = ["identify", "email", "guilds", "guilds.join"];
passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.CLIENT_ID_DISCORD,
      clientSecret: process.env.CLIENT_SECRET_DISCORD,
      callbackURL: process.env.CLIENT_REDIRECT_DISCORD,
      scope: scopes,
    },
    async function (accessToken, refreshToken, profile, cb) {
      let userExist = await User.findOne({ email: profile.email });

      if (userExist) {
        cb(null, userExist);
      }
      let data = {
        email: profile.email,
        username: profile.username,
        activatedAccount: true,
        from: "DISCORD",
      };

      let user = new User(data);
      await user.save();
      cb(null, user);
    }
  )
);

//local strategy
var LocalStrategy = require("passport-local").Strategy;
passport.use(
  new LocalStrategy({ passReqToCallback: true }, function (
    req,
    username,
    password,
    done
  ) {
    User.findOne({ username: req.body.username.toLowerCase() }, async function (err, user) {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false, { message: "Incorrect username." });
      }
      const isMatch = await bcrypt.compare(req.body.password, user.password);

      if (!isMatch) {
        return done(null, false, { message: "Incorrect password." });
      }
      return done(null, user);
    });
  })
);

//facebook strategy
var FacebookStrategy = require("passport-facebook").Strategy;

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACKURL,
    },
    async function (accessToken, refreshToken, profile, done) {
      let userExist = await User.findOne({ email: profile.email });

      if (userExist) {
        done(null, userExist);
      }
      let data = {
        email: profile.email,
        username: profile.username,
        activatedAccount: true,
        from: "FACEBOOK",
      };

      let user = new User(data);
      await user.save();
      done(null, user);
    }
  )
);

// // Google auth strategy
// var GoogleStrategy = require("passport-google-oauth20");

// passport.use(
//   new GoogleStrategy(
//     {
//       consumerKey: process.env.API_KEY_GOOGLE,
//       consumerSecret: process.env.CLIENT_SECRET_GOOGLE,
//       callbackURL: process.env.CLIENT_REDIRECT_GOOGLE,
//     },
//     async function (token, tokenSecret, profile, done) {
//       let userExist = await User.findOne({ email: profile.email });

//       if (userExist) {
//         cb(null, userExist);
//       }
//       let data = {
//         email: profile.email,
//         // username: profile.username,
//         activatedAccount: true,
//         from: "GOOGLE",
//       };

//       let user = new User(data);
//       await user.save();
//       cb(null, user);
//     }
//   )
// );
