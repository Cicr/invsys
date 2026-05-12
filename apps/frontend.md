You are a senior frontend architect and product engineer.

Build a production-quality frontend MVP for this backend system.

# Goal

Create a clean, lightweight, maintainable frontend focused on:
- fast iteration
- API-first architecture
- scalability
- strong UX
- low complexity

Avoid overengineering.

# Frontend Stack

Use:
- Next.js App Router
- TypeScript
- TailwindCSS
- shadcn/ui
- TanStack Query
- Zustand only if truly necessary
- Zod for validation
- React Hook Form for forms

Avoid:
- Redux
- excessive abstractions
- unnecessary custom hooks
- premature optimization

# Backend Integration Source Priority

Understand the backend in this order:

1. Read Swagger/OpenAPI spec first 
2. Read backend integration tests and e2e tests
3. Read docs/QA-Delivery-Report.md to validate use cases needed. 
4. Read API handlers/controllers
5. Read DTOs/types/models
6. Infer user workflows from test cases

The tests define the REAL business behavior.

# Important Instruction

Do NOT blindly mirror backend structure into frontend structure.

Frontend should optimize for:
- user workflows
- maintainability
- UX clarity

# API Integration Rules

Generate:
- typed API client layer
- centralized fetch wrapper
- auth token handling
- automatic retry handling
- loading states
- empty states
- optimistic updates where useful
- error boundaries

# UI Requirements

The UI should:
- feel modern but lightweight
- prioritize usability over visual complexity
- support desktop first, mobile responsive second
- use skeleton loading states
- support dark mode

# Architecture Requirements

Structure the project with:

/app
/components
/features
/lib/api
/lib/auth
/lib/utils
/types

use the folders invsys/apps as root for the frontend app

Prefer feature-oriented organization.

# Authentication

Read backend auth flow carefully from:
- middleware
- tests
- swagger auth definitions

Implement:
- login flow
- token refresh if backend supports it
- protected routes
- logout handling

# Tables and Lists

Implement:
- pagination
- filtering
- sorting
- empty states
- loading states
- optimistic UI when safe

# Forms

All forms must:
- validate using zod
- show inline errors
- support disabled/loading states
- properly map backend validation errors

# API Understanding Task

Before generating components:
1. Analyze all endpoints
2. Infer business domains
3. Infer core user workflows
4. Infer entity relationships
5. Generate a frontend implementation plan

# Deliverables

Generate:
- folder structure
- architecture explanation
- reusable API layer
- reusable UI primitives
- example pages
- production-ready code

# Backend Files

The following files are available:
- swagger.json
- integration tests
- backend handlers
- DTOs
- database models

Use ALL of them before implementation.

# Critical Rule

If tests contradict Swagger:
TRUST THE TESTS.

# Another Critical Rule

Do not invent API behavior not present in:
- tests
- handlers
- swagger