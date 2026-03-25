const mongoose = require("mongoose");

const WeightRecordSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    dateKey: { type: String, required: true, index: true },
    weightKg: { type: Number, required: true }
  },
  { timestamps: true }
);

WeightRecordSchema.index({ userId: 1, dateKey: 1 }, { unique: true });

module.exports = mongoose.model("WeightRecord", WeightRecordSchema);

