using Azure;
using BLL;
using BLL.Hubs;
using DTO;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using API.Infrastructure.Email;
using Microsoft.AspNetCore.SignalR;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.OpenApi.Models;
using System.Security.Claims;
using System.Text.Json;
using System.Text;
using Resend;
using UTL;

var builder = WebApplication.CreateBuilder(args);

#region Configuración para usar appsettings
var configBuilder = new ConfigurationBuilder()
    .SetBasePath(builder.Environment.ContentRootPath)
    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
    .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true, reloadOnChange: true);
#endregion

#region Servicios de Autenticación JWT
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ClockSkew = TimeSpan.Zero,
            ValidIssuer = System.Configuration.ConfigurationManager.AppSettings["JwtIssuer"],
            ValidAudience = System.Configuration.ConfigurationManager.AppSettings["JwtAudience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(System.Configuration.ConfigurationManager.AppSettings["JwtKey"] ?? ""))
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                // ✅ Para SignalR: permitir token por query string
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;

                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hub/monitorOSHub"))
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            },
        };
    });
#endregion

#region Servicios Base
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    // Definir el tipo de contenido para archivos binarios (para permitir cargar archivos con Swagger)
    options.MapType<IFormFile>(() => new OpenApiSchema
    {
        Type = "string",
        Format = "binary"
    });
});
#endregion

#region SignalR Configuration
builder.Services.AddSingleton<IUserIdProvider, EmailUserIdProvider>();
builder.Services.AddSignalR();
#endregion

#region SiganlR Notificador Business Logic Layer (BLL) Services
builder.Services.AddScoped<BLL_Notificador>();
builder.Services.AddScoped<BLL_ChatIA>();
builder.Services.AddScoped<BLL_ItemOrdenServicio>();
builder.Services.AddScoped<BLL_OrdenServicio>();
#endregion

#region Email Service Configuration (Resend) usando App.config
// Tomar credenciales de AppSettings (App.config)
var resendApiKey = System.Configuration.ConfigurationManager.AppSettings["Resend.ApiKey"];
var resendFrom = System.Configuration.ConfigurationManager.AppSettings["Resend.From"];
var resendFromName = System.Configuration.ConfigurationManager.AppSettings["Resend.FromName"];

// Cliente Resend
builder.Services.AddOptions();
builder.Services.AddHttpClient<ResendClient>();
builder.Services.Configure<ResendClientOptions>(o =>
{
    o.ApiToken = resendApiKey ?? string.Empty;
});
builder.Services.AddTransient<IResend, ResendClient>();

// Wrapper (IEmailSender) y settings tipados
builder.Services.Configure<ResendSettings>(o =>
{
    o.ApiKey = resendApiKey ?? string.Empty;
    o.From = resendFrom ?? string.Empty;
    o.FromName = string.IsNullOrWhiteSpace(resendFromName) ? "IAM Suit" : resendFromName;
    o.ReplyTo = null; // no incluir ReplyTo
});
builder.Services.AddScoped<IEmailSender, ResendEmailSender>();
#endregion

#region CORS Configuration
// Lee de AppSettings y también de variables de entorno (Render/Azure: Application settings)
var raw = System.Configuration.ConfigurationManager.AppSettings["ClientURLs"]
          ?? builder.Configuration["ClientURLs"]; // e.g. "https://iam-demo.netlify.app, http://localhost:5173"

var clientUrls = raw?
    .Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries)
    .Select(u => u.Trim())
    .Where(u => !string.IsNullOrWhiteSpace(u))
    .Distinct()
    .ToArray() ?? Array.Empty<string>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontendDev", policy =>
    {
        if (clientUrls.Length > 0)
        {
            policy.WithOrigins(clientUrls)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials()
                  .WithExposedHeaders("Content-Type", "Authorization", "Set-Cookie", "accesToken");
        }
        else
        {
            // Fallback en demo: permitir todo si aún no tienes configurado ClientURLs
            policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
        }
    });
});
#endregion

var app = builder.Build();
// Cookies cross-site (Netlify -> Azure App Service)
app.UseCookiePolicy(new CookiePolicyOptions
{
    MinimumSameSitePolicy = SameSiteMode.None,
    Secure = CookieSecurePolicy.Always
});


#region Middleware Pipeline Configuration
app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();

app.UseCors("AllowFrontendDev");

// Healthcheck simple para validar despliegue
app.MapGet("/health", () => Results.Json(new { status = "ok" })).WithTags("Health");

// Middleware personalizado para renovación de tokens
app.Use(async (context, next) =>
{
    await next();

    if (context.Response.StatusCode == 401 &&
        context.Request.Cookies.TryGetValue("refreshToken", out var refreshToken))
    {
        // Aquí puedes poner tu lógica de validación del refreshToken
        // por ejemplo:

        var bllSesion = new BLL_Sesion();
        var bllUsuario = new BLL_Usuario();
        var cipher = new UTL_Cipher();

        // Extraer el userId desde el JWT vencido si lo deseas (opcional)
        var authHeader = context.Request.Headers["Authorization"].ToString();
        var token = authHeader.StartsWith("Bearer ") ? authHeader.Substring(7) : null;

        var handler = new JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(token);
        var userId = jwtToken.Claims.FirstOrDefault(c =>
            c.Type == ClaimTypes.NameIdentifier || c.Type == "id")?.Value;

        DTO_Sesion sesion = new DTO_Sesion
        {
            RefreshToken = refreshToken,
            ID_Usuario = Convert.ToInt32(userId)
        };

        var respuesta = bllSesion.validarRefreshToken(sesion);

        if (respuesta.TipoRespuesta)
        {
            sesion = (DTO_Sesion)respuesta.Resultado[0];
            DTO_Usuario usuario = new() { ID_Usuario = sesion.ID_Usuario };
            usuario = (DTO_Usuario)bllUsuario.obtenerUsuarioPorId(usuario).Resultado[0];

            var nuevoToken = cipher.generarAccessToken(usuario);

            context.Response.StatusCode = 403;
            context.Response.ContentType = "application/json";
            context.Response.Headers["Access-Control-Allow-Credentials"] = "true";
            context.Response.Headers["Access-Control-Expose-Headers"] = "Content-Type, Authorization, accesToken";

            var result = JsonSerializer.Serialize(new
            {
                tipoRespuesta = true,
                mensaje = "Token renovado automáticamente",
                resultado = new[] { new { accesToken = nuevoToken } }
            });

            await context.Response.WriteAsync(result);
        }
    }
});

app.UseAuthentication();
app.UseAuthorization();
app.UseCookiePolicy();
#endregion

#region Endpoint Mapping
app.MapHub<MonitorOSHub>("/hub/monitorOSHub");
app.MapControllers();
#endregion

app.Run();