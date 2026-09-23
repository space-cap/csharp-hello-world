# C# & ASP.NET Core 실무 치트시트 & 복붙 템플릿

실무에서 새로운 기능을 개발할 때, 백지 상태에서 고민하지 않고 **복사해서 이름만 바꾸어 즉시 사용할 수 있는 표준 코드 템플릿 및 스니펫 모음집**입니다.

---

## 📑 목차
1. [REST Controller 템플릿 (CRUD 기본형)](#1-rest-controller-템플릿)
2. [Service & Interface 템플릿](#2-service--interface-템플릿)
3. [DTO (Data Transfer Object) 템플릿](#3-dto-record-템플릿)
4. [Program.cs 핵심 등록 코드 모음](#4-programcs-핵심-등록-코드-모음)
5. [appsettings.json 설정값 읽어오기 3가지 패턴](#5-appsettingsjson-설정값-읽어오기)
6. [자주 쓰는 실무 LINQ 패턴 10선](#6-자주-쓰는-실무-linq-패턴-10선)

---

## 1. REST Controller 템플릿

컨트롤러를 새로 만들 때 그대로 복사해서 사용할 수 있는 표준 CRUD 뼈대입니다.

```csharp
using Microsoft.AspNetCore.Mvc;
// TODO: 사용할 DTO 및 Service 네임스페이스 추가
// using MyProject.Models.DTOs;
// using MyProject.Services;

namespace MyProject.Controllers;

[ApiController]
[Route("api/[controller]")] // URL: /api/{컨트롤러명} (예: /api/products)
public class ProductsController(IProductService productService, ILogger<ProductsController> logger) : ControllerBase
{
    // 1. 전체 목록 조회: GET /api/products
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductResponse>>> GetAll(CancellationToken ct)
    {
        logger.LogInformation("전체 목록 조회 요청");
        var list = await productService.GetAllAsync(ct);
        return Ok(list); // 200 OK
    }

    // 2. 단건 상세 조회: GET /api/products/{id}
    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProductResponse>> GetById(int id, CancellationToken ct)
    {
        var item = await productService.GetByIdAsync(id, ct);
        if (item == null)
        {
            return NotFound(new { message = $"ID가 {id}인 항목을 찾을 수 없습니다." }); // 404
        }
        return Ok(item); // 200 OK
    }

    // 3. 신규 등록: POST /api/products
    [HttpPost]
    public async Task<ActionResult<ProductResponse>> Create([FromBody] CreateProductRequest request, CancellationToken ct)
    {
        var created = await productService.CreateAsync(request, ct);
        // 201 Created 반환 및 Location 헤더에 새로 생긴 리소스 URL 자동 생성
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    // 4. 정보 수정: PUT /api/products/{id}
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ProductResponse>> Update(int id, [FromBody] UpdateProductRequest request, CancellationToken ct)
    {
        var updated = await productService.UpdateAsync(id, request, ct);
        if (updated == null)
        {
            return NotFound(new { message = $"ID가 {id}인 항목을 찾을 수 없습니다." }); // 404
        }
        return Ok(updated); // 200 OK
    }

    // 5. 삭제: DELETE /api/products/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var success = await productService.DeleteAsync(id, ct);
        if (!success)
        {
            return NotFound(new { message = $"ID가 {id}인 항목을 찾을 수 없습니다." }); // 404
        }
        return NoContent(); // 204 No Content (반환 바디 없음)
    }
}
```

---

## 2. Service & Interface 템플릿

비즈니스 로직을 분리하고 DI로 주입할 때 사용하는 표준 인터페이스 및 구현체 쌍입니다.

### (1) Interface (`IProductService.cs`)
```csharp
namespace MyProject.Services;

public interface IProductService
{
    Task<IEnumerable<ProductResponse>> GetAllAsync(CancellationToken ct = default);
    Task<ProductResponse?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<ProductResponse> CreateAsync(CreateProductRequest request, CancellationToken ct = default);
    Task<ProductResponse?> UpdateAsync(int id, UpdateProductRequest request, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
}
```

### (2) Implementation (`ProductService.cs`)
```csharp
using System.Collections.Concurrent;

namespace MyProject.Services;

public class ProductService(ILogger<ProductService> logger) : IProductService
{
    // 스레드 안전한 인메모리 저장소 예시 (DB 연동 시 DbContext 주입)
    private static readonly ConcurrentDictionary<int, Product> _items = new();
    private static int _seq = 0;

    public Task<IEnumerable<ProductResponse>> GetAllAsync(CancellationToken ct = default)
    {
        var result = _items.Values
            .OrderBy(x => x.Id)
            .Select(x => new ProductResponse(x.Id, x.Name, x.Price, x.CreatedAt));

        return Task.FromResult<IEnumerable<ProductResponse>>(result);
    }

    public Task<ProductResponse?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        if (_items.TryGetValue(id, out var x))
        {
            return Task.FromResult<ProductResponse?>(new ProductResponse(x.Id, x.Name, x.Price, x.CreatedAt));
        }
        return Task.FromResult<ProductResponse?>(null);
    }

    public Task<ProductResponse> CreateAsync(CreateProductRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new ArgumentException("이름은 필수입니다.", nameof(request.Name));
        }

        var id = Interlocked.Increment(ref _seq);
        var product = new Product
        {
            Id = id,
            Name = request.Name.Trim(),
            Price = request.Price,
            CreatedAt = DateTime.UtcNow
        };

        _items[id] = product;
        return Task.FromResult(new ProductResponse(product.Id, product.Name, product.Price, product.CreatedAt));
    }

    public Task<ProductResponse?> UpdateAsync(int id, UpdateProductRequest request, CancellationToken ct = default)
    {
        if (!_items.TryGetValue(id, out var product)) return Task.FromResult<ProductResponse?>(null);

        product.Name = request.Name.Trim();
        product.Price = request.Price;

        return Task.FromResult<ProductResponse?>(new ProductResponse(product.Id, product.Name, product.Price, product.CreatedAt));
    }

    public Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var removed = _items.TryRemove(id, out _);
        return Task.FromResult(removed);
    }
}
```

---

## 3. DTO (`record`) 템플릿

클라이언트와 주고받는 데이터는 불변 객체인 `record`로 작성하는 것이 현대 C#의 표준입니다.

```csharp
namespace MyProject.Models.DTOs;

// 등록 요청 DTO
public record CreateProductRequest(
    string Name,
    decimal Price
);

// 수정 요청 DTO
public record UpdateProductRequest(
    string Name,
    decimal Price
);

// 응답 DTO
public record ProductResponse(
    int Id,
    string Name,
    decimal Price,
    DateTime CreatedAt
);
```

---

## 4. `Program.cs` 핵심 등록 코드 모음

`Program.cs`에서 자주 설정하는 핵심 코드 조각들입니다.

```csharp
var builder = WebApplication.CreateBuilder(args);

// 1. 컨트롤러 활성화
builder.Services.AddControllers();

// 2. 서비스 DI 등록 (실무는 90% AddScoped 사용)
builder.Services.AddScoped<IProductService, ProductService>();

// 3. CORS 허용 (프론트엔드와 포트가 다를 때 필수)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// 4. 미들웨어 파이프라인 구성 (순서 중요!)
app.UseCors("AllowAll"); // CORS 허용 적용

// 5. 정적 파일 서빙 (wwwroot/index.html)
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthorization();

// 6. 컨트롤러 라우팅 매핑
app.MapControllers();

app.Run();
```

---

## 5. `appsettings.json` 설정값 읽어오기

설정 파일(`appsettings.json`)에 있는 값을 C# 코드에서 읽는 3가지 방법입니다.

### `appsettings.json` 예시:
```json
{
  "AppSettings": {
    "SiteTitle": "나의 쇼핑몰",
    "MaxPageSize": 50,
    "AdminEmail": "admin@example.com"
  }
}
```

### 읽기 방법 1: `IConfiguration` 직접 접근 (가장 간단)
```csharp
// Program.cs 또는 컨트롤러/서비스에서
string siteTitle = builder.Configuration["AppSettings:SiteTitle"] ?? "기본제목";
int maxPageSize = builder.Configuration.GetValue<int>("AppSettings:MaxPageSize", defaultValue: 20);
```

### 읽기 방법 2: 클래스에 바인딩하여 타입 안전하게 사용 (실무 추천)
```csharp
// 1. 설정 클래스 선언
public class AppSettings
{
    public string SiteTitle { get; set; } = string.Empty;
    public int MaxPageSize { get; set; }
    public string AdminEmail { get; set; } = string.Empty;
}

// 2. Program.cs에서 등록
builder.Services.Configure<AppSettings>(builder.Configuration.GetSection("AppSettings"));

// 3. Service나 Controller에서 IOptions<AppSettings>로 주입받아 사용
public class MyService(IOptions<AppSettings> options)
{
    private readonly AppSettings _settings = options.Value;

    public void Print()
    {
        Console.WriteLine(_settings.SiteTitle);
    }
}
```

---

## 6. 자주 쓰는 실무 LINQ 패턴 10선

`List<T>`나 DB 쿼리 시 매일 사용하는 LINQ 코드 조각입니다.

```csharp
List<Product> products = GetProductList();

// 1. 조건 검색 (Where) - 가격이 10,000원 이상인 것만
var expensive = products.Where(p => p.Price >= 10000).ToList();

// 2. 특정 필드만 추출 (Select) - 상품 이름 목록만 문자열 리스트로
List<string> names = products.Select(p => p.Name).ToList();

// 3. 정렬 (OrderBy, ThenBy) - 가격 내림차순, 이름 오름차순
var sorted = products
    .OrderByDescending(p => p.Price)
    .ThenBy(p => p.Name)
    .ToList();

// 4. 단건 조회 (FirstOrDefault) - ID가 5인 상품 (없으면 null)
Product? item = products.FirstOrDefault(p => p.Id == 5);

// 5. 조건 만족 여부 검사 (Any, All)
bool hasSoldOut = products.Any(p => p.Price == 0); // 하나라도 0원인가?
bool allValid = products.All(p => p.Price > 0);    // 모두 0원 초과인가?

// 6. 개수 및 집계 (Count, Sum, Average, Max, Min)
int totalCount = products.Count;
decimal totalPrice = products.Sum(p => p.Price);
decimal avgPrice = products.Average(p => p.Price);

// 7. 페이징 처리 (Skip, Take) - 2페이지 (페이지당 10개)
int pageNumber = 2;
int pageSize = 10;
var pagedList = products
    .Skip((pageNumber - 1) * pageSize)
    .Take(pageSize)
    .ToList();

// 8. 딕셔너리로 변환 (ToDictionary) - ID를 Key로 맵 생성
Dictionary<int, Product> map = products.ToDictionary(p => p.Id);

// 9. 특정 필드 기준 중복 제거 (DistinctBy) - 이름 기준 고유 상품
var uniqueByName = products.DistinctBy(p => p.Name).ToList();

// 10. 문자열 합치기 (string.Join + Select)
string commaNames = string.Join(", ", products.Select(p => p.Name));
// 결과: "노트북, 마우스, 키보드"
```
