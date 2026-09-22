using csharp_hello_world.Middlewares;
using csharp_hello_world.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. DI 컨테이너 서비스 등록
builder.Services.AddControllers();
builder.Services.AddScoped<IUserService, UserService>();

var app = builder.Build();

// 2. HTTP 요청 파이프라인 (미들웨어)
app.UseMiddleware<GlobalExceptionHandlerMiddleware>();

app.UseAuthorization();

// 3. 컨트롤러 라우팅 매핑
app.MapControllers();

// 루트(/) 접속 시 API 사용 가이드 및 엔드포인트 목록 안내
app.MapGet("/", () => Results.Ok(new
{
    service = "C# ASP.NET Core Layered API",
    status = "Healthy",
    architecture = "Controller - Service - Model - Middleware",
    currentTime = DateTime.UtcNow,
    endpoints = new object[]
    {
        new { method = "GET", path = "/api/users", description = "전체 사용자 목록 조회" },
        new { method = "GET", path = "/api/users/{id}", description = "사용자 단건 조회 (예: /api/users/1)" },
        new { method = "POST", path = "/api/users", description = "신규 사용자 등록", body = new { name = "이순신", email = "lee@example.com" } },
        new { method = "PUT", path = "/api/users/{id}", description = "사용자 정보 수정", body = new { name = "이순신(수정)", isActive = true } },
        new { method = "DELETE", path = "/api/users/{id}", description = "사용자 삭제" }
    }
}));

app.Run();
