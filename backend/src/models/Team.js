const crypto = require("crypto");
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Team = sequelize.define(
  "Team",
  {
    id: {
      type: DataTypes.STRING(24),
      primaryKey: true,
      defaultValue: () => crypto.randomBytes(12).toString("hex"),
    },
    name: { type: DataTypes.STRING(64), allowNull: false },
    ownerId: { type: DataTypes.STRING(24), allowNull: false },
    inviteCode: { type: DataTypes.STRING(16), allowNull: false, unique: true },
  },
  {
    tableName: "teams",
    timestamps: true,
    indexes: [{ unique: true, fields: ["inviteCode"] }],
  }
);

module.exports = Team;
