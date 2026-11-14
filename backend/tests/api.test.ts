import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

const prisma = new PrismaClient();
describe('backend HTTP API', () => {
  it('returns a database-backed health check', async () => {
    const response = await request(app).get('/api/health');
    expect([200, 503]).toContain(response.status);
    expect(response.body).toHaveProperty('database');
  });
  it('returns JSON for unknown API endpoints', async () => {
    const response = await request(app).get('/api/not-a-route');
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });
  it('rejects malformed registration before database access', async () => {
    const response = await request(app).post('/api/auth/register').send({ email: 'not-an-email' });
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
});
afterAll(async () => { await prisma.$disconnect(); });
