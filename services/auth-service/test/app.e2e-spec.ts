import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

/**
 * Auth Service — Complete E2E Suite
 *
 * Covers all AUTH-* cases from run_tests.sh and test-plan.md:
 *   AUTH-01  Login → JWT (Admin)
 *   AUTH-02  Reject invalid credentials
 *   AUTH-05  Unauthenticated request rejected (no token)
 *   AUTH-11  Token Refresh
 *   AUTH-12  Disable User Account (Admin Only)
 *   AUTH-EXT-01  Register new user
 *   AUTH-EXT-04  Disabled user blocked on login (403)
 *
 * Test isolation: each describe block captures shared state (tokens, usernames)
 * via closure variables populated by previous `it` blocks in the same suite.
 */
describe('Auth Service — E2E Test Suite', () => {
  let app: INestApplication<App>;

  // Shared state across the full suite — populated sequentially
  let adminToken: string;
  let registeredUsername: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Section 1 — Core Authentication (AUTH-01, AUTH-02, AUTH-05)
  // ─────────────────────────────────────────────────────────────────────────
  describe('Core Authentication', () => {
    it('AUTH-01: POST /auth/login → 201 + access_token for valid admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'admin', password: 'password' })
        .expect(201);

      expect(res.body.access_token).toBeDefined();
      expect(typeof res.body.access_token).toBe('string');
      adminToken = res.body.access_token;
    });

    it('AUTH-02: POST /auth/login → 401 for invalid password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'admin', password: 'wrongpassword' })
        .expect(401);
    });

    it('AUTH-02b: POST /auth/login → 401 for unknown username', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'ghost', password: 'anything' })
        .expect(401);
    });

    it('AUTH-05: GET /auth/... → 401 when no Authorization header provided', () => {
      // Refresh without a token must fail with 401
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .expect(401);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Section 2 — User Registration (AUTH-EXT-01)
  // ─────────────────────────────────────────────────────────────────────────
  describe('User Registration', () => {
    it('AUTH-EXT-01: POST /auth/register → 201 with valid payload', async () => {
      registeredUsername = `testuser_${Date.now()}`;

      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: registeredUsername,
          email: `${registeredUsername}@example.com`,
          password: 'SecurePass123!',
        })
        .expect(201);

      expect(res.body.status).toBe('created');
      expect(res.body.user.username).toBe(registeredUsername);
    });

    it('AUTH-EXT-01b: POST /auth/login → 201 for newly registered user', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: registeredUsername, password: 'SecurePass123!' })
        .expect(201);

      expect(res.body.access_token).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Section 3 — Token Refresh (AUTH-11)
  // ─────────────────────────────────────────────────────────────────────────
  describe('Token Refresh — AUTH-11', () => {
    it('AUTH-11: POST /auth/refresh → 201 + new access_token with valid Bearer', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      expect(res.body.access_token).toBeDefined();
      expect(typeof res.body.access_token).toBe('string');
      // Refresh produces a new token (may be identical payload, different iat)
    });

    it('AUTH-11b: POST /auth/refresh → 401 with malformed token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', 'Bearer not.a.real.token')
        .expect(401);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Section 4 — Disable User (AUTH-12) + Blocked Login (AUTH-EXT-04)
  // ─────────────────────────────────────────────────────────────────────────
  describe('Account Disabling — AUTH-12', () => {
    it('AUTH-12: POST /auth/disable → 200 when admin disables an account', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/disable')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ username: registeredUsername })
        .expect(200);

      expect(res.body.status).toBe('disabled');
      expect(res.body.username).toBe(registeredUsername);
    });

    it('AUTH-EXT-04: POST /auth/login → 403 for a disabled account', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: registeredUsername, password: 'SecurePass123!' })
        .expect(403);
    });

    it('AUTH-12b: POST /auth/disable → 403 when a non-admin attempts disable', async () => {
      // Register a second user to act as a non-admin caller
      const altUser = `altuser_${Date.now()}`;
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: altUser, email: `${altUser}@example.com`, password: 'Pass123!' });

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: altUser, password: 'Pass123!' });

      const altToken = loginRes.body.access_token;

      return request(app.getHttpServer())
        .post('/auth/disable')
        .set('Authorization', `Bearer ${altToken}`)
        .send({ username: 'admin' })
        .expect(403);
    });
  });
});
