import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  FRONTEND_ORIGIN: z.string().url(),
  SESSION_COOKIE_NAME: z.string().default('kk_session'),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().default(14),
  OTP_TTL_MINUTES: z.coerce.number().int().positive().default(10),
  OTP_RESEND_SECONDS: z.coerce.number().int().positive().default(60),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  OTP_HMAC_SECRET: z.string().min(32),
  SMTP_HOST: z.string().optional().default(''), SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.string().default('false'), SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''), SMTP_FROM: z.string().optional().default(''),
  TWILIO_ACCOUNT_SID: z.string().optional().default(''), TWILIO_AUTH_TOKEN: z.string().optional().default(''),
  TWILIO_FROM: z.string().optional().default('')
});
export const env = schema.parse(process.env);
export const isProduction = env.NODE_ENV === 'production';
