# INVSYS - Sprint Plan & Implementation Tracker

**Project:** INVSYS Architecture Implementation  
**Total Sprints:** 7  
**Sprint Duration:** 1 week each  

*Note: This document serves as the live implementation tracker. Each Sprint is broken down into specific User Stories (Histories) that correspond to physical artifacts.*

---

## Sprint 1: Auth Microservice
**Goal:** Implement the Auth microservice according to ADRs and PDD, establishing foundational REST security.

### Implementation Tracker
- [x] **INVSYS-1: Auth Microservice Foundation** 
  - *Scaffold NestJS service and connect to PostgreSQL `auth_db`.*
- [x] **INVSYS-2: JWT Core Security Model** 
  - *Implement passport strategies, hashing logic, and mint tokens.*
- [x] **INVSYS-3: API Contracts & Swagger** 
  - *Create REST endpoints (login/register) and document via interactive Swagger UI.*
- [x] **INVSYS-4: Test Coverage Shield** 
  - *Develop Jest unit testing pipelines hitting >95% logic paths.*

---

## Sprint 2: DevOps & Automation
**Goal:** Add a Taskfile with comprehensive up/down commands establishing a 100% clean deployment.

### Implementation Tracker
- [x] **INVSYS-5: Taskfile Orchestration**
  - *Create automated `task up` / `task down` bindings for the Docker compose environment.*
- [x] **INVSYS-6: End-to-End Environment Validation**
  - *Verify Postgres table instantiation, Redis binds, and Kafka KRaft topics spin up cleanly.*

---

## Sprint 3: Inventory Microservice & EDA
**Goal:** Implement the high-throughput Inventory microservice in Golang adhering to CQRS/EDA patterns.

### Implementation Tracker
- [ ] **INVSYS-7: Golang Service Foundation**
  - *Initialize Go Modules and connection hooks to `inventory_db`.*
- [ ] **INVSYS-8: Kafka Event Consumers**
  - *Build asynchronous consumers anticipating `product.created` streams.*
- [ ] **INVSYS-9: Stock Mutation Handlers**
  - *Handle CRUD CQRS operations for inventory ledgers.*
- [ ] **INVSYS-10: Golang Testing & API Validation**
  - *Generate `go test` coverage constraints and Swagger endpoint equivalents.*

---

## Sprint 4: Product Microservice & Exchange Integration
**Goal:** Implement the Product microservice managing cataloging and third-party rate limiting.

### Implementation Tracker
- [ ] **INVSYS-11: Products NestJS Foundation**
  - *Scaffold the NextJS App and connect to `products_db`.*
- [ ] **INVSYS-12: External Exchange Rate Client**
  - *Implement API polling with robust Redis caching and TTL adherence.*
- [ ] **INVSYS-13: Kafka Event Producers**
  - *Emit strictly typed events (`product.created`) upon catalog mutations.*

---

## Sprint 5: Quality Assurance & Status Report
**Goal:** Enforce 100% Test Coverage conforming to all defined features spanning the PRD, PDD, and ADRs.

### Implementation Tracker
- [ ] **INVSYS-14: Auth & Product Defect Remediation**
- [ ] **INVSYS-15: Inventory Defect Remediation**
- [ ] **INVSYS-16: Comprehensive Delivery Report**

---

## Sprint 6: Observability Integration
**Goal:** Implement telemetry and monitoring utilizing Grafana and Prometheus.

### Implementation Tracker
- [ ] **INVSYS-17: Service Telemetry Endpoints**
  - *Add `/metrics` to NestJS and Golang.*
- [ ] **INVSYS-18: Centralized Dashboards**
  - *Add Prometheus/Grafana to Docker & build visual dashboards.*

---

## Sprint 7: Master Documentation Compilation
**Goal:** Finalize the project with a comprehensive master document aggregation.

### Implementation Tracker
- [ ] **INVSYS-19: Developer Portal Unification**
  - *Compile PRD, PDD, ADRs, and localized setup scripts into the final docs.*
