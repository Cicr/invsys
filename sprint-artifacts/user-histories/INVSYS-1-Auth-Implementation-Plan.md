# Implementation Plan: INVSYS-1 Auth Foundation

## Goal

Scaffold the NestJS Application inside `services/auth-service`, establish core connection parameters utilizing the new strictly-prefixed `.env`, setup Swagger UI, and implement baseline tests to achieve >95% coverage reports.

---

## Proposed Changes

### Auth Microservice (NestJS)

#### [NEW] [services/auth-service/src/main.ts](file:///services/auth-service/src/main.ts)
- Base application bootstrap leveraging explicit environment variables like `process.env.AUTH_APP_PORT`.
- Enable Swagger Document Builder exposing to `/api/docs`.

#### [NEW] [services/auth-service/src/app.module.ts](file:///services/auth-service/src/app.module.ts)
- Integrate ConfigModule (loading `infra/.env` variables).
- Integrate TypeOrmModule targeting `AUTH_DB_NAME`, `AUTH_DB_USER` on `AUTH_DB_PORT`.
- Implement basic health check probe component.

---

## Verification Plan

### Automated Tests

**Unit Tests (Jest):**
```bash
cd services/auth-service
npm run test:cov
```
- Expect strict failure if test paths fall below the 95% threshold constraint.

### Manual Verification
1. Open terminal locally.
2. Ensure infrastructure runs: `docker-compose up -d postgres` inside `/infra`.
3. Start service: `npm run start:dev` inside `services/auth-service`.
4. Validate DB connection terminal log says "TypeORM Core: Connection initialized".
5. Navigate to `http://localhost:<AUTH_APP_PORT>/api/docs` and observe the Swagger interactive GUI.
