const jwt = require("jsonwebtoken");


const verifyToken = (req, res, next) => {
  const token =
    req.body.token || req.query.token || req.headers["x-access-token"];

  if (!token) {
    return res.status(403).send({
        message: "fail",
        data: "Connection token is missing",
      });
  }
  try {
      
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userExists = await UserModel.findById(decoded.user._id);
    if (!userExists)
      return res.status(401).send({
        message: "fail",
        data: "user not connected",
      });
    req.user = userExists;
  } catch (err) {
    return res.status(401).send({
        message: "fail",
        data: err,
      });
  }
  return next();
};

module.exports = verifyToken;