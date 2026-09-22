# 02. ASP.NET Core 핵심 웹 아키텍처

> **소속**: [🟡 Part 2. 중급](../README.md#part-2-중급--실무-웹-백엔드-핵심-메커니즘)  
> **핵심 키워드**: Dependency Injection (DI), Middleware, ApiController, ControllerBase, ProblemDetails

---

## 1. 의존성 주입 (DI) 수명 주기 완전 정복

ASP.NET Core는 프레임워크 자체에 고성능 경량 IoC 컨테이너가 기본 내장되어 있습니다. `Program.cs`에서 서비스 인터페이스와 구현체를 등록합니다.

```csharp
// Program.cs
builder.Services.AddScoped<IUserService, UserService>();
```

### 3가지 수명 주기(Lifetime) 비교

```
[ Transient ]  요청마다 항상 새로운 객체 생성
요청 A ──▶ [객체 1]
요청 A ──▶ [객체 2]

[ Scoped ]     하나의 HTTP 요청 범위 내에서 동일한 객체 공유 (요청 끝나면 자동 폐기)
HTTP 요청 1 ──▶ [객체 1] ──▶ 컨트롤러, 서비스, 리포지토리가 모두 [객체 1] 공유
HTTP 요청 2 ──▶ [객체 2]

[ Singleton ]  서버가 켜져 있는 동안 단 1개의 객체만 영구 유지
모든 요청 ──▶ [단 하나의 객체]
```

| 수명 주기 | 등록 메서드 | 적합한 대상 | 주의사항 |
| :--- | :--- | :--- | :--- |
| **Transient** | `AddTransient` | 가벼운 유틸리티, 상태가 없는 헬퍼 클래스 | 남발 시 GC 부하 증가 |
| **Scoped** | `AddScoped` | **DB 컨텍스트(`DbContext`), 비즈니스 서비스(`UserService`), 리포지토리** | **실무 90% 이상 사용** |
| **Singleton** | `AddSingleton` | 인메모리 캐시, 시스템 설정, 외부 연결 풀(HttpClientFactory) | 멀티스레드 동시성 이슈 주의 |

> ⚠️ **캡티브 디펜던시(Captive Dependency) 경고**: Singleton 객체의 생성자에 Scoped 객체(예: DbContext)를 주입하면, DbContext가 영원히 살아남아 메모리 누수와 동시성 에러가 발생합니다. ASP.NET Core는 개발 환경에서 이를 자동으로 감지하여 예외를 발생시킵니다.

---

## 2. 미들웨어 (Middleware) 파이프라인

미들웨어는 HTTP 요청이 들어왔을 때부터 응답이 나갈 때까지 통과하는 양방향 파이프라인(Chain of Responsibility)입니다. (Spring의 Filter + Interceptor)

```
클라이언트 요청
     │
     ▼
[ 1. 글로벌 예외 처리 미들웨어 ]  (try { await next(); } catch { ... })
     │
     ▼
[ 2. 정적 파일 서빙 (UseStaticFiles) ] ── (정적 파일이면 여기서 즉시 응답 반환!)
     │
     ▼
[ 3. 라우팅 & 인증/인가 (UseAuthorization) ]
     │
     ▼
[ 4. 컨트롤러 액션 실행 ]
     │
     ▼
클라이언트로 응답 전달
```

### 실무 커스텀 미들웨어 작성 예시:
```csharp
public class GlobalExceptionHandlerMiddleware(RequestDelegate next, ILogger<GlobalExceptionHandlerMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context); // 다음 파이프라인으로 요청 전달
        }
        catch (ArgumentException ex)
        {
            // 입력값 검증 에러는 400 Bad Request
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            await context.Response.WriteAsJsonAsync(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            // 예상치 못한 서버 에러는 500 Internal Server Error
            logger.LogError(ex, "서버 오류 발생");
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            await context.Response.WriteAsJsonAsync(new { error = "서버 내부 오류가 발생했습니다." });
        }
    }
}
```

---

## 3. 컨트롤러 (`[ApiController]`) 표준 패턴

```csharp
[ApiController]
[Route("api/[controller]")] // URL: /api/users
public class UsersController(IUserService userService) : ControllerBase
{
    // 1. 목록 조회: GET /api/users
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserResponse>>> GetAll()
    {
        var users = await userService.GetAllUsersAsync();
        return Ok(users); // 200 OK
    }

    // 2. 단건 조회: GET /api/users/{id}
    [HttpGet("{id:int}")]
    public async Task<ActionResult<UserResponse>> GetById(int id)
    {
        var user = await userService.GetUserByIdAsync(id);
        if (user == null) return NotFound(new { message = "사용자를 찾을 수 없습니다." }); // 404
        return Ok(user);
    }

    // 3. 신규 생성: POST /api/users
    [HttpPost]
    public async Task<ActionResult<UserResponse>> Create([FromBody] CreateUserRequest request)
    {
        var created = await userService.CreateUserAsync(request);
        // 201 Created 응답 및 Location 헤더에 새로 생성된 리소스 URL 자동 첨부
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    // 4. 정보 수정: PUT /api/users/{id}
    [HttpPut("{id:int}")]
    public async Task<ActionResult<UserResponse>> Update(int id, [FromBody] UpdateUserRequest request)
    {
        var updated = await userService.UpdateUserAsync(id, request);
        if (updated == null) return NotFound();
        return Ok(updated);
    }

    // 5. 삭제: DELETE /api/users/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await userService.DeleteUserAsync(id);
        if (!success) return NotFound();
        return NoContent(); // 204 No Content
    }
}
```
