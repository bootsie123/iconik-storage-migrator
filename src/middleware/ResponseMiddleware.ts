import * as iconik from "iconik-typescript";

export class ResponseMiddleware implements iconik.Middleware {
  pre(context: iconik.RequestContext): Promise<iconik.RequestContext> {
    return Promise.resolve(context);
  }

  async post(context: iconik.ResponseContext): Promise<iconik.ResponseContext> {
    const blob = await context.body.binary();

    const newContext = new iconik.ResponseContext(
      context.httpStatusCode,
      context.headers,
      {
        text: () => blob.text(),
        binary: () => new Promise(resolve => resolve(blob))
      }
    );

    return Promise.resolve(newContext);
  }
}
