const User = require("../models/User");
const Team = require("../models/Team");
const WeightRecord = require("../models/WeightRecord");
const Challenge = require("../models/Challenge");
const Article = require("../models/Article");
const {
  startOfWeekMonday,
  endOfWeekSunday,
  toDateOnlyKey,
} = require("../utils/date");

function toNumber(v, d) {
  const n = Number(v);
  if (!Number.isFinite(n)) return d;
  return n;
}

async function listUsers(req, res, next) {
  try {
    const limit = toNumber(req.query.limit, 50);
    const offset = toNumber(req.query.offset, 0);
    const q = req.query.q ? String(req.query.q).trim() : "";
    const query = {};
    if (q) {
      query.$or = [
        { nickname: { $regex: q, $options: "i" } },
        { openid: { $regex: q, $options: "i" } },
      ];
    }
    const items = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(Math.min(limit, 200))
      .lean();
    return res.json({
      items: items.map((u) => ({
        id: String(u._id),
        nickname: u.nickname,
        avatarUrl: u.avatarUrl,
        initialWeightKg: u.initialWeightKg,
        targetWeightKg: u.targetWeightKg,
        heightCm: u.heightCm,
        teamId: u.teamId ? String(u.teamId) : null,
        lastCheckInDateKey: u.lastCheckInDateKey,
        streakDays: u.streakDays,
        createdAt: u.createdAt,
      })),
    });
  } catch (err) {
    return next(err);
  }
}

async function listTeams(req, res, next) {
  try {
    const limit = toNumber(req.query.limit, 50);
    const offset = toNumber(req.query.offset, 0);
    const q = req.query.q ? String(req.query.q).trim() : "";
    const query = {};
    if (q) {
      query.name = { $regex: q, $options: "i" };
    }
    const items = await Team.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(Math.min(limit, 200))
      .lean();
    return res.json({
      items: items.map((t) => ({
        id: String(t._id),
        name: t.name,
        ownerId: String(t.ownerId),
        inviteCode: t.inviteCode,
        memberCount: Array.isArray(t.members) ? t.members.length : 0,
        createdAt: t.createdAt,
      })),
    });
  } catch (err) {
    return next(err);
  }
}

async function listWeights(req, res, next) {
  try {
    const limit = toNumber(req.query.limit, 50);
    const offset = toNumber(req.query.offset, 0);
    const userId = req.query.userId;
    const dateFrom = req.query.dateFrom;
    const dateTo = req.query.dateTo;
    const q = {};
    if (userId) q.userId = userId;
    if (dateFrom || dateTo) {
      q.dateKey = {};
      if (dateFrom) q.dateKey.$gte = dateFrom;
      if (dateTo) q.dateKey.$lte = dateTo;
    }
    const items = await WeightRecord.find(q)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(Math.min(limit, 500))
      .lean();
    return res.json({
      items: items.map((w) => ({
        id: String(w._id),
        userId: String(w.userId),
        dateKey: w.dateKey,
        weightKg: w.weightKg,
        createdAt: w.createdAt,
      })),
    });
  } catch (err) {
    return next(err);
  }
}

async function listChallenges(req, res, next) {
  try {
    const limit = toNumber(req.query.limit, 50);
    const offset = toNumber(req.query.offset, 0);
    const q = req.query.q ? String(req.query.q).trim() : "";
    const query = {};
    if (q) {
      query.title = { $regex: q, $options: "i" };
    }
    const items = await Challenge.find(query)
      .sort({ startAt: -1 })
      .skip(offset)
      .limit(Math.min(limit, 200))
      .lean();
    return res.json({
      items: items.map((c) => ({
        id: String(c._id),
        type: c.type,
        title: c.title,
        weekKey: c.weekKey,
        startAt: c.startAt,
        endAt: c.endAt,
        targetLossKg: c.targetLossKg,
        participants: Array.isArray(c.participants)
          ? c.participants.map((p) => ({
              userId: String(p.userId),
              joinedAt: p.joinedAt,
              startWeightKg: p.startWeightKg,
              endWeightKg: p.endWeightKg,
              deltaKg: p.deltaKg,
              lossRate: p.lossRate,
              completed: p.completed,
            }))
          : [],
      })),
    });
  } catch (err) {
    return next(err);
  }
}

