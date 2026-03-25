const axios = require("axios");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { getEnv } = require("../config/env");

async function wxLogin(req, res, next) {
  try {
    const env = getEnv();
    const { code, nickname, avatarUrl } = req.body || {};

    if (!code) {
      return res.status(400).json({
        error: { code: "BAD_REQUEST", message: "code is required" },
      });
    }

    const url = "https://api.weixin.qq.com/sns/jscode2session";
    const { data } = await axios.get(url, {
      params: {
        appid: env.WX_APPID,
        secret: env.WX_SECRET,
        js_code: code,
        grant_type: "authorization_code",
      },
      timeout: 8000,
    });

    if (data.errcode) {
      return res.status(401).json({
        error: {
          code: "WX_LOGIN_FAILED",
          message: data.errmsg || "wx login failed",
        },
      });
    }

    const openid = data.openid;
    if (!openid) {
      return res.status(401).json({
        error: { code: "WX_LOGIN_FAILED", message: "missing openid" },
      });
    }

    const update = {};
    if (typeof nickname === "string") update.nickname = nickname;
    if (typeof avatarUrl === "string") update.avatarUrl = avatarUrl;

    const user = await User.findOneAndUpdate(
      { openid },
      { $setOnInsert: { openid }, $set: update },
      { new: true, upsert: true }
    );

    const token = jwt.sign({ openid }, env.JWT_SECRET, {
      subject: String(user._id),
      expiresIn: env.JWT_EXPIRES_IN,
    });

    return res.json({
      token,
      user: {
        id: String(user._id),
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

async function devLogin(req, res, next) {
  try {
    const env = getEnv();
    if (env.NODE_ENV === "production") {
      return res
        .status(404)
        .json({ error: { code: "NOT_FOUND", message: "Not found" } });
    }

    const nickname =
      typeof req.body?.nickname === "string" ? req.body.nickname : "开发用户";
    const avatarUrl =
      typeof req.body?.avatarUrl === "string" ? req.body.avatarUrl : "";
    const openid = `dev_${crypto.randomBytes(12).toString("hex")}`;

    const user = await User.findOneAndUpdate(
      { openid },
      { $setOnInsert: { openid }, $set: { nickname, avatarUrl } },
      { new: true, upsert: true }
    );

    const token = jwt.sign({ openid }, env.JWT_SECRET, {
      subject: String(user._id),
      expiresIn: env.JWT_EXPIRES_IN,
    });

    return res.json({
      token,
      user: {
        id: String(user._id),
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

module.exports = { wxLogin, devLogin };
