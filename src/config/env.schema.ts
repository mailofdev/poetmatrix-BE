import { z } from 'zod';

function blankToUndefined(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    DB_HOST: z.string().min(1),
    DB_PORT: z.coerce.number().int().positive().default(5432),
    DB_USERNAME: z.string().min(1),
    DB_PASSWORD: z.string().min(1),
    DB_NAME: z.string().min(1),
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_ACCESS_TTL_SECONDS: z.coerce
      .number()
      .int()
      .min(60)
      .max(3600)
      .default(900),
    REFRESH_TOKEN_TTL_SECONDS: z.coerce
      .number()
      .int()
      .min(300)
      .default(60 * 60 * 24 * 7),
    PASSWORD_RESET_TTL_SECONDS: z.coerce
      .number()
      .int()
      .min(300)
      .max(60 * 60 * 24)
      .default(1800),
    FRONTEND_ORIGIN: z.url().default('http://localhost:3000'),
    SWAGGER_ENABLED: z.enum(['true', 'false']).default('false'),
    TRUST_PROXY: z.enum(['true', 'false']).default('false'),
    SUPER_ADMIN_EMAIL: z.preprocess(blankToUndefined, z.email().optional()),
    SUPER_ADMIN_PASSWORD: z.preprocess(
      blankToUndefined,
      z.string().min(10).max(128).optional(),
    ),
    OBSERVE_APP_KEY: z.preprocess(
      blankToUndefined,
      z.string().min(1).optional(),
    ),
    OBSERVE_APP_SECRET: z.preprocess(
      blankToUndefined,
      z.string().min(1).optional(),
    ),
    GOOGLE_CLIENT_ID: z.preprocess(blankToUndefined, z.string().min(1).optional()),
    SMTP_HOST: z.preprocess(blankToUndefined, z.string().min(1).optional()),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_USER: z.preprocess(blankToUndefined, z.string().min(1).optional()),
    SMTP_PASSWORD: z.preprocess(blankToUndefined, z.string().min(1).optional()),
    SMTP_FROM: z.preprocess(blankToUndefined, z.string().min(1).optional()),
    RAZORPAY_KEY_ID: z.preprocess(blankToUndefined, z.string().min(1).optional()),
    RAZORPAY_KEY_SECRET: z.preprocess(
      blankToUndefined,
      z.string().min(1).optional(),
    ),
    PLAN_WEBHOOK_SECRET: z.preprocess(
      blankToUndefined,
      z.string().min(16).optional(),
    ),
  })
  .superRefine((env, ctx) => {
    const hasEmail = Boolean(env.SUPER_ADMIN_EMAIL);
    const hasPassword = Boolean(env.SUPER_ADMIN_PASSWORD);
    if (hasEmail !== hasPassword) {
      ctx.addIssue({
        code: 'custom',
        message:
          'SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set together',
        path: ['SUPER_ADMIN_EMAIL'],
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }
  return parsed.data;
}
