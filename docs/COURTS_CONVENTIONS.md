# Convenciones y Guía de Ingeniería del Módulo de Canchas (Courts)

Este documento establece las especificaciones técnicas oficiales, patrones arquitectónicos, reglas de integridad de dominio y pautas de diseño de interfaz para el **Módulo de Canchas (Courts)** de **MultiSport**, abarcando tanto el backend en **.NET 8 (C# Minimal APIs, Dapper, PostgreSQL)** como el frontend en **React 18+ (Vite, TypeScript, Tailwind CSS, TanStack Query)**.

El objetivo de este estándar es asegurar un código mantenible, libre de solapamientos temporales, con validaciones robustas y transacciones atómicas que garanticen la integridad operativa del complejo deportivo.

---

## 1. Visión y Principios Arquitectónicos del Módulo

El módulo de canchas resuelve el ciclo de vida completo de los espacios físicos deportivos del predio:
1. **Inicialización dinámica en blanco:** Cada complejo gestiona su propio inventario de canchas físicas sin valores prefijados globales.
2. **Soporte multidisciplinar:** Una cancha física puede alojar múltiples disciplinas deportivas (por ejemplo, una cancha de césped sintético configurada para Fútbol 5 y Fútbol 7, o un gimnasio polideportivo para Básquetbol y Vóley).
3. **Disponibilidad temporal y tarifaria granular:** Cada deporte en una cancha dispone de franjas horarias y esquemas tarifarios propios por día de la semana, soportando horarios estándar y tarifas nocturnas diferenciales.
4. **Prevención matemática de colisiones horarias:** Protección en dos capas: validación algorítmica previa en el backend y restricción física de exclusión GiST en PostgreSQL.
5. **Protección de turnos futuros agendados:** Ninguna modificación de horarios, desvinculación de disciplinas o baja de cancha puede ejecutarse si deja reservas existentes huérfanas o fuera de horario.

---

## 2. Modelo de Dominio y Base de Datos (PostgreSQL)

### 2.1. Jerarquía de Entidades

La persistencia del módulo se estructura en tres niveles jerárquicos normalizados:

```text
complexes (1)
   └── courts (N)
          └── courts_sports (N)
                 └── court_pricing_rules (N)
```

1. **`courts` (Cancha Física):** Representa el espacio material (ej. "Cancha 1", "Pista Central"), sus propiedades constructivas (`surface_type`, `is_covered`, `has_lighting`) y su pertenencia al complejo (`complex_id`).
2. **`courts_sports` (Compatibilidad Cancha-Deporte):** Tabla de unión N:M entre una cancha física y el catálogo maestro de disciplinas (`sports`). Define la duración base (`duration_minutes`) y el precio base (`base_price`) para cada deporte en dicha cancha.
3. **`court_pricing_rules` (Reglas de Disponibilidad y Precios por Horario):** Sobrescrituras y aperturas de agenda para cada combinación de cancha y deporte (`court_sport_id`), especificando el día de la semana (`day_of_week`), franja (`start_time` a `end_time`), tarifa (`price`) y duración específica (`duration_minutes`).

### 2.2. Esquema de Tablas

#### Tabla `courts`

| Columna | Tipo de Dato | Restricciones | Propósito |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Identificador único de la cancha. |
| `complex_id` | `UUID` | `FK NOT NULL -> complexes(id)` | Identificador del complejo deportivo propietario. |
| `name` | `VARCHAR(100)` | `NOT NULL` | Nombre operativo de la cancha (ej. "Cancha 1 - Sintético"). |
| `surface_type` | `VARCHAR(50)` | `NOT NULL` | Material del piso (Césped Sintético, Parquet, Polvo de Ladrillo, etc.). |
| `is_covered` | `BOOLEAN` | `NOT NULL, DEFAULT FALSE` | Indica si la cancha está techada / bajo cubierta. |
| `has_lighting` | `BOOLEAN` | `NOT NULL, DEFAULT TRUE` | Indica si dispone de iluminación artificial para turnos nocturnos. |
| `is_active` | `BOOLEAN` | `NOT NULL, DEFAULT TRUE` | Estado operativo de la cancha. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT CURRENT_TIMESTAMP` | Fecha de creación del registro en UTC. |
| `created_by` | `UUID` | `NULL` | Usuario que creó el registro. |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT CURRENT_TIMESTAMP` | Fecha de última modificación en UTC. |
| `updated_by` | `UUID` | `NULL` | Usuario que modificó el registro. |
| `deleted_at` | `TIMESTAMPTZ` | `NULL` | Marca de borrado lógico (Soft delete). |
| `deleted_by` | `UUID` | `NULL` | Usuario que realizó la baja lógica. |

> [!NOTE]
> **Eliminación de `buffer_minutes`:** La columna `buffer_minutes` fue eliminada formalmente mediante la migración `202610091000_RemoveBufferMinutesFromCourtsTable.cs`. La separación o colchón entre turnos no se almacena como atributo fijo de la cancha física; las agendas operativas se gobiernan mediante franjas de disponibilidad explícitas.

#### Tabla `courts_sports`

| Columna | Tipo de Dato | Restricciones | Propósito |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Identificador de la vinculación cancha-deporte. |
| `court_id` | `UUID` | `FK NOT NULL -> courts(id) ON DELETE CASCADE` | Cancha física anfitriona. |
| `sport_id` | `UUID` | `FK NOT NULL -> sports(id)` | Disciplina deportiva admitida. |
| `duration_minutes` | `INT` | `NOT NULL, DEFAULT 60, CHECK (duration_minutes > 0)` | Duración habitual del turno para este deporte. |
| `base_price` | `NUMERIC(10, 2)` | `NOT NULL, CHECK (base_price >= 0)` | Precio base de referencia por turno. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT CURRENT_TIMESTAMP` | Auditoría de creación. |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT CURRENT_TIMESTAMP` | Auditoría de modificación. |

*Restricción de Unicidad:* `CONSTRAINT uq_courts_sports UNIQUE (court_id, sport_id)`.

#### Tabla `court_pricing_rules`

| Columna | Tipo de Dato | Restricciones | Propósito |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Identificador único de la regla de horario y precio. |
| `court_sport_id` | `UUID` | `FK NOT NULL -> courts_sports(id) ON DELETE CASCADE` | Vínculo directo a la disciplina de la cancha. |
| `day_of_week` | `INT` | `NOT NULL, CHECK (day_of_week >= 0 AND day_of_week <= 6)` | 0 = Domingo, 1 = Lunes, ..., 6 = Sábado. |
| `start_time` | `TIME` | `NOT NULL` | Hora de inicio de la franja (ej. `08:00:00`). |
| `end_time` | `TIME` | `NOT NULL` | Hora de fin de la franja (ej. `23:00:00` o `00:00:00`). |
| `price` | `NUMERIC(10, 2)` | `NOT NULL, CHECK (price >= 0)` | Tarifa horaria a cobrar en dicha franja. |
| `duration_minutes` | `INT` | `NOT NULL, CHECK (duration_minutes > 0)` | Duración específica del turno en esta franja. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT CURRENT_TIMESTAMP` | Auditoría de creación. |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT CURRENT_TIMESTAMP` | Auditoría de modificación. |

### 2.3. Restricción GiST Anti-Solapamiento en PostgreSQL

Para garantizar que sea matemáticamente imposible registrar dos reglas que colisionen en horario para el mismo deporte en el mismo día, la base de datos utiliza una restricción de exclusión GiST (`btree_gist`):

1. **Función de conversión inmutable:** Mapea el horario diario a segundos (`0` a `86400`), tratando el cierre a medianoche (`00:00:00`) como el segundo 86400 del día:
```sql
CREATE OR REPLACE FUNCTION court_pricing_time_to_day_range(s time, e time) 
RETURNS int4range LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
    SELECT int4range(
        EXTRACT(EPOCH FROM s)::integer, 
        CASE WHEN e = '00:00:00'::time THEN 86400 ELSE EXTRACT(EPOCH FROM e)::integer END
    );
$$;
```

2. **Exclusion Constraint:**
```sql
ALTER TABLE court_pricing_rules ADD CONSTRAINT exc_court_pricing_rules_no_overlap EXCLUDE USING gist (
    court_sport_id WITH =,
    day_of_week WITH =,
    court_pricing_time_to_day_range(start_time, end_time) WITH &&
);
```

---

## 3. Representación Temporal y Cruce de Medianoche

En complejos deportivos es habitual que las canchas permanezcan abiertas más allá de las 00:00 (por ejemplo, viernes de 20:00 a 02:00 del sábado). 

### Regla de Partición Inequívoca
El tipo `TIME` de SQL no puede representar un rango negativo ni invertido (`20:00:00` a `02:00:00`). Por convención obligatoria, todo horario que atraviese la medianoche se particiona en el backend en dos reglas atómicas contiguas:

```text
Horario solicitado: Viernes 20:00 a 02:00
      ↓ Partición automática en backend (CourtService.GeneratePricingRules)
Regla A: Día = 5 (Viernes), Inicio = 20:00, Fin = 00:00, Precio = $X, Duración = Y min
Regla B: Día = 6 (Sábado),  Inicio = 00:00, Fin = 02:00, Precio = $X, Duración = Y min
```

* El cálculo del día siguiente utiliza aritmética modular: `nextDayOfWeek = (tier.DayOfWeek + 1) % 7`.
* Ambas reglas heredan exactamente la misma tarifa y duración.
* Esta división garantiza indexación óptima y compatibilidad directa con la restricción GiST.

---

## 4. Arquitectura y Reglas de Negocio en Backend (.NET 8)

El módulo reside bajo la estructura Vertical Slice en `backend/MultiSport.Api/Features/Courts/`:

```text
backend/MultiSport.Api/Features/Courts/
├── Endpoints/
│   └── CourtsEndpoints.cs           # Minimal API routes (/api/v1/courts)
├── Services/
│   ├── ICourtService.cs             # Orquestación de reglas de negocio
│   └── CourtService.cs              # Implementación de lógica, validaciones cruzadas y conflictos
├── Repositories/
│   ├── ICourtRepository.cs          # Contrato de persistencia SQL Dapper
│   └── CourtRepository.cs           # Transacciones atómicas e integridad referencial
├── Validators/
│   ├── CreateCourtRequestValidator.cs # FluentValidation para alta de cancha
│   └── UpdateCourtRequestValidator.cs # FluentValidation para modificación
└── Models/
    ├── Entities/
    │   ├── Court.cs                 # Entidad de cancha física
    │   ├── CourtSport.cs            # Entidad de compatibilidad deporte-cancha
    │   ├── CourtPricingRule.cs      # Entidad de regla tarifaria
    │   ├── CourtFutureBooking.cs    # Modelo de proyección para turnos futuros
    │   └── Sport.cs                 # Entidad del catálogo maestro
    └── Dtos/
        ├── CreateCourtRequest.cs    # DTO de entrada inmutable (record)
        ├── UpdateCourtRequest.cs    # DTO de modificación inmutable (record)
        ├── CourtResponse.cs         # DTO de respuesta con árbol de deportes y reglas
        ├── CourtSportResponse.cs    # DTO de disciplina asociada
        ├── CourtPricingTierDto.cs   # DTO de franja horaria de entrada
        └── SportResponse.cs         # DTO de catálogo deportivo
```

### 4.1. Reglas de Validación (FluentValidation)

Las solicitudes son validadas exhaustivamente antes de interactuar con la base de datos:
1. **Nombre de Cancha:** Obligatorio, longitud entre 2 y 100 caracteres.
2. **Superficie:** Obligatoria, máximo 50 caracteres.
3. **Disciplinas Deportivas:** Debe seleccionarse al menos un deporte; no se admiten identificadores duplicados.
4. **Franjas Horarias:**
   - Al menos una franja horaria requerida.
   - `DayOfWeek` comprendido entre 0 y 6.
   - `StartTime` y `EndTime` no pueden ser idénticos.
   - `Price >= 0` y `DurationMinutes` entre 1 y 480 minutos.
5. **Detección Previa de Solapamientos (`HasInternalTierOverlaps`):** Validación en memoria para evitar enviar a la base de datos solicitudes con franjas superpuestas en el mismo día y deporte.

### 4.2. Unicidad de Nombre por Complejo

El nombre de la cancha debe ser único dentro del complejo deportivo activo:
* En **alta:** `WHERE complex_id = @ComplexId AND LOWER(name) = LOWER(@Name) AND deleted_at IS NULL`.
* En **modificación:** `WHERE complex_id = @ComplexId AND LOWER(name) = LOWER(@Name) AND id <> @CourtId AND deleted_at IS NULL`.
* Si colisiona, se retorna `409 Conflict` con detalle explícito en `ProblemDetails`.

### 4.3. Integridad Operativa y Protección contra Turnos Futuros

Cualquier operación que altere la estructura de una cancha existente debe verificar el impacto sobre turnos ya reservados:

#### A. Desvinculación de Deportes en Modificación
Si el usuario envía una modificación donde se omite un deporte que la cancha tenía previamente:
1. Se consulta `GetActiveFutureBookingsCountForSportAsync(courtId, sportId)`.
2. Si existen reservas futuras activas (`> 0`):
   - Se rechaza la solicitud con **`409 Conflict`**.
   - Mensaje: *"No es posible desvincular el deporte '{SportName}' porque tiene {N} turno(s) futuro(s) agendado(s) en esta cancha. Debe reubicar o cancelar dichos turnos antes de retirar la disciplina."*

#### B. Recorte de Horarios y Turnos Fuera de Disponibilidad
Si el usuario modifica los horarios comerciales de la cancha:
1. Se obtienen todos los turnos futuros activos (`GetActiveFutureBookingsAsync`).
2. Se evalúa si cada turno cae íntegramente dentro de alguna de las nuevas reglas configuradas (`HasUncoveredFutureBookings`).
3. Si al menos un turno queda fuera del nuevo horario operativo:
   - Se rechaza la solicitud con **`409 Conflict`**.
   - Mensaje: *"No es posible modificar el horario operativo porque existen {N} turno(s) futuro(s) agendado(s) que quedan fuera de la nueva disponibilidad configurada."*

#### C. Baja Lógica de la Cancha (Soft Delete)
Al solicitar `DELETE /api/v1/courts/{id}`:
1. Se evalúa `GetActiveFutureBookingsCountAsync(courtId)`.
2. Si existen reservas futuras:
   - Se rechaza con **`409 Conflict`**.
   - Mensaje: *"No es posible dar de baja la cancha '{Name}' porque posee {N} turno(s) futuro(s) agendado(s)."*
3. Si no hay turnos futuros, se ejecuta la baja lógica actualizando `deleted_at = UtcNow`, `deleted_by = userId`, `is_active = false`.

### 4.4. Transacciones Atómicas con Dapper

Toda operación de escritura sobre canchas, disciplinas y reglas se ejecuta dentro de una única transacción explícita (`await using var transaction = await connection.BeginTransactionAsync(ct);`):
* Si falla la inserción de una regla de precios o salta la restricción GiST, la transacción ejecuta un `ROLLBACK` completo, impidiendo estados corruptos o canchas a medio configurar.

---

## 5. Convenciones de API REST

Todos los endpoints requieren autenticación mediante token JWT (`RequireAuthorization()`) y extraen el identificador del complejo desde la claim `complex_id`.

| Método | Ruta | Código Éxito | Códigos de Error | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/courts` | `201 Created` | `400, 401, 409` | Da de alta una nueva cancha con disciplinas y franjas. |
| `GET` | `/api/v1/courts` | `200 OK` | `401` | Lista las canchas activas del complejo autenticado. |
| `GET` | `/api/v1/courts/{id}` | `200 OK` | `401, 404` | Obtiene el detalle completo de una cancha y sus tarifas. |
| `PUT` | `/api/v1/courts/{id}` | `200 OK` | `400, 401, 404, 409` | Modifica configuración física, disciplinas y reglas. |
| `DELETE` | `/api/v1/courts/{id}` | `204 NoContent` | `401, 404, 409` | Baja lógica de la cancha si no tiene turnos futuros. |
| `GET` | `/api/v1/courts/sports` | `200 OK` | `401` | Obtiene el catálogo maestro de deportes disponibles. |

### Ejemplo de Contrato de Solicitud (`CreateCourtRequest`)

```json
{
  "name": "Cancha 1 - Césped Sintético",
  "surfaceType": "Césped Sintético",
  "isCovered": false,
  "hasLighting": true,
  "basePrice": 22000,
  "durationMinutes": 60,
  "sportIds": [
    "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  ],
  "pricingTiers": [
    {
      "dayOfWeek": 1,
      "startTime": "08:00",
      "endTime": "18:00",
      "price": 22000,
      "durationMinutes": 60
    },
    {
      "dayOfWeek": 1,
      "startTime": "18:00",
      "endTime": "00:00",
      "price": 28000,
      "durationMinutes": 60
    }
  ],
  "customSportPrices": []
}
```

---

## 6. Convenciones y Ergonomía en Frontend (React + TypeScript)

El frontend reside en `frontend/src/features/courts/` respetando la arquitectura por módulos de negocio:

```text
frontend/src/features/courts/
├── api/
│   └── courtsApi.ts             # Cliente Axios tipado hacia /api/v1/courts
├── hooks/
│   └── useCourts.ts             # Hooks de TanStack Query (useCourts, useCreateCourt, etc.)
├── components/
│   ├── CreateCourtForm.tsx      # Formulario reactivo de alta de cancha
│   ├── EditCourtModal.tsx       # Modal de edición con protección contra descarte accidental
│   ├── PricingTiersEditor.tsx   # Editor de franjas horarias y detección visual de colisiones
│   ├── CourtImagePreview.tsx    # Componente de preview dinámico de cancha
│   └── CourtVisualSystem.ts     # Mapeo determinístico de superficies y deportes a recursos gráficos
├── pages/
│   └── CourtsManagementPage.tsx # Página de administración general y métricas
├── types/
│   └── index.ts                 # Contratos TypeScript sincronizados 1:1 con DTOs de C#
└── index.ts                     # Barrel export público del módulo
```

### 6.1. Divulgación Progresiva en Horarios y Precios

Para evitar sobrecargar al usuario administrativo, el formulario ofrece dos niveles de complejidad:
1. **Modo Rápido / Simple (Por Defecto):**
   - El usuario define un horario comercial estándar (ej. Apertura 08:00, Cierre 23:00), selecciona los días hábiles con atajos (*Lun-Vie*, *Todos*, *Finde*) y especifica un precio base.
   - El sistema calcula y genera internamente las reglas uniformes correspondientes.
2. **Modo Avanzado (`PricingTiersEditor`):**
   - Se habilita mediante el interruptor *"Configuración avanzada de franjas horarias y precios"*.
   - Permite añadir múltiples franjas independientes por día (ej. Mañana $18.000, Noche con luces $25.000).
   - Detecta solapamientos en tiempo real en el cliente, resaltando con borde y badge de alerta las franjas colisionantes antes de enviar la petición.

### 6.2. Sistema Visual Determinístico (`CourtVisualSystem.ts`)

Para dotar al panel de una estética comercial cuidada sin requerir subida manual obligatoria de imágenes, el sistema resuelve la fotografía de presentación en función del deporte primario y el tipo de superficie seleccionada:

```typescript
// Ejemplo de resolución: Tenis + Polvo de Ladrillo -> Foto reglamentaria de arcilla
const visual = resolveCourtImage("Tenis", "Polvo de Ladrillo");
// visual.imageUrl -> Tenis_Court_PolvoLadrillo.jpg
// visual.caption  -> "Cancha de Tenis en Polvo de Ladrillo"
```

* Las imágenes están optimizadas y empaquetadas localmente en `frontend/src/assets/create-courts/`.
* Nunca se colocan badges decorativos ni etiquetas artificiales sobre las fotografías (cumpliendo la regla anti-ruido visual de [AGENTS.md](file:///c:/Dev/MultiSport/AGENTS.md)).

### 6.3. Protección contra Descarte Accidental en Modales

En `EditCourtModal.tsx`, al cargar la cancha a editar se genera un snapshot JSON del estado inicial. Si el usuario intenta cerrar el modal habiendo modificado datos, se presenta un diálogo de confirmación:
- Evita la pérdida accidental de configuraciones complejas de franjas horarias.
- El fondo del modal utiliza desenfoque suave (`backdrop-blur-sm`).

### 6.4. Manejo de Estado del Servidor con TanStack Query

Todas las operaciones de lectura y mutación están encapsuladas en `useCourts.ts`:
- Las consultas (`useCourts`, `useCourt`, `useSports`) definen claves inmutables `['courts']`, `['courts', id]`, `['sports']`.
- Las mutaciones (`useCreateCourt`, `useUpdateCourt`, `useDeleteCourt`) invalidan automáticamente la clave `['courts']` en el callback `onSuccess`.
- Las notificaciones operativas se presentan mediante **Sonner** (`toast.success()`, `toast.error()`).

---

## 7. Catálogo de Errores y Códigos de Estado HTTP

El módulo estandariza las respuestas de fallo siguiendo la especificación RFC 7807 (`ProblemDetails`):

| Código HTTP | Escenario | Detalle / Causa Raíz |
| :--- | :--- | :--- |
| `400 Bad Request` | Fallo de validación de contrato | Error en `FluentValidation` (nombre vacío, duración menor a 1 min, franja horaria idéntica). |
| `401 Unauthorized` | Sesión no válida o ausente | Falta token JWT en encabezado `Authorization` o no contiene la claim `complex_id`. |
| `404 Not Found` | Cancha inexistente | No existe una cancha activa con el identificador provisto para el complejo autenticado. |
| `409 Conflict` | Nombre de cancha duplicado | Ya existe otra cancha activa con el mismo nombre en el complejo. |
| `409 Conflict` | Superposición horaria de reglas | Dos franjas horarias configuradas para el mismo deporte y día se solapan. |
| `409 Conflict` | Desvinculación de deporte con reservas | Se intentó quitar un deporte que posee turnos futuros pendientes o confirmados. |
| `409 Conflict` | Turnos futuros fuera de horario | La nueva franja de disponibilidad deja turnos futuros agendados fuera de horario. |
| `409 Conflict` | Baja de cancha con reservas | Se intentó dar de baja una cancha que posee turnos futuros agendados. |

---

## 8. Checklist de Validación y Calidad para Nuevos Cambios

Antes de solicitar la integración de cambios sobre el módulo de canchas a la rama `develop`:

- [ ] Las migraciones nuevas de base de datos residen en `MultiSport.Database.Migrations/Features/Courts/` y cuentan con métodos `Up()` y `Down()` completos.
- [ ] No se reintrodujo la columna `buffer_minutes`.
- [ ] Todo método asincrónico en endpoints, servicios y repositorios recibe y propaga un `CancellationToken`.
- [ ] Las consultas de lectura filtran estrictamente por `deleted_at IS NULL` y aíslan por `complex_id`.
- [ ] Las operaciones de escritura en `CourtRepository` están contenidas en transacciones Dapper atómicas.
- [ ] No se utilizan llamadas directas a `fetch` ni instancias aisladas de `axios.create()` en frontend; se usa `@/lib/axios`.
- [ ] Las mutaciones en frontend invalidan la cache de TanStack Query `['courts']`.
- [ ] La interfaz cumple los estándares ergonómicos táctiles (targets >= 44x44px, inputs text-base >= 16px).
- [ ] No se introdujeron emojis ni microtítulos decorativos ("01.", "FORMULARIO").
