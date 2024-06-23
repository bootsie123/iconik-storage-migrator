import * as iconik from "iconik-typescript";
import { RateLimit } from "async-sema";

export default class RateLimitMiddleware implements iconik.Middleware {
  private static limit = RateLimit(45);

  async pre(context: iconik.RequestContext): Promise<iconik.RequestContext> {
    await RateLimitMiddleware.limit();

    return context;
  }

  async post(context: iconik.ResponseContext): Promise<iconik.ResponseContext> {
    return context;
  }
}
