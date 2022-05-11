const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    discordId: {
      type: String,
    },
    googleId: {
      type: String,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      max: 64,
    },
    phone: {
      type: String,
      trim: true,
      lowercase: true,
    },
    src: {
      ip: { type: String },
      region: {
        type: String,
      },
      city: {
        type: String,
      },
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
    },

    // activationCode: {
    //   type: String,
    //   default: "",
    // },
    activatedAccount: {
      type: Boolean,
      default: false,
    },
    from: {
      type: String,
      enum: ["GOOGLE", "DISCORD", "FACEBOOK", "LOCAL"],
    },
    resetLink: {
      type: String,
    },
    country : {
      type : String
    }
  },
  { timestamps: true }
);

function arrayLimit(limit) {
  return limit.length <= 5;
}

module.exports = User = mongoose.model("User", userSchema);
