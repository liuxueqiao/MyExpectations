const { Sequelize } = require("sequelize");
const mysql = require("mysql2/promise");

function parseAddress(address) {
  if (!address) return { host: "", port: "" };
  const s = String(address).trim();
  const idx = s.lastIndexOf(":");
  if (idx === -1) return { host: s, port: "" };
  return { host: s.slice(0, idx), port: s.slice(idx + 1) };
}

function getMySQLConfig() {
  const address = process.env.MYSQL_ADDRESS || "";
  const parsed = parseAddress(address);

  const database = process.env.MYSQL_DATABASE || "shoushenquan";
  const user = process.env.MYSQL_USER || process.env.MYSQL_USERNAME || "root";
  const password = process.env.MYSQL_PASSWORD || "";
  const host = process.env.MYSQL_HOST || parsed.host || "127.0.0.1";
  const port = Number(process.env.MYSQL_PORT || parsed.port || 3306);

  return { database, user, password, host, port };
}

const mysqlConfig = getMySQLConfig();

const sequelize = new Sequelize(
  mysqlConfig.database,
  mysqlConfig.user,
  mysqlConfig.password,
  {
    host: mysqlConfig.host,
    port: mysqlConfig.port,
    dialect: "mysql",
    logging: false,
    timezone: "+08:00",
  }
);

async function ensureDatabaseExists() {
  const { database, user, password, host, port } = getMySQLConfig();
  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true,
  });
  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
  );
  await conn.end();
}

async function connectMySQL() {
  try {
    await sequelize.authenticate();
  } catch (err) {
    const code = err?.parent?.code || err?.original?.code || err?.code;
    if (code === "ER_BAD_DB_ERROR") {
      await ensureDatabaseExists();
      await sequelize.authenticate();
    } else {
      throw err;
    }
  }
  await sequelize.sync();
  return sequelize;
}

module.exports = { sequelize, connectMySQL };
