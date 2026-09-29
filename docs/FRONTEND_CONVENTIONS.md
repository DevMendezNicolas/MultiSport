# Frontend Engineering & UI Guidelines (React + Vite + TypeScript)

This document establishes the official architectural standards, technical conventions, typing policies, and user interface guidelines for developing the **MultiSport** client web application using **React 18+, Vite, TypeScript, Tailwind CSS, shadcn/ui, and TanStack Query**. Compliance with these rules is mandatory to guarantee consistency, maintainability, and commercial-grade quality.

---

## 1. Architecture: Feature-Driven Structure

The project does not organize files by generic technical folders (global `hooks/`, `views/`, `services/`). Code is organized around **business domains (Features)** inside `frontend/src/features/`.

### Directory Structure
```text
frontend/src/
├── assets/                 # Static SVGs, logos, static assets
├── components/             # Shared cross-cutting components
│   ├── ui/                 # shadcn/ui primitives (Button, Dialog, Sheet, etc.)
│   └── feedback/           # Generic Skeletons, ErrorBoundaries
├── features/               # Functional business modules
│   ├── auth/
│   │   ├── api/            # Login, token refresh, session requests
│   │   ├── components/     # LoginForm, ProtectedRoute
│   │   └── types/          # AuthCredentials, UserSession
│   ├── courts/
│   │   ├── api/            # React Query hooks (useCourts, useCourtMutations)
│   │   ├── components/     # CourtCard, CourtFormModal, SportBadge
│   │   ├── types/          # Feature TypeScript interfaces
│   │   └── index.ts        # Public module barrel export
│   ├── bookings/
│   │   ├── api/
│   │   ├── components/     # BookingCalendarGrid, BookingDetailSheet, PaymentForm
│   │   └── types/
│   └── tournaments/
│       ├── api/
│       ├── components/     # TournamentBracket, StandingsTable, FixtureList
│       └── types/
├── hooks/                  # Global hooks not tied to a single feature (useDebounce, useMediaQuery)
├── lib/                    # External library configs (axios.ts, utils.ts for cn())
├── routes/                 # Routing tree with react-router-dom
└── App.tsx
```

### Isolation Rules

* **Self-containment:** Domain-specific components (e.g., `TournamentBracket`) must reside exclusively inside `features/tournaments/components/`.
* **Barrel Exports (`index.ts`):** A feature only exposes public contracts and entry points through its `index.ts`. Deep imports navigating the internal structure of another feature are forbidden.

---

## 2. Strict Typing with TypeScript

* **Zero `any` and Unguarded `unknown`:** The use of `any` is strictly prohibited.
* **1:1 Mirror of Backend DTOs:** Request and response models must match the C# API contracts exactly, using JavaScript-standard `camelCase`:

```typescript
export interface CourtResponse {
  id: string;
  name: string;
  sportType: string;
  hasLighting: boolean;
  hourlyRate: number;
  isActive: boolean;
  createdAt: string; // ISO 8601 UTC string
}

export interface CreateBookingPayload {
  courtId: string;
  customerName: string;
  customerPhone: string;
  startTimeUtc: string;
  endTimeUtc: string;
  depositAmount: number;
}
```

* **Date & Timezone Handling:** All timestamps are sent and received in UTC (`ISO 8601`). Conversion to the user's local timezone occurs strictly in the presentation layer using utility helpers (e.g., `date-fns`).

---

## 3. Server State Management with TanStack Query

Using `useEffect` + `useState` to fetch and synchronize server data is strictly prohibited.

* **Queries (`useQuery`):** Encapsulated into dedicated custom hooks with descriptive, immutable query keys:
```typescript
export const useCourts = () => {
  return useQuery({
    queryKey: ['courts'],
    queryFn: courtsApi.getAll,
    staleTime: 1000 * 60 * 5, // 5 minutes cache validity
  });
};
```

* **Mutations & Invalidation (`useMutation`):** Write operations (`POST`, `PUT`, `DELETE`) must invalidate related queries on success to keep UI state automatically synchronized:
```typescript
export const useCreateCourt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: courtsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courts'] });
    },
  });
};
```

