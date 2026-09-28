# Directrices y Estándares de Ingeniería Backend (.NET 8)

Este documento define la arquitectura, convenciones técnicas y políticas de desarrollo para la API del sistema **MultiSport**. El objetivo es garantizar un código performante, libre de acoplamientos innecesarios, seguro y preparado para estándares comerciales.

---

## 1. Arquitectura: Vertical Slice Architecture

El proyecto no utiliza la arquitectura tradicional en capas horizontales (`Controllers`, `Services`, `Repositories` globales). Se estructura en torno a **capacidades de negocio (Features)** dentro de `MultiSport.Api/Features/`.

### Estructura de un Módulo
Cada funcionalidad debe estar autocontenida:

```text
Features/
└── Bookings/
    ├── BookingsEndpoints.cs      # Mapeo de rutas Minimal API
    ├── CreateBookingRequest.cs   # DTO de entrada (record)
    ├── BookingResponse.cs        # DTO de salida (record)
    ├── CreateBookingValidator.cs # FluentValidation
    ├── IBookingRepository.cs     # Contrato Dapper de la feature
    ├── BookingRepository.cs      # Consultas SQL con Dapper
    └── Booking.cs                # Modelo de dominio de la feature
```

### Reglas de la Arquitectura

* **Aislamiento:** Una feature no debe depender directamente de los repositorios internos de otra. Si se requiere compartir lógica cross-cutting (autenticación, extensiones, manejo de excepciones), esta debe residir en `Common/`.
* **Zero AutoMapper:** Queda prohibido el uso de AutoMapper u otras librerías basadas en reflexión. Los mapeos se resuelven de forma explícita mediante constructores tipados, métodos de extensión (`ToResponse()`) o funciones puras estáticas para maximizar rendimiento y detectar fallos en compilación.

---

## 2. Minimal APIs y Contratos HTTP

### Agrupación y Documentación

* Cada módulo registra sus endpoints extendiendo `IEndpointRouteBuilder` mediante métodos de extensión (por ejemplo, `app.MapBookingEndpoints()`).
* Se debe usar `MapGroup` con versionado y etiquetas de Swagger:
```csharp
var group = app.MapGroup("/api/v1/bookings")
               .WithTags("Bookings");
```

### Tipado Estricto de Respuestas (`TypedResults`)

* Prohibido retornar `Results.Ok(...)` sin tipar. Siempre se debe utilizar `TypedResults` y la firma explícita `Results<T1, T2, ...>` para que OpenAPI/Swagger documente con exactitud los códigos HTTP y los esquemas JSON devueltos:
```csharp
public static async Task<Results<Ok<BookingResponse>, NotFound, Conflict<ProblemDetails>>> GetById(
    Guid id, 
    IBookingRepository repository, 
    CancellationToken ct)
```

### Cancelación Cooperativa (`CancellationToken`)

* Todo endpoint asíncrono y todo método de persistencia **debe recibir un `CancellationToken`** y pasarlo a las llamadas asíncronas de Dapper y ASP.NET. Si la petición es cancelada por el cliente, la consulta a PostgreSQL se aborta de inmediato liberando la conexión.

### Inmutabilidad en DTOs

* Todo contrato de entrada y salida debe definirse como un `record`:
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

## 3. Acceso a Datos con Dapper y PostgreSQL

### Ciclo de Vida de las Conexiones

* **Efímeras y seguras:** Las conexiones no se mantienen abiertas más tiempo del necesario. Se inyecta una fábrica `NpgsqlDataSource` o `IDbConnectionFactory` con ciclo de vida `Scoped`.
* Se debe utilizar siempre `await using` sobre la conexión y las transacciones:
```csharp
await using var connection = await connectionFactory.CreateConnectionAsync(ct);
```

### Parámetros Estrictos y Cero Inyección SQL

