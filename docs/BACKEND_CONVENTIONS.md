# Backend Engineering Guidelines & Standards (.NET 8)

This document establishes the official architectural standards, technical conventions, and development guidelines for the **MultiSport** backend API built on **.NET 8** with **Minimal APIs, Dapper, PostgreSQL, FluentValidation, and FluentMigrator**. The goal is to guarantee performant, decoupled, secure, and production-ready code.

---

## 1. Architecture: Vertical Slice Architecture

The project does not use traditional horizontal technical layers (global `Controllers/`, `Services/`, `Repositories/`). Code is organized around **business capabilities (Features)** inside `backend/MultiSport.Api/Features/`.

### Module Structure
Each feature must be self-contained and organized into standard internal subfolders:

```text
Features/
└── Bookings/
    ├── Endpoints/
    │   └── BookingsEndpoints.cs      # Minimal API route definitions (injects IBookingService)
    ├── Services/
    │   ├── IBookingService.cs        # Business logic interface
    │   └── BookingService.cs         # Domain orchestration (injects IBookingRepository)
    ├── Repositories/
    │   ├── IBookingRepository.cs     # Data access interface
    │   └── BookingRepository.cs      # Dapper SQL persistence (injects IDbConnectionFactory)
    └── Models/
        ├── Entities/
        │   └── Booking.cs            # Domain / database entity
        └── Dtos/
            ├── CreateBookingRequest.cs   # Input DTO (sealed record) + validator
            └── BookingResponse.cs        # Output DTO (sealed record)
```

### Architectural Rules

* **Isolation & Dependency Injection:** 
  - Every business logic component must define and implement an explicit `IService` interface (e.g., `IBookingService` and `BookingService`).
  - Every data access component must define and implement an explicit `IRepository` interface (e.g., `IBookingRepository` and `BookingRepository`).
  - All services and repositories must be registered in the ASP.NET Core DI container with `Scoped` lifetime.
  - Minimal API Endpoints inject `IService`, and Services inject `IRepository`. Endpoints must not bypass the service layer to interact directly with repositories.
  - A feature must not depend directly on internal repositories of another feature. Shared cross-cutting concerns (authentication, extension methods, error handling) must reside in `Common/`.
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

---

## 8. Observability & Structured Logging

Plain text logs (`Console.WriteLine`) are inadequate for diagnosing production issues:

* **Structured Logging with Serilog:**
  * Output logs in JSON format with indexable property keys (`CourtId`, `BookingId`, `UserId`, `ElapsedMilliseconds`).
  * Never concatenate or interpolate strings in log messages (`logger.LogInformation($"Booking {id} created")` ❌). Use semantic templates:
  ```csharp
  logger.LogInformation("Booking created successfully. BookingId: {BookingId}, CourtId: {CourtId}", booking.Id, booking.CourtId);
  ```
* **Request Correlation (`X-Correlation-Id`):**
  * Every incoming HTTP request must include or generate an `X-Correlation-Id`.
  * Propagate this identifier through ASP.NET Core middleware into the Serilog `LogContext` and return it in the HTTP response header for unified end-to-end tracing.
* **Sensitive Data Redaction:** Never log raw passwords, hashes, payment details, or JWT tokens.

---

## 9. API Versioning & Backward Compatibility

* **URL Path Versioning:** Prefix all endpoints with `/api/v1/` (e.g., `/api/v1/bookings`) to allow future versions (`/api/v2/`) to coexist without breaking existing clients.
* **Backward-Compatible Contracts:**
  * Renaming or removing existing properties from response DTOs without a formal deprecation schedule is forbidden.
  * New fields added to existing response records must be optional or strictly additive.

---

## 10. Pragmatic Code Quality & Warnings Management

A balanced approach ensuring high software reliability without hindering development velocity:

* **Nullable Reference Types Enabled (`<Nullable>enable</Nullable>`):**
  * Static nullability analysis is active across all projects to prevent `NullReferenceException` at compile-time:
  ```xml
  <PropertyGroup>
      <Nullable>enable</Nullable>
  </PropertyGroup>
  ```
  * Enforce zero warnings as errors exclusively in `Release` builds:
  ```xml
  <PropertyGroup Condition="'$(Configuration)' == 'Release'">
      <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
  </PropertyGroup>
  ```
* **Critical Warnings in Code Review:**
  * Review audits prioritize critical behavioral warnings (e.g., unawaited async calls `CS4014` or unsafe null-forgiving operator `!` usage).
* **Repository Hygiene & Zero Dead Code:**
  * Commented-out code blocks (`// old code`), abandoned experimental endpoints, and unused dependencies must be deleted before merging into `develop`.

