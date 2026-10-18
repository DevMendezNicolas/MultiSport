# Módulo Backend de Canchas (Courts Feature Slice)

Este directorio contiene la implementación vertical del **Módulo de Canchas** bajo el patrón **Vertical Slice Architecture** en **.NET 8 Minimal APIs**, **Dapper** y **PostgreSQL**.

Para la especificación completa de arquitectura y reglas de negocio, consulta el documento oficial:
[Convenciones del Módulo de Canchas](file:///c:/Dev/MultiSport/docs/COURTS_CONVENTIONS.md).

---

## Estructura Interna del Slice

```text
backend/MultiSport.Api/Features/Courts/
├── Endpoints/
│   └── CourtsEndpoints.cs           # Definición de rutas Minimal API agrupadas en /api/v1/courts
├── Services/
│   ├── ICourtService.cs             # Contrato de la capa de orquestación de negocio
│   └── CourtService.cs              # Validaciones de conflicto, cálculo de reglas y protecciones
├── Repositories/
│   ├── ICourtRepository.cs          # Contrato de persistencia y consultas Dapper
│   └── CourtRepository.cs           # Transacciones atómicas SQL e integridad referencial
├── Validators/
│   ├── CreateCourtRequestValidator.cs # Validador FluentValidation para creación de canchas
│   └── UpdateCourtRequestValidator.cs # Validador FluentValidation para actualización
└── Models/
    ├── Entities/
    │   ├── Court.cs                 # Entidad de cancha física
    │   ├── CourtSport.cs            # Entidad de compatibilidad de disciplinas
    │   ├── CourtPricingRule.cs      # Entidad de regla tarifaria por franja horaria
    │   ├── CourtFutureBooking.cs    # Modelo de proyección para turnos futuros
    │   └── Sport.cs                 # Entidad del catálogo maestro de deportes
    └── Dtos/
        ├── CreateCourtRequest.cs    # Record inmutable de solicitud de creación
        ├── UpdateCourtRequest.cs    # Record inmutable de solicitud de edición
        ├── CourtResponse.cs         # Record inmutable de respuesta de cancha
        ├── CourtSportResponse.cs    # Record inmutable de deporte y reglas asociadas
        ├── CourtPricingTierDto.cs   # Record inmutable de franja horaria entrante
        ├── CourtSportConfigDto.cs   # Record inmutable de configuración por deporte
        └── SportResponse.cs         # Record inmutable de deporte en catálogo
```

---

## Principios y Convenciones del Slice

1. **Aislamiento por Complejo:** Todas las operaciones extraen el `complex_id` desde el token JWT del usuario autenticado (`ClaimsPrincipal`). No es posible consultar, modificar o dar de baja canchas pertenecientes a otro complejo.
2. **Inmutabilidad de Contratos:** Todos los DTOs de entrada y salida son `record` inmutables de C#.
3. **CancellationToken Obligatorio:** Todos los métodos asincrónicos reciben y propagan un `CancellationToken` hacia Dapper y el motor de PostgreSQL.
4. **Respuestas Fuertemente Tipadas:** Los endpoints utilizan `TypedResults` con firmas `Results<Ok<T>, Created<T>, NotFound, Conflict<ProblemDetails>, ValidationProblem, UnauthorizedHttpResult>`.
5. **Transaccionalidad Atómica:** Toda escritura que involucra `courts`, `courts_sports` y `court_pricing_rules` se ejecuta bajo `BeginTransactionAsync(ct)`.
6. **Partición de Cruce de Medianoche:** Si un horario de disponibilidad abarca más allá de las 00:00 (ej. 20:00 a 02:00), `CourtService.GeneratePricingRules` lo descompone automáticamente en dos reglas contiguas en la base de datos (Regla 1: 20:00-00:00 del día base; Regla 2: 00:00-02:00 del día siguiente).
7. **Protección contra Turnos Futuros (409 Conflict):**
   - No se permite desvincular un deporte si tiene reservas futuras agendadas.
   - No se permite recortar horarios si turnos futuros quedan fuera de la nueva disponibilidad.
   - No se permite dar de baja una cancha si tiene reservas futuras activas.
