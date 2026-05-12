# Functional and Non-Functional Requirement Analysis

This document provides a detailed analysis of the requirements extracted from the [PRD.md](file:///home/chaosblade/Projects/invsys/docs/PRD.md).

## 1. Functional Requirements (FR)
Functional requirements define what the system must do.

| ID | Category | Requirement Description |
| :--- | :--- | :--- |
| **FR-01** | Product Management | Create a new product with details: name, description, price, category, and SKU. |
| **FR-02** | Product Management | List all existing products with full details. |
| **FR-03** | Product Management | Filter products by a specific category. |
| **FR-04** | Product Management | Retrieve detailed information for a specific product using its ID. |
| **FR-05** | Product Management | Update existing product details (price, name, description, category). |
| **FR-06** | Product Management | Delete a product from the database by its ID. |
| **FR-07** | Inventory Management | Increase or decrease the stock quantity of a product (Entry/Exit). |
| **FR-08** | Inventory Management | Query the current available stock for a specific product. |
| **FR-09** | Inventory Management | Retrieve the history of all inventory movements for a product. |
| **FR-10** | Pricing & Currency | Support currency conversion in price queries via an optional parameter (using external API). |
| **FR-11** | Pricing & Currency | Track and allow querying of the price history for each product. |
| **FR-12** | Security | Implement authentication using JSON Web Tokens (JWT). |
| **FR-13** | Security | Implement Role-Based Access Control (RBAC) with **Admin** and **User** roles. |
| **FR-14** | Security | Restrict sensitive operations (Modify/Delete/Inventory Adjust) to Admin users only. |
| **FR-15** | Communication | Notify the Inventory service when a product is created, updated, or deleted. |
| **FR-16** | Communication | Emit events when inventory adjustments are performed. |

## 2. Non-Functional Requirements (NFR)
Non-functional requirements define how the system should perform or its quality attributes.

| ID | Attribute | Requirement Description |
| :--- | :--- | :--- |
| **NFR-01** | Scalability | Use a decoupled microservice architecture communicating via events. |
| **NFR-02** | Performance | Implement caching for frequent queries (product lists, prices, stock). |
| **NFR-03** | Reliability | Ensure event processing is **idempotent** to prevent data inconsistencies. |
| **NFR-04** | Resilience | Use asynchronous messaging queues (Kafka/RabbitMQ) to handle service failures. |
| **NFR-05** | Data Integrity | Implement validation measures to ensure the integrity and validity of product data. |
| **NFR-06** | Security | Ensure secure access through authentication and authorization mechanisms. |
| **NFR-07** | Interoperability | Implement services as **RESTful** APIs. |
| **NFR-08** | Portability | Provide a **Docker Compose** configuration for easy deployment of the entire stack. |
| **NFR-09** | Quality | Implement unit tests with a focus on high code coverage for core functions. |
| **NFR-10** | Maintainability | Follow modern framework standards (e.g., NestJS, ASP.NET Core) and provide detailed documentation. |
| **NFR-11** | Deployment | Auth service must be production-ready: no hardcoded credentials, use volumes for persistence, and define a master admin user in `infra/.env`. |
| **NFR-12** | Security | Prevent unauthorized user creation; the Auth service must require an active session/login to create new users. |
| **NFR-13** | Security (RBAC) | Strict Role-Based Access Control hierarchy: <br> - **Unauthenticated**: Access limited to login endpoint. <br> - **User**: Read-only access to products and inventory. <br> - **Admin**: Full system access. |
