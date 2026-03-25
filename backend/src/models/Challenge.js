const mongoose = require("mongoose");

const ParticipantSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    joinedAt: { type: Date, required: true },

    startWeightKg: { type: Number, default: null },
    endWeightKg: { type: Number, default: null },
    deltaKg: { type: Number, default: null },
    lossRate: { type: Number, default: null },
    completed: { type: Boolean, default: false }
  },
  { _id: false }
);

const ChallengeSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["weight_loss_weekly"], default: "weight_loss_weekly" },
    title: { type: String, required: true },
    weekKey: { type: String, required: true, unique: true, index: true },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    targetLossKg: { type: Number, required: true },
    participants: { type: [ParticipantSchema], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Challenge", ChallengeSchema);

