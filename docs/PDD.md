# INVSYS - Product Design Document (Solution Design)

**System:** INVSYS Inventory Platform
**Architecture:** Polyglot Microservices (DDD, EDA)

---

## Executive Summary

INVSYS decomposes standard monolithic inventory systems into three robust Bounded Contexts: Auth, Products, and Inventory. By strictly isolating databases and relying on Apache Kafka for asynchronous state synchronization, the platform guarantees high throughput. A hybrid stack of NestJS and Golang is selected to optimize HTTP REST APIs and intensive event-processing respectfully. 

---

## Core System Architecture

### 1. Bounded Contexts
1.  **Auth Domain:** Exclusively handles AuthN/AuthZ. Mints JWTs. Stack: NestJS.
2.  **Products Domain:** Manages catalog data and base prices. Integrates with third-party Exchange Rate APIs to retrieve current prices utilizing Redis caching. Stack: NestJS.
3.  **Inventory Domain:** Handles stock levels recursively. Reacts to `product.created` events and tracks stock in/out thresholds dynamically. Stack: Golang.

### 2. Event-Driven Architecture (EDA)
- **Broker:** Apache Kafka.
- **Pattern:** Choreography/Pub-Sub.
- Services never share databases. If the Inventory service needs to know a product exists, it listens to the `product.created` Kafka topic emitted by the Products service.

### 3. API & Communication
- **Synchronous:** RESTful HTTP interfaces documented via Swagger/OpenAPI.
- **Asynchronous:** Protobuf or JSON Schema encoded payloads transmitted over Kafka.
- **Caching:** Distributed Redis instances caching JWT sessions and external Exchange Rates to mitigate rate limits.

---

## Data Definitions & Storage

### Relational Storage (PostgreSQL)
- `auth_db`: Users, Passwords (Hashed), Roles.
- `products_db`: Products (ID, Name, BasePrice, Currency).
- `inventory_db`: Stock Levels, ProductReferences (ID, CurrentQuantity).

### Ephemeral Storage (Redis)
- Short-term currency conversion caching leveraging TTLs based on API refresh minimums to fulfill aggressive PRD compliance.

---

## Development & Observability

### Environments
- Local development perfectly aligned with production security patterns via Docker Compose.
- Complete parity maintained with `APP_ENV` and `NODE_ENV`. 

### Observability (Future Sprint Focus)
- Grafana + Prometheus for metric ingestion.
- Centralized structured logging output from NestJS/Golang modules natively.

---

## Out of Scope
- Frontend UI implementations (React/Vue).
- GraphQL endpoints (sticking to REST + CQRS/EDA).
