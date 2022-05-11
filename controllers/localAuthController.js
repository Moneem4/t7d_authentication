const bcrypt = require("bcrypt");
const UserModel = require("../models/userModel");
var amqp = require("amqplib");
const ipRegex = require("ip-regex");
var geoip = require("geoip-lite");
const jwt = require("jsonwebtoken");
const sgMail = require("@sendgrid/mail");

// islam rabbit mq START //
const QUEUE_NAME = "square";
const EXCHANGE_TYPE = "direct";
const EXCHANGE_NAME = "main";
const KEY = "myKey";
const number = "5";
// islam rabbit mq END //
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const client = require("twilio")(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);
let connection;
let channel;
const rabbitConnect = async () => {
  try {
    // connection = await amqp.connect("amqp://localhost");
    connection = await amqp.connect("amqp://Galactech:rabbit@15.237.12.241");
    channel = await connection.createChannel();
    await channel.assertQueue("addProfil");
  } catch (error) {
    console.log(error);
  }
};
rabbitConnect();

exports.register = async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    var ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    let user;

    if (!ipRegex().test(`unicorn ${ip}`)) {
      res.status(400).json({ message: "ip invalid" });
    }
    if (req.body.password != req.body.confirmPassword) {
      return res.status(400).json({
        message: "check your password",
      });
    }
    let userExist;
    userExist = await UserModel.findOne({ phone: req.body.phone });
    if (userExist)
      return res.status(401).json({ message: "user already exist", data: null });

    //
    //????
    // userExist = await UserModel.findOne({ email: req.body.email });
    // if (userExist)
    //   return res.status(401).json({ message: "user alrady exist", data: null });

    userExist = await UserModel.findOne({ username: req.body.username.toLowerCase() });
    if (userExist)
      return res.status(401).json({ message: "user already exist", data: null });
    var geo = geoip.lookup(ip);
    user = new UserModel({
      username: req.body.username.toLowerCase(),
      password: hashedPassword,
      phone: req.body.phone,
      country: req.body.country,
      // email: req.body.email,
      src: {
        ip: ip,
        // city: geo.city,
        // region: geo.region,
      },
      from: "LOCAL",
    });

    await user.save();
    const tokenBody = { _id: user._id };
    const token = jwt.sign({ user: tokenBody }, process.env.JWT_SECRET);
    sendSms(user.phone);

    res.send({
      message: "success",
      data: {
        _id: user._id,
        username: user.username,
        password: user.password,
        phone: user.phone,
        country: user.country,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        from: user.from,
        activatedAccount: user.activatedAccount,
        src: {
          ip: user.src.ip,
        },
        token: token,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error .",
      error,
    });
  }
};

exports.activateAccount = async (req, res) => {
  try {
    const { user_id, activationCode } = req.body;
    const userExist = await UserModel.findOne({ _id: user_id });
    if (!userExist) res.status(401).json("user dosen't exist");
    client.verify
      .services(process.env.TWILIO_MESSAGING_VERIFY)
      .verificationChecks.create({ to: userExist.phone, code: activationCode })
      .then(async (verification_check) => {
        if (verification_check.status == "pending")
          return res.status(401).send({ message: "the code is incorrect" });
        if (verification_check.status == "expired")
          return res.status(401).send({ message: "the code is incorrect" });
        if (verification_check.status == "approved") {
          await UserModel.updateOne(
            { _id: user_id },
            {
              $set: { activatedAccount: true },
            }
          );
          await channel.sendToQueue(
            "addProfil",
            Buffer.from(JSON.stringify(user_id))
          );
          // islam start : send user data to wallet miscroservice
          //create a connection & queue to send user data to t7d_payment microservice (save user data inside his wallet)
          await channel.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE);
          await channel.assertQueue(QUEUE_NAME);
          channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, KEY);
          channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(user_id)));

          return res.status(200).send({ message: "success", data: user_id });
        }
      })
      .catch((e) => {
        console.log(e);
        return res.status(500).send(e);
      });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error .",
      error,
    });
  }
};
exports.resendSms = async (req, res) => {
  try {
    const { user_id } = req.body;
    const userExist = await UserModel.findById(user_id);
    if (!userExist) res.status(401).json("user dosen't exist");
    sendSms(userExist.phone);

    res.send({ message: "success" });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error .",
      error,
    });
  }
};
exports.updateUserPhone = async (req, res) => {
  try {
    const { phone } = req.body;
    const { user_id } = req.body;
    const updatedUser = await UserModel.findByIdAndUpdate(user_id, { phone: phone }, { new: true });
    sendSms(phone);
    res.status(200).json({ message: "success", data: updatedUser });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error .",
      error,
    });
    console.log(error);
  }
};
const sendSms = (phone) => {
  try {
    const messagingId = process.env.TWILIO_MESSAGING_VERIFY;
    client.verify
      .services(messagingId)
      .verifications.create({ to: phone, channel: "sms" })
      .then((verification) => console.log(verification.status))
      .catch((e) => {
        return res.status(500).send(e);
      });
  } catch (error) {
    console.log(error);
  }
};

