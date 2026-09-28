# MultiSport

> Plataforma web para la gestión integral de canchas, control operativo de turnos y generación algorítmica de eventos y torneos en complejos deportivos.

![.NET](https://img.shields.io/badge/.NET_8-C%23_Minimal_APIs-512BD4?style=flat&logo=dotnet)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=flat&logo=postgresql)
![Dapper](https://img.shields.io/badge/ORM-Dapper-red?style=flat)
![React](https://img.shields.io/badge/Frontend-React_18_%2B_Vite-61DAFB?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat&logo=typescript)
![JWT](https://img.shields.io/badge/Security-JWT-black?style=flat&logo=jsonwebtokens)

---

## 📌 Visión del Producto

**MultiSport** es una solución de software orientada a digitalizar, agilizar y profesionalizar la administración interna de complejos deportivos. 

Diseñado con un enfoque comercial (*product-ready*), el sistema resuelve el ciclo operativo diario de reservas, la administración de espacios físicos y aborda como núcleo algorítmico la generación, sorteo y gestión interactiva de fixtures, tablas y llaves de torneos.

---

## 🚀 Módulos Funcionales

### 🏟️ Infraestructura y Canchas
- **Modelo dinámico:** Inicialización en blanco con alta y parametrización de canchas según demanda.
- **Multidisciplina:** Configuración de disciplinas (fútbol 5/7/11, pádel, tenis, básquet, etc.) y soporte para superficies compartidas entre distintos deportes.
- **Políticas de disponibilidad:** Rangos operativos y esquemas tarifarios base.

### 📅 Control Operativo de Turnos
- **Tipos de reserva:** Turnos eventuales y turnos fijos de frecuencia semanal.
- **Gestión financiera manual:** Control administrativo de cobros y señas (efectivo, transferencias).
- **Políticas de cancelación:** Penalización directa mediante retención de seña.
- **Prevención de colisiones:** Control de concurrencia y solapamiento garantizado a nivel motor de base de datos (`Exclusion Constraints` en PostgreSQL).
- **Borrado Lógico:** Soporte para auditoría mediante trazabilidad con `deleted_at`.

### 🏆 Motor de Torneos y Eventos
- **Eventos sociales y corporativos:** Bloqueo de franjas y canchas para cumpleaños y eventos recreativos.
- **Formatos de competencia:**
  - **Liga (Round-Robin):** Rueda simple o ida y vuelta.
  - **Playoffs:** Cuadros de eliminación directa con llaves jerárquicas interactivas.
  - **Combinado:** Fase regular de grupos con clasificación a llaves eliminatorias.
- **Automatización:**
  - Registro de planteles, listas de buena fe y jugadores.
  - Sorteo algorítmico de fixtures con flexibilidad para ajustes manuales.
  - Asignación manual de cruces a las franjas horarias y canchas del complejo.
  - Cómputo dinámico de tablas de posiciones (puntos, goles, diferencia y desempates) y progresión automática de ganadores.

---

## 🛠️ Stack Tecnológico

| Capa / Ecosistema | Tecnología | Justificación |
| :--- | :--- | :--- |
| **Backend Framework** | .NET (C#) | Minimal APIs de alto rendimiento estructuradas por Vertical Slices |
| **Acceso a Datos** | Dapper | Micro-ORM de alto rendimiento para consultas SQL nativas y transacciones |
| **Motor de Base de Datos** | PostgreSQL | Persistencia relacional, soporte nativo de rangos (`tstzrange`) e integridad transaccional |
| **Migraciones de BD** | FluentMigrator | Ensamblado desacoplado para versionado de esquemas SQL de forma declarativa |
| **Validaciones** | FluentValidation | Validación robusta de DTOs antes de interactuar con el dominio o la base |
| **Manejo de Errores** | `IExceptionHandler` (RFC 7807) | Middleware nativo para serialización estándar de errores en `ProblemDetails` |
| **Frontend Framework** | React + Vite | SPA modular con tiempo de compilación y recarga casi instantáneos |
| **Tipado Frontend** | TypeScript | Tipado estricto que asegura sincronía con los contratos DTO del backend |
| **Estilos y Componentes** | Tailwind CSS + shadcn/ui | UI accesible y personalizable orientada a paneles de control comerciales |
| **Iconografía y Animación**| Lucide React + Framer Motion | Iconografía sobria y micro-interacciones en la agenda y llaves de torneos |
| **Gestión de Estado Servidor**| TanStack Query (React Query) | Cacheo inteligente, reintentos y sincronización asíncrona de datos |
| **Documentación** | OpenAPI / Swagger | Exploración interactiva y testeo directo de endpoints HTTP |

---

## 🤝 Contribución y Flujo de Trabajo

Para conocer el modelo de ramas (GitFlow simplificado), convenciones de commits y el protocolo de Pull Requests, consulta nuestra [Guía de Contribución](CONTRIBUTING.md).

---

## 🏛️ Arquitectura del Sistema

La solución está desacoplada en proyectos modulares, organizando la API bajo el patrón **Vertical Slice / Feature Folders**:

```text
MultiSport/
├── src/
│   ├── MultiSport.Api/                  # Host web y Minimal APIs (.NET 8)
│   │   ├── Common/                      # Middlewares, IExceptionHandler, Helpers
│   │   └── Features/                    # Vertical Slice Architecture (100% en inglés)
│   │       ├── Auth/                    # Autenticación, generación y validación de tokens JWT
│   │       ├── Courts/                  # Canchas: endpoints, models, Dapper repositories
│   │       ├── Bookings/                # Turnos: validaciones de solapamiento GiST, señas y agenda
│   │       ├── Events/                  # Bloqueo de turnos para cumpleaños y eventos sociales
│   │       └── Tournaments/             # Sorteos algorítmicos, tablas de posiciones y playoffs
│   ├── MultiSport.Database.Migrations/  # Proyecto ClassLib con migraciones de FluentMigrator
│   └── client/                          # SPA en React 18+ Vite + TypeScript
│       ├── src/
│       │   ├── components/              # Primitivas shadcn/ui y feedback global
│       │   ├── features/                # Módulos de negocio (api, components, types, index.ts)
│       │   ├── hooks/                   # Hooks transversales de UI
│       │   ├── lib/                     # Cliente Axios centralizado y utilidades cn()
│       │   └── routes/                  # Enrutamiento protegido de la aplicación
│       └── package.json
└── docker-compose.yml                   # Contenedor para instancia local de PostgreSQL
```
