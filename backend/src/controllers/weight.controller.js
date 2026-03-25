const WeightRecord = require("../models/WeightRecord");
const User = require("../models/User");
const { toDateOnlyKey } = require("../utils/date");
const { applyCheckInStreak } = require("../services/streak.service");

function todayKeyCN() {
  const now = new Date();
  const cn = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Shanghai" }));
  return toDateOnlyKey(cn);
}

async function checkIn(req, res, next) {
  try {
    const weightKg = Number(req.body?.weightKg);
    if (!Number.isFinite(weightKg) || weightKg < 20 || weightKg > 300) {
      return res.status(400).json({
        error: { code: "BAD_REQUEST", message: "weightKg out of range" }
      });
    }

    const dateKey = todayKeyCN();

    const existing = await WeightRecord.findOne({ userId: req.user.id, dateKey }).lean();
    if (existing) {
      return res.status(409).json({
        error: { code: "ALREADY_CHECKED_IN", message: "Already checked in today" }
      });
    }

    await WeightRecord.create({
      userId: req.user.id,
      dateKey,
      weightKg
    });

    const user = await User.findById(req.user.id);
    applyCheckInStreak(user, dateKey);
    await user.save();

    return res.json({
      ok: true,
      dateKey,
      streakDays: user.streakDays
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({
        error: { code: "ALREADY_CHECKED_IN", message: "Already checked in today" }
      });
    }
    return next(err);
  }
}

async function getHistory(req, res, next) {
  try {
    const limit = Math.min(90, Math.max(1, Number(req.query?.limit || 30)));
    const records = await WeightRecord.find({ userId: req.user.id })
      .sort({ dateKey: -1 })
      .limit(limit)
      .lean();

    return res.json({
      items: records.map((r) => ({
        id: String(r._id),
        dateKey: r.dateKey,
        weightKg: r.weightKg
      }))
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { checkIn, getHistory, todayKeyCN };
