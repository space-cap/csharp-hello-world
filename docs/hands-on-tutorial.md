# 단계별 실습 워크북: 내 손으로 직접 새 기능 추가해보기

> **목표**: 튜토리얼을 눈으로만 보는 것을 넘어, 현재 프로젝트에 **'부서 관리(Department)' CRUD API**를 바닥부터 직접 추가하며 C# 웹 개발의 전체 개발 사이클을 완벽히 체득합니다.

---

## 🛠️ 실습 목표 아키텍처

우리가 구축할 새로운 컴포넌트들의 전체 흐름입니다:

```
[클라이언트 요청] ──▶ DepartmentsController ──▶ IDepartmentService (DI) ──▶ DepartmentService (로직/저장소)
                             ▲                                                    │
                             └──────────── DepartmentResponse DTO ────────────────┘
```

---

## 📝 1단계: 도메인 엔티티 만들기

가장 먼저 데이터베이스 또는 저장소에 보관될 데이터의 원본 형태(Entity)를 정의합니다.

- **생성할 파일 경로**: `Models/Entities/Department.cs`
- **작성할 코드**:
```csharp
namespace csharp_hello_world.Models.Entities;

/// <summary>
/// 부서 도메인 엔티티
/// </summary>
public class Department
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;       // 부서명 (예: 개발팀, 인사팀)
    public string Description { get; set; } = string.Empty;// 부서 설명
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

> 💡 **체크포인트**: 엔티티 클래스에는 비즈니스 핵심 프로퍼티를 선언하고 기본값을 설정합니다.

---

## 📝 2단계: 요청/응답 DTO 작성하기

클라이언트가 서버로 보낼 데이터(Request)와, 서버가 클라이언트에게 돌려줄 데이터(Response)를 C#의 불변 `record`로 작성합니다.

- **생성할 파일 경로**: `Models/DTOs/DepartmentDto.cs`
- **작성할 코드**:
```csharp
namespace csharp_hello_world.Models.DTOs;

/// <summary>
/// 부서 등록 요청 DTO
/// </summary>
public record CreateDepartmentRequest(
    string Name,
    string Description
);

/// <summary>
/// 부서 조회 응답 DTO
/// </summary>
public record DepartmentResponse(
    int Id,
    string Name,
    string Description,
    DateTime CreatedAt
);
```

> 💡 **체크포인트**: 클라이언트가 보낼 때는 `Id`나 `CreatedAt`이 필요 없으므로 `CreateDepartmentRequest`에는 `Name`, `Description`만 선언합니다.

---

## 📝 3단계: 서비스 인터페이스 & 비즈니스 로직 구현

비즈니스 로직을 컨트롤러에 직접 짜지 않고, 테스트와 유지보수를 위해 **인터페이스(규격)**와 **서비스 구현체**로 분리합니다.

### (1) 인터페이스 정의
- **생성할 파일 경로**: `Services/IDepartmentService.cs`
- **작성할 코드**:
```csharp
using csharp_hello_world.Models.DTOs;

namespace csharp_hello_world.Services;

public interface IDepartmentService
{
    Task<IEnumerable<DepartmentResponse>> GetAllAsync();
    Task<DepartmentResponse?> GetByIdAsync(int id);
    Task<DepartmentResponse> CreateAsync(CreateDepartmentRequest request);
    Task<bool> DeleteAsync(int id);
}
```

### (2) 서비스 구현체 작성
- **생성할 파일 경로**: `Services/DepartmentService.cs`
- **작성할 코드**:
```csharp
using System.Collections.Concurrent;
using csharp_hello_world.Models.DTOs;
using csharp_hello_world.Models.Entities;

namespace csharp_hello_world.Services;

public class DepartmentService : IDepartmentService
{
    // 스레드 안전한 인메모리 딕셔너리
    private static readonly ConcurrentDictionary<int, Department> _departments = new();
    private static int _nextId = 1;

    static DepartmentService()
    {
        // 초기 샘플 부서 데이터 등록
        AddInitial("플랫폼 개발팀", "백엔드 및 인프라 개발");
        AddInitial("UI/UX 디자인팀", "사용자 경험 설계 및 프로토타이핑");
        AddInitial("비즈니스 기획팀", "서비스 전략 및 마케팅");
    }

    private static void AddInitial(string name, string desc)
    {
        var id = _nextId++;
        _departments[id] = new Department
        {
            Id = id,
            Name = name,
            Description = desc,
            CreatedAt = DateTime.UtcNow
        };
    }

    public Task<IEnumerable<DepartmentResponse>> GetAllAsync()
    {
        var list = _departments.Values
            .OrderBy(d => d.Id)
            .Select(d => new DepartmentResponse(d.Id, d.Name, d.Description, d.CreatedAt));

        return Task.FromResult<IEnumerable<DepartmentResponse>>(list);
    }

