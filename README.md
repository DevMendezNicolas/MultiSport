![.NET](https://img.shields.io/badge/.NET-C%23_Minimal_APIs-512BD4?style=flat&logo=dotnet)
![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=flat&logo=react)
![Dapper](https://img.shields.io/badge/Data-Dapper-red?style=flat)
![Database](https://img.shields.io/badge/Database-PostgreSQL_%7C_MySQL-336791?style=flat)
![Auth](https://img.shields.io/badge/Security-JWT-black?style=flat&logo=jsonwebtokens)

---

## 📌 Visión del Producto

**MultiSport** es una plataforma web integral diseñada para digitalizar, optimizar y profesionalizar la operativa diaria de complejos deportivos. 

Si bien su desarrollo inicial se enmarca en la cátedra de **Algoritmos y Estructuras de Datos III**, el proyecto está concebido bajo estándares de ingeniería de software comercial con visión de producto productivo (*go-to-market*). Centraliza la administración de espacios físicos, la agenda de reservas y resuelve de forma algorítmica y automatizada la organización de eventos y torneos competitivos.

---

## 🚀 Módulos y Funcionalidades

### 🏟️ Gestión Dinámica de Espacios y Canchas
- **Modelo flexible:** El complejo se inicializa en blanco, permitiendo parametrizar la infraestructura desde cero.
- **Multidisciplina y uso compartido:** Configuración de canchas por disciplina (fútbol 5/7/11, pádel, tenis, básquet, etc.) con soporte para espacios híbridos que alternan diferentes deportes en una misma superficie.
- **Tarifas y disponibilidad:** Definición de esquemas de precios, franjas horarias y reglas de uso.

### 📅 Control Operativo de Turnos
- **Modalidades de reserva:** Coexistencia de turnos eventuales y reservas fijas semanales.
- **Gestión financiera manual:** Registro administrativo de pagos y cobro de señas (efectivo, transferencias bancarias).
- **Políticas de cancelación:** Control de penalidades mediante retención automática de seña.
- **Prevención de colisiones:** Motor de validación horaria para asegurar solapamiento cero entre turnos, reservas fijas y eventos.

### 🏆 Motor Algorítmico de Eventos y Torneos
- **Eventos sociales y corporativos:** Bloqueo integral de canchas e instalaciones para cumpleaños, exhibiciones y jornadas recreativas.
- **Formatos de competencia configurables:**
  - **Liga (Round-Robin):** Todos contra todos a rueda simple o ida y vuelta.
  - **Playoffs:** Cuadros de eliminación directa con generación de llaves jerárquicas.
  - **Mixto:** Fase de grupos clasificatoria integrada a cuadro eliminatorio final.
- **Automatización algorítmica:**
  - Padrón de equipos, planteles y listas de buena fe.
  - Generación y sorteo automatizado de fixtures con soporte para reordenamiento y ajustes manuales.
  - Asignación flexible de cruces a turnos y canchas disponibles del complejo.
  - Cómputo de resultados en tiempo real: cálculo dinámico de tablas de posiciones (puntos, diferencia de gol, criterios de desempate) y avance automático en cuadros eliminatorios.

---

## 🛠️ Stack Tecnológico

| Componente | Tecnología | Rol / Justificación |
| :--- | :--- | :--- |
| **Backend** | .NET (C#) | Minimal APIs orientadas a baja latencia, escalabilidad y alto rendimiento |
| **Acceso a Datos** | Dapper | Micro-ORM de alto rendimiento para consultas SQL precisas y control transaccional |
| **Base de Datos** | PostgreSQL / MySQL | Persistencia relacional, integridad referencial y atomicidad |
| **Seguridad** | JWT (JSON Web Tokens) | Autenticación y autorización para la sesión de administración |
| **Frontend** | React | SPA modular y reactiva para el panel operativo del complejo |

---

## 🏛️ Arquitectura del Backend

El backend está estructurado mediante **Vertical Slice / Feature Folders**, priorizando la cohesión del dominio sobre la dispersión en capas técnicas tradicionales:

```text
src/
└── MultiSport.Api/
    ├── Common/               # Middlewares, filtros y utilidades transversales
    ├── Infrastructure/       # Gestión de conexiones de datos (Dapper) y migraciones
    └── Features/
        ├── Auth/             # Autenticación, generación y validación de tokens JWT
        ├── Canchas/          # Endpoints, DTOs, Repository y Service de canchas
        ├── Turnos/           # Reglas de solapamiento, señas y grilla operativa
        ├── Eventos/          # Bloqueo de instalaciones para eventos sociales
        └── Torneos/          # Lógica algorítmica de fixtures, llaves y tablas
            ├── Endpoints/    # Mapeo de rutas (MapGroup / Minimal APIs)
            ├── Models/       # Modelos de dominio y DTOs de entrada/salida
            ├── Repositories/ # Operaciones SQL optimizadas con Dapper
            └── Services/     # Lógica algorítmica de sorteos, llaves y cálculos
