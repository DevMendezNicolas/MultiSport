# Estrategia de Pruebas Automatizadas y Calidad (Testing Strategy)

Este documento define las políticas de testing, alcance y estándares de validación para **MultiSport** en backend y frontend.

---

## 1. Pirámide de Pruebas y Enfoque

El objetivo del testing en MultiSport es proteger la integridad de los algoritmos de negocio críticos y validar el comportamiento ante concurrencia sin sobrecargar los tiempos de compilación ni generar tests frágiles.

```text
       / \
      / E2E \          (Mínimos flujos críticos)
     /-------\
    /  Integ  \        (Testcontainers + PostgreSQL GiST)
   /-----------\
  /   Unitarias \      (Algoritmos de torneos, señas, validadores)
 /---------------\
```

---

## 2. Pruebas Unitarias Prioritarias (Backend - xUnit + FluentAssertions)

Las pruebas unitarias deben concentrarse en lógica pura y determinista:

### 1. Algoritmos de Fixture de Torneos
- **Round-Robin:** Validar que el algoritmo de rueda simple o ida y vuelta garantice que:
  - Cada equipo juegue exactamente una vez contra cada rival (o dos en ida y vuelta).
  - Los equipos descansen de manera equitativa si el número de participantes es impar.
  - No existan cruces duplicados en la misma fecha o jornada.
- **Playoffs:** Comprobar la correcta asignación de llaves, propagación de ganadores y cálculo de posiciones/diferencia de gol.

### 2. Reglas de Cancelación y Retención de Seña
- Probar que la política de cancelación deduzca o retenga la seña de forma exacta según la antelación:
  - Cancelación con más de $X$ horas $\rightarrow$ Reembolso o crédito según regla.
  - Cancelación tardía $\rightarrow$ Retención total de la seña.

### 3. Validadores de FluentValidation
- Pruebas unitarias directas sobre `AbstractValidator<T>`:
  - Fechas válidas (`end_time_utc > start_time_utc`).
  - Precios y depósitos no negativos (`total_price >= 0`, `deposit_amount >= 0`).
  - Formato y longitud de nombres, teléfonos y emails.

---

## 3. Pruebas de Integración con Base de Datos

### Concurrencia y Restricciones de Exclusión GiST
La integridad de los turnos no se delega a validaciones en memoria sino al motor PostgreSQL.

- **Stack:** Uso de **Testcontainers for .NET** para levantar una instancia real de PostgreSQL con la extensión `btree_gist`.
- **Caso Crítico:** Ejecutar dos inserciones asíncronas concurrentes para la misma cancha (`court_id`) con rangos horarios superpuestos (`tstzrange`).
- **Aserción:** Verificar que la segunda inserción lance `PostgresException` con código `23P01` (`exclusion_violation`) y sea mapeada a `HTTP 409 Conflict`.

---

## 4. Pruebas de Frontend (Vitest + Testing Library)

- **Helpers y Formateadores:** Pruebas unitarias exhaustivas sobre funciones de conversión de marcas temporales UTC (`ISO 8601`) a formatos locales.
- **Formularios y Validaciones:** Comprobación del renderizado de errores devueltos por la API (`ProblemDetails` con código 400).
- **Custom Hooks:** Validar que los hooks de TanStack Query ejecuten las invalidaciones de caché esperadas tras mutaciones exitosas.
