function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env: ${name}`);
  }
  return value;
}

function optional(name, defaultValue) {
  const value = process.env[name];
  return value == null || value === "" ? defaultValue : value;
}

function getEnv() {
  return {
    NODE_ENV: optional("NODE_ENV", "development"),
    PORT: Number(optional("PORT", "3000")),
    MONGO_URI:
      process.env.MONGO_IN_MEMORY === "1"
        ? optional("MONGO_URI", "")
        : required("MONGO_URI"),
    JWT_SECRET: required("JWT_SECRET"),
    JWT_EXPIRES_IN: optional("JWT_EXPIRES_IN", "30d"),
    WX_APPID: required("WX_APPID"),
    WX_SECRET: required("WX_SECRET"),
    ADMIN_KEY: required("ADMIN_KEY"),

    COS_SECRET_ID: optional("COS_SECRET_ID", ""),
    COS_SECRET_KEY: optional("COS_SECRET_KEY", ""),
    COS_REGION: optional("COS_REGION", ""),
    COS_BUCKET: optional("COS_BUCKET", ""),
    COS_ALLOW_PREFIX: optional("COS_ALLOW_PREFIX", "shoushenquan/*"),
  };
}

module.exports = { getEnv };
