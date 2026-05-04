# Story INVSYS-9: Stock Mutation Handlers

**Story ID:** INVSYS-9-Inventory
**Jira Issue:** INVSYS-9
**Epic:** Sprint 3 (INVSYS-300)
**Priority:** High
**Effort:** 5 points
**Status:** ready-for-dev
**Created:** 2026-05-04

## Story

As a backend engineer, I need to implement REST endpoints in the Golang Inventory service to handle synchronous mutations (additions, deductions) to the stock ledger.
**CRITICAL REQUIREMENT:** The service MUST BE CONTAINERIZED. The endpoints must be reachable through the docker network boundary and correctly map requests using CQRS principles.

### Acceptance Criteria
- REST API handling `POST /inventory/deduct` and `POST /inventory/add`.
- CQRS commands update the `inventory_db` securely enforcing transactional integrity avoiding race conditions.
- Service remains containerized and does not break existing orchestration.

## Dev Agent Record
### Debug Log
<!-- Pending execution -->

### Verification Results
<!-- Pending execution -->
