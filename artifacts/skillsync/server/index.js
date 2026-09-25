import mongoose from "mongoose";
import pino from "pino";
import app from "./app.js";

const logger = pino({
  redact: [
    "req.headers.cookie",
    "req.headers.authorization",
    "mongodbUri",
    "MONGODB_URI",
  ],
});

async function start() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI is required. Add it as a secret or to the local .env file.");
  }
  if (!process.env.CLERK_SECRET_KEY || !process.env.CLERK_PUBLISHABLE_KEY) {
    throw new Error("Clerk keys are required. Add the server-side keys to the environment.");
  }

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });
  } catch (error) {
    logger.error(
      { name: error?.name, code: error?.code },
      "Could not connect to MongoDB. Check MONGODB_URI and Atlas network access.",
    );
    process.exit(1);
  }

  const port = Number(process.env.PORT || 5000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be a valid TCP port.");
  }

  const server = app.listen(port, "0.0.0.0", () => {
    logger.info({ port }, "SkillSync API is listening");
  });

  const shutdown = async (signal) => {
    logger.info({ signal }, "Stopping SkillSync API");
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start().catch((error) => {
  logger.error({ name: error?.name }, error?.message || "SkillSync could not start");
  process.exit(1);
});