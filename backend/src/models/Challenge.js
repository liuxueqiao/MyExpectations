const crypto = require("crypto");
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Challenge = sequelize.define(
  "Challenge",
  {
    id: {
      type: DataTypes.STRING(24),
      primaryKey: true,
      defaultValue: () => crypto.randomBytes(12).toString("hex"),
    },
    type: {
      type: DataTypes.ENUM("weight_loss_weekly"),
      allowNull: false,
      defaultValue: "weight_loss_weekly",
    },
    title: { type: DataTypes.STRING(256), allowNull: false },
    weekKey: { type: DataTypes.STRING(16), allowNull: false, unique: true },
    startAt: { type: DataTypes.DATE, allowNull: false },
    endAt: { type: DataTypes.DATE, allowNull: false },
    targetLossKg: { type: DataTypes.FLOAT, allowNull: false },
  },
  {
    tableName: "challenges",
    timestamps: true,
    indexes: [{ unique: true, fields: ["weekKey"] }],
  }
);

const ChallengeParticipant = sequelize.define(
  "ChallengeParticipant",
  {
    id: {
      type: DataTypes.STRING(24),
      primaryKey: true,
      defaultValue: () => crypto.randomBytes(12).toString("hex"),
    },
    challengeId: { type: DataTypes.STRING(24), allowNull: false },
    userId: { type: DataTypes.STRING(24), allowNull: false },
    joinedAt: { type: DataTypes.DATE, allowNull: false },
    startWeightKg: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: null,
    },
    endWeightKg: { type: DataTypes.FLOAT, allowNull: true, defaultValue: null },
    deltaKg: { type: DataTypes.FLOAT, allowNull: true, defaultValue: null },
    lossRate: { type: DataTypes.FLOAT, allowNull: true, defaultValue: null },
    completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: "challenge_participants",
    timestamps: true,
    indexes: [
      { unique: true, fields: ["challengeId", "userId"] },
      { fields: ["userId"] },
      { fields: ["challengeId"] },
    ],
  }
);

module.exports = Challenge;
module.exports.ChallengeParticipant = ChallengeParticipant;
