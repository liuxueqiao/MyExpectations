const Challenge = require("../models/Challenge");
const { ChallengeParticipant } = require("../models/Challenge");
const WeightRecord = require("../models/WeightRecord");
const { Op } = require("sequelize");
const {
  endOfWeekSunday,
  startOfWeekMonday,
  toDateOnlyKey,
} = require("../utils/date");
const { safeDeltaKg, safeLossRate } = require("../utils/privacy");

function defaultWeeklyTargetKg() {
  return 0.5;
}

function buildWeeklyTitle(startAt, targetLossKg) {
  const weekKey = toDateOnlyKey(startAt);
  return `本周挑战：减重${targetLossKg}kg（${weekKey}）`;
}

async function ensureWeeklyChallenge(now) {
  const startAt = startOfWeekMonday(now);
  const endAt = endOfWeekSunday(now);
  const weekKey = toDateOnlyKey(startAt);

  const existing = await Challenge.findOne({ where: { weekKey } });
  if (existing) return existing;

  const targetLossKg = defaultWeeklyTargetKg();
  const challenge = await Challenge.create({
    type: "weight_loss_weekly",
    title: buildWeeklyTitle(startAt, targetLossKg),
    weekKey,
    startAt,
    endAt,
    targetLossKg,
  });

  return challenge;
}

async function getCurrentWeeklyChallenge(now) {
  const startAt = startOfWeekMonday(now);
  const weekKey = toDateOnlyKey(startAt);
  return Challenge.findOne({ where: { weekKey } });
}

async function joinCurrentChallenge({ userId, now }) {
  const challenge = await ensureWeeklyChallenge(now);

  const already = await ChallengeParticipant.findOne({
    where: { challengeId: challenge.id, userId: String(userId) },
  });
  if (already) return challenge;

  await ChallengeParticipant.create({
    challengeId: challenge.id,
    userId,
    joinedAt: now,
    startWeightKg: null,
    endWeightKg: null,
    deltaKg: null,
    lossRate: null,
    completed: false,
  });

  return challenge;
}

async function computeChallengeResults(challenge) {
  const startKey = toDateOnlyKey(challenge.startAt);
  const endKey = toDateOnlyKey(challenge.endAt);

  const participants = await ChallengeParticipant.findAll({
    where: { challengeId: challenge.id },
  });
  const userIds = participants.map((p) => String(p.userId));

  const startWeights = await WeightRecord.findAll({
    where: { userId: { [Op.in]: userIds }, dateKey: startKey },
    raw: true,
  });
  const endWeights = await WeightRecord.findAll({
    where: { userId: { [Op.in]: userIds }, dateKey: endKey },
    raw: true,
  });

  const startMap = new Map(
    startWeights.map((r) => [String(r.userId), r.weightKg])
  );
  const endMap = new Map(endWeights.map((r) => [String(r.userId), r.weightKg]));

  let changed = false;
  for (const p of participants) {
    const sid = String(p.userId);
    const startKg = startMap.get(sid) ?? null;
    const endKg = endMap.get(sid) ?? null;

    const deltaKg = safeDeltaKg(startKg, endKg);
    const lossRate = safeLossRate(startKg, endKg);
    const completed =
      typeof deltaKg === "number"
        ? deltaKg >= Number(challenge.targetLossKg || 0)
        : false;

    if (
      p.startWeightKg !== startKg ||
      p.endWeightKg !== endKg ||
      p.deltaKg !== deltaKg ||
      p.lossRate !== lossRate ||
      p.completed !== completed
    ) {
      p.startWeightKg = startKg;
      p.endWeightKg = endKg;
      p.deltaKg = deltaKg;
      p.lossRate = lossRate;
      p.completed = completed;
      changed = true;
    }
  }

  if (changed) {
    await Promise.all(participants.map((p) => p.save()));
  }

  return challenge;
}

module.exports = {
  ensureWeeklyChallenge,
  getCurrentWeeklyChallenge,
  joinCurrentChallenge,
  computeChallengeResults,
};
