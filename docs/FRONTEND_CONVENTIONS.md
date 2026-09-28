# Frontend Engineering & UI Guidelines (React + Vite + TypeScript)

Este documento define la arquitectura, convenciones técnicas, estándares de tipado y políticas de interfaz para el desarrollo de la aplicación web cliente de **MultiSport**. El cumplimiento de estas normas es obligatorio para asegurar coherencia, mantenibilidad y calidad comercial en el frontend.

---

## 1. Arquitectura: Feature-Driven Structure

El proyecto no agrupa archivos por tipos técnicos genéricos (`hooks/`, `views/`, `services/` globales). Se organiza por **módulos de negocio (Features)** dentro del directorio `src/features/`.

### Estructura de Directorios
```text
src/
├── assets/                 # SVGs estáticos, logos e iconografía estática
├── components/             # Componentes transversales compartidos
│   ├── ui/                 # Primitivas shadcn/ui (Button, Dialog, Sheet, etc.)
│   └── feedback/           # Skeletons genéricos, ErrorBoundaries
├── features/               # Dominios funcionales del sistema
│   ├── auth/
│   │   ├── api/            # Login, refresh token, sesión
│   │   ├── components/     # LoginForm, ProtectedRoute
│   │   └── types/          # AuthCredentials, UserSession
│   ├── courts/
│   │   ├── api/            # Hooks de React Query (useCourts, useCourtMutations)
│   │   ├── components/     # CourtCard, CourtFormModal, SportBadge
│   │   ├── types/          # Interfaces TypeScript del módulo
│   │   └── index.ts        # Barril público de exportación
│   ├── bookings/
│   │   ├── api/
│   │   ├── components/     # BookingCalendarGrid, BookingDetailSheet, PaymentForm
│   │   └── types/
│   └── tournaments/
│       ├── api/
│       ├── components/     # TournamentBracket, StandingsTable, FixtureList
│       └── types/
├── hooks/                  # Hooks globales no atados a una feature (useDebounce, useMediaQuery)
├── lib/                    # Configuración de librerías externas (axios.ts, utils.ts)
├── routes/                 # Árbol de enrutamiento con react-router-dom
└── App.tsx
```

### Reglas de Aislamiento

* **Autocontención:** Componentes específicos de un dominio (ej. `TournamentBracket`) deben residir exclusivamente en `features/tournaments/components/`.
* **Barriles de exportación (`index.ts`):** Una feature expone al resto de la aplicación únicamente lo indispensable mediante su archivo `index.ts`. No se permiten importaciones que naveguen por la estructura interna de otra feature.

---

## 2. Tipado Estricto con TypeScript

* **Prohibición de `any` y `unknown` no validado:** Queda terminantemente prohibido el uso del tipo `any`.
* **Espejo estricto de DTOs del Backend:** Los modelos de respuesta y petición deben coincidir exactamente con los contratos C# de la API, utilizando `camelCase`:

```typescript
export interface CourtResponse {
  id: string;
  name: string;
  sportType: string;
  hasLighting: boolean;
  hourlyRate: number;
  isActive: boolean;
  createdAt: string; // Formato ISO 8601 UTC
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

* **Manejo de Fechas y Zonas Horarias:** Todas las marcas temporales se reciben y envían a la API en formato UTC (`ISO 8601`). La conversión a hora local se resuelve exclusivamente en la vista mediante helpers de formateo (ej. `date-fns`).

---

## 3. Manejo de Estado del Servidor con TanStack Query

Queda prohibido utilizar la combinación `useEffect` + `useState` para obtener y sincronizar datos del backend.

* **Consultas (`useQuery`):** Se encapsulan en custom hooks con claves descriptivas e inmutables:
```typescript
export const useCourts = () => {
  return useQuery({
    queryKey: ['courts'],
    queryFn: courtsApi.getAll,
    staleTime: 1000 * 60 * 5, // 5 minutos de validez en caché
  });
};
```

* **Mutaciones e Invalidación (`useMutation`):** Toda acción de escritura (`POST`, `PUT`, `DELETE`) debe invalidar las consultas afectadas para mantener la UI sincronizada:
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

* **Renderizado condicional semántico:** Utilizar las propiedades nativas `isLoading`, `isPending`, `isError` y `error` para renderizar esqueletos de carga y estados vacíos o de fallo.

---

## 4. Cliente HTTP Centralizado con Axios

Toda llamada externa se realiza a través de la instancia compartida en `src/lib/axios.ts`:

* **Inyección de JWT (Request Interceptor):** Adjunta de forma automática el header `Authorization: Bearer <token>` cuando existe un token almacenado.
* **Manejo de Errores RFC 7807 (Response Interceptor):**
  * `401 Unauthorized`: Limpia el token y fuerza la redirección al login.
  * `409 Conflict`: Extrae y muestra el mensaje del `ProblemDetails` devuelto por el backend (ej. superposición de turnos).
  * `400 Bad Request`: Procesa el objeto de errores de validación de FluentValidation para mostrarlo en los formularios.

---

## 5. UI, Componentes y Estándares Visuales

* **Cero Emojis:** Queda prohibido el uso de emojis en botones, títulos, insignias o tarjetas.
* **Iconografía Profesional:** Toda iconografía debe implementarse mediante **Lucide React**, estandarizando el trazo (`strokeWidth={1.75}` o `2`) y tamaños proporcionales (`size={16}` para botones, `size={20}` para navegación).
* **shadcn/ui y Utilidad `cn()`:**
  * Los componentes se agregan mediante CLI en `src/components/ui/`.
  * La composición de estilos condicionales debe realizarse obligatoriamente con la función helper `cn(...)` (`clsx` + `tailwind-merge`).

* **Micro-interacciones y Animación:**
  * Emplear **Framer Motion** para transiciones fluidas en modales, despliegue de paneles laterales (*Sheets*) y animación de llaves en los cuadros de torneos.
  * Implementar **Sonner** para toasts de confirmación, advertencia y fallo de red.

* **Skeletons obligatorios:** Tablas, calendarios y tarjetas deben implementar componentes `<Skeleton />` animados durante los tiempos de carga; no utilizar spinners aislados en pantalla completa.

---

## 6. Variables de Entorno

* Las variables de entorno para el cliente deben comenzar con el prefijo `VITE_` (ejemplo: `VITE_API_BASE_URL`).
* Debe mantenerse un archivo `.env.example` versionado en el repositorio con las claves requeridas sin valores sensibles.
* El archivo `.env.local` debe estar estrictamente ignorado por Git en el `.gitignore`.
