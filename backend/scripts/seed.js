require("dotenv").config();

const { connectMySQL } = require("../src/config/db");
const { getEnv } = require("../src/config/env");
const Article = require("../src/models/Article");

async function main() {
  getEnv();
  await connectMySQL();

  const count = await Article.count({ where: { status: "published" } });
  if (count > 0) return;

  await Article.create({
    title: "坚持一周，你会感谢今天的自己",
    coverUrl: "",
    content: "<p>每天打卡一点点，小队互相监督，一周后就能看到变化。</p>",
    status: "published",
    publishedAt: new Date(),
  });
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
