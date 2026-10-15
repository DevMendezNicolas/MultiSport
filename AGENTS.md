# MultiSport - AI Agent Guidelines & Engineering Rules

This repository contains strict architectural and stylistic standards. All AI agents generating, editing, or refactoring code MUST follow these rules without exception.

---

## 1. Project Context & Stack

- **Backend:** .NET 8, C# Minimal APIs (Vertical Slice Architecture), Dapper, PostgreSQL, FluentValidation, FluentMigrator.
- **Frontend:** React 18+, Vite, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query (React Query), Axios, Lucide React, Framer Motion, Sonner.
- **Documentation:** Swagger/OpenAPI.
- **Repository Workflow:** Simplified GitFlow. All working branches target `develop` via PRs. Never generate instructions that push directly to `main` or `develop`.

---

## 2. Universal Prohibitions (Zero Tolerance)

1. **NO Emojis in UI or Code:** Never introduce emojis in labels, titles, buttons, badges, logs, or commit messages. Use **Lucide React** icons exclusively (`strokeWidth={2}` or `1.75`).
2. **NO Controllers / NO Global Generic Layers:** Never create a `Controllers/` folder or global generic `Services/` / `Repositories/`. All API logic must reside inside feature folders (`Features/<FeatureName>/`). Each feature must organize its internal components into standard subfolders: `Models/` (`Entities/`, `Dtos/`), `Endpoints/`, `Services/` (with explicit `IService`), and `Repositories/` (with explicit `IRepository`).
3. **NO AutoMapper:** Never use AutoMapper or reflection-based object mappers. Use explicit extension methods or static pure mapper functions.
4. **NO Raw String Interpolation in SQL:** Never interpolate parameters into SQL queries (`$"SELECT ... WHERE id = '{id}'"`). Always use Dapper anonymous parameter objects or `CommandDefinition`.
5. **NO useEffect for Data Fetching:** Never use `useEffect` + `useState` to fetch API data. Always use **TanStack Query** (`useQuery` / `useMutation`).
6. **NO TypeScript `any`:** Never use `any`. All API contracts, parameters, and hooks must be strictly typed matching C# DTOs.
7. **NO Try-Catch in Minimal API Endpoints:** Rely on the native `IExceptionHandler` middleware configured in `MultiSport.Api/Common/` returning RFC 7807 `ProblemDetails`.
8. **NO String Interpolation in Logs:** Never use string interpolation in logging calls (`logger.LogInformation($"...")` ❌). Use structured semantic templates exclusively (`logger.LogInformation("... {Prop}", val)`).
9. **NO Deletion of Financial Records:** Records in financial or payment tables (`payments`) must never be deleted (neither hard nor soft delete). Record adjustments as negative refund rows.
10. **NO Decorative Visual Noise (Anti-AI Clutter):** Never introduce decorative microtitles, pre-labels, or tutorial-style numbering (`01.`, `02.`, `FORMULARIO DE ALTA`, etc.) that do not represent dynamic operational data. Never repeat information in subtitles, badges, or tags that is already evident from the main title, context, or form inputs. Never place unnecessary badges, labels, or dark overlays on top of photographs. Cards, icons, borders, shadows, and animations must have a concrete functional, usability, or accessibility reason; never add them for pure decoration.
11. **NO Brand Red in UI:** Red is strictly reserved for semantic feedback (form validation errors, conflict alerts, destructive operations like deleting courts or canceling bookings). Brand identity, primary buttons, active navigation, and highlighted states must exclusively use the sporting green palette (`#258653` / `#1E6E44` / `#164734`).
12. **NO Non-Markdown or Static Reports in `docs/`:** The `docs/` directory is strictly reserved for living system guidelines, architecture documents, conventions, data dictionaries, and security policies in Markdown format (`.md`). Never place binary files (`.pdf`), compiled pages (`.html`), or one-off milestone/audit reports in `docs/`. All periodic reports, implementation summaries, and milestone deliverables belong under `reports/<module>/` (e.g., `reports/canchas/`).
13. **NO Floating Workflow Popups/Modals (Zero-Popup Policy):** Intrusive centered floating modals are strictly forbidden for workflows, forms (create/edit), operational details, or lead capture. Use **Slide-over Sheets** (Drawers on mobile) for agile operational tasks (booking details, quick slot creation), **dedicated full pages/routes** for dense entity configurations (court and tournament creation/editing with pricing tiers), and **in-page embedded sections** on public landing pages. Centered dialogs (`AlertDialog`) are strictly restricted to concise destructive confirmation prompts (deleting courts, canceling bookings) using semantic red buttons.
14. **NO Autonomous Git Adds, Commits, or Pushes:** AI agents are strictly forbidden from executing `git add`, `git commit`, `git push`, or modifying Git repository state without explicit, prior user instruction or approval. After generating, editing, or refactoring code and completing verification, the agent MUST present the results to the user and wait for explicit confirmation before staging, committing, or pushing any changes.

