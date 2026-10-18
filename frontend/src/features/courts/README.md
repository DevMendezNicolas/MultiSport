# Módulo Frontend de Canchas (Courts Feature)

Este directorio contiene la implementación de la interfaz de usuario y la gestión del estado cliente para el **Módulo de Canchas** de **MultiSport**, desarrollado con **React 18+**, **Vite**, **TypeScript**, **Tailwind CSS**, **shadcn/ui** y **TanStack Query**.

Para la especificación completa de arquitectura, contratos de datos y reglas de negocio, consulta el documento oficial:
[Convenciones del Módulo de Canchas](file:///c:/Dev/MultiSport/docs/COURTS_CONVENTIONS.md).

---

## Estructura del Módulo

```text
frontend/src/features/courts/
├── api/
│   └── courtsApi.ts             # Llamadas HTTP con cliente Axios centralizado (@/lib/axios)
├── hooks/
│   └── useCourts.ts             # Custom hooks con TanStack Query (queries y mutaciones)
├── components/
│   ├── CreateCourtForm.tsx      # Formulario reactivo de alta de cancha
│   ├── EditCourtModal.tsx       # Modal de edición con detección de cambios sin guardar
│   ├── PricingTiersEditor.tsx   # Editor dinámico de franjas horarias y detección de colisiones
│   ├── CourtImagePreview.tsx    # Componente visual para previsualización dinámica
│   └── CourtVisualSystem.ts     # Resolución determinística de fotografías según deporte y piso
├── pages/
│   └── CourtsManagementPage.tsx # Vista principal con métricas, altas y lista de canchas
├── types/
│   └── index.ts                 # Contratos TypeScript sincronizados 1:1 con DTOs de C#
└── index.ts                     # Barrel export con las dependencias públicas del módulo
```

---

## Pautas Técnicas y de Ergonomía UI

1. **Gestión de Estado Servidor:**
   - La obtención y sincronización de datos se realiza exclusivamente con **TanStack Query** (`useCourts`, `useCourt`, `useSports`).
   - Se prohíbe el uso de `useEffect` + `useState` para realizar peticiones al backend.
   - Las mutaciones (`useCreateCourt`, `useUpdateCourt`, `useDeleteCourt`) invalidan la clave `['courts']` en `onSuccess`.
2. **Divulgación Progresiva:**
   - `CreateCourtForm` presenta un modo simple con horarios estándar por defecto (ej. 08:00 a 23:00) y atajos de días (*Lun-Vie*, *Todos*, *Finde*).
   - El modo avanzado despliega `PricingTiersEditor` para configurar franjas tarifarias complejas y diferenciales por deporte.
3. **Detección Visual de Solapamientos:**
   - `PricingTiersEditor` detecta colisiones horarias en el cliente en tiempo real (`useMemo`), advirtiendo al operador con bordes de alerta antes de remitir la solicitud al servidor.
4. **Protección contra Pérdida de Datos en Modales:**
   - `EditCourtModal` captura un snapshot JSON del formulario al cargarse; si el usuario intenta cerrarlo habiendo efectuado cambios, se dispara un diálogo de confirmación para evitar descartes involuntarios.
5. **Sistema Visual Determinístico:**
   - `CourtVisualSystem.ts` asigna recursos gráficos locales de alta calidad en función del tipo de superficie y el deporte primario, eliminando la necesidad de subida manual de archivos.
6. **Estándares de Accesibilidad y Ergonomía:**
   - Objetivos táctiles mínimos de 44x44px en botones e interruptores (Ley de Fitts).
   - Tamaño de fuente en inputs `>= 16px` (`text-base`) para prevenir zoom automático no deseado en dispositivos móviles.
   - Retroalimentación mediante notificaciones **Sonner** (`toast.success()`, `toast.error()`).
