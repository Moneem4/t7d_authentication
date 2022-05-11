require("dotenv").config();

const express = require("express");
const connectDB = require("./config/connectDB");
const cors = require("cors");
const passport = require("passport");
const passportSetup = require("./config/passport-setup");
const discordAuth = require("./routes/discordAuth");
const facebookAuth = require("./routes/facebookAuth");
const localAuth = require("./routes/localAuth");
const fs = require("fs");

const morgan = require("morgan");
const ecsFormat = require("@elastic/ecs-morgan-format");
const app = express();
app.use(express.json());
app.use(cors());
app.use(require("cookie-parser")());
app.use(require("body-parser").urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(
  require("express-session")({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);
// app.use(morgan( 'dev' )) 

app.use(morgan(ecsFormat({ format: 'tiny' }))) 



app.use("/socialDiscord", discordAuth);
app.use("/socialFacebook", facebookAuth);
app.use("/local", localAuth);

const PORT = process.env.PORT || 3000;

connectDB();

app.listen(PORT, () => {
  console.log(`Server listning on port ${PORT}`);
});
