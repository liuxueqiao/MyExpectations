const Article = require("../models/Article");

async function listLatest(req, res, next) {
  try {
    const limit = Math.min(10, Math.max(1, Number(req.query?.limit || 3)));
    const items = await Article.find({ status: "published" })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(limit)
      .lean();
    return res.json({
      items: items.map((a) => ({
        id: String(a._id),
        title: a.title,
        coverUrl: a.coverUrl,
        publishedAt: a.publishedAt
      }))
    });
  } catch (err) {
    return next(err);
  }
}

async function getById(req, res, next) {
  try {
    const id = req.params.id;
    const a = await Article.findById(id).lean();
    if (!a || a.status !== "published") {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Article not found" } });
    }
    return res.json({
      article: {
        id: String(a._id),
        title: a.title,
        coverUrl: a.coverUrl,
        content: a.content,
        publishedAt: a.publishedAt
      }
    });
  } catch (err) {
    return next(err);
  }
}

async function adminCreate(req, res, next) {
  try {
    const title = String(req.body?.title || "").trim();
    const coverUrl = String(req.body?.coverUrl || "").trim();
    const content = String(req.body?.content || "");
    const status = req.body?.status === "draft" ? "draft" : "published";

    if (!title) {
      return res.status(400).json({ error: { code: "BAD_REQUEST", message: "title is required" } });
    }

    const article = await Article.create({
      title,
      coverUrl,
      content,
      status,
      publishedAt: status === "published" ? new Date() : null
    });

    return res.json({
      article: { id: String(article._id) }
    });
  } catch (err) {
    return next(err);
  }
}

async function adminUpdate(req, res, next) {
  try {
    const id = req.params.id;
    const patch = {};
    if (typeof req.body?.title === "string") patch.title = req.body.title.trim();
    if (typeof req.body?.coverUrl === "string") patch.coverUrl = req.body.coverUrl.trim();
    if (typeof req.body?.content === "string") patch.content = req.body.content;
    if (req.body?.status === "draft" || req.body?.status === "published") {
      patch.status = req.body.status;
      if (req.body.status === "published") patch.publishedAt = new Date();
    }

    const article = await Article.findByIdAndUpdate(id, { $set: patch }, { new: true });
    if (!article) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Article not found" } });
    }

    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listLatest, getById, adminCreate, adminUpdate };

