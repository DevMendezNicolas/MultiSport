# Automated Testing Strategy & Quality Assurance

This document establishes the testing policies, scope, and quality standards for **MultiSport** across both backend and frontend layers.

---

## 1. Testing Pyramid & Focus

Testing in MultiSport aims to protect the integrity of critical algorithmic logic and validate concurrent behavior without bloating build times or creating brittle tests.

```text
       / \
      / E2E \          (Minimal critical end-to-end flows)
     /-------\
    /  Integ  \        (Testcontainers + PostgreSQL GiST concurrency)
   /-----------\
  /   Unit      \      (Tournament fixtures, deposit rules, validators)
 /---------------\
```

---

## 2. Priority Unit Tests (Backend - xUnit + FluentAssertions)

Unit tests must focus on pure, deterministic business logic:

### 1. Tournament Fixture Algorithms
- **Round-Robin:** Verify that single and double round-robin algorithms guarantee that:
  - Every team plays against each opponent exactly once (or twice in double round-robin).
  - Teams receive fair bye distributions when the number of participants is odd.
  - No duplicate match pairings occur within the same round or match day.
- **Playoffs:** Verify accurate bracket pairing, winner propagation, and standings computation (points, goal difference, head-to-head tiebreakers).

### 2. Cancellation & Deposit Retention Rules
- Verify that cancellation rules accurately deduct or retain deposits according to notice time:
  - Cancellation with more than $X$ hours notice $\rightarrow$ Full or partial refund/credit.
  - Late cancellation $\rightarrow$ 100% deposit forfeiture.

### 3. FluentValidation Contract Validators
- Unit test `AbstractValidator<T>` implementations directly:
  - Valid date ranges (`end_time_utc > start_time_utc`).
  - Non-negative amounts (`total_price >= 0`, `deposit_amount >= 0`).
  - Required formats, regexes, and character limits for customer details.

---

## 3. Database Integration Testing (Testcontainers)

### Concurrency & GiST Exclusion Constraints
Booking schedule integrity must not rely on fragile in-memory locks; it is enforced directly by PostgreSQL.

- **Stack:** Use **Testcontainers for .NET** to spin up an authentic PostgreSQL instance with the `btree_gist` extension enabled.
- **Critical Test Case:** Execute two concurrent asynchronous inserts targeting the same court (`court_id`) with overlapping time ranges (`tstzrange`).
- **Assertion:** Ensure that the second insert throws a `PostgresException` with error code `23P01` (`exclusion_violation`) and is cleanly mapped to `HTTP 409 Conflict`.

---

## 4. Frontend Testing (Vitest + Testing Library)

- **Utility Helpers & Formatters:** Unit tests for conversion between UTC ISO 8601 timestamps and local presentation timezones.
- **Form Validation & Error Rendering:** Verification of form feedback when the backend returns RFC 7807 `ProblemDetails` (HTTP 400).
- **Custom React Query Hooks:** Verify that TanStack Query hooks trigger the expected cache invalidations upon successful mutations.
