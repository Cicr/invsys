# Story INVSYS-2: JWT Core Security Model

**Story ID:** INVSYS-2-JWT-Security  
**Jira Issue:** INVSYS-2  
**Epic:** Sprint 1 (INVSYS-100)  
**Priority:** Critical  
**Effort:** 5 points  
**Status:** ready-for-dev  
**Created:** 2026-05-03  

## Story

As a backend developer, I need to implement robust JWT minting and Passport.js validation strategies within the Auth Service, so that identical security payloads can be generated, signed, and validated consistently across all downstream Bounded Contexts.

### Acceptance Criteria
- Integration of `@nestjs/jwt` and `@nestjs/passport`.
- JWT sign mechanisms correctly utilize the `JWT_SECRET` pulled exclusively from the central `.env` via `ConfigModule`.
- A global (or localized) `JwtAuthGuard` successfully rejects unauthorized requests with an `HTTP 401`.

### Risk Mitigation
- **Risk:** Weak or hardcoded keys exposing security vulnerabilities.
  - **Mitigation:** Assert the config payload strictly throws an error if `process.env.JWT_SECRET` is undefined upon startup.

## Dev Agent Record

### Debug Log
<!-- AI agent writes implementation notes, decisions, and debugging steps here -->

### Verification Results
<!-- Validation outputs here -->

## File List
<!-- AI agent lists all files created/modified during implementation -->

---

**Context Generated:** 2026-05-03  
**Context File:** INVSYS-2-Auth-Context.xml
