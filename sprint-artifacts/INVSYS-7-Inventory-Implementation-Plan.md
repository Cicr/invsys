# Implementation Plan: INVSYS-7 Golang Service Foundation

## Goal
Scaffold the highly concurrent Inventory service in Golang obeying ADR-001 (DDD) and ADR-002 (Tech Stack).
**CRITICAL:** ALL SERVICES MUST BE CONTAINERIZED.

## Proposed Changes
1. **Initialize Module:** `go mod init github.com/invsys/inventory` inside `services/inventory-service/`.
2. **Database Connection:** Use `GORM` or `pgx` to connect to `AUTH_DB_HOST` but pointing to `INVENTORY_DB_NAME`.
3. **Dockerization (CRITICAL):**
   - Create `services/inventory-service/Dockerfile` utilizing a `golang:1.21-alpine` builder and scratch/alpine runner.
   - Modify `infra/docker-compose.yml` to inject the `inventory-service` binding to `infra/.env` variables.
4. **Health Check:** Implement a native `/health` HTTP handler to validate DB uptime.

## Verification Plan
1. Do not implement. Documents only.
