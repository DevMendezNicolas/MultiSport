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
