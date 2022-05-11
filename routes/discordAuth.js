const express = require("express");
const router = express.Router();
const passport = require("passport");

// GET /auth/discord
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in discord authentication will involve
//   redirecting the user to discord.com.  After authorization, discord
//   will redirect the user back to this application at /auth/discord/callback

router.get("/discord", passport.authenticate("discord"));

// GET /auth/discord/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
router.get(
  "/discord/callback",
  passport.authenticate("discord", {
    failureRedirect: "/",
  }),
  function (req, res) {
    res.send("<p>auth</p>");
  }
);

module.exports = router;
