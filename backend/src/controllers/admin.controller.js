const User = require("../models/User");
const Team = require("../models/Team");
const WeightRecord = require("../models/WeightRecord");
const Challenge = require("../models/Challenge");
const { ChallengeParticipant } = require("../models/Challenge");
const Article = require("../models/Article");
const { Op, fn, col } = require("sequelize");
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
    const where = q
      ? {
          [Op.or]: [
            { nickname: { [Op.like]: `%${q}%` } },
            { openid: { [Op.like]: `%${q}%` } },
          ],
        }
      : {};

    const items = await User.findAll({
      where,
      order: [["createdAt", "DESC"]],
      offset,
      limit: Math.min(limit, 200),
      raw: true,
    });
    return res.json({
      items: items.map((u) => ({
        id: String(u.id),
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
    const where = q ? { name: { [Op.like]: `%${q}%` } } : {};
    const items = await Team.findAll({
      where,
      order: [["createdAt", "DESC"]],
      offset,
      limit: Math.min(limit, 200),
      raw: true,
    });

    const teamIds = items.map((t) => String(t.id));
    const memberCounts = teamIds.length
      ? await User.findAll({
          where: { teamId: { [Op.in]: teamIds } },
          attributes: ["teamId", [fn("COUNT", col("id")), "cnt"]],
          group: ["teamId"],
          raw: true,
        })
      : [];
    const countMap = new Map(
      memberCounts.map((r) => [String(r.teamId), Number(r.cnt || 0)])
    );

    return res.json({
      items: items.map((t) => ({
        id: String(t.id),
        name: t.name,
        ownerId: String(t.ownerId),
        inviteCode: t.inviteCode,
        memberCount: countMap.get(String(t.id)) || 0,
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
    const where = {};
    if (userId) where.userId = String(userId);
    if (dateFrom || dateTo) {
      where.dateKey = {};
      if (dateFrom) where.dateKey[Op.gte] = String(dateFrom);
      if (dateTo) where.dateKey[Op.lte] = String(dateTo);
    }

    const items = await WeightRecord.findAll({
      where,
      order: [["createdAt", "DESC"]],
      offset,
      limit: Math.min(limit, 500),
      raw: true,
    });
    return res.json({
      items: items.map((w) => ({
        id: String(w.id),
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
    const where = q ? { title: { [Op.like]: `%${q}%` } } : {};
    const items = await Challenge.findAll({
      where,
      order: [["startAt", "DESC"]],
      offset,
      limit: Math.min(limit, 200),
      raw: true,
    });

    const challengeIds = items.map((c) => String(c.id));
    const participants = challengeIds.length
      ? await ChallengeParticipant.findAll({
          where: { challengeId: { [Op.in]: challengeIds } },
          raw: true,
        })
      : [];
    const byChallenge = new Map();
    for (const p of participants) {
      const cid = String(p.challengeId);
      if (!byChallenge.has(cid)) byChallenge.set(cid, []);
      byChallenge.get(cid).push(p);
    }

    return res.json({
      items: items.map((c) => ({
        id: String(c.id),
        type: c.type,
        title: c.title,
        weekKey: c.weekKey,
        startAt: c.startAt,
        endAt: c.endAt,
        targetLossKg: c.targetLossKg,
        participants: (byChallenge.get(String(c.id)) || []).map((p) => ({
          userId: String(p.userId),
          joinedAt: p.joinedAt,
          startWeightKg: p.startWeightKg,
          endWeightKg: p.endWeightKg,
          deltaKg: p.deltaKg,
          lossRate: p.lossRate,
          completed: p.completed,
        })),
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
    const where = q ? { title: { [Op.like]: `%${q}%` } } : {};
    const items = await Article.findAll({
      where,
      order: [["createdAt", "DESC"]],
      offset,
      limit: Math.min(limit, 200),
      raw: true,
    });
    return res.json({
      items: items.map((a) => ({
        id: String(a.id),
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
    const existed = await Challenge.findOne({ where: { weekKey } });
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
    });
    return res.json({ challengeId: String(challenge.id) });
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
    return res.json({ id: String(article.id) });
  } catch (err) {
    return next(err);
  }
}

// --- Generic Delete/Update Helpers (wrapped for export) ---

async function deleteUser(req, res, next) {
  try {
    await User.destroy({ where: { id: String(req.params.id) } });
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    await User.update(req.body || {}, { where: { id: String(req.params.id) } });
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function deleteTeam(req, res, next) {
  try {
    const id = String(req.params.id);
    await Team.destroy({ where: { id } });
    await User.update({ teamId: null }, { where: { teamId: id } });
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function updateTeam(req, res, next) {
  try {
    await Team.update(req.body || {}, { where: { id: String(req.params.id) } });
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function deleteWeight(req, res, next) {
  try {
    await WeightRecord.destroy({ where: { id: String(req.params.id) } });
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function updateWeight(req, res, next) {
  try {
    await WeightRecord.update(req.body || {}, {
      where: { id: String(req.params.id) },
    });
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function deleteChallenge(req, res, next) {
  try {
    const id = String(req.params.id);
    await ChallengeParticipant.destroy({ where: { challengeId: id } });
    await Challenge.destroy({ where: { id } });
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function updateChallenge(req, res, next) {
  try {
    await Challenge.update(req.body || {}, {
      where: { id: String(req.params.id) },
    });
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function deleteArticle(req, res, next) {
  try {
    await Article.destroy({ where: { id: String(req.params.id) } });
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
    await Article.update(update, { where: { id: String(req.params.id) } });
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
