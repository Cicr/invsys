# Story INVSYS-7: Golang Service Foundation

**Story ID:** INVSYS-7-Inventory
**Jira Issue:** INVSYS-7
**Epic:** Sprint 3 (INVSYS-300)
**Priority:** High
**Effort:** 5 points
**Status:** ready-for-dev
**Created:** 2026-05-04

## Story

As a backend engineer, I need to scaffold the Inventory microservice in Golang so that it serves as the foundational CQRS command/query layer.
**CRITICAL REQUIREMENT:** The service MUST BE CONTAINERIZED. It must include a robust multi-stage `Dockerfile` and be injected into the root `infra/docker-compose.yml` natively alongside Postgres, Kafka, Redis, and Auth-Service.

### Acceptance Criteria
- Go module (`invsys-inventory`) initialized in `services/inventory-service`.
- Connects exclusively to `inventory_db` on PostgreSQL.
- Service is containerized with a Dockerfile.
- Service boots cleanly inside `task up` via `docker-compose.yml`.

## Dev Agent Record
### Debug Log
<!-- Pending execution -->

### Verification Results
<!-- Pending execution -->
