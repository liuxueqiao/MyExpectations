# 瘦搭子（MVP）

# 重启后端服务：pm2 restart shoushenquan-backend


## 目录结构

- [backend](file:///Users/liuxueqiao/qiao/mine_practice/UniappScanAssistant/backend)：Node.js + Express + MongoDB API
- [miniprogram](file:///Users/liuxueqiao/qiao/mine_practice/UniappScanAssistant/miniprogram)：微信小程序原生版本（用于 MVP 演示）

## 本地运行（推荐）

1. 启动 MongoDB

```bash
docker compose up -d
```

2. 启动后端

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

如果本机没有 MongoDB/Docker，可把 `backend/.env` 里的 `MONGO_IN_MEMORY` 改为 `1`（仅用于开发/演示）。

3. 打开小程序

使用微信开发者工具导入项目根目录，`miniprogramRoot` 为 `miniprogram/`。

开发者工具里默认 `appid` 为 `touristappid`，微信登录会无法换取真实 openid。可在登录页使用「开发模式」登录：输入后端 `.env` 里的 `ADMIN_KEY`，点击「开发登录」即可体验打卡/小队/挑战/内容等功能。

## 配置项

- 小程序请求地址：在 [config.js](file:///Users/liuxueqiao/qiao/mine_practice/UniappScanAssistant/miniprogram/utils/config.js) 修改 `API_BASE_URL`
- 后端环境变量：在 [backend/.env.example](file:///Users/liuxueqiao/qiao/mine_practice/UniappScanAssistant/backend/.env.example) 复制为 `backend/.env`
