import { z } from 'zod';

const bool = z
  .enum(['true', 'false'])
  .optional()
  .transform((v) => v === 'true');

/**
 * Every environment variable the API reads, validated once at startup.
 * In production, weak or missing secrets stop the process instead of running insecurely.
 */
const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().default(4000),
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().min(1),
    JWT_EXPIRES_IN: z.string().default('1d'),
    CORS_ORIGINS: z.string().default('http://localhost:3001,http://localhost:3002'),
    PUBLIC_API_URL: z.string().url().default('http://localhost:4000'),
    /** Member app URL, used in invite / reset links. */
    WEB_APP_URL: z.string().url().default('http://localhost:3002'),
    ADMIN_APP_URL: z.string().url().default('http://localhost:3001'),
    ENABLE_SWAGGER: bool,
    TRUST_PROXY: bool,
    /** Default requests per minute per IP (auth and public routes have stricter limits). */
    RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(10).default(300),

    // Storage: "local" for dev, "s3" for AWS (or MinIO via S3_ENDPOINT).
    STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
    AWS_REGION: z.string().default('eu-west-2'),
    S3_BUCKET: z.string().optional(),
    S3_ENDPOINT: z.string().url().optional(),
    S3_FORCE_PATH_STYLE: bool,
    /** Public base for files, e.g. https://assets.forum500.club (CloudFront). */
    ASSET_PUBLIC_BASE_URL: z.string().url().optional(),

    // Email: "log" prints to the console in dev, "ses" sends via Amazon SES.
    MAIL_DRIVER: z.enum(['log', 'ses']).default('log'),
    MAIL_FROM: z.string().default('Forum500 <no-reply@forum500.club>'),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production') return;
    if (env.JWT_SECRET.length < 32 || /change-me|dev-secret/i.test(env.JWT_SECRET)) {
      ctx.addIssue({ code: 'custom', path: ['JWT_SECRET'], message: 'must be a random string of 32+ characters in production' });
    }
    if (env.STORAGE_DRIVER === 's3' && !env.S3_BUCKET) {
      ctx.addIssue({ code: 'custom', path: ['S3_BUCKET'], message: 'is required when STORAGE_DRIVER=s3' });
    }
  });

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

export function env(): Env {
  if (cached) return cached;
  // Treat empty values (e.g. `S3_ENDPOINT=`) as unset.
  const raw = Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== ''));
  const parsed = EnvSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}
