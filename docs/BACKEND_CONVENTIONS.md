# Backend Engineering Guidelines & Standards (.NET 8)

This document establishes the official architectural standards, technical conventions, and development guidelines for the **MultiSport** backend API built on **.NET 8** with **Minimal APIs, Dapper, PostgreSQL, FluentValidation, and FluentMigrator**. The goal is to guarantee performant, decoupled, secure, and production-ready code.

---

## 1. Architecture: Vertical Slice Architecture

The project does not use traditional horizontal technical layers (global `Controllers/`, `Services/`, `Repositories/`). Code is organized around **business capabilities (Features)** inside `src/MultiSport.Api/Features/`.

### Module Structure
Each feature must be self-contained:

```text
Features/
└── Bookings/
    ├── BookingsEndpoints.cs      # Minimal API route definitions
    ├── CreateBookingRequest.cs   # Input DTO (sealed record)
    ├── BookingResponse.cs        # Output DTO (sealed record)
    ├── CreateBookingValidator.cs # FluentValidation rules
    ├── IBookingRepository.cs     # Feature Dapper repository contract
    ├── BookingRepository.cs      # Dapper SQL persistence
    └── Booking.cs                # Feature domain entity
```

### Architectural Rules

* **Isolation:** A feature must not depend directly on internal repositories of another feature. Shared cross-cutting concerns (authentication, extension methods, error handling) must reside in `Common/`.
* **Zero AutoMapper:** Using AutoMapper or reflection-based object mappers is strictly forbidden. Mappings must be resolved explicitly using typed constructors, extension methods (`court.ToResponse()`), or pure static functions to maximize throughput and catch errors at compile-time.

---

## 2. Minimal APIs & HTTP Contracts

### Grouping & Documentation

* Each feature registers its endpoints by extending `IEndpointRouteBuilder` through extension methods (e.g., `app.MapBookingEndpoints()`).
* Endpoints must be grouped with versioning and Swagger tags:
```csharp
var group = app.MapGroup("/api/v1/bookings")
               .WithTags("Bookings");
```

### Strictly Typed Responses (`TypedResults`)

* Returning untyped `Results.Ok(...)` is prohibited. Always use `TypedResults` and explicit `Results<T1, T2, ...>` signatures so OpenAPI/Swagger generates accurate HTTP status codes and response schemas:
```csharp
public static async Task<Results<Ok<BookingResponse>, NotFound, Conflict<ProblemDetails>>> GetById(
    Guid id, 
    IBookingRepository repository, 
    CancellationToken ct)
```

### Cooperative Cancellation (`CancellationToken`)

* Every asynchronous endpoint and repository method **must accept a `CancellationToken`** and forward it to Dapper and ASP.NET async calls. If a client aborts the request, the PostgreSQL query is canceled immediately, freeing database resources.

### Immutable DTOs

* All input and output contracts must be defined as immutable `record` types:
```csharp
public sealed record CreateBookingRequest(
    Guid CourtId,
    string CustomerName,
    string CustomerPhone,
    DateTimeOffset StartTimeUtc,
    DateTimeOffset EndTimeUtc,
    decimal DepositAmount
);
```

---

## 3. Data Access with Dapper & PostgreSQL

### Connection Lifetime

* **Ephemeral & Scoped:** Connections must not remain open longer than necessary. Inject a connection factory `NpgsqlDataSource` or `IDbConnectionFactory` with a `Scoped` lifetime.
* Always wrap connections and transactions in `await using`:
```csharp
await using var connection = await connectionFactory.CreateConnectionAsync(ct);
```

### Strict Parameterization & Zero SQL Injection

* String concatenation or interpolation in SQL queries (`$"SELECT ... WHERE id = '{id}'"`) is strictly forbidden.
* All queries must be parameterized via `CommandDefinition` or Dapper anonymous objects:
```csharp
var command = new CommandDefinition(sql, new { CourtId = courtId }, cancellationToken: ct);
return await connection.QueryFirstOrDefaultAsync<CourtResponse>(command);
```

### Snake Case Mapping

* Configure Dapper globally in `Program.cs` to match snake_case database columns with PascalCase C# properties without requiring manual SQL aliases:
```csharp
Dapper.DefaultTypeMap.MatchNamesWithUnderscores = true;
```

### Concurrency & Transactions

* Atomic operations affecting two or more tables must be encapsulated in an explicit transaction:
```csharp
await using var tx = await connection.BeginTransactionAsync(ct);
// Dapper operations executed within 'tx'...
await tx.CommitAsync(ct);
```

* Booking schedule overlaps are prevented at the database engine level via the GiST exclusion constraint `exc_bookings_no_overlap`. The repository layer must not implement artificial, slow table locks.

---

## 4. Input Validation (FluentValidation)

* Every request DTO must have an associated `AbstractValidator<T>`.
* Validation must be executed before entering domain or persistence logic. On failure, the pipeline must immediately return `TypedResults.ValidationProblem(result.ToDictionary())` (`HTTP 400`).
* Do not mix format/contract validations (FluentValidation) with heavy database checks; the latter belong in the feature handler or domain logic.

---

## 5. Centralized Exception Handling (`IExceptionHandler`)

* Using generic or empty `try/catch` blocks inside endpoints is prohibited.
* All unhandled exceptions are intercepted by a global handler implementing `Microsoft.AspNetCore.Diagnostics.IExceptionHandler` returning standardized RFC 7807 `ProblemDetails`:

| Exception Type | HTTP Status | ProblemDetails Details |
| :--- | :--- | :--- |
| `ValidationException` | `400 Bad Request` | List of non-compliant fields |
| `KeyNotFoundException` | `404 Not Found` | Non-existent entity or resource |
| `PostgresException` (code `23P01` exclusion_violation) | `409 Conflict` | Booking slot overlaps with an active booking |
| `PostgresException` (code `23505` unique_violation) | `409 Conflict` | Duplicate record in database |
| `UnauthorizedAccessException` | `401 Unauthorized` | Invalid or missing credentials |
| Any other unhandled exception | `500 Internal Server Error` | Generic message in prod; stack trace only in dev |

---

## 6. Security & Configuration

* **Secrets:** Committing database passwords, connection strings, or JWT keys in `appsettings.json` is strictly forbidden. Use `dotnet user-secrets` in local development and environment variables in Docker or production.
* **JWT Tokens:**
  * Protected endpoints must require authorization (`.RequireAuthorization()`).
  * Token validation must enforce zero clock skew (`ClockSkew = TimeSpan.Zero`).

---

## 7. Schema Versioning with FluentMigrator

* Migrations reside exclusively in the `MultiSport.Database.Migrations` project.
* **Migration Identifier:** Use timestamp-based numbering `YYYYMMDDHHMM` to prevent collision across concurrent branches:
```csharp
[Migration(202609281830)] // Year Month Day Hour Minute
public class Migration_202609281830_CreateBookingsTable : Migration
{
    public override void Up() { /* ... */ }
    public override void Down() { /* ... */ }
}
```

* Every schema modification introduced in `Up()` must have its clean reversible counterpart in `Down()`.
