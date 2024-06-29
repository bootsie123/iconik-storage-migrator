import * as iconik from "iconik-typescript";
import { RateLimiterQueue, RateLimiterRedis } from "rate-limiter-flexible";
import { Redis } from "ioredis";

import environment from "../environment";

export default class RateLimitMiddleware implements iconik.Middleware {
  private static redis = new Redis({
    host: environment.redis.host,
    port: environment.redis.port
  });

  private static rateLimiter = new RateLimiterRedis({
    storeClient: RateLimitMiddleware.redis,
    points: 45,
    duration: 1,
    keyPrefix: "iconik-limiter"
  });

  private static limiter = new RateLimiterQueue(
    RateLimitMiddleware.rateLimiter
  );

  async pre(context: iconik.RequestContext): Promise<iconik.RequestContext> {
    await RateLimitMiddleware.limiter.removeTokens(1);

    return context;
  }

  async post(context: iconik.ResponseContext): Promise<iconik.ResponseContext> {
    return context;
  }
}
