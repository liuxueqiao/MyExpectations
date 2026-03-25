const mongoose = require("mongoose");

async function connectMongo(mongoUri) {
  mongoose.set("strictQuery", true);
  let uri = mongoUri;
  let memoryServer = null;

  if (process.env.MONGO_IN_MEMORY === "1") {
    const { MongoMemoryServer } = require("mongodb-memory-server");
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri();
  }

  await mongoose.connect(uri, {
    autoIndex: true
  });

  if (memoryServer) {
    const shutdown = async () => {
      try {
        await mongoose.disconnect();
      } finally {
        await memoryServer.stop();
      }
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  }

  return mongoose.connection;
}

module.exports = { connectMongo };
