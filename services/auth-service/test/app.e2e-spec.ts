import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Auth Service End-to-End (e2e)', () => {
  let app: INestApplication<App>;
  let userToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication Core Lifecycle', () => {
    it('AUTH-01: Should login and return JWT for valid Admin', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'admin', password: 'password' })
        .expect(201)
        .expect((res) => {
          expect(res.body.access_token).toBeDefined();
          userToken = res.body.access_token;
        });
    });

    it('AUTH-02: Should reject invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'admin', password: 'wrongpassword' })
        .expect(401);
    });
  });

  describe('Extended Auth Features (Security Best Practices)', () => {
    it('AUTH-EXT-01: Should successfully create a new user (Registration)', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'newuser', email: 'newuser@example.com', password: 'securepassword123' })
        .expect(201); // Expecting feature to be built
    });

    it('AUTH-EXT-02: Should refresh an existing token securely', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${userToken || 'mock'}`)
        .expect(201)
        .expect((res) => {
          expect(res.body.access_token).toBeDefined();
        });
    });

    it('AUTH-EXT-03: Should disable a user (Admin Only)', () => {
      return request(app.getHttpServer())
        .post('/auth/disable')
        .set('Authorization', `Bearer ${userToken || 'mock'}`)
        .send({ username: 'newuser' })
        .expect(200);
    });

    it('AUTH-EXT-04: Disabled users should be blocked from logging in', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'newuser', password: 'securepassword123' })
        .expect(403); // 403 Forbidden for disabled accounts
    });
  });
});
