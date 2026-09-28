![.NET](https://img.shields.io/badge/.NET-C%23_Minimal_APIs-512BD4?style=flat&logo=dotnet)
![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=flat&logo=react)
![Dapper](https://img.shields.io/badge/Data-Dapper-red?style=flat)
![Database](https://img.shields.io/badge/Database-PostgreSQL_%7C_MySQL-336791?style=flat)
![Auth](https://img.shields.io/badge/Security-JWT-black?style=flat&logo=jsonwebtokens)

---

## 📌 Contexto del Proyecto

**MultiSport** es una aplicación web desarrollada para la cátedra de **Algoritmos y Estructuras de Datos III**. 

El software está concebido como una herramienta de administración interna para complejos deportivos (*single-tenant* con usuario único administrador), centralizando la gestión de canchas, reservas de turnos y resolviendo la lógica algorítmica requerida para coordinar eventos y competencias deportivas.

---

## 🚀 Funcionalidades Principales

### 🏟️ Configuración y Gestión de Canchas
- **Modelo dinámico:** El complejo inicia sin canchas predefinidas.
- **Multidisciplina:** Alta y parametrización de canchas por deporte (fútbol 5/7/11, pádel, tenis, básquet, etc.), contemplando canchas que comparten distintas disciplinas en un mismo espacio físico.
- **Parametrización:** Configuración de tarifas y horarios operativos.

### 📅 Turnos y Gestión de Disponibilidad
- **Tipos de reserva:** Soporte para turnos eventuales y turnos fijos semanales.
- **Control de señas y cobros:** Registro administrativo manual de señas y pagos recibidos (efectivo, transferencias).
- **Políticas de cancelación:** Penalización directa mediante la retención de la seña ante cancelaciones.
- **Control de solapamiento:** Algoritmo de validación para evitar colisiones horarias entre turnos, canchas y eventos.

### 🏆 Eventos y Generación de Torneos (Módulo Algorítmico)
- **Eventos sociales:** Bloqueo de franjas horarias y canchas para cumpleaños, exhibiciones y jornadas recreativas.
- **Formatos de competencia soportados:**
  - **Liga (Round-Robin):** Todos contra todos a rueda simple o ida y vuelta.
  - **Playoffs:** Eliminación directa con armado de llaves y cruces jerárquicos.
  - **Combinado:** Fase de grupos clasificatoria + fase de playoffs.
- **Lógica de gestión:**
  - Carga y registro de equipos, listas de buena fe y jugadores.
  - Sorteo algorítmico automatizado del fixture con flexibilidad para ediciones manuales.
  - Asignación manual de los partidos del fixture a los turnos y canchas disponibles en el complejo.
  - Carga de resultados, cómputo dinámico de tablas de posiciones (puntos, diferencia de gol, desempates) y avance en llaves eliminatorias.

---

## 🛠️ Stack Tecnológico

| Componente | Tecnología | Rol / Justificación |
| :--- | :--- | :--- |
| **Backend** | .NET (C#) | Minimal APIs para un diseño liviano y de alto rendimiento |
| **Acceso a Datos** | Dapper | Micro-ORM para ejecución de consultas SQL optimizadas |
| **Base de Datos** | PostgreSQL / MySQL | Persistencia relacional y consistencia transaccional |
| **Seguridad** | JWT (JSON Web Tokens) | Autenticación y autorización para la sesión de administración |
| **Frontend** | React | Single Page Application (SPA) para el panel de gestión |

---

## 🏛️ Arquitectura del Backend

El backend se estructura mediante **Vertical Slice / Feature Folders**, organizando el código por capacidades funcionales en lugar de capas técnicas dispersas:

```text
src/
└── MultiSport.Api/
    ├── Common/               # Middlewares, filtros y utilidades compartidas
    ├── Infrastructure/       # Conexión a BD (Dapper) y migraciones
    └── Features/
        ├── Auth/             # Autenticación, generación y validación de tokens JWT
        ├── Canchas/          # Endpoints, DTOs, Repository y Service de canchas
        ├── Turnos/           # Validación de solapamientos, señas y grilla de reservas
        ├── Eventos/          # Bloqueo de canchas para eventos sociales y cumpleaños
        └── Torneos/          # Lógica algorítmica de fixtures, llaves y tablas
            ├── Endpoints/    # Mapeo de rutas (MapGroup / Minimal APIs)
            ├── Models/       # Modelos de dominio y DTOs de request/response
            ├── Repositories/ # Consultas SQL y operaciones con Dapper
            └── Services/     # Lógica de sorteos, validaciones y cálculos
