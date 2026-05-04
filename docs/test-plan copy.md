# System Test Plan: Inventory & Product Ecosystem

## 1. Objective
This Test Plan defines the formal validation requirements for the Microservice Ecosystem spanning the Auth, Product, and Inventory domains. It guarantees 1:1 compliance with the capabilities specified in the Product Requirements Document (PRD).

---

## 2. Key Metrics Summary (Redis & Kafka)
**Objective:** Establish baseline telemetry constraints required for passing the E2E Quality Assurance checks.

* **Redis Cache:**
  * **Cold Start Penalty Limit:** `< 400ms` (API Fetch + Redis Write overhead)
  * **Warm Fetch Benchmark:** `< 200ms` (Direct retrieval)
  * **Hit Ratio Target:** `> 95%` on localized currency queries.
* **Kafka Event Pipeline:**
  * **Ingestion Latency:** `< 50ms` from producer emission to consumer acknowledgment.
  * **Idempotency Accuracy:** `100%` drop rate on duplicated `product.created` offsets.
  * **Throughput Target:** Reliable execution without localized Docker bridge DNS timeout leaks.

---

## 3. Authentication & Authorization (JWT & Roles)
**Objective:** Validate that JSON Web Tokens correctly restrict access according to the Role-Based Access Control (RBAC) definitions.

| ID | Test Case | Action / Input | Expected Output | Edge Cases Covered |
| :--- | :--- | :--- | :--- | :--- |
| `AUTH-01` | **Generate Admin JWT** | `POST /auth/login` (Admin credentials) | `201 Created` + JWT Payload | Invalid passwords return `401 Unauthorized`. |
| `AUTH-02` | **Generate User JWT** | `POST /auth/login` (User credentials) | `201 Created` + JWT Payload | Missing payload fields return `400 Bad Request`. |
| `AUTH-03` | **Product Service Read-Only**| `POST /products` (Using User JWT) | `403 Forbidden` | Standard users cannot mutate product state. |
| `AUTH-04` | **Product Service Admin** | `POST /products` (Using Admin JWT)| `201 Created` | Admins have full structural access to catalog. |
| `AUTH-05` | **Product Unauthenticated** | `GET /products` (No JWT provided) | `401 Unauthorized` | Invalid/expired tokens gracefully reject on Product bounds. |
| `AUTH-06` | **Product Service User Read**| `GET /products` (Using User JWT) | `200 OK` | Standard users can retrieve product lists natively. |
| `AUTH-07` | **Inventory Mutation Reject**| `POST /api/v1/inventory/add` (User) | `403 Forbidden` | Users cannot perform inventory adjustments. |
| `AUTH-08` | **Inventory Admin Mutation** | `POST /api/v1/inventory/deduct` (Admin)| `200 OK` | Admins can safely adjust inventory thresholds. |
| `AUTH-09` | **Inventory Unauthenticated**| `GET /api/v1/inventory/:id` (No JWT)| `401 Unauthorized` | Invalid/expired tokens gracefully reject on Inventory bounds. |
| `AUTH-10` | **Inventory User Read** | `GET /api/v1/inventory/:id` (User JWT)| `200 OK` | Standard users can successfully retrieve stock counts. |
| `AUTH-11` | **Token Refresh** | `POST /auth/refresh` | `201 Created` + New JWT | Rejects expired/invalid refresh tokens. |
| `AUTH-12` | **Disable User Account** | `POST /auth/disable` (Admin) | `200 OK` | Disabled users are rejected on next login attempt. |


---

## 4. Product Lifecycle (CRUD & Currency)
**Objective:** Validate the Catalog Management functionality including SKU integrity and external currency exchange formatting.

