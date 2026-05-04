# Implementation Plan: INVSYS-8 Kafka Event Consumers

## Goal
Implement asynchronous Kafka consumption honoring ADR-001 EDA requirements for Domain Decoupling.
**CRITICAL:** ALL SERVICES MUST BE CONTAINERIZED.

## Proposed Changes
1. **Kafka Client:** Add `github.com/segmentio/kafka-go`.
2. **Consumer Group:** Establish a worker loop parsing incoming `product.created` payloads and initiating DB skeletons.
3. **Docker Integration:** Ensure `docker-compose.yml` has `depends_on: kafka` for the `inventory-service` so network pipes establish cleanly.

## Verification Plan
1. Do not implement. Documents only.
