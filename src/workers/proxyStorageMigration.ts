import { SandboxedJob } from "bullmq";

export default async (job: SandboxedJob) => {
  console.log(job);
};
