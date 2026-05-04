# Invsys: Enterprise Microservice Inventory Platform

[![CI/CD Tests](https://img.shields.io/badge/tests-17%2F17%20passing-success)](#)
[![Docker Support](https://img.shields.io/badge/docker-ready-blue)](#)
[![Architecture](https://img.shields.io/badge/architecture-event--driven-orange)](#)

Invsys is a high-performance, polyglot microservice ecosystem designed to manage complex product catalogs, live multi-currency conversions, and high-throughput inventory ledgers. 

The platform utilizes **CQRS (Command Query Responsibility Segregation)**, strict **Bounded Contexts**, and **Event-Driven Asynchronous Synchronization** via Kafka to maintain maximum scalability and zero database coupling.

---

## 🏗️ Core Technologies

* **Auth & Product Services:** Node.js (NestJS) + TypeORM
* **Inventory Service:** Golang (Gin) + GORM (CQRS Implementation)
* **Data Persistence:** PostgreSQL 15 (Isolated schema per service)
* **Message Broker:** Apache Kafka (KRaft mode)
* **Caching:** Redis 7 (External API response caching)
* **Observability:** Prometheus & Grafana

---

## 🚀 Quick Start

The entire infrastructure, including databases, brokers, microservices, and telemetry, is fully containerized.

### 1. Boot the Stack
Ensure Docker is running, then execute:

```bash
docker compose -f infra/docker-compose.yml --env-file infra/.env up -d --build
```
*Wait ~15-30 seconds for Kafka's KRaft quorum and PostgreSQL's Bounded Context initialization to complete.*

### 2. Verify Telemetry
Once booted, the observability stack is immediately available:
* **Grafana Dashboard:** [http://localhost:3000](http://localhost:3000) (User/Pass: `admin` / `admin`)
* **Prometheus Targets:** [http://localhost:9090](http://localhost:9090)

---

## 🧪 Live Integration Testing

We provide a robust E2E bash script that runs 17 automated regression scenarios against the live Docker environment. This verifies JWT authentication, product mutation histories, live currency conversions (USD -> DOP, EUR, CNY), and background Kafka event propagation.

```bash
# Execute the test suite
bash run_tests.sh
```

---

## 📖 Developer Documentation

For an in-depth understanding of the system, including **C4 Architecture Diagrams**, **Entity Relationship (ER) diagrams**, asynchronous **Sequence diagrams**, and live REST API snippets, please refer to the Master Documentation:

👉 **[View Master Documentation](docs/Master-Documentation.md)**

### Other Key Documents
* [Product Requirements (PRD)](docs/PRD.md)
* [Architectural Decision Records (ADRs)](docs/adrs)
* [QA Delivery Report](sprint-artifacts/QA-Delivery-Report.md)

---

## 📂 Project Structure

```text
.
├── services/               # Microservice Implementations
│   ├── auth-service/       # NestJS (Role-based JWT generation)
│   ├── product-service/    # NestJS (Pricing, mutation history, caching)
│   └── inventory-service/  # Golang (High-speed CQRS ledger engine)
├── infra/                  # Docker Compose, Prometheus, Grafana configs
├── docs/                   # Architectural drawings and specifications
└── run_tests.sh            # Live integration regression suite
```
