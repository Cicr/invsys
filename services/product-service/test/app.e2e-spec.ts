import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as jwt from 'jsonwebtoken';
import { AppModule } from './../src/app.module';

/**
 * Product Service — Complete E2E Suite
 *
 * Covers all PROD-* and AUTH-05 cases from run_tests.sh and test-plan.md:
 *   AUTH-05   Unauthenticated request → 401
 *   PROD-01   Create product
 *   PROD-02   Retrieve all products
 *   PROD-03   Filter by category
 *   PROD-04   Currency conversion (EUR)
 *   PROD-05   Invalid currency → 400
 *   PROD-07   Full update (PUT)
 *   PROD-08   Price history tracking
 *   PROD-10   Soft-delete product (DELETE)
 *   PROD-11   Partial update (PATCH)
 *   PROD-12   Invalid UUID on DELETE → 400
 *   RED-01    Currency conversion latency benchmark (< 400ms)
 *
 * Kafka is mocked to prevent ENOTFOUND errors in the test environment.
 * JWT is signed locally using the same secret as the JwtStrategy fallback.
 */
describe('Product Service — E2E Test Suite', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let createdProductId: string;

  const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // Mock Kafka to prevent broker DNS timeouts in unit/e2e context
      .overrideProvider('KAFKA_SERVICE')
      .useValue({
        emit: jest.fn().mockReturnValue({ subscribe: jest.fn() }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    // Sign a real JWT using the same secret as JwtStrategy — includes role:admin
    adminToken = jwt.sign(
      { sub: 1, username: 'admin', role: 'admin' },
      JWT_SECRET,
      { expiresIn: '1h' },
    );
  });

  afterAll(async () => {
    await app.close();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Section 1 — Auth Guard Enforcement (AUTH-05 on Product Service)
  // ─────────────────────────────────────────────────────────────────────────
  describe('AUTH-05: Unauthenticated Access Rejection', () => {
    it('Should return 401 on POST /products with no token', () => {
      return request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Unauthorized Item', priceUsd: 100 })
        .expect(401);
    });

    it('Should return 401 on GET /products with no token', () => {
      return request(app.getHttpServer())
        .get('/products')
        .expect(401);
    });

    it('Should return 401 on DELETE /products/:id with no token', () => {
      return request(app.getHttpServer())
        .delete('/products/00000000-0000-0000-0000-000000000000')
        .expect(401);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Section 2 — Product Creation (PROD-01)
  // ─────────────────────────────────────────────────────────────────────────
  describe('PROD-01: Create Product', () => {
    it('Should create a product and return 201 with a UUID id', async () => {
      const res = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Sony Headphones E2E',
          description: 'High quality headset for QA',
          priceUsd: 300,
          category: 'electronics',
          sku: `SKU-E2E-${Date.now()}`,
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe('Sony Headphones E2E');
      expect(res.body.priceUsd).toBe(300);
      expect(res.body.deletedAt).toBeNull();
      createdProductId = res.body.id;
    });

    it('Should return 401 when creating a product without a token', () => {
      return request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Ghost Product', priceUsd: 50 })
        .expect(401);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Section 3 — List Products (PROD-02, PROD-03)
  // ─────────────────────────────────────────────────────────────────────────
  describe('PROD-02/03: Retrieve Products', () => {
    it('PROD-02: Should return all active products as an array', () => {
      return request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('PROD-03: Should filter products by category=electronics', () => {
      return request(app.getHttpServer())
        .get('/products?category=electronics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach((p: any) => {
            expect(p.category).toBe('electronics');
          });
        });
    });

    it('PROD-03b: Should return empty array for non-existent category', () => {
      return request(app.getHttpServer())
        .get('/products?category=nonexistent_xyz')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(0);
        });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Section 4 — Currency Conversion (PROD-04, PROD-05, RED-01)
  // ─────────────────────────────────────────────────────────────────────────
  describe('PROD-04/05: Currency Conversion', () => {
    it('PROD-04: Should return priceEUR on valid currency=EUR', () => {
      return request(app.getHttpServer())
        .get(`/products/${createdProductId}?currency=EUR`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.priceEUR).toBeDefined();
          expect(typeof res.body.priceEUR).toBe('number');
          expect(res.body.priceEUR).toBeGreaterThan(0);
        });
    });

    it('PROD-05: Should return 400 for invalid currency ticker', () => {
      return request(app.getHttpServer())
        .get(`/products/${createdProductId}?currency=INVALID_TICKER`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400)
        .expect((res) => {
          expect(res.body.error).toBe('Bad Request');
          expect(res.body.message).toContain('Invalid currency');
        });
    });

    it('RED-01: Currency conversion response time must be under 400ms', async () => {
      const start = Date.now();
      await request(app.getHttpServer())
        .get(`/products/${createdProductId}?currency=EUR`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(400);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Section 5 — Update Operations (PROD-07, PROD-08, PROD-11)
  // ─────────────────────────────────────────────────────────────────────────
  describe('PROD-07/08/11: Update & Price History', () => {
    it('PROD-07: PUT /products/:id should fully update priceUsd and return 200', async () => {
      const res = await request(app.getHttpServer())
        .put(`/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ priceUsd: 250 })
        .expect(200);

      expect(res.body.priceUsd).toBe(250);
    });

    it('PROD-08: GET /products/:id/history should return price change ledger', async () => {
      const res = await request(app.getHttpServer())
        .get(`/products/${createdProductId}/history`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      // At least one entry from the PUT above
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].oldPriceUsd).toBeDefined();
      expect(res.body[0].newPriceUsd).toBeDefined();
    });

    it('PROD-11: PATCH /products/:id should update name only and return 200', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Sony Headphones V2' })
        .expect(200);

      expect(res.body.name).toBe('Sony Headphones V2');
      // Price should remain from the PUT above
      expect(Number(res.body.priceUsd)).toBe(250);
    });

    it('PROD-07b: PUT /products/:id → 404 for a non-existent product', () => {
      return request(app.getHttpServer())
        .put('/products/00000000-0000-0000-0000-000000000001')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ priceUsd: 100 })
        .expect(404);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Section 6 — Soft-Delete (PROD-10, PROD-12)
  // ─────────────────────────────────────────────────────────────────────────
  describe('PROD-10/12: Soft-Delete', () => {
    it('PROD-10: DELETE /products/:id should archive product and return 200', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.message).toContain('archived successfully');
      expect(res.body.id).toBe(createdProductId);
    });

    it('PROD-10b: Archived product should not appear in GET /products', async () => {
      const res = await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const found = res.body.find((p: any) => p.id === createdProductId);
      expect(found).toBeUndefined();
    });

    it('PROD-10c: GET /products/:id → 404 for a soft-deleted product', () => {
      return request(app.getHttpServer())
        .get(`/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('PROD-12: DELETE /products/999999 → 400 (invalid UUID format)', () => {
      return request(app.getHttpServer())
        .delete('/products/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('uuid is expected');
          expect(res.body.error).toBe('Bad Request');
        });
    });

    it('PROD-12b: DELETE /products/:id → 404 for valid UUID that does not exist', () => {
      return request(app.getHttpServer())
        .delete('/products/00000000-0000-0000-0000-000000000099')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