    public Task<DepartmentResponse?> GetByIdAsync(int id)
    {
        if (_departments.TryGetValue(id, out var d))
        {
            return Task.FromResult<DepartmentResponse?>(new DepartmentResponse(d.Id, d.Name, d.Description, d.CreatedAt));
        }
        return Task.FromResult<DepartmentResponse?>(null);
    }

    public Task<DepartmentResponse> CreateAsync(CreateDepartmentRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new ArgumentException("부서명은 필수입니다.", nameof(request.Name));
        }

        var id = Interlocked.Increment(ref _nextId);
        var dept = new Department
        {
            Id = id,
            Name = request.Name.Trim(),
            Description = request.Description.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _departments[id] = dept;
        return Task.FromResult(new DepartmentResponse(dept.Id, dept.Name, dept.Description, dept.CreatedAt));
    }

    public Task<bool> DeleteAsync(int id)
    {
        var removed = _departments.TryRemove(id, out _);
        return Task.FromResult(removed);
    }
}
```

---

## 📝 4단계: REST API Controller 만들기

외부에서 HTTP 요청(`GET`, `POST`, `DELETE`)을 받아 서비스로 연결해 줄 컨트롤러를 작성합니다.

- **생성할 파일 경로**: `Controllers/DepartmentsController.cs`
- **작성할 코드**:
```csharp
using Microsoft.AspNetCore.Mvc;
using csharp_hello_world.Models.DTOs;
using csharp_hello_world.Services;

namespace csharp_hello_world.Controllers;

[ApiController]
[Route("api/[controller]")] // URL: /api/departments
public class DepartmentsController(IDepartmentService departmentService, ILogger<DepartmentsController> logger) : ControllerBase
{
    // 전체 부서 목록 조회: GET /api/departments
    [HttpGet]
    public async Task<ActionResult<IEnumerable<DepartmentResponse>>> GetAll()
    {
        logger.LogInformation("부서 목록 조회");
        var list = await departmentService.GetAllAsync();
        return Ok(list);
    }

    // 단건 부서 조회: GET /api/departments/{id}
    [HttpGet("{id:int}")]
    public async Task<ActionResult<DepartmentResponse>> GetById(int id)
    {
        var dept = await departmentService.GetByIdAsync(id);
        if (dept == null)
        {
            return NotFound(new { message = $"ID가 {id}인 부서를 찾을 수 없습니다." });
        }
        return Ok(dept);
    }

    // 신규 부서 등록: POST /api/departments
    [HttpPost]
    public async Task<ActionResult<DepartmentResponse>> Create([FromBody] CreateDepartmentRequest request)
    {
        var created = await departmentService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    // 부서 삭제: DELETE /api/departments/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await departmentService.DeleteAsync(id);
        if (!deleted)
        {
            return NotFound(new { message = $"ID가 {id}인 부서를 찾을 수 없습니다." });
        }
        return NoContent();
    }
}
```

---

## 📝 5단계: `Program.cs`에 DI 컨테이너 서비스 등록

새로 만든 `IDepartmentService`를 `Program.cs`에 등록해야 ASP.NET Core가 컨트롤러 생성자에 자동으로 주입해 줍니다.

- **수정할 파일**: [Program.cs](file:///h:/lee/csharp-hello-world/Program.cs)
- **추가할 코드 한 줄**:
```csharp
// 기존 UserService 등록 바로 아래에 추가:
builder.Services.AddScoped<IDepartmentService, DepartmentService>();
```

---

## 🚀 6단계: 빌드 및 실행 테스트

터미널에서 실행 중인 프로세스를 정리하고 테스트해 봅니다.

```powershell
# 1. 기존 프로세스 종료
Stop-Process -Name csharp-hello-world -Force -ErrorAction SilentlyContinue

# 2. 빌드 검증
dotnet build

# 3. 서버 실행
dotnet run
```

### 테스트 명령어 (새 터미널 창에서):
```powershell
# 1. 부서 목록 전체 조회
Invoke-RestMethod -Uri "http://localhost:5167/api/departments" | ConvertTo-Json

# 2. 신규 부서 등록 (POST)
$body = @{ name = "신규 사업팀"; description = "AI 신사업 기획" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5167/api/departments" -Method Post -Body $body -ContentType "application/json" | ConvertTo-Json
```

브라우저 주소창에 `http://localhost:5167/api/departments` 를 입력하여 JSON 목록이 잘 나오는지 확인해 보세요!

---

## 🏆 축하합니다!
축하드립니다! 여러분은 방금 **C# 엔터프라이즈 실무 표준 레이어드 아키텍처(Entity ➔ DTO ➔ Service ➔ Controller ➔ DI)**의 모든 단계를 스스로의 손으로 직접 완성하셨습니다.
