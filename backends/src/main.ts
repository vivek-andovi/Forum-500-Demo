import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { requestContext } from './core/common/request-context';
import { env } from './core/config/env';

async function bootstrap() {
  const cfg = env(); // throws on invalid configuration before anything starts
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });

  // Behind an AWS ALB / CloudFront, trust the first proxy so req.ip is the client IP.
  if (cfg.TRUST_PROXY || cfg.NODE_ENV === 'production') app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.useBodyParser('json', { limit: '1mb' });
  app.useBodyParser('urlencoded', { limit: '1mb', extended: false });
  // After the body parsers (their stream callbacks would lose it): who is acting, for createdBy/updatedBy.
  app.use(requestContext.middleware);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  const origins = cfg.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean);
  const allowAllOrigins = origins.includes('*') || cfg.CORS_ORIGINS === '*';

  app.enableCors({
    origin: allowAllOrigins ? true : origins,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  });
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();

  app.useStaticAssets(join(process.cwd(), 'static'), { prefix: '/static', maxAge: '30d' });
  if (cfg.STORAGE_DRIVER === 'local') {
    app.useStaticAssets(join(process.cwd(), 'uploads'), {
      prefix: '/uploads',
      // Uploaded files are never executed or sniffed as HTML.
      setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
    });
  }

  if (cfg.NODE_ENV !== 'production' || cfg.ENABLE_SWAGGER) {
    const config = new DocumentBuilder().setTitle('Forum500 API').setVersion('0.2').addBearerAuth().build();
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
  }

  await app.listen(cfg.PORT);
  console.log(`Forum500 API listening on http://localhost:${cfg.PORT}/api (storage=${cfg.STORAGE_DRIVER}, mail=${cfg.MAIL_DRIVER})`);
  if (cfg.NODE_ENV === 'production' && cfg.MAIL_DRIVER === 'log') {
    // PENDING (email provider not set up yet): with the log driver, invite / magic-link / password-reset links
    // are written to the server log instead of being emailed. Switch to MAIL_DRIVER=ses before real members use it.
    console.warn('WARNING: MAIL_DRIVER=log in production: sign-in and reset links go to the log, not to members. Set MAIL_DRIVER=ses before go-live.');
  }
}
bootstrap();
