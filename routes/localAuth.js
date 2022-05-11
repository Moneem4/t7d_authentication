const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const {
  register,
  activateAccount,
  resendSms,
  deleteOneUser,
  findAllUser,
  findOneUser,
  updateUser,
  forgotPassword,
  newPassword,
  getUserConnected,
  validOtpNumber,
  modifyPassword,
  updateUserPhone,
} = require("../controllers/localAuthController");

router.post(
  "/login",
  passport.authenticate("local", { failureRedirect: "/login" }),
  function (req, res) {
    const body = { _id: req.user._id };
    const token = jwt.sign({ user: body }, process.env.JWT_SECRET);
    res.send({
      message: "success",
      data: token,
    });
  }
);
//activation account take      { user_id, activationCode }  as body
router.put("/activateAccount", activateAccount);
//resend mail  take      { user_id, }  as body
router.post("/resendMail", resendSms);
//forgotPassword  take      { phone }  as body
router.post("/forgotPassword", forgotPassword);
//newPAssword  take      { token , newPassword }  as body
router.post("/newPassword", newPassword);
//resend password  account take      { token }  as body
router.post("/resendMailForgotPassword", resendSms);
//register take  { username , password , phone}  as body
router.post("/register", register);
//get one user account take  id as param
router.get("/findOne/:id", findOneUser);
//get all users
router.get("/findAll", findAllUser);
//activation account take  id as param
router.delete("/deleteOneUser/:id", deleteOneUser);
//update user account take  json containing ({field : updatedValue})  as body and id as param
router.put("/updateUser/:id", updateUser);
//get user connected
router.get("/getUserConnected/:token", getUserConnected);
//otp validation for password forgot  {token , activationCode}
router.post("/validateOtp", validOtpNumber);

router.post("/modifyPassword", modifyPassword);

//update phone number and send sms verification, { user_id, phone }  as body
router.post("/updatePhone", updateUserPhone);


module.exports = router;
