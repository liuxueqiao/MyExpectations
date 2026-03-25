const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    openid: { type: String, required: true, unique: true, index: true },
    nickname: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },

    initialWeightKg: { type: Number, default: null },
    targetWeightKg: { type: Number, default: null },
    heightCm: { type: Number, default: null },

    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },

    lastCheckInDateKey: { type: String, default: null },
    streakDays: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);