| ID | Test Case | Action / Input | Expected Output | Edge Cases Covered |
| :--- | :--- | :--- | :--- | :--- |
| `PROD-01` | **Create Product** | `POST /products` (name, desc, price, cat, SKU) | `201 Created` with unique ID | Duplicate SKUs return `409 Conflict`. |
| `PROD-02` | **Retrieve All Products** | `GET /products` | Array of product objects. | Empty catalog returns `[]`. |
| `PROD-03` | **Filter by Category** | `GET /products?category=electronics` | Sliced array matching category. | Non-existent categories return `[]`. |
| `PROD-04` | **Currency Conversion Valid** | `GET /products/:id?currency=EUR` | Output includes converted `priceEur`. | Properly fetches from external exchange API. |
| `PROD-05` | **Currency Conversion Edge**| `GET /products/:id?currency=INVALID` | `400 Bad Request` | Fails gracefully if requested currency doesn't exist. |
| `PROD-06` | **Currency API Timeout** | `GET /products/:id?currency=GBP` | `200 OK` (Fallback to USD) | Falls back to default pricing if external provider drops. |
| `PROD-07` | **Update Product Price** | `PUT /products/:id` (Changing price) | `200 OK` + Updated Price | Automatically populates new entry into Price History ledger. |
| `PROD-08` | **Price History Tracking** | `GET /products/:id/history` | Array of historic price mutations. | Empty history returns `[]` cleanly. |
| `PROD-09` | **Price History Date Filtering**| `GET /products/:id/history?from=YYYY-MM-DD`| Filtered history array. | Ensures time-series data is queryable natively. |
| `PROD-10` | **Delete Product** | `DELETE /products/:id` (Admin) | `200 OK` | Queries to deleted ID return `404 Not Found`. |
| `PROD-11` | **Update Partial Product** | `PATCH /products/:id` (Admin) | `200 OK` + Updated fields | Validates that only provided fields are changed. |
| `PROD-12` | **Delete Non-existent** | `DELETE /products/INVALID_ID` | `404 Not Found` | Gracefully handles non-existent deletions. |


---

## 5. Inventory Lifecycle (Stock Mutations)
**Objective:** Validate the warehouse stock controls, ensuring negative balances are impossible and histories are tracked.

| ID | Test Case | Action / Input | Expected Output | Edge Cases Covered |
| :--- | :--- | :--- | :--- | :--- |
| `INV-01` | **Add Stock (Restock)** | `POST /api/v1/inventory/add` (+50) | `200 OK`, Quantity increases by 50. | Invalid/Null IDs return `404 Not Found`. |
| `INV-02` | **Deduct Stock (Sale)** | `POST /api/v1/inventory/deduct` (-10)| `200 OK`, Quantity decreases by 10. | |
| `INV-03` | **Prevent Over-Deduction**| `POST /api/v1/inventory/deduct` (-999)| `400 Bad Request` | Transaction rolls back natively preventing negative integers. |
| `INV-04` | **Query Stock Level** | `GET /api/v1/inventory/:id` | Returns current total quantity. | |
| `INV-05` | **Movement History** | `GET /api/v1/inventory/:id/history` | Array mapping all adds/deducts. | Chronological sorting verified. |

---

## 6. Event Queue (Kafka) & Integration
**Objective:** Validate the asynchronous pipeline connecting domains seamlessly without data loss.

| ID | Test Case | Action / Input | Expected Output | Edge Cases Covered |
| :--- | :--- | :--- | :--- | :--- |
| `KAF-01` | **Product Creation Event** | `POST /products` (Create) | Inventory initializes Ledger (`Qty: 0`). | Kafka Network failure caught by Retry strategies. |
| `KAF-02` | **Product Update Event** | `PUT /products/:id` (Update) | Inventory acknowledges update. | |
| `KAF-03` | **Product Delete Event** | `DELETE /products/:id` | Inventory archives/flags stock ledger. | |
| `KAF-04` | **Inventory Adjustment** | `POST /inventory/add` | Event emitted back to message broker. | |
| `KAF-05` | **Event Idempotency** | Re-broadcast `product.created` payload | Duplicate ignored by Consumer. | Database uniqueness constraints prevent double-initialization. |

---

## 7. Performance & Caching (Redis)
**Objective:** Validate caching mechanisms are drastically improving query response times under load.

| ID | Test Case | Action / Input | Expected Output | Edge Cases Covered |
| :--- | :--- | :--- | :--- | :--- |
| `RED-01` | **Cache Write (Cold)** | `GET /products` (First execution) | Hits Postgres, populates Redis (~300ms). | |
| `RED-02` | **Cache Read (Warm)** | `GET /products` (Second execution)| Bypasses Postgres, returns Redis (~150ms). | Validates Time-To-Live (TTL) prevents stale data. |
| `RED-03` | **Cache Invalidation** | `PUT /products/:id` | Redis cache flushed for that ID. | Prevents reading old prices post-mutation. |
| `RED-04` | **Exchange Rate Caching**| `GET /products/:id?currency=EUR` | Exchange rate cached locally. | Rate limits preserved on external API. |
