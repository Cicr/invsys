# Functional Requirements Correction Plan

Based on the `Functional-Requirement-Analysis.md` report, this document outlines a structured execution plan to address all identified gaps, vulnerabilities, and missing functional/non-functional requirements.

> **CRITICAL ARCHITECTURAL DECISION:**
> The monolithic handler pattern currently implemented in the Golang **Inventory Service** is an accepted architectural design choice. It will **not** be refactored into a layered (Service/Repository) pattern. All corrections for the Inventory service (e.g., Auth, Idempotency, History tracking) will be implemented directly within the existing Gin HTTP handler structure to maintain alignment with this design choice.

The corrections are bundled into **Epics** that group related issues by domain and impact area.

---

## Epic 1: Identity & Access Management (IAM) Hardening
*Objective: Secure all endpoints, enforce Role-Based Access Control (RBAC), and eliminate public access to sensitive operations.*

*   **Issue 1.1: Secure Auth Registration (Auth Service)**
    *   **Description:** The `/auth/register` endpoint is currently public.
    *   **Action:** Add the `JwtAuthGuard` and a custom Role Guard to the register endpoint so that only an authenticated `Admin` can create new users and assign roles (resolves NFR-12).
*   **Issue 1.2: Enforce RBAC in Product API (Product Service)**
    *   **Description:** Product mutations are accessible to any authenticated user.
    *   **Action:** Implement a `@Roles('admin')` guard on the `POST`, `PUT`, `PATCH`, and `DELETE` endpoints in the `ProductController` (resolves FR-13, FR-14).
*   **Issue 1.3: Implement JWT & RBAC Middleware (Inventory Service)**
    *   **Description:** The Golang Inventory APIs have no authentication.
    *   **Action:** Create a Gin middleware function to parse and validate JWTs. Apply it to all routes. Restrict the `AddStock` and `DeductStock` handlers to the `admin` role (resolves FR-13, FR-14, NFR-06).

---

## Epic 2: Reliability & Idempotency
*Objective: Ensure network retries and duplicate events do not corrupt stock levels or cause data inconsistencies.*

*   **Issue 2.1: Idempotent Inventory Handlers (Inventory Service)**
    *   **Description:** Stock adjustment APIs are vulnerable to double-counting on retries.
    *   **Action:** 
        *   Update `AddStock` and `DeductStock` handlers to require an `Idempotency-Key` HTTP header.
        *   Create a `processed_requests` DB table.
        *   Inside the handler's `db.DB.Transaction(...)`, check if the key exists before mutating stock (resolves NFR-03).
*   **Issue 2.2: Idempotent Event Processing (Inventory Service)**
    *   **Description:** The Kafka consumer lacks explicit event deduplication.
    *   **Action:** Update the Kafka consumer logic to extract a unique event ID and track it via the `processed_requests` table to prevent duplicate processing.

---

## Epic 3: Inventory Traceability & Event Emitting
*Objective: Complete missing business logic for tracking stock history and publishing inventory events.*

*   **Issue 3.1: Inventory Movement Ledger (Inventory Service)**
    *   **Description:** Missing audit trail for stock additions and deductions.
    *   **Action:** Create an `inventory_movements` GORM model. Inside the existing `AddStock` and `DeductStock` handlers, insert a new movement record (timestamp, delta, action type) alongside the stock update (resolves FR-09 backend).
*   **Issue 3.2: Expose Movement History API (Inventory Service)**
    *   **Description:** Missing endpoint to retrieve movements.
    *   **Action:** Create a new `GET /inventory/{productId}/history` Gin handler to fetch the ledger entries for a given product.
*   **Issue 3.3: Emit Inventory Events (Inventory Service)**
    *   **Description:** Stock adjustments do not inform the broader system.
    *   **Action:** Integrate a Kafka producer in the `AddStock` and `DeductStock` handlers to emit an `inventory.adjusted` event after a successful database transaction (resolves FR-16).

---

## Epic 4: Frontend Feature Parity & Security UI
*Objective: Align the Next.js frontend with the secured backend and implement missing user interfaces.*

*   **Issue 4.1: Role-Based Conditional Rendering (Frontend)**
    *   **Description:** Administrative actions are visible to all users.
    *   **Action:** Update the UI components (`product-table.tsx`, etc.) to parse the JWT role. Hide Create, Edit, Delete, Add Stock, and Deduct Stock buttons for users without the `admin` role (resolves FR-13/14 UI).
*   **Issue 4.2: Inventory Movement UI (Frontend)**
    *   **Description:** No UI to view stock history.
    *   **Action:** Build an `inventory-history.tsx` component/modal that fetches data from the new Inventory Service history API, mirroring the logic used in the pricing history (resolves FR-09 UI).

---

## Epic 5: Quality Assurance & Test Coverage
*Objective: Establish a robust testing foundation to prevent regressions.*

*   **Issue 5.1: Auth & Product Service Testing**
    *   **Description:** NestJS services lack unit and integration tests.
    *   **Action:** Write Jest unit tests for all controllers and services, targeting >80% coverage (resolves NFR-09).
*   **Issue 5.2: Inventory Service Testing**
    *   **Description:** The Golang handlers are untested.
    *   **Action:** Write standard `go test` files using `httptest` to mock requests against the Gin handlers, ensuring validation, auth middleware, and idempotency logic are fully verified.

---

## Epic 6: Messaging Infrastructure Security (Technical Debt)
*Objective: Harden the Kafka event bus against tampering and data loss.*

*   **Issue 6.1: Event Payload Signatures**
    *   **Description:** Kafka payloads are sent in plaintext and can be spoofed.
    *   **Action:** Implement cryptographic signing (e.g., HMAC) for Kafka messages in both the NestJS publisher and the Golang publisher. Add signature verification logic to all consumers.
*   **Issue 6.2: Consumer Dead Letter Queue (DLQ) (Inventory Service)**
    *   **Description:** Failing Kafka events are logged and skipped, leading to data loss.
    *   **Action:** Implement a DLQ fallback inside the Golang Kafka consumer to save unprocessable events to the database for manual review.
