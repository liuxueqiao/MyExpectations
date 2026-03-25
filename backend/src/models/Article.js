const mongoose = require("mongoose");

const ArticleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    coverUrl: { type: String, default: "" },
    content: { type: String, default: "" },
    status: { type: String, enum: ["draft", "published"], default: "published" },
    publishedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Article", ArticleSchema);

