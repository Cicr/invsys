# Implementation Plan: INVSYS-11 Products NestJS Foundation

## Goal
Scaffold the highly available Products service in NestJS obeying ADR-001 (DDD) and ADR-002 (Tech Stack).
**CRITICAL:** ALL SERVICES MUST BE CONTAINERIZED.

## Proposed Changes
1. **Initialize Module:** `nest new product-service` inside `services/`.
2. **Database Connection:** Configure TypeORM to connect to `AUTH_DB_HOST` (reusing the common Postgres instance) but pointing to `PRODUCTS_DB_NAME`.
3. **Dockerization (CRITICAL):**
   - Create `services/product-service/Dockerfile` utilizing a `node:20-alpine` builder.
   - Modify `infra/docker-compose.yml` to inject the `product-service` alongside existing clusters mapping port `3002:3002`.
4. **Health Check:** Implement a native `/health` HTTP endpoint to validate DB uptime.

## Verification Plan
1. Do not implement. Documents only.