---

## 3. Backend Rules (.NET 8 + Dapper + PostgreSQL)

- **Architecture:** Vertical Slice Architecture under `backend/MultiSport.Api/Features/<DomainName>/`. Each slice internally isolates:
  - `Endpoints/`: Minimal API route definitions (injecting `IService`).
  - `Services/`: Business logic orchestration (implementing `IService`, injecting `IRepository`).
  - `Repositories/`: Dapper SQL data access (implementing `IRepository`, injecting `IDbConnectionFactory`).
  - `Models/`: Divided into `Entities/` (domain/database entities) and `Dtos/` (immutable input/output records).
  - **Dependency Injection:** Every service and repository must define its matching interface (`IService` / `IRepository`) and be registered in DI with `Scoped` lifetime. Endpoints never query repositories directly.
- **API Versioning:** All endpoints must be prefixed with `/api/v1/` using `MapGroup`.
- **Contracts:** All request and response DTOs MUST be immutable C# `record` types. Backward compatibility is required (no renaming/removing fields without deprecation).
- **CancellationToken:** Every async endpoint and repository method MUST accept and forward a `CancellationToken`.
- **Minimal API Responses:** Use strictly typed results: `Results<Ok<TDto>, NotFound, Conflict<ProblemDetails>, ValidationProblem>`.
- **Database Mapping:** Dapper maps `snake_case` database columns to `PascalCase` C# models (`Dapper.DefaultTypeMap.MatchNamesWithUnderscores = true`). Do NOT alias SQL columns unnecessarily.
- **Concurrency & Overlapping:** Court schedule overlap protection is enforced at the database level using PostgreSQL GiST Exclusion Constraints (`exc_bookings_no_overlap`). Catch `PostgresException` (code `23P01`) and map it to `409 Conflict`.
- **Soft Deletes & Audit:** Filter by `deleted_at IS NULL` on active queries. Populate audit fields (`created_by`, `updated_by`, `deleted_by`) on all transactional operations.
- **Observability:** Propagate `X-Correlation-Id` across requests, middleware, and Serilog `LogContext`.
- **FluentMigrator:** Migrations belong strictly in `MultiSport.Database.Migrations/Features/<FeatureName>/`. Each created or modified table must have its own dedicated migration file. Migration classes must be annotated with `[Migration(YYYYMMDDHHMM)]` (timestamp format, sequential). Always provide `Down()` methods. Monolithic multi-table migration files are strictly forbidden.

---

## 4. Database Rules (PostgreSQL)

- **Naming:** Strict lowercase `snake_case` in English for all objects (tables: plural, columns: singular with prefixes/suffixes, PK: `id`, FK: `<entity>_id`).
- **Audit Columns:** All business tables must include `created_at`, `created_by`, `updated_at`, `updated_by`, `deleted_at`, `deleted_by`.
- **Financial Immutability:** Payment and transaction tables are append-only.
- **Constraints:** Follow explicit naming prefixes:
  - PK: `pk_<table_name>`
  - FK: `fk_<source_table>_<target_table>`
  - UQ: `uq_<table_name>_<columns>`
  - CK: `ck_<table_name>_<rule>`
  - EXC: `exc_<table_name>_<rule>`
  - IDX: `idx_<table_name>_<columns>`
- **Timestamps:** Use `TIMESTAMPTZ` normalized to UTC. Suffix timestamp columns with `_at` (`created_at`, `updated_at`, `deleted_at`).


---

## 5. Frontend Rules (React + Vite + TypeScript)

- **Architecture:** Feature-driven structure under `src/features/<feature-name>/`.
  - Subdirectories: `api/`, `components/`, `types/`, `index.ts`.
