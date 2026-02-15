const Challenge = require("../models/Challenge");
const { ChallengeParticipant } = require("../models/Challenge");
const Team = require("../models/Team");
const User = require("../models/User");
const WeightRecord = require("../models/WeightRecord");
const { Op } = require("sequelize");
const {
  ensureWeeklyChallenge,
  joinCurrentChallenge,
} = require("../services/challenge.service");
const { startOfWeekMonday, toDateOnlyKey } = require("../utils/date");
const { safeDeltaKg, safeLossRate } = require("../utils/privacy");
const { todayKeyCN } = require("./weight.controller");

async function getCurrent(req, res, next) {
  try {
    const challenge = await ensureWeeklyChallenge(new Date());
    const joinedCount = await ChallengeParticipant.count({
      where: { challengeId: String(challenge.id) },
    });
    const joined = Boolean(
      await ChallengeParticipant.findOne({
        where: {
          challengeId: String(challenge.id),
          userId: String(req.user.id),
        },
        attributes: ["id"],
        raw: true,
      })
    );
    return res.json({
      challenge: {
        id: String(challenge.id),
        title: challenge.title,
        weekKey: challenge.weekKey,
        startAt: challenge.startAt,
        endAt: challenge.endAt,
        targetLossKg: challenge.targetLossKg,
        joinedCount,
        joined,
      },
    });
  } catch (err) {
    return next(err);
  }
}

async function join(req, res, next) {
  try {
    const challenge = await joinCurrentChallenge({
      userId: req.user.id,
      now: new Date(),
    });
    return res.json({
      ok: true,
      challengeId: String(challenge.id),
    });
  } catch (err) {
    return next(err);
  }
}

async function getTeamRank(req, res, next) {
  try {
    const todayKey = todayKeyCN();
    const weekStartKey = toDateOnlyKey(startOfWeekMonday(new Date()));

    const challenge = await Challenge.findOne({
      where: { weekKey: weekStartKey },
    });
    if (!challenge) return res.json({ items: [], weekKey: weekStartKey });

    const me = await User.findByPk(String(req.user.id), { raw: true });
    if (!me?.teamId) return res.json({ items: [], weekKey: weekStartKey });
    const team = await Team.findByPk(String(me.teamId), { raw: true });
    if (!team) return res.json({ items: [], weekKey: weekStartKey });

    const members = await User.findAll({
      where: { teamId: String(team.id) },
      attributes: ["id", "nickname", "avatarUrl"],
      raw: true,
    });
    const memberIds = members.map((m) => String(m.id));

    const participants = await ChallengeParticipant.findAll({
      where: {
        challengeId: String(challenge.id),
        userId: { [Op.in]: memberIds },
      },
      attributes: ["userId"],
      raw: true,
    });
    const ids = participants.map((p) => String(p.userId));
    if (!ids.length) return res.json({ items: [], weekKey: weekStartKey });

    const startWeights = await WeightRecord.findAll({
      where: { userId: { [Op.in]: ids }, dateKey: weekStartKey },
      attributes: ["userId", "weightKg"],
      raw: true,
    });
    const endWeights = await WeightRecord.findAll({
      where: { userId: { [Op.in]: ids }, dateKey: todayKey },
      attributes: ["userId", "weightKg"],
      raw: true,
    });

    const startMap = new Map(
      startWeights.map((r) => [String(r.userId), r.weightKg])
    );
    const endMap = new Map(
      endWeights.map((r) => [String(r.userId), r.weightKg])
    );

    const userMap = new Map(members.map((u) => [String(u.id), u]));

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
          ...(isSelf ? { startWeightKg: startKg, endWeightKg: endKg } : {}),
        };
      })
      .sort((a, b) => (b.lossRate ?? -999) - (a.lossRate ?? -999));

    return res.json({
      weekKey: weekStartKey,
      team: { id: String(team.id), name: team.name },
      items,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getCurrent, join, getTeamRank };
