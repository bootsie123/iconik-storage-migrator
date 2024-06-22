import { Worker } from "bullmq";
import path from "path";
import os from "os";

import environment from "./environment";
import logger from "./logger";
import QueueService from "./services/QueueService";

const workers: Worker[] = [];

const cores = os.cpus().length;

logger.info(`Spawning ${cores} workers...`);

for (let i = 0; i < cores; i++) {
  workers.push(
    new Worker(
      environment.bullmq.queueName,
      path.join(__dirname, "/workers/proxyStorageMigration.js"),
      {
        connection: environment.redis,
        concurrency: environment.concurrency,
        autorun: true
      }
    )
  );
}

logger.info("Workers spawned!");

const gracefulShutdown = async () => {
  logger.info("Graceful shutdown signal recieved: closing queues");

  const promises = [];

  for (const worker of workers) {
    promises.push(worker.close());
  }

  await Promise.all(promises);

  logger.info("All queues closed");

  process.exit(0);
};

process
  .on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled rejection:", reason, promise);
  })
  .on("uncaughtException", err => {
    logger.error("Uncaught exception:", err);
  })
  .on("SIGTERM", gracefulShutdown)
  .on("SIGINT", gracefulShutdown);

if (environment.addJobs) {
  QueueService.addProxyMigrationJobs();
}
