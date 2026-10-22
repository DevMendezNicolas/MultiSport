using System.Text;
using System.Threading.RateLimiting;
using Dapper;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using MultiSport.Api.Common;
using MultiSport.Api.Features.Auth.Endpoints;
using MultiSport.Api.Features.Auth.Repositories;
using MultiSport.Api.Features.Auth.Services;
using MultiSport.Api.Features.Bookings.Endpoints;
using MultiSport.Api.Features.Bookings.Repositories;
using MultiSport.Api.Features.Bookings.Services;
using MultiSport.Api.Features.Courts.Endpoints;
using MultiSport.Api.Features.Courts.Repositories;
using MultiSport.Api.Features.Courts.Services;
using MultiSport.Api.Features.System;
using MultiSport.Database.Migrations;
using Serilog;

// Configuración global de mapeo de Dapper (snake_case de PostgreSQL a PascalCase de C#)
DefaultTypeMap.MatchNamesWithUnderscores = true;
SqlMapper.AddTypeHandler(new TimeOnlyTypeHandler());
SqlMapper.AddTypeHandler(new DateOnlyTypeHandler());

var builder = WebApplication.CreateBuilder(args);

// Configuración de Logging Estructurado con Serilog
builder.Host.UseSerilog((context, services, configuration) =>
{
    configuration
        .ReadFrom.Configuration(context.Configuration)
        .Enrich.FromLogContext()
        .Enrich.WithProperty("Application", "MultiSport.Api")
        .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] [{CorrelationId}] {Message:lj}{NewLine}{Exception}");
});

// Configuración de JSON para Minimal APIs (soporte flexible para TimeOnly HH:mm / HH:mm:ss)
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new TimeOnlyJsonConverter());
});

// Configuración de Base de Datos y Factoría Scoped
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
                       ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

if (string.IsNullOrWhiteSpace(connectionString) || connectionString.Contains("REPLACE_WITH_"))
{
    throw new InvalidOperationException(
        "La cadena de conexión 'DefaultConnection' no está configurada o contiene un valor placeholder. " +
        "Configure una cadena válida mediante 'dotnet user-secrets' o variable de entorno.");
}

builder.Services.AddScoped<IDbConnectionFactory>(_ => new NpgsqlConnectionFactory(connectionString));
builder.Services.AddDatabaseMigrations(connectionString);

// Registro de Capas de Features (Auth y Courts)
builder.Services.AddScoped<IAuthRepository, AuthRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IEmailService, DevelopmentEmailService>();
builder.Services.AddScoped<ICourtRepository, CourtRepository>();
builder.Services.AddScoped<ICourtService, CourtService>();
builder.Services.AddScoped<IBookingRepository, BookingRepository>();
builder.Services.AddScoped<IBookingService, BookingService>();

// Configuración de Autenticación con JWT Bearer
var jwtSecret = builder.Configuration["Jwt:Secret"] 
                ?? throw new InvalidOperationException("Jwt:Secret no configurado.");

if (string.IsNullOrWhiteSpace(jwtSecret) || jwtSecret.StartsWith("REPLACE_WITH_") || Encoding.UTF8.GetByteCount(jwtSecret) < 32)
{
    throw new InvalidOperationException(
        "La clave 'Jwt:Secret' no está configurada adecuadamente o no cumple con el requisito de entropía mínima (al menos 32 bytes / 256 bits). " +
        "Configure una clave segura mediante 'dotnet user-secrets' o variable de entorno.");
}
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "MultiSport.Api";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "MultiSport.Client";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// Configuración de CORS estricto con credenciales para el Frontend
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
    ?? ["http://localhost:5173", "https://app.multisport.com"];

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Configuración de Rate Limiting defensivo para endpoints sensibles
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.ContentType = "application/problem+json";
        var problemDetails = new ProblemDetails
        {
            Status = StatusCodes.Status429TooManyRequests,
            Title = "Demasiadas peticiones",
            Detail = "Ha superado el límite de intentos permitidos. Por favor, espere un minuto antes de reintentar.",
            Instance = context.HttpContext.Request.Path
        };
        await context.HttpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken: token);
    };

    options.AddPolicy("auth-rate-limit", httpContext =>
    {
        var clientIp = httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault()
            ?? httpContext.Connection.RemoteIpAddress?.ToString()
            ?? "unknown";

        return RateLimitPartition.GetSlidingWindowLimiter(
            partitionKey: clientIp,
            factory: _ => new SlidingWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                SegmentsPerWindow = 3,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            });
    });
});

// Manejo Centralizado de Excepciones RFC 7807
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

// Registro de Validadores de FluentValidation
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// Chequeos de Salud Operativa
builder.Services.AddHealthChecks();

// Configuración de OpenAPI / Swagger con soporte para JWT Bearer
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "MultiSport API",
        Version = "v1",
        Description = "API del backend para gestión integral de complejos deportivos y turnos."
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Ingrese su token JWT en el formato: Bearer {token}"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Pipeline de Middlewares
app.UseMiddleware<CorrelationIdMiddleware>();
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseExceptionHandler();
app.UseSerilogRequestLogging();

app.UseCors("FrontendPolicy");
app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "MultiSport API v1");
        options.RoutePrefix = "swagger";
    });

    // Ejecutar migraciones automáticamente en entorno de desarrollo
    app.Services.ApplyDatabaseMigrations();
}

// Endpoint de Salud Operativa
app.MapHealthChecks("/health")
   .WithTags("Health");

// Grupo de Endpoints Versionados (/api/v1/)
var apiV1 = app.MapGroup("/api/v1");

// Módulos Vertical Slice
apiV1.MapSystemEndpoints();
apiV1.MapAuthEndpoints();
apiV1.MapCourtsEndpoints();
apiV1.MapBookingEndpoints();

app.Run();
