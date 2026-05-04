# Story INVSYS-11: Products NestJS Foundation

**Story ID:** INVSYS-11-Products
**Jira Issue:** INVSYS-11
**Epic:** Sprint 4 (INVSYS-400)
**Priority:** High
**Effort:** 5 points
**Status:** ready-for-dev
**Created:** 2026-05-04

## Story

As a backend engineer, I need to scaffold the Product microservice using NestJS so that it serves as the core authority for the product catalog.
**CRITICAL REQUIREMENT:** The service MUST BE CONTAINERIZED. It must include a robust multi-stage `Dockerfile` and be injected into the root `infra/docker-compose.yml` natively alongside Postgres, Kafka, Redis, Auth-Service, and Inventory-Service.

### Acceptance Criteria
- NestJS module (`product-service`) initialized in `services/product-service`.
- Connects exclusively to `products_db` on PostgreSQL via TypeORM.
- Service is containerized with a Dockerfile running on Node 20.
- Service boots cleanly inside `task up` via `docker-compose.yml`.

## Dev Agent Record
### Debug Log
<!-- Pending execution -->

### Verification Results
<!-- Pending execution -->