* Queda terminantemente prohibida la concatenación o interpolación de variables directas en strings SQL (`$"SELECT ... WHERE id = '{id}'"`).
* Toda consulta debe parametrizarse mediante `CommandDefinition` o tipos anónimos de Dapper:
```csharp
var command = new CommandDefinition(sql, new { CourtId = courtId }, cancellationToken: ct);
return await connection.QueryFirstOrDefaultAsync<CourtResponse>(command);
```

### Mapeo Snake Case

* Dapper se configura globalmente al inicio de la aplicación en `Program.cs` para enlazar columnas `snake_case` de la base de datos con propiedades `PascalCase` de C# sin necesidad de escribir alias SQL manuales:
```csharp
Dapper.DefaultTypeMap.MatchNamesWithUnderscores = true;
```

### Concurrencia y Transacciones

* Operaciones atómicas que afecten a dos o más tablas deben encapsularse en una transacción explícita:
```csharp
await using var tx = await connection.BeginTransactionAsync(ct);
// Operaciones SQL asociadas a 'tx'
await tx.CommitAsync(ct);
```

* El solapamiento de turnos se previene a nivel de base de datos mediante la constraint de exclusión `exc_bookings_no_overlap`. La capa de repositorio no debe implementar cerrojos artificiales lentos.

---

## 4. Validación de Entrada (FluentValidation)

* Toda clase request debe contar con su correspondiente `AbstractValidator<T>`.
* La validación debe evaluarse antes de ingresar a la lógica del dominio o repositorio. Si falla, el pipeline responde inmediatamente con `TypedResults.ValidationProblem(result.ToDictionary())` (`HTTP 400`).
* No mezclar validaciones de formato (FluentValidation) con lógica de persistencia que requiera llamadas asíncronas pesadas; estas últimas se verifican dentro de la feature correspondiente.

---

## 5. Manejo Global de Excepciones (`IExceptionHandler`)

* Queda prohibido el uso indiscriminado de bloques `try / catch` vacíos o con respuestas HTTP manuales en cada endpoint.
* Todo error no controlado es interceptado por un manejador global que implementa `Microsoft.AspNetCore.Diagnostics.IExceptionHandler` configurado bajo el estándar **RFC 7807 (`ProblemDetails`)**:

| Tipo de Excepción | Código HTTP | Detalle del ProblemDetails |
| --- | --- | --- |
| `ValidationException` | `400 Bad Request` | Lista de campos no conformes |
| `KeyNotFoundException` | `404 Not Found` | Entidad o recurso inexistente |
| `PostgresException` (código `23P01` exclusion_violation) | `409 Conflict` | El turno colisiona con una reserva activa |
| `PostgresException` (código `23505` unique_violation) | `409 Conflict` | Registro duplicado en la base de datos |
| `UnauthorizedAccessException` | `401 Unauthorized` | Credenciales no válidas o ausentes |
| Cualquier otra no contemplada | `500 Internal Server Error` | Mensaje genérico en prod; detalles solo en Dev |

---

## 6. Seguridad y Configuración

* **Secretos:** Queda prohibido commitear contraseñas, connection strings o claves secretas en `appsettings.json`. En entorno de desarrollo se debe emplear `dotnet user-secrets`; en despliegues, variables de entorno.
* **Tokens JWT:**
  * Los endpoints protegidos deben requerir autenticación explícita (`.RequireAuthorization()`).
  * La validación del token no debe admitir desfase temporal de reloj (`ClockSkew = TimeSpan.Zero`).

---

## 7. Versionado de Esquema con FluentMigrator

* Las migraciones residen exclusivamente en el proyecto `MultiSport.Database.Migrations`.
* **Identificador de migración:** Se utiliza el formato temporal unívoco `YYYYMMDDHHMM` para prevenir colisiones entre ramas concurrentes:
```csharp
[Migration(202609281830)] // Año Mes Día Hora Minuto
public class Migration_202609281830_CreateBookingsTable : Migration
{
    public override void Up() { /* ... */ }
    public override void Down() { /* ... */ }
}
```

* Todo cambio introducido mediante `Up()` debe tener su contraparte destructiva o reversiva en `Down()`.
