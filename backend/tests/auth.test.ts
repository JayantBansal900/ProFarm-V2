import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { env } from '../src/config/env';

const TEST_ORIGIN = env.FRONTEND_ORIGIN || 'http://localhost:5173';
const TEST_EMAIL_PREFIX = `__authtest_${Date.now()}`;

describe('Authentication & Session Management API (/api/auth)', () => {
  const testUser = {
    name: 'Suresh Kumar',
    email: `${TEST_EMAIL_PREFIX}_suresh@example.com`,
    password: 'SuperSecretPassword123!',
  };

  afterAll(async () => {
    // Clean up all sessions and test users created during this suite
    const users = await prisma.user.findMany({
      where: { email: { startsWith: TEST_EMAIL_PREFIX } },
      select: { id: true },
    });
    const userIds = users.map((u) => u.id);

    if (userIds.length > 0) {
      await prisma.session.deleteMany({
        where: { userId: { in: userIds } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: userIds } },
      });
    }

    await prisma.$disconnect();
  });

  // -------------------------------------------------------------------------
  // CSRF Protection Tests
  // -------------------------------------------------------------------------
  describe('CSRF Middleware Protection', () => {
    it('rejects POST /api/auth/login when Origin header is missing with 403', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      expect(res.status).toBe(403);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toMatch(/missing origin header/i);
    });

    it('rejects POST /api/auth/login when Origin is untrusted with 403', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Origin', 'http://malicious-site.attacker.com')
        .send({ email: testUser.email, password: testUser.password });

      expect(res.status).toBe(403);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toMatch(/cors policy|origin not allowed/i);
    });
  });

  // -------------------------------------------------------------------------
  // User Registration
  // -------------------------------------------------------------------------
  describe('POST /api/auth/register', () => {
    it('rejects registration with short password (< 8 chars) with 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Origin', TEST_ORIGIN)
        .send({
          name: 'Test',
          email: `${TEST_EMAIL_PREFIX}_short@example.com`,
          password: 'short',
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Validation failed');
    });

    it('successfully registers a new user, hashes password, and returns session cookie', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Origin', TEST_ORIGIN)
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(testUser.email.toLowerCase());
      expect(res.body.user.name).toBe(testUser.name);
      expect(res.body.user.passwordHash).toBeUndefined(); // Never expose hash

      // Verify Set-Cookie header contains profarm_sid
      const setCookie = res.headers['set-cookie'];
      expect(setCookie).toBeDefined();
      const cookieStr = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
      expect(cookieStr).toMatch(/profarm_sid=/);
      expect(cookieStr).toMatch(/HttpOnly/i);

      // Verify user actually created in DB with valid Argon2id hash
      const dbUser = await prisma.user.findUnique({
        where: { email: testUser.email.toLowerCase() },
      });
      expect(dbUser).not.toBeNull();
      expect(dbUser?.passwordHash).toMatch(/^\$argon2id\$/);
    });

    it('rejects registration with duplicate email with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Origin', TEST_ORIGIN)
        .send(testUser);

      expect(res.status).toBe(409);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toMatch(/already exists/i);
    });
  });

  // -------------------------------------------------------------------------
  // User Login & Session Verification
  // -------------------------------------------------------------------------
  describe('POST /api/auth/login and Session Life Cycle', () => {
    let authCookie: string;

    it('rejects login with incorrect password with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Origin', TEST_ORIGIN)
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toMatch(/invalid email or password/i);
    });

    it('rejects login with non-existent email with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Origin', TEST_ORIGIN)
        .send({
          email: `${TEST_EMAIL_PREFIX}_nonexistent@example.com`,
          password: 'SomePassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toMatch(/invalid email or password/i);
    });

    it('logs in successfully with correct credentials and issues session cookie', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Origin', TEST_ORIGIN)
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.user.email).toBe(testUser.email.toLowerCase());

      const setCookie = res.headers['set-cookie'];
      expect(setCookie).toBeDefined();
      const cookieStr = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
      expect(cookieStr).toMatch(/profarm_sid=/);

      // Save cookie for subsequent authenticated tests
      const match = cookieStr.match(/profarm_sid=([^;]+)/);
      expect(match).not.toBeNull();
      authCookie = `profarm_sid=${match![1]}`;
    });

    it('GET /api/auth/me returns 401 when unauthenticated', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toMatch(/authentication required/i);
    });

    it('GET /api/auth/me returns 401 when session cookie is invalid', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', 'profarm_sid=invalid_forged_token_1234567890');

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
    });

    it('GET /api/auth/me returns 200 and user profile when valid session cookie provided', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', authCookie);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.user.email).toBe(testUser.email.toLowerCase());
      expect(res.body.user.name).toBe(testUser.name);
    });

    it('POST /api/auth/logout revokes session in DB and clears cookie', async () => {
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Origin', TEST_ORIGIN)
        .set('Cookie', authCookie);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.status).toBe('success');

      // Subsequent access using revoked cookie must now return 401
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Cookie', authCookie);

      expect(meRes.status).toBe(401);
    });
  });
});
