# MultiSport Backend (.NET 8)

Backend API for MultiSport built with .NET 8, C# Minimal APIs, Dapper, PostgreSQL, FluentValidation, and FluentMigrator.

## Architecture

This service is structured using Vertical Slice Architecture under `backend/MultiSport.Api/Features/`.

```text
backend/
├── MultiSport.Api/
│   ├── Common/                      # Cross-cutting middlewares, RFC 7807 IExceptionHandler, Helpers
│   └── Features/                    # Vertical Slice business features
│       ├── Auth/                    # JWT authentication and user management
│       ├── Courts/                  # Court infrastructure and disciplines
│       ├── Bookings/                # Reservation management and GiST collision prevention
│       ├── Events/                  # Social and corporate event booking blocks
│       └── Tournaments/             # Tournament fixtures, standings, and brackets
└── MultiSport.Database.Migrations/  # FluentMigrator SQL schema migrations
```

## Architectural Guidelines

- Minimal APIs with MapGroup and TypedResults
- Micro-ORM Dapper with parameterized queries (CommandDefinition)
- PostgreSQL with Exclusion Constraints for overlap prevention
- Soft delete traceability (deleted_at, created_by, updated_by, deleted_by)
- RFC 7807 ProblemDetails error handling via IExceptionHandler
- Comprehensive guidelines in docs/BACKEND_CONVENTIONS.md and AGENTS.md
