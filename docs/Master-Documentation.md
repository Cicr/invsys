# Invsys Master Documentation

This document serves as the overarching technical source of truth for the **Invsys Platform**. It consolidates the architecture, deployment strategies, core API interactions, and telemetry insights. 

It is designed to guide developers progressively—from a high-level system overview down to code-level interactions and live deployment behavior.

---

## 1. High-Level Architecture (C4 Diagrams)

The platform is designed as an event-driven, polyglot microservice architecture. To avoid tight coupling, services communicate synchronously via REST for front-end actions and asynchronously via Kafka for background synchronization.

### 1.1 Context Level (System Integration)
This diagram illustrates how external actors interact with the system as a whole.

```mermaid
C4Context
  title System Context for Invsys Platform

  Person(admin, "Inventory Admin", "Manages product catalog and tracks warehouse stock levels.")
  System(invsys, "Invsys Platform", "Handles user authentication, product lifecycle, and strict stock ledger management.")
  System_Ext(exchangerates, "Exchange Rate API", "Provides real-time, global currency conversion rates (open.er-api.com).")
  
  Rel(admin, invsys, "Uses and manages", "HTTPS")
  Rel(invsys, exchangerates, "Fetches daily rates", "HTTPS/JSON")
```

### 1.2 Container Level (Microservice Topology)
This diagram breaks the system down into independently deployable containers and persistent stores.

```mermaid
C4Container
  title Container Architecture for Invsys Platform

  Person(admin, "Admin User", "Platform Administrator")
  
  System_Boundary(invsys, "Invsys System") {
    Container(auth, "Auth Service", "Node.js / NestJS", "Issues secure JWTs and handles role-based user validation.")
    Container(product, "Product Service", "Node.js / NestJS", "Manages product definitions, complex pricing, and currency caching.")
    Container(inventory, "Inventory Service", "Golang / Gin", "High-throughput CQRS engine managing raw stock transactions.")
    
    ContainerDb(db, "PostgreSQL Database", "PostgreSQL 15", "Stores isolated schemas (Bounded Contexts) for Users, Products, and Stock.")
    ContainerDb(redis, "Redis Cache", "Redis 7", "In-memory caching for API responses and exchange rates.")
    ContainerQueue(kafka, "Kafka Broker", "Apache Kafka (KRaft)", "Durable message broker for decoupled event-driven communication.")
  }

  Rel(admin, auth, "Authenticates", "HTTPS/REST")
  Rel(admin, product, "Manages catalog", "HTTPS/REST")
  Rel(admin, inventory, "Manages stock", "HTTPS/REST")
  
  Rel(auth, db, "Reads/Writes User Bounded Context", "TCP")
  Rel(product, db, "Reads/Writes Product Bounded Context", "TCP")
  Rel(inventory, db, "Reads/Writes Inventory Bounded Context", "TCP")
  
  Rel(product, redis, "Caches external API data", "TCP")
  Rel(product, kafka, "Publishes lifecycle events", "TCP")
  Rel(kafka, inventory, "Consumes lifecycle events", "TCP")
```

### 1.3 Component Level (Product Service Internals)
A zoomed-in view of the **Product Service**, demonstrating internal NestJS modules.

```mermaid
C4Component
  title Component Architecture - Product Service

  Container_Boundary(product_app, "Product Service (NestJS)") {
    Component(controller, "ProductController", "NestJS Controller", "Handles incoming REST HTTP boundaries and validations.")
    Component(service, "ProductService", "NestJS Injectable", "Orchestrates business logic, soft-deletion, and history mutation tracking.")
    Component(exchange, "ExchangeService", "NestJS Injectable", "Retrieves and parses multi-currency conversions using Redis.")
    Component(kafka_client, "KafkaProducer", "NestJS ClientKafka", "Emits structured schema payloads to Kafka topics.")
  }
  
  ContainerDb(db, "PostgreSQL", "Relational DB", "Stores products and price history tables.")
  
  Rel(controller, service, "Delegates domain logic", "Method Call")
  Rel(service, db, "Persists data via TypeORM", "TCP")
  Rel(service, exchange, "Requests dynamic conversion rates", "Method Call")
  Rel(service, kafka_client, "Emits 'product.created/updated/deleted'", "Method Call")
```

---

## 2. Data Models & Bounded Contexts

The system enforces strict **Bounded Contexts** to prevent data mingling. Each microservice owns its schema entirely. They do not share tables.

### 2.1 Entity Relationship Diagrams (ERD)

```mermaid
erDiagram
    %% Auth Bounded Context
    USERS {
        uuid id PK
        string username
        string password_hash
        string role
        string status
    }

    %% Product Bounded Context
    PRODUCTS {
        uuid id PK
        string name
        float price_usd
        string category
        string sku UK
        datetime created_at
        datetime deleted_at
    }
    PRICE_HISTORY {
        uuid id PK
        uuid product_id FK
        float old_price
        float new_price
        datetime changed_at
    }
    PRODUCTS ||--o{ PRICE_HISTORY : "tracks mutations"

    %% Inventory Bounded Context
    INVENTORY_ITEMS {
        int id PK
        uuid product_id UK
        int quantity
        datetime updated_at
    }
```