* **Semantic Conditional Rendering:** Leverage native flags (`isLoading`, `isPending`, `isError`, `error`) to render animated skeletons and error/empty states cleanly.

---

## 4. Centralized HTTP Client with Axios

All remote API calls must go through the shared instance configured in `frontend/src/lib/axios.ts`:

* **JWT & Credentials (Request Interceptor):** Configure `withCredentials: true` to support safe transport of `HttpOnly; SameSite=Strict` session/refresh cookies, and automatically attach the `Authorization: Bearer <token>` header when an in-memory access token is present.
* **RFC 7807 Error Handling (Response Interceptor):**
  * `401 Unauthorized`: Clear in-memory state and trigger login redirection (or initiate a token refresh request).
  * `409 Conflict`: Extract and display the `ProblemDetails` collision message (e.g., booking slot overlap).
  * `400 Bad Request`: Parse the FluentValidation error dictionary to provide direct feedback on forms.

---

## 5. UI, Components & Visual Standards

* **Zero Emojis:** Using emojis in buttons, titles, badges, or cards is prohibited.
* **Professional Iconography:** All icons must be implemented using **Lucide React**, with consistent stroke width (`strokeWidth={1.75}` or `2`) and proportional sizing (`size={16}` for buttons, `size={20}` for navigation).
* **shadcn/ui & the `cn()` Utility:**
  * Components are installed via CLI into `frontend/src/components/ui/`.
  * Conditional styling composition must exclusively use the `cn(...)` helper (`clsx` + `tailwind-merge`).
* **Micro-interactions & Animation:**
  * Use **Framer Motion** for smooth transitions in modals, side panels (*Sheets*), and tournament bracket progressions.
  * Use **Sonner** for confirmation, warning, and network error toasts.
* **Mandatory Skeletons:** Tables, calendars, and cards must display animated `<Skeleton />` placeholders during data loading; full-screen isolated spinners are prohibited.

---

## 6. Environment Variables & Secrets

* Client environment variables must use the `VITE_` prefix (e.g., `VITE_API_BASE_URL`).
* An `.env.example` file must be maintained and tracked in Git as a template with dummy keys.
* `.env.local` must remain strictly gitignored to prevent leaking local ports or sensitive endpoints.

---

## 7. Integridad del Layout y Viewport

* **Cero Desplazamiento Horizontal Involuntario:** Ninguna vista, bajo ninguna resolución (desde 360px de ancho en adelante), debe provocar una barra de desplazamiento horizontal global en la ventana del navegador. El scroll horizontal solo se admite de forma contenida y explícita dentro de componentes específicos (ej. tablas extensas o llaves de torneos).
* **Contenedores de Ancho Adaptable:** Queda prohibido el uso de dimensiones fijas que excedan el ancho de pantallas pequeñas. Todo bloque estructural debe expandirse o contraerse de manera fluida, delimitado únicamente por anchos máximos de lectura en pantallas grandes.
* **Adaptación a Zonas Seguras de Dispositivos Móviles:** En dispositivos con muescas (notches) o barras gestuales inferiores, los elementos anclados a los bordes de la pantalla (barras de navegación, paneles de acción flotantes) no deben quedar tapados por la interfaz nativa del sistema operativo (`env(safe-area-inset-*)`).

---

## 8. Ergonomía y Usabilidad Táctil (Touch UX)

* **Áreas de Interacción Mínimas (Ley de Fitts):** Todo elemento que admita clics o toques (botones de reserva, selectores de horarios, íconos de acción, checkboxes) debe contar con una superficie de contacto suficiente para ser accionado con el pulgar sin riesgo de pulsar elementos vecinos por error (mínimo 44x44px).
* **Prevención de Zoom Forzado en Dispositivos Móviles:** Los campos de formulario deben mantener un tamaño de texto legible (mínimo 16px / `text-base` en móviles) que evite que los navegadores móviles ejecuten ampliaciones automáticas de pantalla al hacer foco en un input.
* **Interacción con Teclados Virtuales:** Los formularios y paneles de carga de datos deben permitir el desplazamiento interno suficiente para que la apertura del teclado del teléfono no oculte el botón de confirmación ni el campo que se está editando.
* **Zona del Pulgar (Thumb Zone):** En interfaces móviles, las acciones principales y frecuentes (confirmar cobro, nuevo turno) deben ubicarse en la mitad inferior de la pantalla para facilitar su alcance sin forzar la mano.

