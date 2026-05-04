# Implementation Plan: INVSYS-5 Taskfile Orchestration

## Goal

Provide rigid deployment standards matching ADR-003 explicitly tying task commands rigidly into our custom `/infra` environment directory parameters bridging developer workflows simply.

---

## Proposed Changes

### [NEW] [Taskfile.yaml](file:///Taskfile.yaml)
*Build the primary structural orchestration pipeline schema utilizing schema standard version 3:*

- **task up:**
  - Wrap `docker compose -f infra/docker-compose.yml --env-file infra/.env up -d`
- **task down:**
  - Wrap `docker compose -f infra/docker-compose.yml --env-file infra/.env down -v` *(Includes Volume tears optionally)*
- **task start:**
  - Starts NestJS implementations (`cd services/auth-service && npm run start:dev`)
- **task clean:**
  - Prunes broken images recursively isolating environment stability.

---

## Verification Plan
1. Call `task up`. Confirm container spinup visibly occurs targeting precisely Postgres, Kafka, and Redis images.
2. Call `task down`. Confirm clean environment tears.
