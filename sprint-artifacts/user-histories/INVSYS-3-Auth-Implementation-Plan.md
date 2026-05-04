# Implementation Plan: INVSYS-3 API Contracts & Swagger

## Goal

Expose the JWT mechanics constructed in INVSYS-2 outwards via HTTP, ensuring strict typing overrides and interactive documentation visibility.

---

## Proposed Changes

### Auth Microservice (NestJS)

#### [NEW] [services/auth-service/src/auth/auth.controller.ts](file:///services/auth-service/src/auth/auth.controller.ts)
- Inject `AuthService`.
- Expose `@Post('login')` leveraging `LocalAuthGuard`.
- Provide `@Post('register')` handling standard user creation calls.

#### [NEW] [services/auth-service/src/auth/dto/login.dto.ts](file:///services/auth-service/src/auth/dto/login.dto.ts)
- Build class `LoginDto` using `@ApiProperty()` decorators.
- Apply `@IsString()`, `@IsEmail()` and `@IsNotEmpty()` restrictions.

#### [MODIFY] [services/auth-service/src/main.ts](file:///services/auth-service/src/main.ts)
- Append `app.useGlobalPipes(new ValidationPipe())` to guarantee class-validators trigger actively before reaching the controller.
- Instantiate `DocumentBuilder` ensuring title="INVSYS Auth API".

---

## Verification Plan

### Manual Verification
1. Start application `npm run start:dev`.
2. Browse to localhost interface.
3. Use the integrated "Try it Out" feature inside Swagger to inject an invalid user registration payload.
4. Verify HTTP 400 Bad Request triggers containing the missing class validation arrays.