### 2.2 Decoupled Interaction Schema
How the tables interact across services without sharing a physical relational key:
- `PRODUCTS.id` (UUID) is emitted via Kafka.
- The **Inventory Service** stores `PRODUCTS.id` as a unique string (`product_id`) in its `INVENTORY_ITEMS` table.
- Referential integrity is managed via **eventual consistency** rather than foreign keys.

---

## 3. Sequence Interactions

### 3.1 Synchronous + Asynchronous Creation Flow
The following sequence demonstrates how creating a product immediately triggers background inventory initialization via Kafka.

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant ProductService as Product Service (NestJS)
    participant DB as Postgres (Product Schema)
    participant Kafka as Kafka (product.created)
    participant InvService as Inventory Service (Golang)
    participant InvDB as Postgres (Inventory Schema)

    Admin->>ProductService: POST /products {name, priceUsd}
    ProductService->>DB: INSERT INTO products
    DB-->>ProductService: Success (Returns UUID)
    
    ProductService->>Kafka: Publish Event: { event: "product.created", id: UUID }
    ProductService-->>Admin: 201 Created (HTTP Response)

    Kafka-->>InvService: Consume Event (Reader Group)
    InvService->>InvDB: CREATE initial ledger (product_id: UUID, qty: 0)
    InvDB-->>InvService: Stock ledger initialized
```

---

## 4. Live Request Examples & Swagger Contracts

All APIs use standard HTTP verbs with JSON payloads. Below are examples extracted from a live system run.

### 4.1 Product Creation (POST)
**Endpoint:** `POST http://localhost:3002/products`
**Headers:** `Authorization: Bearer <Admin_JWT>`
**Payload:**
```json
{
  "name": "1 metter Copper pipe",
  "priceUsd": 12.50,
  "category": "materials",
  "sku": "PIPE-CU-28982"
}
```
**Response (201 Created):**
```json
{
  "id": "db182571-559e-407d-a54a-6f22f24ef25a",
  "name": "1 metter Copper pipe",
  "priceUsd": 12.5,
  "category": "materials",
  "sku": "PIPE-CU-28982",
  "createdAt": "2026-05-04T16:02:38.599Z",
  "deletedAt": null
}
```

### 4.2 Multi-Currency Fetch (GET)
**Endpoint:** `GET http://localhost:3002/products/{id}?currency=DOP`
**Response (200 OK):**
```json
{
  "id": "db182571-559e-407d-a54a-6f22f24ef25a",
  "name": "1 metter Copper pipe",
  "priceUsd": "12.50",
  "priceDOP": 742.81
}
```

### 4.3 Inventory Deduction (CQRS)
**Endpoint:** `POST http://localhost:8080/api/v1/inventory/deduct`
**Payload:**
```json
{
  "productId": "db182571-559e-407d-a54a-6f22f24ef25a",
  "quantity": 5
}
```
**Response (200 OK):**
```json
{
  "id": 10,
  "productId": "db182571-559e-407d-a54a-6f22f24ef25a",
  "quantity": 45,
  "updatedAt": "2026-05-04T16:02:38.546Z"
}
```

---

## 5. Deployment Information

### 5.1 Infrastructure Setup
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

### 5.2 Known Quirks & Design Decisions
* **Initial Database Provisioning:** The Postgres container automatically executes `infra/postgres/init.sql` on the very first boot to create the 3 bounded context databases. If you destroy the `postgres_data` volume, you must restart the compose stack fully to recreate them.
* **Golang vs NestJS:** The Inventory service was intentionally built in Golang (Gin) for high-throughput CQRS operations. The Auth and Product services use Node.js (NestJS) for rapid REST API development.
* **Kafka KRaft:** We use Kafka without Zookeeper (KRaft mode). The quorum voter is hardcoded to `localhost:9093` inside its own Docker container, which is standard for single-node KRaft testing.

---

## 6. QA & Observability Summary

### 6.1 Telemetry
* **Prometheus:** Scrapes `/metrics` from all 3 services every 15s (`http://localhost:9090`).
* **Grafana:** Visualizes metrics via a pre-installed `Invsys Overview` dashboard (`http://localhost:3000`).

### 6.2 Key Testing Metrics
As per the most recent `QA-Delivery-Report.md` execution:
* **Total End-to-End Scenarios:** 17
* **Pass Rate:** 100% (17 / 17)
* **Latency Benchmark (`RED-01`):** Redis fetch time is highly optimized (`< 5ms`).
* **Test Automation Coverage:** Validates Authentication, Soft-Deletion, Multi-Currency pricing, and multi-step Price History ledgers dynamically.
