# Invsys Master Documentation

This document serves as the overarching technical source of truth for the **Invsys Platform**. It consolidates the architecture, deployment strategies, core API interactions, and telemetry insights.

---

## 1. Summary
The **Invsys Platform** is a polyglot microservice architecture designed for high-performance product management and inventory tracking. It leverages Node.js (NestJS) for complex business logic and authentication, and Golang (Gin) for high-throughput inventory operations. The system is event-driven, using Apache Kafka for decoupled service communication and eventual consistency.

## 2. Problem
Legacy inventory systems often suffer from tight coupling, making it difficult to scale individual components. Managing product catalogs with complex pricing histories and real-time inventory updates in a single monolithic database leads to performance bottlenecks and deployment risks.

## 3. Why Now
As the volume of product transactions and stock adjustments grows, the need for a scalable, resilient, and observable architecture becomes critical. The transition to a microservice model allows for specialized technology stacks (Go for performance, NestJS for development speed) and isolated data domains (Bounded Contexts).

## 4. Functional Requirements
- **Secure Authentication**: Role-based access control (Admin/User) using JWT.
- **Product Lifecycle**: CRUD operations for products with automated price history tracking.
- **Multi-Currency Support**: Real-time currency conversion (USD to DOP) via external API integration and Redis caching.
- **Inventory Ledger**: High-throughput stock additions and deductions with transactional integrity.
- **Event-Driven Sync**: Automatic inventory initialization when new products are created via Kafka events.

## 5. Non-Functional Requirements
- **Performance**: Redis-backed caching ensuring <5ms latency for frequent data fetches.
- **Reliability**: 100% pass rate on a 17-scenario automated regression suite.
- **Observability**: Full-stack telemetry with Prometheus metrics and Grafana dashboards.
- **Security**: Strict Bounded Contexts with isolated database schemas per service.
- **Scalability**: Decoupled asynchronous communication via Kafka KRaft.

## 6. Entities / Domains
The system is divided into three primary bounded contexts:
- **Auth Domain**: Manages users, roles, and security tokens.
- **Product Domain**: Owns product definitions, pricing, and history.
- **Inventory Domain**: Manages the physical stock ledger and transaction logs.

## 7. API
All APIs use standard HTTP verbs with JSON payloads.
- **Auth Service (Port 3001)**: `POST /auth/login`
- **Product Service (Port 3002)**: `GET /products`, `POST /products`, `GET /products/:id?currency=DOP`
- **Inventory Service (Port 8080)**: `POST /api/v1/inventory/add`, `POST /api/v1/inventory/deduct`

---

## 8. High-Level Architecture
This diagram illustrates the high-level system context and external integrations.

<div style="background-color: #ffffff; padding: 24px; border-radius: 8px; overflow: auto; width: 100%; border: 1px solid #f0f0f0; margin-bottom: 24px;">

![System Context — Invsys Platform](./diagrams/invsys-context.svg?v=1)

</div>

---

## 9. Detailed Level Architecture

### 9.1 Container Diagram (Microservice Topology)
A deep dive into the independently deployable containers and persistent stores.

<div style="background-color: #ffffff; padding: 24px; border-radius: 8px; overflow: auto; width: 100%; border: 1px solid #f0f0f0; margin-bottom: 24px;">

![Container Architecture — Invsys Platform](./diagrams/invsys-container.svg?v=1)

</div>

### 9.2 Data Models (ERD)
The system enforces strict Bounded Contexts. Databases do not share tables; communication happens via events.

<div style="background-color: #ffffff; padding: 24px; border-radius: 8px; overflow: auto; width: 100%; border: 1px solid #f0f0f0; margin-bottom: 24px;">

![Entity Relationship Diagram — Invsys Platform](./diagrams/invsys-erd.svg?v=1)

</div>

### 9.3 Interaction Flows (Sequence Diagram)
Demonstrating the synchronous and asynchronous creation flow.

<div style="background-color: #ffffff; padding: 24px; border-radius: 8px; overflow: auto; width: 100%; border: 1px solid #f0f0f0; margin-bottom: 24px;">

![Sequence Diagram — Invsys Platform](./diagrams/invsys-sequence.svg?v=1)

</div>

---

## 10. Deployment Information

### 10.1 Infrastructure Setup
The entire platform is orchestrated via Docker Compose.

**To Start the Environment:**
```bash
docker compose -f infra/docker-compose.yml --env-file infra/.env up -d --build
```
**Expected Result:**
All 8 containers will spin up: Postgres, Redis, Kafka, Auth, Product, Inventory, Prometheus, and Grafana.

**To Run the Regression Suite:**
```bash
bash run_tests.sh
```
*(This triggers a 17-step full system integration validation against the live Docker ports.)*

### 10.2 Known Quirks & Design Decisions
* **Initial Database Provisioning:** The Postgres container automatically executes `infra/postgres/init.sql` on the very first boot to create the 3 bounded context databases. If you destroy the `postgres_data` volume, you must restart the compose stack fully to recreate them.
* **Golang vs NestJS:** The Inventory service was intentionally built in Golang (Gin) for high-throughput CQRS operations. The Auth and Product services use Node.js (NestJS) for rapid REST API development.
* **Kafka KRaft:** We use Kafka without Zookeeper (KRaft mode). The quorum voter is hardcoded to `localhost:9093` inside its own Docker container, which is standard for single-node KRaft testing.

---

## 11. QA & Observability Summary

### 11.1 Telemetry
* **Prometheus:** Scrapes `/metrics` from all 3 services every 15s (`http://localhost:9090`).
* **Grafana:** Visualizes metrics via a pre-installed `Invsys Overview` dashboard (`http://localhost:3000`).

### 11.2 Key Testing Metrics
As per the most recent `QA-Delivery-Report.md` execution:
* **Total End-to-End Scenarios:** 17
* **Pass Rate:** 100% (17 / 17)
* **Latency Benchmark (`RED-01`):** Redis fetch time is highly optimized (`< 5ms`).
* **Test Automation Coverage:** Validates Authentication, Soft-Deletion, Multi-Currency pricing, and multi-step Price History ledgers dynamically.
