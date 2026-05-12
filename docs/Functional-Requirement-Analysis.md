# Functional and Non-Functional Requirement Analysis Report

This document presents a comprehensive, enterprise-grade analysis of the InvSys microservice architecture against the established Product Requirements Document (PRD).

## 1. Functional and Non-Functional Requirements Evaluation

| ID | Category / Attribute | Requirement Description | Evaluation |
| :--- | :--- | :--- | :--- |
| **FR-01** | Product Management | Create a new product. | **PASS** |
| **FR-02** | Product Management | List all existing products. | **PASS** |
| **FR-03** | Product Management | Filter products by a specific category. | **PASS** |
| **FR-04** | Product Management | Retrieve detailed information for a specific product. | **PASS** |
| **FR-05** | Product Management | Update existing product details. | **PASS** |
| **FR-06** | Product Management | Delete a product from the database by its ID. | **PASS** |
| **FR-07** | Inventory Management | Increase or decrease stock quantity (Entry/Exit). | **PASS** (Functionally works, but lacks security/idempotency) |
| **FR-08** | Inventory Management | Query the current available stock for a product. | **PASS** |
| **FR-09** | Inventory Management | Retrieve the history of all inventory movements. | **FAIL** (Not implemented in backend handlers or frontend) |
| **FR-10** | Pricing & Currency | Support currency conversion in price queries. | **PASS** |
| **FR-11** | Pricing & Currency | Track and allow querying of the price history. | **PASS** |
| **FR-12** | Security | Implement authentication using JSON Web Tokens (JWT). | **PARTIAL** (Implemented in Auth/Product, missing in Inventory) |
| **FR-13** | Security | Implement Role-Based Access Control (Admin/User). | **FAIL** |
| **FR-14** | Security | Restrict sensitive ops to Admin users only. | **FAIL** |
| **FR-15** | Communication | Notify Inventory on product creation/update/delete. | **PASS** |
| **FR-16** | Communication | Emit events when inventory adjustments are performed. | **FAIL** |
| **NFR-01**| Scalability | Use a decoupled microservice architecture. | **PASS** |
| **NFR-02**| Performance | Implement caching for frequent queries. | **PARTIAL** (Exchange rates cached; products/inventory are not) |
| **NFR-03**| Reliability | Ensure event processing is **idempotent**. | **FAIL** |
| **NFR-04**| Resilience | Use asynchronous messaging queues (Kafka). | **PASS** |
| **NFR-05**| Data Integrity | Implement validation measures. | **PARTIAL** (Basic validation exists, but stock dedupe/idempotency missing) |
| **NFR-06**| Security | Ensure secure access through authentication. | **FAIL** (Inventory API is completely unauthenticated) |
| **NFR-07**| Interoperability | Implement services as RESTful APIs. | **PASS** |
| **NFR-08**| Portability | Provide a Docker Compose configuration. | **PASS** (Assumed present via infra context) |
| **NFR-09**| Quality | Implement unit tests with high code coverage. | **FAIL** |
| **NFR-10**| Maintainability | Follow modern framework standards. | **PARTIAL** (Go service violates standards) |
| **NFR-11**| Deployment | Auth service production-ready (no hardcoded creds). | **PASS** (Uses .env) |
| **NFR-12**| Security | Prevent unauthorized user creation. | **FAIL** (Auth `/register` endpoint is public) |
| **NFR-13**| Security (RBAC) | Strict Role-Based Access Control hierarchy. | **FAIL** |

## 2. Is the Application Secure? Does it respect Role Access?
**NO.** The application has critical security vulnerabilities and does not enforce Role-Based Access Control (RBAC) across its domains:
*   **Public Registration:** The `/auth/register` endpoint lacks the `JwtAuthGuard`, allowing unauthenticated users to register and inject arbitrary roles (e.g., assigning themselves as 'admin').
*   **Unauthenticated Inventory Service:** The Golang `inventory-service` handlers lack any JWT validation middleware. Any actor with network access can invoke `/inventory/add` or `/inventory/deduct`.
*   **Missing RBAC in Product Service:** The `product-service` requires a valid JWT for mutations, but fails to check if the user is an Admin. Standard users can create, update, or delete products.

