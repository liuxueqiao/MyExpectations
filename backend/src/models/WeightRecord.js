const crypto = require("crypto");
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const WeightRecord = sequelize.define(
  "WeightRecord",
  {
    id: {
      type: DataTypes.STRING(24),
      primaryKey: true,
      defaultValue: () => crypto.randomBytes(12).toString("hex"),
    },
    userId: { type: DataTypes.STRING(24), allowNull: false },
    dateKey: { type: DataTypes.STRING(16), allowNull: false },
    weightKg: { type: DataTypes.FLOAT, allowNull: false },
  },
  {
    tableName: "weight_records",
    timestamps: true,
    indexes: [
      { unique: true, fields: ["userId", "dateKey"] },
      { fields: ["userId"] },
      { fields: ["dateKey"] },
    ],
  }
);

module.exports = WeightRecord;
