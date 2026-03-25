const crypto = require("crypto");
const Team = require("../models/Team");
const User = require("../models/User");
const WeightRecord = require("../models/WeightRecord");
const { startOfWeekMonday, toDateOnlyKey } = require("../utils/date");
const { safeDeltaKg, safeLossRate } = require("../utils/privacy");
const { todayKeyCN } = require("./weight.controller");

const INVITE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function generateInviteCode(length = 8) {
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += INVITE_ALPHABET[bytes[i] % INVITE_ALPHABET.length];
  }
  return out;
}

async function createTeam(req, res, next) {
  try {
    const name = String(req.body?.name || "").trim();
    if (!name) {
      return res.status(400).json({ error: { code: "BAD_REQUEST", message: "name is required" } });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: { code: "NOT_FOUND", message: "User not found" } });
    if (user.teamId) {
      return res.status(409).json({
        error: { code: "ALREADY_IN_TEAM", message: "Already in a team" }
      });
    }

    let inviteCode = generateInviteCode();
    for (let i = 0; i < 5; i++) {
      const exists = await Team.findOne({ inviteCode }).lean();
      if (!exists) break;
      inviteCode = generateInviteCode();
    }

    const team = await Team.create({
      name,
      ownerId: user._id,
      inviteCode,
      members: [user._id]
    });

    user.teamId = team._id;
    await user.save();

    return res.json({
      team: {
        id: String(team._id),
        name: team.name,
        inviteCode: team.inviteCode
      }
    });
  } catch (err) {
    return next(err);
  }
}

async function joinTeam(req, res, next) {
  try {
    const inviteCode = String(req.body?.inviteCode || "").trim().toUpperCase();
    if (!inviteCode) {
      return res
        .status(400)
        .json({ error: { code: "BAD_REQUEST", message: "inviteCode is required" } });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: { code: "NOT_FOUND", message: "User not found" } });
    if (user.teamId) {
      return res.status(409).json({
        error: { code: "ALREADY_IN_TEAM", message: "Already in a team" }
      });
    }

    const team = await Team.findOne({ inviteCode });
    if (!team) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Team not found" } });
    }

    team.members = Array.from(new Set([...team.members.map(String), String(user._id)])).map(
      (id) => id
    );
    await Team.updateOne({ _id: team._id }, { $addToSet: { members: user._id } });

    user.teamId = team._id;
    await user.save();

    return res.json({
      team: { id: String(team._id), name: team.name, inviteCode: team.inviteCode }
    });
  } catch (err) {
    return next(err);
  }
}

async function leaveTeam(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.teamId) return res.json({ ok: true });

    const team = await Team.findById(user.teamId);
    if (team) {
      await Team.updateOne({ _id: team._id }, { $pull: { members: user._id } });
    }

    user.teamId = null;
    await user.save();
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
}

async function getMyTeam(req, res, next) {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user?.teamId) return res.json({ team: null });

    const team = await Team.findById(user.teamId).lean();
    if (!team) return res.json({ team: null });

    const memberIds = team.members.map((id) => String(id));
    const members = await User.find({ _id: { $in: memberIds } }, { nickname: 1, avatarUrl: 1 })
      .lean();
    const memberMap = new Map(members.map((m) => [String(m._id), m]));

    const todayKey = todayKeyCN();
    const weekStartKey = toDateOnlyKey(startOfWeekMonday(new Date()));

    const todayRecords = await WeightRecord.find(
      { userId: { $in: memberIds }, dateKey: todayKey },
      { userId: 1 }
    ).lean();
    const checkedInSet = new Set(todayRecords.map((r) => String(r.userId)));

    const weekRecords = await WeightRecord.find(
      { userId: { $in: memberIds }, dateKey: { $gte: weekStartKey, $lte: todayKey } },
      { userId: 1, dateKey: 1, weightKg: 1 }
    )
      .sort({ userId: 1, dateKey: 1 })
      .lean();

    const byUser = new Map();
    for (const r of weekRecords) {
      const uid = String(r.userId);
      if (!byUser.has(uid)) byUser.set(uid, []);
      byUser.get(uid).push(r);
    }

    const items = memberIds.map((uid) => {
      const m = memberMap.get(uid) || { nickname: "", avatarUrl: "" };
      const rows = byUser.get(uid) || [];
      const startKg = rows.length ? rows[0].weightKg : null;
      const endKg = rows.length ? rows[rows.length - 1].weightKg : null;
      const deltaKg = safeDeltaKg(startKg, endKg);
      const lossRate = safeLossRate(startKg, endKg);

      const isSelf = uid === String(req.user.id);
      const series = rows.map((x) => ({
        dateKey: x.dateKey,
        ...(isSelf ? { weightKg: x.weightKg } : {}),
        deltaKg: safeDeltaKg(startKg, x.weightKg)
      }));

      return {
        userId: uid,
        nickname: m.nickname,
        avatarUrl: m.avatarUrl,
        checkedInToday: checkedInSet.has(uid),
        weekDeltaKg: deltaKg,
        weekLossRate: lossRate,
        series
      };
    });

    return res.json({
      team: {
        id: String(team._id),
        name: team.name,
        inviteCode: team.inviteCode,
        ownerId: String(team.ownerId),
        members: items
      }
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { createTeam, joinTeam, leaveTeam, getMyTeam };