## 3. Architecture Pattern for Each Microservice (Correctness & Malpractice)
*   **Auth Service (NestJS):** Follows a standard Layered Architecture (Controller → Service). Implementation is generally correct, but suffers from security malpractice (unprotected registration).
*   **Product Service (NestJS):** Follows a standard Layered Architecture. Correctly separates HTTP transport from business logic and database access using TypeORM.
*   **Inventory Service (Golang):** **CRITICAL MALPRACTICE.** The architecture is monolithic at the handler level. Database transactions (`db.DB.Transaction(...)`) are executed directly inside the Gin HTTP handlers (`handlers/inventory.go`). This tightly couples the HTTP transport layer with the data access layer, violating the Single Responsibility Principle and making unit testing exceedingly difficult.

## 4. Is the Product Microservice a RESTful API?
**YES.** The `product-service` implements a clean RESTful design:
*   Uses standard HTTP methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`).
*   Maps actions to proper URI resources (`/products`, `/products/:id`, `/products/:id/history`).
*   Returns correct HTTP status codes (e.g., `201 Created`, `200 OK`, `404 Not Found`).

## 5. Does the Inventory Service have Idempotence?
**NO.** The `inventory-service` fails to implement idempotency:
*   The `AddStock` and `DeductStock` HTTP handlers do not require or process an `Idempotency-Key` header. A retried HTTP request due to a network timeout will result in double-counting inventory.
*   The Kafka consumer (`product.created`) relies entirely on the database `gorm.ErrRecordNotFound` for deduplication, rather than explicitly tracking processed event IDs.

## 6. Are Unit Testing and Coverage implemented to cover all FRs?
**NO.** Code coverage is drastically inadequate. A global scan reveals only a handful of test files (`app.e2e-spec.ts`, `app.controller.spec.ts`, `consumer_test.go`). The vast majority of business logic, database transactions, Kafka publishing, and currency exchange mechanisms lack unit and integration tests.

## 7. Detailed Technical Debt Table

| Component | Debt Description | Impact | Remediation |
| :--- | :--- | :--- | :--- |
| **Inventory Service** | Direct DB access inside Gin Handlers. | High coupling, untestable business logic. | Refactor to Handler → Service → Repository pattern. |
| **Inventory Service** | Missing Inventory Movement History. | Violates FR-09. No audit trail for stock. | Implement `inventory_movements` table and append ledger entries on mutation. |
| **Frontend/Backend** | Lack of test coverage. | High regression risk during CI/CD. | Implement Jest/Go tests targeting >80% coverage. |
| **Inventory Service** | Lack of idempotency keys. | Financial/Stock data corruption on retries. | Require `Idempotency-Key`, store in a `processed_requests` table. |

## 8. Detailed Security/Vulnerability Table

| Vulnerability | Component | Severity | Description |
| :--- | :--- | :--- | :--- |
| **Unauthenticated Registration** | Auth Service | CRITICAL | `/auth/register` allows public user creation and arbitrary role assignment. |
| **Unauthenticated API** | Inventory Service | CRITICAL | No JWT middleware. Attackers can freely manipulate global stock levels. |
| **Broken Access Control** | Product Service | HIGH | Lacks `@Roles('admin')` guards. Any authenticated user can delete products. |

## 9. Detailed Events Security/Vulnerability Table

| Vulnerability | Component | Severity | Description |
| :--- | :--- | :--- | :--- |
| **Unencrypted Broker Traffic** | Kafka Infrastructure | MEDIUM | Services connect to `localhost:9092` using plaintext, susceptible to sniffing in shared networks. |
| **Lack of Payload Signatures** | Kafka Events | HIGH | Event payloads (`product.created`) are not cryptographically signed. Malicious actors on the network can inject fake events. |
| **Missing Dead Letter Queue (DLQ)**| Inventory Service | MEDIUM | Failing events in the consumer are logged but not persisted for manual recovery. |

## 10. Does the Frontend achieve all Functional Requirements?
**NO.** The frontend MVP is missing key functional interfaces:
*   **Missing FR-09:** There is no UI implemented to view the history of inventory movements (`inventory-history.tsx` is missing).
*   **Missing FR-13/14 (UI Level):** The frontend does not conditionally hide or block restricted operations (Create/Update/Delete Product, Add/Deduct Stock) based on the active user's role. Administrative actions are exposed to all users.
