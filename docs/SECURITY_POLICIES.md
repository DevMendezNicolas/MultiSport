# Políticas de Seguridad, Criptografía y Protección de Datos

Este documento establece las políticas de seguridad técnica, criptografía, protección de datos y endurecimiento de infraestructura para el sistema **MultiSport** (.NET 8, Dapper, PostgreSQL y React + Vite).

---

## 1. Almacenamiento y Hashing de Contraseñas

* **Algoritmo Obligatorio:** Usar **Argon2id** (o **BCrypt** con factor de trabajo $\ge 12$). Queda prohibido el uso de SHA-256, SHA-512 o MD5 (incluso con salt manual), ya que son vulnerables a ataques de fuerza bruta acelerados por GPU.
* **Manejo en Base de Datos:**
  * Almacenar únicamente el hash resultante (el cual ya incluye internamente el salt aleatorio y los parámetros de costo).
  * La columna en la tabla `app_users` se define como `password_hash VARCHAR(255) NOT NULL`.
  * Nunca devolver el campo `password_hash` en las proyecciones o DTOs de salida de Dapper.

---

## 2. Autenticación y Criptografía de Tokens (JWT)

* **Algoritmo de Firma:** Utilizar **HMAC-SHA256 (HS256)** con una clave simétrica de al menos **256 bits (32 caracteres de alta entropía)**, o **RS256** (par de claves asimétricas pública/privada).
* **Caducidad y Claims Mínimos:**
  * El token de acceso (*Access Token*) debe tener una vida útil corta (entre **15 y 60 minutos**).
  * Payload mínimo: incluir solo identificadores no sensibles (`sub`, `email`, `role`). Prohibido incluir contraseñas, hashes, roles no autorizados o datos personales sensibles.
  * Desactivar la tolerancia de reloj en .NET (`ClockSkew = TimeSpan.Zero`) para evitar que tokens vencidos sigan siendo válidos durante 5 minutos extra.
* **Almacenamiento en el Cliente (Frontend):**
  * La opción prioritaria frente a ataques XSS es emitir una **Cookie `HttpOnly`, `Secure` y `SameSite=Strict`**, impidiendo que scripts maliciosos de JavaScript lean el token.
  * Si se utiliza almacenamiento en memoria de la SPA, no persistir tokens de larga duración en `localStorage` o `sessionStorage` sin mitigaciones XSS estrictas.

---

## 3. Seguridad en la Base de Datos (PostgreSQL + Dapper)

* **Prevención Absoluta de SQL Injection:**
  * Prohibir la interpolación directa (`$"SELECT ... {param}"`).
  * Toda interacción debe ser ejecutada mediante parámetros anónimos de Dapper o `CommandDefinition`.
* **Principio de Menor Privilegio (Least Privilege):**
  * El usuario de base de datos que usa la aplicación (`multisport_app`) no debe ser superusuario (`postgres`).
  * No debe tener permisos para ejecutar sentencias DDL destructivas (`DROP TABLE`, `ALTER TABLE`).
  * Los permisos de alteración estructural de esquemas se reservan exclusivamente para el runner de migraciones de FluentMigrator.
* **Cifrado en Tránsito (SSL/TLS):**
  * Forzar conexión cifrada con PostgreSQL configurando la cadena de conexión: `SslMode=Require;TrustServerCertificate=false`.

---

## 4. Endurecimiento de la API HTTP y Cabeceras de Seguridad

* **Política de CORS Restrictiva:**
  * Prohibir `.AllowAnyOrigin()` en entornos no locales.
  * Especificar explícitamente los orígenes confiables del frontend:
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
* **Cabeceras de Seguridad HTTP (Security Headers):**
  * `X-Content-Type-Options: nosniff` (previene ataques de MIME-sniffing).
  * `X-Frame-Options: DENY` (evita clickjacking dentro de iframes).
  * `Content-Security-Policy (CSP)` para restringir las fuentes de scripts y estilos.
* **Limitación de Tasa (Rate Limiting):**
  * Implementar el middleware nativo de .NET 8 (`Microsoft.AspNetCore.RateLimiting`) en rutas críticas (ej. `/api/v1/auth/login`) para mitigar ataques de fuerza bruta o saturación (DDoS de capa 7).

---

## 5. Prevención de Fugas de Información (Information Leakage)

* **Sanitización de Errores con `ProblemDetails`:**
  * El middleware `IExceptionHandler` jamás debe exponer stack traces, nombres internos de tablas, consultas SQL fallidas o versiones de librerías al cliente en entornos de producción.
  * Los mensajes de error de autenticación deben ser genéricos (ej. *"Credenciales inválidas"*, en lugar de *"El usuario no existe"* o *"La contraseña es incorrecta"* para evitar enumeración de cuentas).
