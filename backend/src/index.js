require("dotenv").config();

const cron = require("node-cron");
const { createApp } = require("./app");
const { connectMongo } = require("./config/db");
const { ensureWeeklyChallenge } = require("./services/challenge.service");
const { getEnv } = require("./config/env");

async function main() {
  const env = getEnv();
  await connectMongo(env.MONGO_URI);

  const app = createApp();

  await ensureWeeklyChallenge(new Date());

  cron.schedule(
    "5 0 * * 1",
    async () => {
      try {
        await ensureWeeklyChallenge(new Date());
      } catch (err) {
        console.error("[cron] ensureWeeklyChallenge failed:", err);
      }
    },
    { timezone: "Asia/Shanghai" }
  );

  app.listen(env.PORT, () => {
    console.log(`API listening on :${env.PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

