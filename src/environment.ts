import "dotenv/config";

export default {
  production: process.env.NODE_ENV === "production",
  iconik: {
    appId: process.env.ICONIK_APP_ID || "",
    token: process.env.ICONIK_TOKEN || "",
    newStorageId: process.env.NEW_STORAGE_ID || ""
  },
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379")
  },
  addJobs:
    process.env.ADD_JOBS === undefined ? true : process.env.ADD_JOBS === "true",
  concurrency: parseInt(process.env.CONCURRENCY || "10"),
  dryRun:
    process.env.DRY_RUN === undefined
      ? process.env.NODE_ENV !== "production"
      : process.env.DRY_RUN === "true",
  bullmq: {
    queueName: "proxyStorageMigration"
  }
};
