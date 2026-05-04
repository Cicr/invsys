# Story INVSYS-12: External Exchange Rate Client

**Story ID:** INVSYS-12-Products
**Jira Issue:** INVSYS-12
**Epic:** Sprint 4 (INVSYS-400)
**Priority:** Medium
**Effort:** 3 points
**Status:** ready-for-dev
**Created:** 2026-05-04

## Story

As a systems architect, I need the Products service to integrate with an external exchange rate API and cache the results in Redis to prevent rate-limiting and ensure fast multi-currency catalog responses.
**CRITICAL REQUIREMENT:** The service MUST BE CONTAINERIZED. Connectivity to Redis must route natively over the Docker internal network.

### Acceptance Criteria
- External HTTP client implemented for exchange rates.
- Caching layer established utilizing the existing `invsys-redis` container.
- Configurable TTL policies protecting the application from stale data or third-party outages.
- Architecture remains fully dockerized without manual proxy interventions.

## Dev Agent Record
### Debug Log
<!-- Pending execution -->

### Verification Results
<!-- Pending execution -->
