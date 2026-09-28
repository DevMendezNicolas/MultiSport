# Seguridad, Gestión de Secretos y Variables de Entorno

Este documento define la política de manejo de credenciales, configuración y variables de entorno para **MultiSport**.

---

## 1. Regla de Oro (Zero Secrets in Git)

Queda estrictamente prohibido versionar credenciales reales, contraseñas de base de datos o claves criptográficas en el repositorio Git.

- Únicamente se versionan archivos de plantilla con valores dummy:
  - `appsettings.example.json` (o sección de ejemplo en la documentación).
  - `.env.example` en la raíz del cliente web.
- Archivos como `.env`, `.env.local` y configuraciones con credenciales locales deben figurar en el `.gitignore`.

---

## 2. Mapa de Variables y Secretos por Entorno

| Variable / Secreto | Entorno Local (Desarrollo) | Entorno Producción / Docker |
| :--- | :--- | :--- |
| **Connection String BD** | `appsettings.Development.json` o `dotnet user-secrets` | Variable de entorno (`ConnectionStrings__DefaultConnection`) |
| **JWT Secret Key** | `dotnet user-secrets` (mínimo 32 caracteres / 256 bits) | Variable de entorno (`Jwt__Key`) |
| **JWT Issuer / Audience** | `appsettings.Development.json` | Variable de entorno (`Jwt__Issuer`, `Jwt__Audience`) |
| **Frontend API URL** | `.env.local` (`VITE_API_URL=http://localhost:5000`) | Inyectado en el build de Vite / contenedor Docker |

---

## 3. Uso de `dotnet user-secrets` en Desarrollo Local

Para evitar modificar accidentalmente `appsettings.json`, inicializar y registrar los secretos en el proyecto de la API:

```bash
cd src/MultiSport.Api
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=multisport_dev;Username=postgres;Password=tu_password_local"
dotnet user-secrets set "Jwt:Key" "ClaveSuperSecretaDeAlMenos32CaracteresDeLargo!"
dotnet user-secrets set "Jwt:Issuer" "MultiSportApi"
dotnet user-secrets set "Jwt:Audience" "MultiSportClient"
```

---

## 4. Parámetros Criptográficos para JWT

Al registrar la autenticación en `Program.cs`:
- La clave debe contar con una entropía de al menos 256 bits (32 caracteres).
- Debe configurarse `ClockSkew = TimeSpan.Zero` para evitar que un token expirado siga siendo aceptado durante la ventana de gracia predeterminada de 5 minutos.
