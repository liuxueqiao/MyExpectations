const crypto = require("crypto");
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.STRING(24),
      primaryKey: true,
      defaultValue: () => crypto.randomBytes(12).toString("hex"),
    },
    openid: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    nickname: {
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: "",
    },
    avatarUrl: {
      type: DataTypes.STRING(512),
      allowNull: false,
      defaultValue: "",
    },

    initialWeightKg: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: null,
    },
    targetWeightKg: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: null,
    },
    heightCm: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },

    teamId: { type: DataTypes.STRING(24), allowNull: true, defaultValue: null },

    lastCheckInDateKey: {
      type: DataTypes.STRING(16),
      allowNull: true,
      defaultValue: null,
    },
    streakDays: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    tableName: "users",
    timestamps: true,
    indexes: [{ unique: true, fields: ["openid"] }],
  }
);

module.exports = User;
