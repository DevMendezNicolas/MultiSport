# Contribution Guide & Workflow (MultiSport)

This document establishes the operational policies, branching workflow, and coding standards for developing **MultiSport**. Strict compliance with these guidelines is mandatory to guarantee repository stability, traceability, and high technical quality.

---

## 1. Branching Model (Simplified GitFlow)

The repository operates under a structured branching model to ensure that the main branch remains isolated, protected, and production-ready at all times.

### Topology & Hierarchy

| Branch | Type | Origin | Merge Target | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **`main`** | Permanent | Initial | — | Stable, deployable production code. Only receives merges from releases or hotfixes. |
| **`develop`** | Permanent | `main` | `main` | Active continuous integration. Contains the team's latest verified functional progress. |
| **`feature/*`** | Temporary | `develop` | `develop` | Development of new features or user stories. |
| **`bugfix/*`** | Temporary | `develop` | `develop` | Bug fixes detected during the integration cycle in `develop`. |
| **`hotfix/*`** | Temporary | `main` | `main` and `develop` | Emergency patches for critical production issues. |

> **Golden Rule:** Never perform a direct `push` to `main` or `develop`. All changes MUST be submitted via a **Pull Request (PR)**.

---

## 2. Branch Naming Conventions

Temporary working branches must follow a lowercase kebab-case convention:

`<type>/<module>-<short-description>`

### Valid Examples:
- **Features:** `feature/courts-crud-creation`, `feature/tournaments-fixture-draw`, `feature/bookings-weekly-grid`
- **Bugfixes:** `bugfix/overlapping-schedule-timezone`, `bugfix/jwt-claims-validation`
- **Refactors:** `refactor/bookings-dapper-queries`, `refactor/standings-table-algorithm`
- **Hotfixes:** `hotfix/cors-production-block`

---

## 3. Commit Message Conventions

Commit messages strictly follow the **Conventional Commits** standard to maintain a clean, semantic, and readable history:

`<type>(<optional-scope>): <short imperative description>`

### Allowed Prefixes:
- **`feat:`** A new feature or functionality.
- **`fix:`** A defect or bug fix.
- **`refactor:`** Code modifications that neither fix a bug nor add a feature.
- **`test:`** Adding or modifying automated tests (xUnit, Vitest).
- **`perf:`** Changes aimed at optimizing performance or SQL queries.
- **`chore:`** Maintenance tasks, dependency updates, Vite configuration, or build scripts.

### Examples:
```text
feat(bookings): add validation for automated deposit retention
fix(tournaments): correct goal difference calculation in group stage
refactor(courts): simplify select queries using dapper
chore(deps): update fluentmigrator to latest stable version
```

---

## 4. Backend Standards (.NET 8)

Backend development follows **Vertical Slice Architecture**, immutable DTOs (`record`), parameterized Dapper queries, declarative validations with FluentValidation, and centralized exception handling (`IExceptionHandler`). All changes must strictly comply with the [Backend Conventions](docs/BACKEND_CONVENTIONS.md).

---

## 5. Frontend Standards (React + Vite + TypeScript)

The client application is organized using **Feature-Driven Structure**, strict TypeScript types mirroring backend DTOs in `camelCase`, server state management with **TanStack Query** (custom hooks), official **shadcn/ui** primitives, and styled with Tailwind CSS. All changes must strictly comply with the [Frontend Conventions](docs/FRONTEND_CONVENTIONS.md).

---

## 6. Database Standards (PostgreSQL)

All table designs, columns, indexes, constraints, and FluentMigrator migrations must strictly align with the [Database Conventions](docs/DATABASE_CONVENTIONS.md).

---

## 7. Testing Strategy & Quality Assurance

Critical business logic (tournament fixture generation, cancellation deposit rules, input validations, and concurrent GiST exclusion constraints) must be thoroughly backed by automated unit and integration tests as detailed in the [Testing Strategy](docs/TESTING_STRATEGY.md).

---

## 8. Security & Secrets Management

Committing credentials, connection strings, or private keys to Git is strictly forbidden. The flow for environment variables, `dotnet user-secrets`, and cryptographic policies is documented in [Security & Secrets](docs/SECURITY_AND_SECRETS.md) and [Security Policies](docs/SECURITY_POLICIES.md).
