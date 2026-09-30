using Dapper;
using FluentValidation;
using Microsoft.OpenApi.Models;
using MultiSport.Api.Common;
using MultiSport.Api.Features.System;
using Serilog;

// Configuración global de mapeo de Dapper (snake_case de PostgreSQL a PascalCase de C#)
DefaultTypeMap.MatchNamesWithUnderscores = true;

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

// Configuración de Base de Datos y Factoría Scoped
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
                       ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddScoped<IDbConnectionFactory>(_ => new NpgsqlConnectionFactory(connectionString));

// Manejo Centralizado de Excepciones RFC 7807
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

// Registro de Validadores de FluentValidation
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// Chequeos de Salud Operativa
builder.Services.AddHealthChecks();

// Configuración de OpenAPI / Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "MultiSport API",
        Version = "v1",
        Description = "API del backend para gestión integral de complejos deportivos y torneos."
    });
});

var app = builder.Build();

// Pipeline de Middlewares
app.UseMiddleware<CorrelationIdMiddleware>();
app.UseExceptionHandler();
app.UseSerilogRequestLogging();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "MultiSport API v1");
        options.RoutePrefix = "swagger";
    });
}

// Endpoint de Salud Operativa
app.MapHealthChecks("/health")
   .WithTags("Health");

// Grupo de Endpoints Versionados (/api/v1/)
var apiV1 = app.MapGroup("/api/v1");

// Módulos Vertical Slice
apiV1.MapSystemEndpoints();

app.Run();
