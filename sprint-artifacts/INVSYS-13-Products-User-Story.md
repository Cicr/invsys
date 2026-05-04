# Story INVSYS-13: Kafka Event Producers

**Story ID:** INVSYS-13-Products
**Jira Issue:** INVSYS-13
**Epic:** Sprint 4 (INVSYS-400)
**Priority:** High
**Effort:** 3 points
**Status:** ready-for-dev
**Created:** 2026-05-04

## Story

As a systems architect, I need the Products service to act as an event producer so that whenever a catalog item is created, a `product.created` event is asynchronously published for the downstream Inventory microservice to consume.
**CRITICAL REQUIREMENT:** The service MUST BE CONTAINERIZED. The messaging pipeline must safely resolve the Kafka KRaft broker over the Docker network.

### Acceptance Criteria
- Kafka Producer integrated directly inside the NestJS lifecycle.
- Events formatted strictly (`ProductID` and `Action` tags) emitted upon successful `POST /products` catalog entries.
- Implementation does not introduce blocking I/O penalties to the HTTP response cycle.
- Containerized testing confirms message ingress to the `invsys-kafka` node natively.

## Dev Agent Record
### Debug Log
<!-- Pending execution -->

### Verification Results
<!-- Pending execution -->
