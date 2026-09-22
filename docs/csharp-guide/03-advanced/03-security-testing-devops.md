# 03. 보안, 테스트, 배포 운영 (DevOps)

> **소속**: [🔴 Part 3. 고급](../README.md#part-3-고급--고성능-대규모-아키텍처-운영)  
> **핵심 키워드**: JWT, Authentication, Authorization, xUnit, WebApplicationFactory, Serilog, Docker

---

## 1. 인증 & 인가 (JWT & Policy 기반 권한 관리)

ASP.NET Core는 표준화된 인증/인가 미들웨어를 제공합니다.

### (1) `Program.cs`에서 JWT Bearer 설정
```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });

builder.Services.AddAuthorization(options =>
{
    // 역할 기반 정책 정의
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
});
```

### (2) Controller에 인가 적용
```csharp
[Authorize] // 로그인한 사용자만 접근 가능
[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    [Authorize(Policy = "AdminOnly")] // 관리자 권한만 실행 가능
    [HttpDelete("users/{id}")]
    public IActionResult DeleteUser(int id) => Ok();
}
```

---

## 2. 자동화 테스트 체계

### (1) xUnit + FluentAssertions 기반 단위 테스트 (Unit Test)
```csharp
public class UserServiceTests
{
    [Fact]
    public async Task CreateUser_WhenNameIsEmpty_ThrowsArgumentException()
    {
        // Arrange (준비)
        var service = new UserService();
        var request = new CreateUserRequest("", "valid@email.com");

        // Act & Assert (실행 및 검증)
        await Assert.ThrowsAsync<ArgumentException>(() => service.CreateUserAsync(request));
    }
}
```

### (2) `WebApplicationFactory`를 활용한 E2E 통합 테스트 (Integration Test)
서버를 실제 네트워크 포트에 띄우지 않고, 인메모리 테스트 서버 파이프라인에서 실제 HTTP 요청을 검증합니다.
```csharp
public class UsersApiTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task GetAllUsers_ReturnsSuccessStatusCode()
    {
        var response = await _client.GetAsync("/api/users");
        response.EnsureSuccessStatusCode(); // 200 OK 검증
    }
}
```

---

## 3. 구조화된 로깅 & 관측성 (Serilog & OpenTelemetry)

### (1) Serilog를 통한 JSON 로깅
텍스트 로그 대신 엘라스틱서치(ELK)나 AWS CloudWatch에서 필터링할 수 있는 JSON 구조화 로그를 남깁니다.
```csharp
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("logs/app.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();
```

---

## 4. Docker 컨테이너 패키징

.NET 10 애플리케이션을 배포하기 위한 표준 멀티 스테이지 Dockerfile입니다.

```dockerfile
# 1. 빌드 스테이지 (SDK 이미지)
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["csharp-hello-world.csproj", "./"]
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# 2. 런타임 스테이지 (초경량 ASP.NET Core 런타임 이미지)
FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS final
WORKDIR /app
EXPOSE 8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "csharp-hello-world.dll"]
```
