# 02. 현대적인 C# 핵심 문법

> **소속**: [🟢 Part 1. 초급](../README.md#part-1-초급--언어-기초--net-10-웹-개발-입문)  
> **핵심 키워드**: Top-Level Statements, Nullable (`?`), record, Property, Primary Constructor, Pattern Matching

---

## 1. 최상위 문 (Top-Level Statements)

과거의 C#과 Java는 간단한 출력 하나를 하려고 해도 클래스와 `Main` 메서드가 필수였습니다.

```csharp
// ❌ 과거 C# 8 이전 방식
using System;
namespace MyApp
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("Hello World");
        }
    }
}
```

```csharp
// ✅ 현대적인 C# 방식 (Top-Level Statements)
// 보일러플레이트 없이 바로 시작!
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/", () => "Hello World");

app.Run();
```

---

## 2. Nullable 참조 형식 (`string?`)

런타임에 불시에 터지는 `NullReferenceException`(Java의 `NullPointerException`)을 원천 방지하기 위한 C#의 강력한 기능입니다.

```csharp
// 1. Non-nullable: 기본적으로 null을 대입할 수 없음
string name = "홍길동";
// name = null; // ⚠️ 컴파일 경고 발생!

// 2. Nullable: 물음표(?)를 붙여야만 null 대입 허용
string? nickname = null;

// 3. Null 조건부 연산자 (?.)
// nickname이 null이면 Length를 호출하지 않고 즉시 null 반환
int? len = nickname?.Length;

// 4. Null 병합 연산자 (??)
// nickname이 null이면 기본값 "익명" 사용
string displayName = nickname ?? "익명";

// 5. Null 면제 연산자 (!)
// 컴파일러에게 "이 값은 절대 null이 아님을 내가 보장한다"고 알림
string forced = nickname!;
```

---

## 3. 프로퍼티 (Property) 문법

Java에서는 필드를 `private`으로 선언하고 Getter/Setter 메서드를 수동으로 만들거나 Lombok(`@Data`)에 의존해야 했습니다. C#은 언어 차원에서 **프로퍼티**를 제공합니다.

```csharp
public class User
{
    // 1. 자동 구현 프로퍼티 (읽기/쓰기 가능)
    public int Id { get; set; }

    // 2. 초기값 지정
    public string Name { get; set; } = string.Empty;

    // 3. init 접근자 (객체 생성자/초기화 블록에서만 값 설정 가능, 이후 수정 불가 불변 필드)
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;

    // 4. 읽기 전용 계산 프로퍼티 (Getter만 존재)
    public bool HasLongName => Name.Length > 10;
}
```

---

## 4. DTO의 정석: `record` 타입

실무 웹 개발에서 클라이언트와 주고받는 요청(Request)/응답(Response) DTO는 **불변성(Immutability)**이 핵심입니다. C#의 `record`는 단 한 줄로 불변 DTO를 완성합니다.

```csharp
// 위치 지정 레코드 (Positional Record)
public record CreateUserRequest(string Name, string Email);

public record UserResponse(int Id, string Name, string Email, bool IsActive);
```

### `record`의 강력한 내장 기능:
1. **값 기반 동등성 비교**: 참조 주소가 달라도 모든 프로퍼티 값이 같으면 `user1 == user2`가 `true`입니다.
2. **자동 `ToString()`**: 객체를 출력할 때 `UserResponse { Id = 1, Name = 홍길동 ... }` 형태로 예쁘게 출력됩니다.
3. **`with` 식을 통한 불변 복사**:
   ```csharp
   var original = new UserResponse(1, "홍길동", "hong@test.com", true);
   // Name만 변경하고 나머지는 그대로 복사된 새 객체 생성!
   var updated = original with { Name = "홍길순" };
   ```

---

## 5. 기본 생성자 (Primary Constructor)

클래스 이름 옆에 매개변수를 직접 선언하여 생성자 본문과 필드 할당 코드를 획기적으로 줄여줍니다.

```csharp
// ❌ 기존 방식
public class UserService : IUserService
{
    private readonly ILogger<UserService> _logger;
    public UserService(ILogger<UserService> logger)
    {
        _logger = logger;
    }
}

// ✅ 현대적 방식 (Primary Constructor)
public class UserService(ILogger<UserService> logger) : IUserService
{
    public void Print()
    {
        logger.LogInformation("주입받은 의존성을 바로 사용!");
    }
}
```

---

## 6. 패턴 매칭 (Pattern Matching)

복잡한 `if-else` 문을 직관적인 `switch` 식으로 표현할 수 있습니다.

```csharp
public string GetRoleDescription(string role, bool isActive) => (role, isActive) switch
{
    ("Admin", true)  => "활성 관리자 - 모든 권한 보유",
    ("Admin", false) => "정지된 관리자 계정",
    ("User", true)   => "일반 회원",
    _                => "알 수 없는 권한"
};
```
