const crypto = require("crypto");
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Article = sequelize.define(
  "Article",
  {
    id: {
      type: DataTypes.STRING(24),
      primaryKey: true,
      defaultValue: () => crypto.randomBytes(12).toString("hex"),
    },
    title: { type: DataTypes.STRING(256), allowNull: false },
    coverUrl: {
      type: DataTypes.STRING(1024),
      allowNull: false,
      defaultValue: "",
    },
    content: {
      type: DataTypes.TEXT("long"),
      allowNull: false,
      defaultValue: "",
    },
    status: {
      type: DataTypes.ENUM("draft", "published"),
      allowNull: false,
      defaultValue: "published",
    },
    publishedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
  },
  { tableName: "articles", timestamps: true }
);

module.exports = Article;
