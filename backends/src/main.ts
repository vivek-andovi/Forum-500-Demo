import { createApp } from './app.factory';
import { env } from './core/config/env';

/** Normal server (local development, Docker). On AWS Lambda the entry point is lambda.ts instead. */
async function bootstrap() {
  const cfg = env();
  const app = await createApp();
  app.enableShutdownHooks();
  await app.listen(cfg.PORT);
  console.log(`Forum500 API listening on http://localhost:${cfg.PORT}/api (storage=${cfg.STORAGE_DRIVER}, mail=${cfg.MAIL_DRIVER})`);
}
bootstrap();
