import app from "../../new-server/app";

export async function onRequest(context: {
  request: Request;
  env: Record<string, unknown>;
  executionCtx: ExecutionContext;
}) {
  return app.fetch(context.request, context.env, context.executionCtx);
}
