# INVSYS: Inventory Management System Product Brief
**Date:** 2026-05-03
**Status:** Approved for Development

---

## Executive Summary

INVSYS is a highly available, event-driven Inventory and Product Management platform designed to handle currency conversions, rapid stock updates, and secure authentication natively. Constructed via a Polyglot Microservices architecture (NestJS & Golang), it aims to deliver robust real-time synchronization utilizing Kafka Pub/Sub and PostgreSQL per-service boundaries under a strict Domain-Driven Design approach.

---

## Technical Vision

### Core Concept
A resilient inventory management backbone decoupling Authentication, Products, and Inventory tracking into isolated, highly cohesive bounded contexts to ensure scalability and granular maintainability.

### Vision Statement
To establish a rigid, production-ready backend infrastructure from day one, proving that strict adherence to EDA, DDD, and containerized orchestration generates vastly superior deployment reliability and team scalability compared to tightly coupled monoliths.

---

## Scope and Architecture

### Target Platforms
- **Primary:** Backend Services (REST / JSON / Events)
- **Deployment:** Docker / Kubernetes

### Core Bounded Contexts
1. **Auth Service (NestJS):** JWT lifecycle, User Identities.
2. **Products Service (NestJS):** Catalog management, Redis-backed Exchange Rates.
3. **Inventory Service (Golang):** High-throughput CQRS stock mutations responding to Kafka topics.

### Technical Constraints
- **Database:** One PostgreSQL database per microservice. Strictly isolated.
- **Messaging:** Apache Kafka (KRaft mode).
- **Environment:** Single `docker-compose.yml` local harness.

---

## Success Criteria
- 100% Unit Test Coverage on all core modules.
- End-to-end event tracing functionality.
- Automated API Documentation via Swagger.
- Full local setup executable via a single Taskfile command.