exports.deleteOneUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userExist = await UserModel.findOne({ _id: id });
    if (!userExist) res.status(401).json("profil dosen't exist");
    const response = await userExist.deleteOne({ _id: id });
    res.status(202).json(response);
  } catch (error) {
    res.status(500).json({
      message: "Internal server error .",
      error,
    });
  }
};
// find one user by id
exports.findOneUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userExist = await UserModel.findOne({ _id: id });
    if (!userExist) res.status(401).json("user dosen't exist");
    res.status(200).json(userExist);
  } catch (error) {
    res.status(500).json({
      message: "Internal server error .",
      error,
    });
  }
};
// find all users
exports.findAllUser = async (req, res) => {
  try {
    const { id } = req.params;
    const users = await UserModel.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: "Internal server error .",
      error,
    });
  }
};
exports.forgotPassword = async (req, res) => {
  const { phone } = req.body;

  try {
    const userExists = await UserModel.findOne({ phone });
    if (!userExists)
      return res.status(400).json({
        msg: "This email does not exist .",
      });

    sendSms(phone);

    const body = { _id: userExists._id };
    const token = jwt.sign({ user: body }, process.env.JWT_SECRET, {
      expiresIn: "10m",
    });
    res.send({
      message: "success",
      data: token,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error .",
      error,
    });
  }
};

exports.validOtpNumber = async (req, res) => {
  let { token, activationCode } = req.body;
  try {
    const decodedToken = await jwt.verify(token, process.env.JWT_SECRET);
    const { _id } = decodedToken.user;
    console.log(_id);

    const userExists = await UserModel.findById(_id);
    if (!userExists)
      return res.status(400).json({
        msg: "This user does not exist .",
      });
    client.verify
      .services(process.env.TWILIO_MESSAGING_VERIFY)
      .verificationChecks.create({ to: userExists.phone, code: activationCode })
      .then(async (verification_check) => {
        if (verification_check.status == "pending")
          res.status(401).send("the code is incorrect");
        if (verification_check.status == "expired")
          res.status(401).send("the code is expired");
        if (verification_check.status == "approved") {
          res.status(200).json({
            message: "success",
          });
        }
      });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error .",
      error,
    });
  }
};
exports.newPassword = async (req, res) => {
  //reset link is the token
  let { token, newPassword } = req.body;

  try {
    const decodedToken = await jwt.verify(token, process.env.JWT_SECRET);
    const { _id } = decodedToken.user;

    let user = await User.findOne({ _id });

    if (!user)
      return res.status(400).json({ message: "Something went wrong ." });
    const salt = await bcrypt.genSalt(10);
    newPassword = await bcrypt.hash(newPassword, salt);

    await UserModel.updateOne(
      { _id },
      {
        $set: { password: newPassword },
      }
    );

    res.status(200).json({ message: "Password has been reset ." });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error .",
      error,
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const entries = Object.keys(req.body);
    const updates = {};
    // constructing dynamic query
    for (let i = 0; i < entries.length; i++) {
      updates[entries[i]] = Object.values(req.body)[i];
    }
    User.updateOne(
      {
        id,
      },
      {
        $set: updates,
      },
      function (err, success) {
        if (err) throw err;
        else {
          res.send({
            message: "update success",
          });
        }
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error .",
      error,
    });
  }
};
exports.getUserConnected = async (req, res) => {
  const { token } = req.params;
  if (!token) {
    return res.status(403).send({
      message: "fail",
      data: "Connection token is missing",
    });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded)
      return res.status(401).send({
        message: "fail",
        data: "token expired",
      });
    const userExists = await UserModel.findById(decoded.user._id);
    // req.user = userExists;
    res.status(200).send({
      message: "succes",
      data: userExists,
    });
  } catch (err) {
    return res.status(401).send({
      message: "fail",
      data: err,
    });
  }
};

exports.modifyPassword = async (req, res) => {
  //reset link is the token
  let { token, newPassword, currentPassword } = req.body;

  try {
    const decodedToken = await jwt.verify(token, process.env.JWT_SECRET);
    const { _id } = decodedToken.user;

    let user = await User.findOne({ _id });

    if (!user)
      return res.status(400).json({ message: "Something went wrong ." });

    console.log(await bcrypt.compare(currentPassword, user.password));
    if (await bcrypt.compare(currentPassword, user.password)) {
      const salt = await bcrypt.genSalt(10);
      newPassword = await bcrypt.hash(newPassword, salt);
      await UserModel.updateOne(
        { _id },
        {
          $set: { password: newPassword },
        }
      );

      res.status(200).json({ message: "Password has been reset." });
    } else {
      res.status(403).json({ message: "Password does not match." });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error .",
      error,
    });
  }
};
