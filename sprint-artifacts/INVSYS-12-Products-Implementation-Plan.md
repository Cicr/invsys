# Implementation Plan: INVSYS-12 External Exchange Rate Client

## Goal
Implement a robust external API client featuring Redis TTL caching to support multi-currency formatting on the product catalog.
**CRITICAL:** ALL SERVICES MUST BE CONTAINERIZED.

## Proposed Changes
1. **Dependencies:** Add `@nestjs/axios`, `@nestjs/cache-manager`, and Redis store connectors to `product-service`.
2. **Redis Integration:** Link the cache manager module to `REDIS_HOST=redis` matching the compose network bindings.
3. **HTTP Client:** Establish a Service that fetches conversion rates (e.g., from an open API) if the cache is empty, caching the response for a configurable TTL (e.g., 1 hour).
4. **Fallback Handlers:** Provide default safe 1:1 rates or previous cached entries if the external API fails.

## Verification Plan
1. Do not implement. Documents only.
