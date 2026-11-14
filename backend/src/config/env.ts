import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  FRONTEND_ORIGIN: z.string().url().default('http://localhost:3000'),
  SESSION_COOKIE_NAME: z.string().default('kk_session'),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().default(14),
});
export const env = schema.parse(process.env);
export const isProduction = env.NODE_ENV === 'production';
