# Database Design & Naming Conventions (PostgreSQL)

This document establishes the official architectural standards and naming conventions for the **MultiSport** PostgreSQL database. Compliance with these rules is mandatory for all migrations, scripts, and Dapper queries.

---

## 1. General Principles

- **Casing:** Strict lowercase `snake_case` across all database objects (tables, columns, indexes, constraints, views, and routines).
- **Language:** 100% English. No Spanish terms, accents, or special characters.
- **Reserved Words:** Avoid PostgreSQL reserved keywords (`user`, `order`, `group`, `table`, `date`). If an entity refers to a user, use `users` or `app_users`.

---

## 2. Tables & Columns

### Tables
- **Plural Nouns:** Tables represent collections of entities.
  - Correct: `courts`, `bookings`, `tournaments`, `teams`, `sports`.
  - Incorrect: `court`, `tbl_bookings`, `CourtList`.
- **Junction / Many-to-Many Tables:** Join both plural entity names alphabetically or logically separated by an underscore.
  - Examples: `tournaments_teams`, `courts_sports`.

### Columns
- **Primary Key (PK):** Always named `id` (using `UUID` or `BIGINT GENERATED ALWAYS AS IDENTITY`).
- **Foreign Keys (FK):** `<singular_entity>_id`.
  - Examples: `court_id`, `tournament_id`, `team_id`, `user_id`.
- **Boolean Columns:** Must use state or modal prefixes (`is_`, `has_`, `can_`).
  - Examples: `is_active`, `is_paid`, `has_lighting`.
- **Timestamps & Audit Columns:** All transactional tables (`courts`, `bookings`, `tournaments`) must include complete audit tracing:
  - `created_at`: Row creation timestamp (`TIMESTAMPTZ` in UTC).
  - `created_by`: User identifier who created the record (`UUID NULL`).
  - `updated_at`: Last modification timestamp (`TIMESTAMPTZ` in UTC).
  - `updated_by`: User identifier who modified the record (`UUID NULL`).
  - `deleted_at`: Soft-delete marker (`TIMESTAMPTZ NULL`, `NULL` means active).
  - `deleted_by`: User identifier who soft-deleted the record (`UUID NULL`).
- **Date & Time Ranges:**
  - Date only: `booking_date`, `start_date`.
  - Timestamps with timezone: `start_time_utc`, `end_time_utc`.

---

## 3. Constraints

Constraint names must follow an explicit, predictable schema:

| Constraint Type | Pattern | Example |
| :--- | :--- | :--- |
| **Primary Key (PK)** | `pk_<table_name>` | `pk_courts`, `pk_bookings` |
| **Foreign Key (FK)** | `fk_<source_table>_<target_table>` | `fk_bookings_courts`, `fk_matches_tournaments` |
| **Unique (UQ)** | `uq_<table_name>_<column_name(s)>` | `uq_users_email`, `uq_courts_code` |
| **Check (CK)** | `ck_<table_name>_<rule_description>` | `ck_bookings_price_positive`, `ck_bookings_valid_timerange` |
| **Exclusion (EXC)** | `exc_<table_name>_<purpose>` | `exc_bookings_no_overlap` |

---

## 4. Indexes

Secondary indexes must specify their type and intent:

| Index Type | Pattern | Example |
| :--- | :--- | :--- |
| **B-Tree (Standard)** | `idx_<table_name>_<column_name(s)>` | `idx_bookings_court_id`, `idx_bookings_start_time_utc` |
| **Unique Index** | `udx_<table_name>_<column_name(s)>` | `udx_users_email` |
| **Partial / Filtered** | `idx_<table_name>_<column_name>_<condition>` | `idx_bookings_court_id_active` (where `deleted_at IS NULL`) |
| **GiST Index** | `idx_<table_name>_<column_name>_gist` | `idx_bookings_timerange_gist` |

---

## 5. Views & Routines

- **Views:** Prefix with `view_` (or `mview_` for materialized views).
  - Examples: `view_court_monthly_occupancy`, `view_tournament_standings`.
- **Functions:** Imperative verb format `fn_<verb>_<object>`.
  - Examples: `fn_calculate_goal_difference()`, `fn_get_court_availability()`.
- **Stored Procedures:** Prefix with `sp_<action>`.
  - Examples: `sp_close_daily_register()`, `sp_archive_tournament()`.
- **Triggers:**
  - Trigger function: `fn_trg_<action>_<table_name>` (e.g., `fn_trg_set_updated_at`).
  - Trigger definition: `trg_<timing>_<event>_<table_name>` (e.g., `trg_bu_courts_set_updated_at`).

---

## 6. PostgreSQL Reference DDL

Example implementing non-overlapping bookings via GiST exclusion constraints and soft deletes:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE bookings (
    id UUID DEFAULT gen_random_uuid(),
    court_id UUID NOT NULL,
    customer_name VARCHAR(120) NOT NULL,
    customer_phone VARCHAR(30) NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    deposit_amount NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    is_paid BOOLEAN DEFAULT FALSE NOT NULL,
    start_time_utc TIMESTAMPTZ NOT NULL,
    end_time_utc TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by UUID NULL,
    deleted_at TIMESTAMPTZ NULL,
    deleted_by UUID NULL,

    -- Constraints
    CONSTRAINT pk_bookings PRIMARY KEY (id),
    CONSTRAINT fk_bookings_courts FOREIGN KEY (court_id) 
        REFERENCES courts (id) ON DELETE RESTRICT,
    CONSTRAINT ck_bookings_price_positive CHECK (total_price >= 0),
    CONSTRAINT ck_bookings_valid_timerange CHECK (end_time_utc > start_time_utc),

    -- Exclusion constraint preventing double bookings for active slots
    CONSTRAINT exc_bookings_no_overlap EXCLUDE USING gist (
        court_id WITH =,
        tstzrange(start_time_utc, end_time_utc) WITH &&
    ) WHERE (deleted_at IS NULL)
);

-- Indexes
CREATE INDEX idx_bookings_court_id ON bookings (court_id);
CREATE INDEX idx_bookings_start_time_utc ON bookings (start_time_utc);
CREATE INDEX idx_bookings_active ON bookings (court_id, start_time_utc) WHERE (deleted_at IS NULL);
```

---

## 7. Financial Ledger & Payment Immutability

- **Append-Only Principle:** Records in payment, transaction, or invoice tables (`payments`, `booking_deposits`) must **NEVER be deleted** (neither physically nor via soft delete).
- **Adjustments & Refunds:** If an error occurs in a transaction or a cancellation triggers a refund, it must be recorded as a new adjustment row with a negative amount (or dedicated refund record), ensuring full financial and accounting auditability.
- **Data Dictionary:** For the exhaustive field-by-field domain specification of tables, check [docs/DATA_DICTIONARY.md](file:///c:/Develop/MultiSport/docs/DATA_DICTIONARY.md).

---

## 8. Migrations Organization & Granularity (FluentMigrator)

- **Feature-Driven Folders:** Migrations must reside in `MultiSport.Database.Migrations/Features/<FeatureName>/`.
- **Single-Table Granularity:** Monolithic migration files are strictly prohibited. Each table creation, structural change, or constraint definition must live in its own dedicated migration file.
- **Naming & Timestamps:** Files and classes must follow `[Migration(YYYYMMDDHHMM)]` with sequential timestamps respecting foreign key dependencies:
  - Example: `Features/Courts/202610011608_CreateCourtsTable.cs`
- **Reversibility:** Every migration must implement a robust `Down()` method.

