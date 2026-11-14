import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';

const server = app.listen(env.PORT, '0.0.0.0', () => console.log(`Kasuwar Kanawa API listening on port ${env.PORT}`));
const shutdown = async (signal: string) => {
  console.log(`${signal} received; shutting down API.`);
  server.close(async () => { await prisma.$disconnect(); process.exit(0); });
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
