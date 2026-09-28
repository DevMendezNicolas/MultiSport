# Security, Cryptography & Data Protection Policies

This document establishes the official technical security standards, cryptographic algorithms, data protection guidelines, and infrastructure hardening policies for **MultiSport** (.NET 8, Dapper, PostgreSQL, and React + Vite).

---

## 1. Password Storage & Hashing

* **Mandatory Algorithms:** Use **Argon2id** (preferred) or **BCrypt** with a work factor $\ge 12$. The use of SHA-256, SHA-512, or MD5 (even with custom salt) is strictly forbidden due to vulnerability to GPU-accelerated brute-force attacks.
* **Database Representation:**
  * Store only the resulting hash string (which internally encodes salt, cost, and parameters).
  * The column in the `app_users` table must be defined as `password_hash VARCHAR(255) NOT NULL`.
  * Never project or return `password_hash` in Dapper queries or response DTOs.

---

## 2. Authentication & Token Cryptography (JWT)

* **Signing Algorithm:** Use **HMAC-SHA256 (HS256)** with a symmetric key of at least **256 bits (32 high-entropy characters)**, or **RS256** (asymmetric public/private key pair).
* **Expiration & Minimal Claims:**
  * Access tokens must have a short lifespan (between **15 and 60 minutes**).
  * Minimal payload: include only non-sensitive identifiers (`sub`, `email`, `role`). Never include passwords, hashes, internal IDs, or sensitive personal data.
  * Disable clock skew in .NET (`ClockSkew = TimeSpan.Zero`) so expired tokens are rejected immediately without the default 5-minute leeway.
* **Client-Side Storage (Frontend):**
  * The primary defense against XSS is issuing a **Cookie configured as `HttpOnly`, `Secure`, and `SameSite=Strict`**, preventing malicious JavaScript from accessing session credentials.
  * If short-lived access tokens are held in SPA memory, long-lived refresh tokens must strictly reside in HttpOnly cookies and never in `localStorage` or `sessionStorage`.

---

## 3. Database Security (PostgreSQL + Dapper)

* **Zero SQL Injection Policy:**
  * Direct string interpolation (`$"SELECT ... {param}"`) is strictly prohibited.
  * All database operations must be executed using Dapper anonymous parameter objects or `CommandDefinition`.
* **Principle of Least Privilege:**
  * The operational application database user (`multisport_app`) must not be a superuser (`postgres`).
  * `multisport_app` must not possess permissions for destructive DDL commands (`DROP TABLE`, `ALTER TABLE`).
  * Structural schema migrations are strictly reserved for the FluentMigrator runner credentials.
* **Encryption in Transit (SSL/TLS):**
  * Enforce TLS encrypted database connections via the connection string: `SslMode=Require;TrustServerCertificate=false`.

---

## 4. HTTP API Hardening & Security Headers

* **Restrictive CORS Policy:**
  * Prohibit `.AllowAnyOrigin()` in non-local environments.
  * Explicitly whitelist trusted frontend origins:
  ```csharp
  builder.Services.AddCors(options =>
  {
      options.AddPolicy("FrontendPolicy", policy =>
      {
          policy.WithOrigins("http://localhost:5173", "https://app.multisport.com")
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
      });
  });
  ```
* **HTTP Security Headers:**
  * `X-Content-Type-Options: nosniff` (mitigates MIME-type sniffing).
  * `X-Frame-Options: DENY` (prevents clickjacking via iframes).
  * `Content-Security-Policy (CSP)` restricting script and style origins.
* **Rate Limiting:**
  * Apply native ASP.NET Core Rate Limiting (`Microsoft.AspNetCore.RateLimiting`) on sensitive routes (e.g., `/api/v1/auth/login`) to mitigate brute-force and Layer 7 denial-of-service attempts.

---

## 5. Information Leakage Prevention

* **ProblemDetails Sanitization:**
  * The `IExceptionHandler` middleware must never leak stack traces, database schema names, raw SQL queries, or library versions in production environments.
  * Authentication errors must remain generic (e.g., *"Invalid credentials"* rather than *"User does not exist"* or *"Incorrect password"*) to prevent account enumeration.
