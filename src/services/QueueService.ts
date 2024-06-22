import { Queue } from "bullmq";
import environment from "../environment";

export default class QueueService {
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

  static async addProxyMigrationJobs() {
    /*
    await this.queue.add("test-job", {
      data: "test"
    });
    */
  }
}
