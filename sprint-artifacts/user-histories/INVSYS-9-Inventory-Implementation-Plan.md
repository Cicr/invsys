# Implementation Plan: INVSYS-9 Stock Mutation Handlers

## Goal
Establish synchronous CQRS endpoints ensuring ledger integrity across highly concurrent transactions.
**CRITICAL:** ALL SERVICES MUST BE CONTAINERIZED.

## Proposed Changes
1. **Router:** Utilize a lightweight router like `gin-gonic/gin`.
2. **Handlers:** Expose `/api/v1/inventory/add` and `/api/v1/inventory/deduct` validating JSON bounds.
3. **Transactions:** Wrap DB writes in `gorm.Transaction` explicitly handling `FOR UPDATE` row locks to prevent race conditions natively.
4. **Docker Integration:** Ensure port bindings `8080:8080` exist in the `docker-compose.yml` for testing external access locally.

## Verification Plan
1. Do not implement. Documents only.
