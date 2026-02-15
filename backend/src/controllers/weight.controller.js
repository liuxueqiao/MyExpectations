const WeightRecord = require("../models/WeightRecord");
const User = require("../models/User");
const { toDateOnlyKey } = require("../utils/date");
const { applyCheckInStreak } = require("../services/streak.service");

function todayKeyCN() {
  const now = new Date();
  const cn = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Shanghai" })
  );
  return toDateOnlyKey(cn);
}

async function checkIn(req, res, next) {
  try {
    const weightKg = Number(req.body?.weightKg);
    if (!Number.isFinite(weightKg) || weightKg < 20 || weightKg > 300) {
      return res.status(400).json({
        error: { code: "BAD_REQUEST", message: "weightKg out of range" },
      });
    }

    const dateKey = todayKeyCN();

    const existing = await WeightRecord.findOne({
      where: { userId: String(req.user.id), dateKey },
      raw: true,
    });
    if (existing) {
      return res.status(409).json({
        error: {
          code: "ALREADY_CHECKED_IN",
          message: "Already checked in today",
        },
      });
    }

    await WeightRecord.create({
      userId: String(req.user.id),
      dateKey,
      weightKg,
    });

    const user = await User.findByPk(String(req.user.id));
    if (!user) {
      return res
        .status(401)
        .json({ error: { code: "UNAUTHORIZED", message: "User not found" } });
    }
    applyCheckInStreak(user, dateKey);
    await user.save();

    return res.json({
      ok: true,
      dateKey,
      streakDays: user.streakDays,
    });
  } catch (err) {
    if (err?.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        error: {
          code: "ALREADY_CHECKED_IN",
          message: "Already checked in today",
        },
      });
    }
    return next(err);
  }
}

async function getHistory(req, res, next) {
  try {
    const limit = Math.min(90, Math.max(1, Number(req.query?.limit || 30)));
    const records = await WeightRecord.findAll({
      where: { userId: String(req.user.id) },
      order: [["dateKey", "DESC"]],
      limit,
      raw: true,
    });

    return res.json({
      items: records.map((r) => ({
        id: String(r.id),
        dateKey: r.dateKey,
        weightKg: r.weightKg,
      })),
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { checkIn, getHistory, todayKeyCN };
