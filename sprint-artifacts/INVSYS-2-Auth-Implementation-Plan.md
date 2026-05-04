# Implementation Plan: INVSYS-2 JWT Core Security Model

## Goal

Build out the logical payload processing inside NestJS using standard `@nestjs/passport` protocols to handle signing and authorizing payload contexts.

---

## Proposed Changes

### Auth Microservice (NestJS)

#### [NEW] [services/auth-service/src/auth/auth.service.ts](file:///services/auth-service/src/auth/auth.service.ts)
- Implement `validateUser(username, pass)` retrieving mocked or DB hashed users. (If DB not ready, mock for this story).
- Implement `login(user)` wrapping the payload via `this.jwtService.sign(payload)`.

#### [NEW] [services/auth-service/src/auth/jwt.strategy.ts](file:///services/auth-service/src/auth/jwt.strategy.ts)
- Extend standard Passport `Strategy`.
- Provide `secretOrKey` natively utilizing the `ConfigService` reading `JWT_SECRET`.

#### [NEW] [services/auth-service/src/auth/jwt-auth.guard.ts](file:///services/auth-service/src/auth/jwt-auth.guard.ts)
- Provide generic Nest guard to restrict API traffic inherently.

#### [MODIFY] [services/auth-service/src/auth/auth.module.ts](file:///services/auth-service/src/auth/auth.module.ts)
- Import `PassportModule` and `JwtModule.registerAsync()` dynamically referencing ENV scopes.

---

## Verification Plan

### Automated Tests
**Unit Tests (Jest):**
- Verify `JwtStrategy` refuses execution if `JWT_SECRET` is compromised.
- Ensure the `sign` payload accurately translates to a valid JSON string output.
