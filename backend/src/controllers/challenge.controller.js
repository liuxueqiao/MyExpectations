const Challenge = require("../models/Challenge");
const Team = require("../models/Team");
const WeightRecord = require("../models/WeightRecord");
const { ensureWeeklyChallenge, joinCurrentChallenge } = require("../services/challenge.service");
const { startOfWeekMonday, toDateOnlyKey } = require("../utils/date");
const { safeDeltaKg, safeLossRate } = require("../utils/privacy");
const { todayKeyCN } = require("./weight.controller");

async function getCurrent(req, res, next) {
  try {
    const challenge = await ensureWeeklyChallenge(new Date());
    const joined = challenge.participants.some((p) => String(p.userId) === String(req.user.id));
    return res.json({
      challenge: {
        id: String(challenge._id),
        title: challenge.title,
        weekKey: challenge.weekKey,
        startAt: challenge.startAt,
        endAt: challenge.endAt,
        targetLossKg: challenge.targetLossKg,
        joinedCount: challenge.participants.length,
        joined
      }
    });
  } catch (err) {
    return next(err);
  }
}

async function join(req, res, next) {
  try {
    const challenge = await joinCurrentChallenge({ userId: req.user.id, now: new Date() });
    return res.json({
      ok: true,
      challengeId: String(challenge._id)
    });
  } catch (err) {
    return next(err);
  }
}

async function getTeamRank(req, res, next) {
  try {
    const todayKey = todayKeyCN();
    const weekStartKey = toDateOnlyKey(startOfWeekMonday(new Date()));

    const challenge = await Challenge.findOne({ weekKey: weekStartKey }).lean();
    if (!challenge) return res.json({ items: [], weekKey: weekStartKey });

    const team = await Team.findOne({ members: req.user.id }).lean();
    if (!team) return res.json({ items: [], weekKey: weekStartKey });

    const memberIds = team.members.map((id) => String(id));
    const participantIds = new Set(
      (challenge.participants || []).map((p) => String(p.userId)).filter((x) => memberIds.includes(x))
    );

    const ids = Array.from(participantIds);
    if (!ids.length) return res.json({ items: [], weekKey: weekStartKey });

    const startWeights = await WeightRecord.find(
      { userId: { $in: ids }, dateKey: weekStartKey },
      { userId: 1, weightKg: 1 }
    ).lean();
    const endWeights = await WeightRecord.find(
      { userId: { $in: ids }, dateKey: todayKey },
      { userId: 1, weightKg: 1 }
    ).lean();

    const startMap = new Map(startWeights.map((r) => [String(r.userId), r.weightKg]));
    const endMap = new Map(endWeights.map((r) => [String(r.userId), r.weightKg]));

    const users = await require("../models/User")
      .find({ _id: { $in: ids } }, { nickname: 1, avatarUrl: 1 })
      .lean();
    const userMap = new Map(users.map((u) => [String(u._id), u]));

    const items = ids
      .map((uid) => {
        const startKg = startMap.get(uid) ?? null;
        const endKg = endMap.get(uid) ?? null;
        const deltaKg = safeDeltaKg(startKg, endKg);
        const lossRate = safeLossRate(startKg, endKg);
        const u = userMap.get(uid) || { nickname: "", avatarUrl: "" };
        const isSelf = uid === String(req.user.id);
        return {
          userId: uid,
          nickname: u.nickname,
          avatarUrl: u.avatarUrl,
          deltaKg,
          lossRate,
          ...(isSelf ? { startWeightKg: startKg, endWeightKg: endKg } : {})
        };
      })
      .sort((a, b) => (b.lossRate ?? -999) - (a.lossRate ?? -999));

    return res.json({
      weekKey: weekStartKey,
      team: { id: String(team._id), name: team.name },
      items
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getCurrent, join, getTeamRank };

