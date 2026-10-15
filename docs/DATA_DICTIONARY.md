# Diccionario de Datos y Especificación de Dominio: Canchas, Turnos, Identidad y Pagos

Este documento constituye la especificación formal del modelo de datos y reglas de negocio para el núcleo de **MultiSport** (.NET 8, Dapper, PostgreSQL). Reemplaza y amplía las especificaciones preliminares, alineándose con las políticas de [DATABASE_CONVENTIONS.md](file:///c:/Develop/MultiSport/docs/DATABASE_CONVENTIONS.md) y [SECURITY_POLICIES.md](file:///c:/Develop/MultiSport/docs/SECURITY_POLICIES.md).

---

## 1. Contexto de Negocio y Arquitectura

* **Tipo de Producto:** SaaS B2B de gestión operativa de turnos y predios deportivos para uso de administradores y recepcionistas.
* **Flujo Operativo:** Los clientes solicitan turnos vía WhatsApp, teléfono o mostrador; el personal del complejo los asigna en la grilla del sistema.
* **Modelo de Identidad:** Relación 1:1 entre predio (`complexes`) y cuenta administrativa (`users`).
* **Seguridad:** Tokens JWT de corta duración (15-60 min) + Refresh Tokens en Cookies HttpOnly con rotación + Tokens de reseteo de contraseña hasheados con SHA-256.
* **Integridad de Horarios:** Restricción GiST en PostgreSQL (`exc_bookings_no_overlap`) para prevenir matemáticamente el solapamiento de turnos.
* **Inmutabilidad Financiera:** La tabla `payments` es append-only (nunca se borra ni se modifica; los saldos se asientan como transacciones independientes).

---

## 2. Mapa de Tablas del Módulo

| Tabla | Dominio / Propósito |
| :--- | :--- |
| **`complexes`** | Perfil fiscal y comercial del complejo deportivo. |
| **`users`** | Credenciales de acceso de la cuenta administrativa del complejo. |
| **`refresh_tokens`** | Sesiones de autenticación JWT y soporte de rotación de tokens. |
| **`password_reset_tokens`** | Tokens de un solo uso hasheados (SHA-256) para recuperación de clave. |
| **`complex_schedules`** | Horarios de apertura y cierre por día de la semana (soporta cruces de medianoche). |
| **`sports`** | Catálogo maestro de deportes disponibles en la plataforma. |
| **`courts`** | Canchas físicas del predio y sus atributos operativos (superficie, iluminación, buffer). |
| **`courts_sports`** | Relación N:M cancha-deporte con duración habitual y precio base. |
| **`court_pricing_rules`** | Reglas de tarifas diferenciales por franjas horarias (ej. tarifa nocturna con luz). |
| **`court_blocks`** | Bloqueos por mantenimiento, lluvia o reparaciones. |
| **`bookings`** | Reservas de turnos (soporta turnos fijos semanales y expiración de seña). |
| **`payments`** | Libro contable append-only para registro de señas y cobros de saldo restante en mostrador. |

---

## 3. Especificación Detallada de Tablas

### 3.1. `complexes` (Complejos Deportivos)
Representa al predio deportivo físico y comercial.

| Columna | Tipo de Dato | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Identificador único del complejo. |
| `name` | `VARCHAR(150)` | `NOT NULL` | Nombre comercial del complejo. |
| `tax_id` | `VARCHAR(20)` | `NOT NULL` | CUIT o identificación tributaria. |
| `cbu_alias` | `VARCHAR(50)` | `NOT NULL` | CBU, CVU o Alias bancario para señas. |
| `address` | `VARCHAR(255)` | `NOT NULL` | Dirección física de ubicación del predio. |
| `phone` | `VARCHAR(50)` | `NOT NULL` | Teléfono / WhatsApp oficial del predio. |
| `city` | `VARCHAR(100)` | `NOT NULL` | Localidad o ciudad. |
| `logo_url` | `TEXT` | `NULL` | URL del logotipo o isotipo del complejo. |
| `is_active` | `BOOLEAN` | `NOT NULL, DEFAULT TRUE` | Banderín de habilitación operativa del predio. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT CURRENT_TIMESTAMP` | Fecha de creación del registro. |
| `created_by` | `UUID` | `NULL` | Usuario que creó el registro. |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT CURRENT_TIMESTAMP` | Fecha de última modificación. |
| `updated_by` | `UUID` | `NULL` | Usuario que modificó el registro. |
| `deleted_at` | `TIMESTAMPTZ` | `NULL` | Marca de borrado lógico (Soft delete). |
| `deleted_by` | `UUID` | `NULL` | Usuario que ejecutó el borrado lógico. |

---

### 3.2. `users` (Cuentas de Acceso)
Credenciales y estado de autenticación de la cuenta del complejo.

| Columna | Tipo de Dato | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Identificador único del usuario. |
| `complex_id` | `UUID` | `FK NOT NULL, UNIQUE` | Vinculación 1:1 con el predio (`complexes.id`). |
| `email` | `VARCHAR(255)` | `NOT NULL, UNIQUE` | Correo electrónico de login en minúsculas. |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | Hash generado con Argon2id o BCrypt (cost >= 12). |
| `role` | `VARCHAR(50)` | `NOT NULL, DEFAULT 'complex_admin'` | Rol para autorización en la API. |
| `is_active` | `BOOLEAN` | `NOT NULL, DEFAULT TRUE` | Habilitación de la cuenta de usuario. |
| `failed_login_attempts` | `INT` | `NOT NULL, DEFAULT 0` | Intentos fallidos consecutivos de login. |
| `lockout_end_utc` | `TIMESTAMPTZ` | `NULL` | Fin de bloqueo temporal por fuerza bruta. |
| `last_login_at_utc` | `TIMESTAMPTZ` | `NULL` | Fecha y hora del último inicio de sesión. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT CURRENT_TIMESTAMP` | Auditoría de creación. |
| `created_by` | `UUID` | `NULL` | Auditoría de creación. |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT CURRENT_TIMESTAMP` | Auditoría de modificación. |
| `updated_by` | `UUID` | `NULL` | Auditoría de modificación. |
| `deleted_at` | `TIMESTAMPTZ` | `NULL` | Borrado lógico. |
| `deleted_by` | `UUID` | `NULL` | Borrado lógico. |

---

### 3.3. `refresh_tokens` (Sesiones JWT)
Control de sesiones concurrentes y renovación de Access Tokens.

| Columna | Tipo de Dato | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Identificador de la sesión. |
| `user_id` | `UUID` | `FK NOT NULL` | Usuario dueño de la sesión (`users.id`). |
| `token_hash` | `VARCHAR(255)` | `NOT NULL` | Hash criptográfico del Refresh Token. |
| `expires_at_utc` | `TIMESTAMPTZ` | `NOT NULL` | Fecha de expiración (típicamente 7 a 30 días). |
| `created_at_utc` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT CURRENT_TIMESTAMP` | Fecha de emisión. |
| `revoked_at_utc` | `TIMESTAMPTZ` | `NULL` | Fecha de revocación manual o por logout. |
| `replaced_by_token` | `VARCHAR(255)` | `NULL` | Hash del nuevo token emitido (rotación). |

---

### 3.4. `password_reset_tokens` (Recuperación de Contraseña)
Tokens de un solo uso para solicitudes de "Olvidé mi contraseña".

| Columna | Tipo de Dato | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Identificador único del token. |
| `user_id` | `UUID` | `FK NOT NULL` | Usuario que solicitó el reseteo (`users.id`). |
| `token_hash` | `VARCHAR(255)` | `NOT NULL` | Hash SHA-256 del token aleatorio enviado por email. |
| `expires_at_utc` | `TIMESTAMPTZ` | `NOT NULL` | Vencimiento estricto (15 a 30 minutos). |
| `created_at_utc` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT CURRENT_TIMESTAMP` | Fecha de emisión. |
| `used_at_utc` | `TIMESTAMPTZ` | `NULL` | Fecha en la que se consumió el reseteo. |
| `created_by_ip` | `VARCHAR(45)` | `NULL` | Dirección IP de la solicitud para auditoría de abuso. |

---

### 3.5. `complex_schedules` (Horarios de Atención)
Horarios comerciales por día de la semana.

| Columna | Tipo de Dato | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Identificador del horario. |
| `complex_id` | `UUID` | `FK NOT NULL` | Complejo deportivo (`complexes.id`). |
| `day_of_week` | `INT` | `NOT NULL, CHECK (0 <= day_of_week <= 6)` | 0 = Domingo, 1 = Lunes, ..., 6 = Sábado. |
| `opening_time` | `TIME` | `NOT NULL` | Hora de apertura (ej. 14:00). |
| `closing_time` | `TIME` | `NOT NULL` | Hora de cierre (ej. 02:00 del día siguiente). |
| `is_closed` | `BOOLEAN` | `NOT NULL, DEFAULT FALSE` | Marca si el predio permanece cerrado este día. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT CURRENT_TIMESTAMP` | Auditoría de creación. |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT CURRENT_TIMESTAMP` | Auditoría de modificación. |

---

### 3.6. `sports` (Catálogo Maestro de Deportes)
Catálogo general de disciplinas admitidas.

| Columna | Tipo de Dato | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Identificador del deporte. |
| `name` | `VARCHAR(100)` | `NOT NULL, UNIQUE` | Nombre de la disciplina (Fútbol 5, Pádel, etc.). |
| `icon_url` | `TEXT` | `NULL` | URL del icono o recurso gráfico. |
| `max_players` | `INT` | `NOT NULL, DEFAULT 10` | Cantidad estándar sugerida de participantes. |
| `is_active` | `BOOLEAN` | `NOT NULL, DEFAULT TRUE` | Habilitación en el catálogo. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT CURRENT_TIMESTAMP` | Auditoría. |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT CURRENT_TIMESTAMP` | Auditoría. |
| `deleted_at` | `TIMESTAMPTZ` | `NULL` | Soft delete. |

---

### 3.7. `courts` (Canchas Físicas)
Espacios físicos para la práctica deportiva.

| Columna | Tipo de Dato | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Identificador de la cancha. |
| `complex_id` | `UUID` | `FK NOT NULL` | Complejo propietario (`complexes.id`). |
| `name` | `VARCHAR(100)` | `NOT NULL` | Nombre o número ("Cancha 1 - Sintético"). |
| `surface_type` | `VARCHAR(50)` | `NOT NULL` | Superficie ("Césped sintético", "Blindex", etc.). |
| `is_covered` | `BOOLEAN` | `NOT NULL, DEFAULT FALSE` | Indica si la cancha es techada. |
| `has_lighting` | `BOOLEAN` | `NOT NULL, DEFAULT TRUE` | Indica si cuenta con iluminación artificial. |
| `buffer_minutes` | `INT` | `NOT NULL, DEFAULT 0` | Tiempo muerto de colchón/limpieza entre turnos. |
| `is_active` | `BOOLEAN` | `NOT NULL, DEFAULT TRUE` | Estado operativo de la cancha. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT CURRENT_TIMESTAMP` | Auditoría. |
| `created_by` | `UUID` | `NULL` | Auditoría. |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT CURRENT_TIMESTAMP` | Auditoría. |
| `updated_by` | `UUID` | `NULL` | Auditoría. |
| `deleted_at` | `TIMESTAMPTZ` | `NULL` | Soft delete. |
| `deleted_by` | `UUID` | `NULL` | Soft delete. |

---

### 3.8. `courts_sports` (Compatibilidad Cancha-Deporte)
Configuración N:M de qué disciplinas pueden jugarse en qué cancha física.

| Columna | Tipo de Dato | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Identificador de la vinculación. |
| `court_id` | `UUID` | `FK NOT NULL` | Cancha física (`courts.id`). |
| `sport_id` | `UUID` | `FK NOT NULL` | Deporte admitido (`sports.id`). |
| `duration_minutes` | `INT` | `NOT NULL, DEFAULT 60` | Duración habitual del turno para este deporte (ej. 60 o 90 min). |
| `base_price` | `NUMERIC(10, 2)` | `NOT NULL, CHECK (base_price >= 0)` | Precio base de alquiler para este deporte. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT CURRENT_TIMESTAMP` | Auditoría. |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT CURRENT_TIMESTAMP` | Auditoría. |

*Restricción de unicidad:* `CONSTRAINT uq_courts_sports UNIQUE (court_id, sport_id)`.

---

### 3.9. `court_pricing_rules` (Tarifas Diferenciales por Horario)
Sobreescritura de precios para turnos nocturnos, días específicos o fines de semana.

| Columna | Tipo de Dato | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Identificador de la regla. |
| `court_id` | `UUID` | `FK NOT NULL` | Cancha a la que aplica (`courts.id`). |
| `sport_id` | `UUID` | `FK NULL` | Deporte específico o NULL para todos. |
| `day_of_week` | `INT` | `NULL, CHECK (0 <= day_of_week <= 6)` | Día de la semana o NULL si aplica todos los días. |
| `start_time` | `TIME` | `NOT NULL` | Inicio de la franja tarifaria (ej. 19:00). |
| `end_time` | `TIME` | `NOT NULL` | Fin de la franja tarifaria (ej. 23:00). |
| `price` | `NUMERIC(10, 2)` | `NOT NULL, CHECK (price >= 0)` | Tarifa a cobrar en dicha franja. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT CURRENT_TIMESTAMP` | Auditoría. |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT CURRENT_TIMESTAMP` | Auditoría. |

---

### 3.10. `court_blocks` (Bloqueos Operativos)
Cancelación de turnos por mantenimiento, lluvia o eventos extraordinarios.

| Columna | Tipo de Dato | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Identificador del bloqueo. |
| `court_id` | `UUID` | `FK NOT NULL` | Cancha bloqueada (`courts.id`). |
| `start_time_utc` | `TIMESTAMPTZ` | `NOT NULL` | Inicio del periodo bloqueado. |
| `end_time_utc` | `TIMESTAMPTZ` | `NOT NULL` | Fin del periodo bloqueado. |
| `reason` | `VARCHAR(255)` | `NOT NULL` | Causa ("Lluvia", "Mantenimiento césped", "Reparación luces"). |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT CURRENT_TIMESTAMP` | Auditoría. |
| `created_by` | `UUID` | `NULL` | Usuario que ejecutó el bloqueo. |

---

### 3.11. `bookings` (Reservas de Turnos)
Registro transaccional de turnos asignados por los encargados del complejo.

| Columna | Tipo de Dato | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Identificador de la reserva. |
| `court_id` | `UUID` | `FK NOT NULL` | Cancha física reservada (`courts.id`). |
| `sport_id` | `UUID` | `FK NOT NULL` | Disciplina jugada (`sports.id`). |
| `customer_name` | `VARCHAR(150)` | `NOT NULL` | Nombre del cliente que solicitó el turno. |
| `customer_phone` | `VARCHAR(50)` | `NOT NULL` | Teléfono / WhatsApp del cliente. |
| `customer_email` | `VARCHAR(255)` | `NULL` | Correo electrónico de contacto (opcional). |
| `start_time_utc` | `TIMESTAMPTZ` | `NOT NULL` | Momento exacto de inicio del turno en UTC. |
| `end_time_utc` | `TIMESTAMPTZ` | `NOT NULL` | Momento exacto de finalización del turno en UTC. |
| `total_price` | `NUMERIC(10, 2)` | `NOT NULL, CHECK (total_price >= 0)` | Monto total pactado para el turno. |
| `deposit_amount` | `NUMERIC(10, 2)` | `NOT NULL, DEFAULT 0.00` | Monto de la seña acordada. |
| `status` | `VARCHAR(30)` | `NOT NULL, DEFAULT 'pending'` | `pending`, `confirmed`, `in_progress`, `completed`, `cancelled`, `expired`. |
| `expires_at_utc` | `TIMESTAMPTZ` | `NULL` | Tiempo límite de espera de seña (15 min para pasar a `expired`). |
| `is_recurring` | `BOOLEAN` | `NOT NULL, DEFAULT FALSE` | Indica si pertenece a un turno fijo semanal. |
| `recurring_group_id` | `UUID` | `NULL` | Agrupador para partidos fijos semanales recurrentes. |
| `notes` | `TEXT` | `NULL` | Notas u observaciones del turno. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT CURRENT_TIMESTAMP` | Auditoría. |
| `created_by` | `UUID` | `NULL` | Auditoría. |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT CURRENT_TIMESTAMP` | Auditoría. |
| `updated_by` | `UUID` | `NULL` | Auditoría. |
| `deleted_at` | `TIMESTAMPTZ` | `NULL` | Soft delete. |
| `deleted_by` | `UUID` | `NULL` | Soft delete. |

#### Restricción de Exclusión GiST Anti-Solapamiento:
```sql
CONSTRAINT exc_bookings_no_overlap EXCLUDE USING gist (
    court_id WITH =,
    tstzrange(start_time_utc, end_time_utc) WITH &&
) WHERE (deleted_at IS NULL AND status NOT IN ('cancelled', 'expired'));
```

---

### 3.12. `payments` (Libro Contable de Pagos - Append-Only)
Registro inmutable de transacciones monetarias asociadas a las reservas.

| Columna | Tipo de Dato | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Identificador de la transacción de pago. |
| `booking_id` | `UUID` | `FK NOT NULL` | Reserva asociada (`bookings.id`). |
| `amount` | `NUMERIC(10, 2)` | `NOT NULL, CHECK (amount > 0)` | Monto cobrado en la transacción. |
| `payment_method` | `VARCHAR(30)` | `NOT NULL` | `transfer`, `cash`, `debit_card`, `credit_card`, `mercadopago`. |
| `payment_type` | `VARCHAR(30)` | `NOT NULL` | `deposit` (seña), `remaining_balance` (saldo restante), `full_payment`, `adjustment`. |
| `status` | `VARCHAR(30)` | `NOT NULL, DEFAULT 'approved'` | `approved`, `pending_verification`, `rejected`. |
| `receipt_url` | `TEXT` | `NULL` | Comprobante de transferencia o cupón de posnet. |
| `notes` | `VARCHAR(255)` | `NULL` | Detalle o aclaración del cobro. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT CURRENT_TIMESTAMP` | Momento exacto del cobro. |
| `created_by` | `UUID` | `NULL` | Usuario que asentó el pago en la caja. |

*Regla:* Esta tabla no cuenta con `deleted_at` ni `deleted_by` (inmutabilidad financiera obligatoria).
