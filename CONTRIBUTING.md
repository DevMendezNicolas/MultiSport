# Guía de Contribución y Flujo de Trabajo (MultiSport)

Este documento define las políticas operativas, el flujo de ramificación y los estándares de código para el desarrollo de **MultiSport**. El cumplimiento de estas normas es obligatorio para asegurar la estabilidad, trazabilidad y calidad técnica del repositorio.

---

## 1. Modelo de Ramas (GitFlow Simplificado)

El repositorio opera bajo un esquema estructurado de ramas para garantizar que la rama principal permanezca aislada y protegida hasta el lanzamiento a producción.

### Topología y Jerarquía

| Rama | Tipo | Origen | Destino de Merge | Propósito |
| :--- | :--- | :--- | :--- | :--- |
| **`main`** | Permanente | Inicial | — | Código estable y desplegable en producción. Solo recibe merges de releases o hotfixes. |
| **`develop`** | Permanente | `main` | `main` | Integración continua activa. Contiene el último avance funcional probado del equipo. |
| **`feature/*`** | Temporal | `develop` | `develop` | Desarrollo de nuevas funcionalidades o historias de usuario. |
| **`bugfix/*`** | Temporal | `develop` | `develop` | Corrección de fallos detectados durante el ciclo de integración en `develop`. |
| **`hotfix/*`** | Temporal | `main` | `main` y `develop` | Parches de emergencia para errores críticos en producción. |

> **Regla de oro:** Jamás se realiza un `push` directo a las ramas `main` ni `develop`. Todo cambio ingresa mediante **Pull Request (PR)**.

---

## 2. Convención de Nombres para Ramas

Las ramas de trabajo temporales deben seguir el estándar en minúsculas con guiones medios:

`<tipo>/<modulo>-<descripcion-corta>`

### Ejemplos válidos:
- **Features:** `feature/canchas-crud-alta`, `feature/torneo-sorteo-fixture`, `feature/turnos-grilla-semanal`
- **Bugfixes:** `bugfix/solapamiento-horarios-zona`, `bugfix/jwt-validacion-claims`
- **Refactors:** `refactor/turnos-dapper-queries`, `refactor/tabla-posiciones-algoritmo`
- **Hotfixes:** `hotfix/cors-produccion-bloqueo`

---

## 3. Convención de Mensajes de Commit

Los mensajes de confirmación siguen el estándar de **Conventional Commits** para mantener un historial semántico, claro y legible:

`<tipo>(<alcance-opcional>): <descripción imperativa breve>`

### Prefijos admitidos:
- **`feat:`** Una nueva característica o funcionalidad.
- **`fix:`** Corrección de un defecto o bug.
- **`refactor:`** Modificación de código sin cambiar la funcionalidad (ni agrega feature ni corrige bug).
- **`test:`** Adición o ajuste de pruebas automatizadas (xUnit).
- **`perf:`** Cambios orientados a optimizar el rendimiento del sistema o consultas SQL.
- **`chore:`** Tareas administrativas, actualización de dependencias, configs de Vite o scripts de build.

### Ejemplos:
```text
feat(turnos): agregar validacion para retencion automatica de seña
fix(torneos): corregir calculo de diferencia de gol en fase de grupos
refactor(canchas): simplificar queries de seleccion con dapper
chore(deps): actualizar fluentmigrator a la ultima version estable
