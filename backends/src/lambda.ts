import serverlessExpress from '@codegenie/serverless-express';
import type { Callback, Context, Handler } from 'aws-lambda';
import { createApp } from './app.factory';

/**
 * AWS Lambda entry point (API Gateway HTTP API → this handler). The Nest app is built once per Lambda
 * instance and reused by every request that instance serves; only the first request pays the start-up.
 */
let server: Handler | undefined;

async function bootstrap(): Promise<Handler> {
  const app = await createApp();
  await app.init();
  return serverlessExpress({ app: app.getHttpAdapter().getInstance() });
}

export const handler: Handler = async (event: unknown, context: Context, callback: Callback) => {
  server ??= await bootstrap();
  return server(event, context, callback);
};
