// 配置不同环境的接口地址
const ENV_CONFIG = {
  // 开发版 (IDE中预览/真机调试)
  develop: "http://49.235.104.95:3000",
  // 体验版
  trial: "http://49.235.104.95:3000", // TODO: 替换为实际的云托管公网域名
  // 正式版
  release: "http://49.235.104.95:3000", // TODO: 替换为实际的云托管公网域名
};

// 获取当前环境
const accountInfo = wx.getAccountInfoSync();
const env = accountInfo.miniProgram.envVersion || "develop";

const API_BASE_URL = ENV_CONFIG[env] || ENV_CONFIG.develop;

module.exports = { API_BASE_URL };
