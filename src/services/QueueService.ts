import { Job, Queue } from "bullmq";
import * as iconik from "iconik-typescript";
import { EventEmitter } from "stream";
import express from "express";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";

import environment from "../environment";
import logger from "../logger";
import RateLimitMiddleware from "../utils/RateLimitMiddleware";

export default class QueueService {
  private static logger = logger.child({ label: "QueueService" });

  private static queue = new Queue(environment.bullmq.queueName, {
    connection: environment.redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000
      }
    }
  });

  private static searchApi = new iconik.SearchApi(
    iconik.createConfiguration({
      authMethods: {
        appId: environment.iconik.appId,
        authToken: environment.iconik.token
      },
      promiseMiddleware: [new RateLimitMiddleware()]
    })
  );

  static async resetQueues() {
    this.logger.warn("Reseting all queues!");

    await this.queue.obliterate({
      force: true
    });

    this.logger.warn("All queues reset!");
  }

  static startBullBoard() {
    const serverAdapter = new ExpressAdapter();

    serverAdapter.setBasePath("/status");

    createBullBoard({
      queues: [new BullMQAdapter(this.queue)],
      serverAdapter
    });

    const app = express();

    app.use("/status", serverAdapter.getRouter());

    app.listen(3000, () => {
      this.logger.info("Running Bull-Board on port 3000");
    });
  }

  static async addProxyMigrationJobs() {
    EventEmitter.setMaxListeners(1000);

    this.logger.info(`Adding proxy migration jobs to the queue`);

    const promises: Promise<Job<any, any, string>[]>[] = [];

    const itemsPerPage = 150;

    const options = {
      query: `_exists_:proxies.status AND NOT proxies.storage_id:"${environment.iconik.newStorageId}"`,
      includeFields: [
        "date_created",
        "date_modified",
        "id",
        "metadata",
        "object_type",
        "title"
      ],
      sort: [
        {
          name: "date_created",
          order: "desc"
        }
      ]
    };

    const addJobs = (data: iconik.SearchDocumentsSchema) => {
      const jobs = data.objects?.map(item => ({
        name: "migrateProxy",
        data: item
      }));

      return this.queue.addBulk(jobs || []);
    };

    const data = await this.searchApi.searchV1SearchPost(
      options,
      undefined,
      undefined,
      itemsPerPage,
      undefined,
      undefined,
      undefined,
      false,
      false,
      false
    );

    promises.push(addJobs(data));

    for (let page = 2; page <= (data.pages || 1); page++) {
      promises.push(
        new Promise<Job<any, any, string>[]>(async resolve => {
          const data = await this.searchApi.searchV1SearchPost(
            options,
            undefined,
            undefined,
            itemsPerPage,
            page,
            undefined,
            undefined,
            false,
            false,
            false
          );

          resolve(addJobs(data));
        })
      );
    }

    const results = await Promise.allSettled(promises);

    for (const result of results) {
      if (result.status === "fulfilled") continue;

      this.logger.warn("Problem adding job to queue:", result.reason);
    }

    this.logger.info(`Finished adding proxy migration jobs to the queue!`);
  }
}
