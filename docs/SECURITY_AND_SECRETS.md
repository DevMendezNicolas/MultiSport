# Security, Secrets Management & Environment Variables

This document establishes the official policy for credentials management, configuration, and environment variables across **MultiSport**.

---

## 1. Golden Rule (Zero Secrets in Git)

Committing real credentials, database passwords, API keys, or private cryptographic secrets to Git is strictly forbidden.

- Only template files with dummy/placeholder values may be tracked:
  - `appsettings.example.json` (or sample configurations in documentation).
  - `.env.example` in the client root.
- Files containing real local values (`.env`, `.env.local`, `appsettings.Development.json` with sensitive data) must be strictly gitignored.

---

## 2. Environment Variables & Secrets Mapping

| Variable / Secret | Local Environment (Dev) | Production / Docker Environment |
| :--- | :--- | :--- |
| **Database Connection String** | `appsettings.Development.json` or `dotnet user-secrets` | Environment variable (`ConnectionStrings__DefaultConnection`) |
| **JWT Secret Key** | `dotnet user-secrets` (minimum 32 characters / 256 bits) | Environment variable (`Jwt__Key`) |
| **JWT Issuer / Audience** | `appsettings.Development.json` | Environment variable (`Jwt__Issuer`, `Jwt__Audience`) |
| **Frontend API URL** | `.env.local` (`VITE_API_URL=http://localhost:5000`) | Injected during Vite build / Docker container config |

---

## 3. Local Development with `dotnet user-secrets`

To avoid accidental edits or commits to `appsettings.json`, initialize and register secrets inside the API project:

```bash
cd backend/MultiSport.Api
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=multisport_dev;Username=postgres;Password=your_local_password"
dotnet user-secrets set "Jwt:Key" "SuperSecretKeyWithAtLeast32CharactersLength!"
dotnet user-secrets set "Jwt:Issuer" "MultiSportApi"
dotnet user-secrets set "Jwt:Audience" "MultiSportClient"
```

---

## 4. Cryptographic Settings for JWT

When configuring JWT bearer authentication in `Program.cs`:
- Symmetric signing keys must have an entropy of at least 256 bits (32 characters).
- Always configure `ClockSkew = TimeSpan.Zero` to prevent expired tokens from being honored during the default 5-minute grace period.