- **Component Styling:** Use **Tailwind CSS** + **shadcn/ui** primitives located in `frontend/src/components/ui/`. Merge class names exclusively using `cn()` from `@/lib/utils`.
- **HTTP Client:** Use the pre-configured Axios instance from `@/lib/axios`. Never instantiate raw `fetch` or a new `axios.create()` inside components.
- **Mutations:** Always invalidate related TanStack Query cache keys in `onSuccess` handlers.
- **Loading States:** Always render `<Skeleton />` components matching layout dimensions. Never use full-screen spinners.
- **Toasts:** Use **Sonner** (`toast.success()`, `toast.error()`).
- **Brand Identity & Color Tokens:** Use the sporting green palette (`brand.sport`: `#258653`, `brand.sport-hover`: `#1E6E44`, `brand.british`: `#164734`, `brand.soft`: `#A7B9A5`, `brand.dark`: `#0B0B0B`, `brand.cream`: `#F4F1EA`, `brand.cream-card`: `#ECE7DD`). Semantic red is strictly reserved for errors and destructive actions. Never introduce hardcoded colors in individual components.
- **Visual Sobriety:** Eliminate decorative microtitles, step numbers (`01.`, `02.`), redundant explanations, and badges/overlays over images. Prioritize typographic hierarchy, white space, and clear actions over visual ornament.

---

## 6. Commit, PR & Language Guidelines

- **Language Policy:** All commit messages, Pull Request titles, PR descriptions, and code review comments MUST be written in **Spanish** (Castellano). Code symbols (classes, methods, variables, database tables, and API contracts) remain 100% in English.
- **Branch names:** `<type>/<module>-<description>` in lowercase kebab-case (e.g., `feature/canchas-disponibilidad`, `chore/docker-postgres-setup`).
- **Commits:** Conventional Commits in lowercase and in Spanish: `<tipo>(<modulo>): <descripcion>` (e.g., `feat(turnos): implementar validacion de solapamiento de horarios`, `fix(canchas): corregir consulta dapper de disponibilidad`).
- **Pull Requests:** Titles and descriptions must follow `.github/pull_request_template.md` in Spanish. All PR discussions, feedback, and review comments must be in Spanish.
- **Approval Gate for Git Actions:** Never execute `git add`, `git commit`, or `git push` autonomously. Staging and committing code without explicit user instruction is considered a direct violation of repository rules. Always present modified files and verification results first, waiting for the user's explicit command to proceed.

---

## 7. Security & Cryptography Policies

All code must adhere to cryptographic, authentication, and data protection standards defined in `docs/SECURITY_POLICIES.md`:
- Passwords: Hash exclusively using Argon2id or BCrypt (cost >= 12). Never project `password_hash` in DTOs.
- Authentication: JWT with HS256 (>= 256 bits key) or RS256, short lifespan (15-60 min), `ClockSkew = TimeSpan.Zero`, and HttpOnly/Secure cookies where applicable.
- Database: Strict parameterized queries (`CommandDefinition`), least privilege user (`multisport_app`), and encrypted transit (`SslMode=Require`).
- HTTP Hardening: Restrictive CORS, security headers (`nosniff`, `DENY`), ASP.NET Rate Limiting on `/api/v1/auth/login`, and generic auth errors to prevent account enumeration.

---

## 8. UX, Responsive Design & Mobile Ergonomics

All user interfaces must strictly comply with the ergonomic and responsive standards in `docs/FRONTEND_CONVENTIONS.md`:
- **Viewport Integrity:** Zero unintentional horizontal scrolling on any resolution >= 360px. Contained, explicit horizontal scrolling only inside specific components (brackets, wide tables). Respect device safe areas (`env(safe-area-inset-*)`).
- **Touch Ergonomics (Fitts's Law):** Minimum touch target of 44x44px for buttons, time pickers, and interactive icons. Prevent iOS auto-zoom by setting form input font size >= 16px (`text-base`). Ensure inputs clear virtual keyboards without hiding submit buttons. Primary mobile actions must sit in the thumb zone (lower screen half).
- **Cognitive Load & Hick's Law:** Deconstruct dense workflows (tournament setup, recurring bookings) into logical multi-step wizards. Require explicit confirmation dialogs for destructive operations. Provide plain human-readable error messages.
- **Adaptive Screen Behavior:**
  - Sidebar navigation collapses into a slide-over Sheet/Drawer on mobile.
  - Court scheduler displays parallel multi-court grids on desktop and transitions to single-court selector or swipeable contained columns on mobile.
  - Operational workflows use Slide-over Sheets on desktop and transform into Bottom Sheets (Drawers) on mobile viewports; dense configuration forms reside on dedicated routes.
  - Tournament brackets support native smooth horizontal touch-drag.
- **Visual Hierarchy & Contrast:** High contrast suitable for outdoor sunlight use at sports complexes. Proportional typography scaling and dynamic compact padding on mobile devices.

