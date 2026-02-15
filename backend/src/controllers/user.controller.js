const User = require("../models/User");

async function getMe(req, res, next) {
  try {
    const user = await User.findByPk(String(req.user.id), { raw: true });
    if (!user) {
      return res
        .status(401)
        .json({ error: { code: "UNAUTHORIZED", message: "User not found" } });
    }
    return res.json({
      user: {
        id: String(user.id),
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        initialWeightKg: user.initialWeightKg,
        targetWeightKg: user.targetWeightKg,
        heightCm: user.heightCm,
        teamId: user.teamId ? String(user.teamId) : null,
        streakDays: user.streakDays,
      },
    });
  } catch (err) {
    return next(err);
  }
}

function numberOrNull(x) {
  if (x === null || x === undefined || x === "") return null;
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

async function updateProfile(req, res, next) {
  try {
    const initialWeightKg = numberOrNull(req.body?.initialWeightKg);
    const targetWeightKg = numberOrNull(req.body?.targetWeightKg);
    const heightCm = numberOrNull(req.body?.heightCm);

    if (
      initialWeightKg != null &&
      (initialWeightKg < 20 || initialWeightKg > 300)
    ) {
      return res.status(400).json({
        error: { code: "BAD_REQUEST", message: "initialWeightKg out of range" },
      });
    }
    if (
      targetWeightKg != null &&
      (targetWeightKg < 20 || targetWeightKg > 300)
    ) {
      return res.status(400).json({
        error: { code: "BAD_REQUEST", message: "targetWeightKg out of range" },
      });
    }
    if (heightCm != null && (heightCm < 50 || heightCm > 250)) {
      return res.status(400).json({
        error: { code: "BAD_REQUEST", message: "heightCm out of range" },
      });
    }

    const patch = {
      ...(initialWeightKg != null ? { initialWeightKg } : {}),
      ...(targetWeightKg != null ? { targetWeightKg } : {}),
      ...(heightCm != null ? { heightCm } : {}),
    };

    if (Object.keys(patch).length) {
      await User.update(patch, { where: { id: String(req.user.id) } });
    }

    const user = await User.findByPk(String(req.user.id), { raw: true });
    if (!user) {
      return res
        .status(401)
        .json({ error: { code: "UNAUTHORIZED", message: "User not found" } });
    }

    return res.json({
      user: {
        id: String(user.id),
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        initialWeightKg: user.initialWeightKg,
        targetWeightKg: user.targetWeightKg,
        heightCm: user.heightCm,
        teamId: user.teamId ? String(user.teamId) : null,
        streakDays: user.streakDays,
      },
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getMe, updateProfile };