---

## 9. Principios de UX/UI y Carga Cognitiva

* **Claridad del Estado del Sistema (Feedback Inmediato):** Cada acción del usuario debe tener una respuesta visual perceptible. El sistema no debe dejar pantallas estáticas ante operaciones asíncronas; debe reflejar si los datos se están cargando, guardando o si ocurrió un conflicto.
* **Carga Progresiva con Esqueletos (Perceived Performance):** Durante la espera de respuestas del backend, la interfaz debe proyectar la silueta estructural del contenido final en lugar de bloquear la vista con pantallas en blanco o indicadores aislados.
* **Prevención y Recuperación de Errores:** Las acciones críticas o destructivas (cancelación definitiva de reservas, eliminación de equipos de un torneo) deben requerir confirmación explícita previa. Los mensajes de fallo deben redactarse en lenguaje humano claro, explicando qué ocurrió y qué paso tomar para corregirlo.
* **Ley de Hick (Reducción de Opciones Simultáneas):** Evitar saturar al operador con formularios interminables en una sola pantalla. Procesos densos como la configuración inicial de un torneo o la creación de reservas fijas deben dividirse en etapas lógicas y secuenciales.
* **Consistencia Visual y Asequibilidad (Affordance):** Los elementos interactivos deben distinguirse de manera evidente del texto plano mediante peso visual, color o bordes consistentes en toda la aplicación. Los estados inactivos, deshabilitados o bloqueados deben comunicarse con claridad visual.

---

## 10. Comportamiento Funcional según Pantalla

* **Navegación Principal:**
  * En pantallas medianas y grandes, el menú y panel administrativo deben permanecer visibles y accesibles de forma directa.
  * En pantallas móviles, la barra lateral debe colapsar por completo, dando paso a un acceso mediante menú desplegable o panel lateral deslizante sin restar espacio al área de trabajo.
* **Agenda y Grilla de Canchas:**
  * En escritorio, debe ofrecer una vista simultánea de múltiples canchas y bloques horarios en paralelo.
  * En pantallas reducidas, debe reorganizarse para evitar saturación visual, priorizando la selección de una cancha a la vez o permitiendo un desplazamiento horizontal contenido con indicadores claros de horarios.
* **Cuadros de Torneos y Tablas de Posiciones:**
  * Las tablas deben priorizar la información esencial (puntos, posición) en móvil, ocultando métricas accesorias o permitiendo su consulta mediante desplazamiento interno delimitado.
  * Los cuadros de eliminación directa (brackets) deben soportar deslizamiento táctil horizontal fluido con gestos de arrastre nativos.
* **Modales y Formularios Operativos:**
  * En monitores se admiten ventanas modales centradas.
  * En teléfonos, los diálogos de alta o cobro deben transformarse preferentemente en paneles que emergen desde la parte inferior de la pantalla (Drawer / Bottom Sheet), maximizando el espacio útil y facilitando el uso a una sola mano.

---

## 11. Legibilidad y Jerarquía Visual

* **Escala Tipográfica Proporcional:** Los títulos y datos numéricos destacados deben reducir su tamaño en pantallas compactas para evitar saltos de línea innecesarios que rompan la coherencia del diseño.
* **Contraste y Accesibilidad Visual:** Todo texto y control operativo debe superar los niveles mínimos de contraste respecto al fondo para ser legible en condiciones de luz solar directa (uso al aire libre en complejos deportivos).
* **Espaciados Dinámicos:** Los márgenes internos y separaciones entre tarjetas deben ser compactos en dispositivos móviles para no desperdiciar pantalla, y expandirse de forma aireada en pantallas de escritorio.
* **Priorización de la Información:** En resoluciones pequeñas, la interfaz debe mostrar en primer plano los datos críticos para la toma de decisiones inmediata (estado del turno, monto adeudado, horario) y relegar los metadatos secundarios a vistas de detalle o paneles expandibles.