async function listArticles(req, res, next) {
  try {
    const limit = toNumber(req.query.limit, 50);
    const offset = toNumber(req.query.offset, 0);
    const q = req.query.q ? String(req.query.q).trim() : "";
    const query = {};
    if (q) {
      query.title = { $regex: q, $options: "i" };
    }
    const items = await Article.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(Math.min(limit, 200))
      .lean();
    return res.json({
      items: items.map((a) => ({
        id: String(a._id),
        title: a.title,
        coverUrl: a.coverUrl,
        content: a.content,
        status: a.status,
        publishedAt: a.publishedAt,
        createdAt: a.createdAt,
      })),
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listUsers,
  listTeams,
  listWeights,
  listChallenges,
  listArticles,
  createChallenge,
  createArticle,
  deleteUser,
  updateUser,
  deleteTeam,
  updateTeam,
  deleteWeight,
  updateWeight,
  deleteChallenge,
  updateChallenge,
  deleteArticle,
  updateArticle,
};

async function createChallenge(req, res, next) {
  try {
    const title = String(req.body?.title || "").trim();
    const targetLossKg = Number(req.body?.targetLossKg || 1);
    const start = req.body?.startAt ? new Date(req.body.startAt) : new Date();
    if (!title) {
      return res
        .status(400)
        .json({ error: { code: "BAD_REQUEST", message: "title is required" } });
    }
    if (!Number.isFinite(targetLossKg) || targetLossKg <= 0) {
      return res.status(400).json({
        error: { code: "BAD_REQUEST", message: "invalid targetLossKg" },
      });
    }
    const startAt = startOfWeekMonday(start);
    const endAt = endOfWeekSunday(start);
    const weekKey = toDateOnlyKey(startAt);
    const existed = await Challenge.findOne({ weekKey });
    if (existed) {
      return res.status(409).json({
        error: {
          code: "CONFLICT",
          message: "challenge already exists for week",
        },
      });
    }
    const challenge = await Challenge.create({
      type: "weight_loss_weekly",
      title,
      weekKey,
      startAt,
      endAt,
      targetLossKg,
      participants: [],
    });
    return res.json({ challengeId: String(challenge._id) });
  } catch (err) {
    return next(err);
  }
}

async function createArticle(req, res, next) {
  try {
    const { title, coverUrl, content, status } = req.body;
    if (!title || !content) {
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST",
          message: "title and content are required",
        },
      });
    }
    const article = await Article.create({
      title,
      coverUrl,
      content,
      status: status || "draft",
      publishedAt: status === "published" ? new Date() : null,
    });
    return res.json({ id: String(article._id) });
  } catch (err) {
    return next(err);
  }
}

// --- Generic Delete/Update Helpers (wrapped for export) ---

async function deleteUser(req, res, next) {
  try {
    await User.findByIdAndDelete(req.params.id);
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    await User.findByIdAndUpdate(req.params.id, req.body);
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function deleteTeam(req, res, next) {
  try {
    await Team.findByIdAndDelete(req.params.id);
    // Optional: Reset users' teamId
    await User.updateMany(
      { teamId: req.params.id },
      { $set: { teamId: null } }
    );
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function updateTeam(req, res, next) {
  try {
    await Team.findByIdAndUpdate(req.params.id, req.body);
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function deleteWeight(req, res, next) {
  try {
    await WeightRecord.findByIdAndDelete(req.params.id);
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function updateWeight(req, res, next) {
  try {
    await WeightRecord.findByIdAndUpdate(req.params.id, req.body);
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function deleteChallenge(req, res, next) {
  try {
    await Challenge.findByIdAndDelete(req.params.id);
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function updateChallenge(req, res, next) {
  try {
    await Challenge.findByIdAndUpdate(req.params.id, req.body);
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function deleteArticle(req, res, next) {
  try {
    await Article.findByIdAndDelete(req.params.id);
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function updateArticle(req, res, next) {
  try {
    const update = { ...req.body };
    if (update.status === "published" && !update.publishedAt) {
      update.publishedAt = new Date();
    }
    await Article.findByIdAndUpdate(req.params.id, update);
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
