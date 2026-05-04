# Implementation Plan: INVSYS-13 Kafka Event Producers

## Goal
Close the Event-Driven Architecture loop by establishing the upstream event emitter satisfying ADR-001 requirements.
**CRITICAL:** ALL SERVICES MUST BE CONTAINERIZED.

## Proposed Changes
1. **Kafka Client:** Install `@nestjs/microservices` and `kafkajs` in the `product-service`.
2. **Provider Registration:** Register `ClientsModule` binding a `KAFKA_SERVICE` token to the `KAFKA_BROKER_URL` environment variable.
3. **Event Emission:** In the `ProductService.create()` method, append a non-blocking `.emit()` call dispatching the structural payload expected by `inventory-service` (ProductID).
4. **Docker Integration:** Ensure `docker-compose.yml` injects `KAFKA_BROKER_URL=kafka:9092` into the `product-service` block securely.

## Verification Plan
1. Do not implement. Documents only.
