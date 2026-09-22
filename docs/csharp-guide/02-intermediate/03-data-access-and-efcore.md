# 03. 데이터베이스 연동 & ORM (EF Core 10 & Dapper)

> **소속**: [🟡 Part 2. 중급](../README.md#part-2-중급--실무-웹-백엔드-핵심-메커니즘)  
> **핵심 키워드**: Entity Framework Core 10, DbContext, DbSet<T>, Migrations, Include, Dapper

---

## 1. ORM 지형: Entity Framework Core vs Dapper

.NET 진영의 데이터베이스 접근 기술은 양대 산맥으로 나뉩니다. 실무에서는 보통 **EF Core를 기본으로 사용하고, 고성능 복잡 쿼리에 Dapper를 보용**하는 하이브리드 전략을 취합니다.

| 비교 항목 | Entity Framework Core 10 | Dapper |
| :--- | :--- | :--- |
| **분류** | Full-featured ORM (Spring Data JPA 대응) | Micro-ORM (초고속 SQL Mapper, MyBatis 대응) |
| **생산성** | 매우 높음 (LINQ로 SQL 없이 객체 조작) | 보통 (개발자가 직접 SQL 작성) |
| **성능** | .NET 10에서 대폭 개선 (최상위권) | C/C++ 네이티브에 근접한 극한의 속도 |
| **마이그레이션** | 내장 CLI로 자동 스키마 버전 관리 | 별도 툴(Flyway, DbUp) 필요 |

---

## 2. EF Core 10 기본 설정

### (1) 엔티티 클래스 정의
```csharp
public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // 1:N 관계 (사용자 1명이 여러 개의 게시글을 가짐)
    public List<Post> Posts { get; set; } = [];
}
```

### (2) `DbContext` 구현
Spring의 `EntityManager` + `JpaRepository`의 역할을 하나로 통합한 세션 객체입니다.
```csharp
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Post> Posts => Set<Post>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Fluent API를 통한 상세 스키마 매핑
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(100);
            entity.HasIndex(e => e.Email).IsUnique(); // 고유 인덱스 설정
        });
    }
}
```

### (3) DI 등록 (`Program.cs`)
```csharp
// SQLite 연결 설정 (또는 SQL Server, PostgreSQL, MySQL)
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));
```

---

## 3. EF Core CLI 마이그레이션

JPA의 `ddl-auto: update`는 운영 환경에서 사고를 유발할 수 있어 지양됩니다. EF Core는 Git으로 버전 관리되는 완벽한 마이그레이션 스크립트를 생성합니다.

```bash
# 1. 새 마이그레이션 생성 (엔티티 변경점 감지)
dotnet ef migrations add AddUserAndPostTables

# 2. 실제 데이터베이스에 변경 사항 적용
dotnet ef database update

# 3. 배포용 순수 SQL 스크립트 추출 (운영 DB 반영용)
dotnet ef migrations script -o migration.sql
```

---

## 4. 실무 쿼리 튜닝 3대 원칙

### (1) 읽기 전용 쿼리에는 `AsNoTracking()` 필수!
EF Core는 기본적으로 조회한 객체의 변경 감지(Change Tracking)를 위해 스냅샷을 보관합니다. 단순 조회 API에서는 이를 꺼주면 메모리와 속도가 2배 이상 향상됩니다.
```csharp
var users = await dbContext.Users
    .AsNoTracking()
    .Where(u => u.IsActive)
    .ToListAsync();
```

### (2) 연관 엔티티 즉시 로딩: `Include()`
N+1 문제를 방지하기 위해 SQL의 `JOIN`으로 한 번에 조회합니다.
```csharp
var userWithPosts = await dbContext.Users
    .Include(u => u.Posts) // LEFT JOIN Posts
    .FirstOrDefaultAsync(u => u.Id == userId);
```

### (3) 필요한 컬럼만 추출 (Projection)
`Select()`를 사용하면 엔티티 전체를 가져오지 않고 지정한 DTO 컬럼만 `SELECT id, name FROM ...` 형태로 쿼리가 최적화됩니다.
```csharp
var userSummaries = await dbContext.Users
    .Select(u => new UserSummaryDto(u.Id, u.Name))
    .ToListAsync();
```
