# Story INVSYS-8: Kafka Event Consumers

**Story ID:** INVSYS-8-Inventory
**Jira Issue:** INVSYS-8
**Epic:** Sprint 3 (INVSYS-300)
**Priority:** High
**Effort:** 3 points
**Status:** ready-for-dev
**Created:** 2026-05-04

## Story

As a systems architect, I need the Inventory service to actively consume Kafka events so that it can autonomously react to domain actions like `product.created` asynchronously.
**CRITICAL REQUIREMENT:** The service MUST BE CONTAINERIZED. This event polling must happen natively inside the Docker composition without manual intervention.

### Acceptance Criteria
- Integration with Kafka broker (`KAFKA_BROKER_URL`).
- Consumer group established listening for `product.created` topics.
- Service is containerized (inherits INVSYS-7 constraints) and seamlessly boots network bounds to `invsys-kafka`.

## Dev Agent Record
### Debug Log
<!-- Pending execution -->

### Verification Results
<!-- Pending execution -->
