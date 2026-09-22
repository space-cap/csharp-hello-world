# 03. 컬렉션과 LINQ 데이터 가공

> **소속**: [🟢 Part 1. 초급](../README.md#part-1-초급--언어-기초--net-10-웹-개발-입문)  
> **핵심 키워드**: List<T>, Dictionary<TKey, TValue>, LINQ, Where, Select, OrderBy, FirstOrDefault, 지연 평가

---

## 1. 핵심 컬렉션 자료구조

C#의 제네릭 컬렉션은 `System.Collections.Generic` 네임스페이스에 위치하며, Java의 `Collection` 프레임워크와 거의 1:1로 매핑됩니다.

| C# 타입 | Java 대응 | 설명 및 용도 |
| :--- | :--- | :--- |
| `List<T>` | `ArrayList<T>` | 순서가 있는 동적 배열. 가장 많이 사용됨 |
| `Dictionary<TKey, TValue>` | `HashMap<K, V>` | Key-Value 해시 테이블 (O(1) 검색) |
| `HashSet<T>` | `HashSet<T>` | 중복을 허용하지 않는 고유 집합 |
| `ConcurrentDictionary<K, V>` | `ConcurrentHashMap<K, V>` | **멀티스레드 환경에서 안전한 락프리 맵** (우리 프로젝트의 인메모리 저장소에 사용됨) |

```csharp
// 컬렉션 초기화 식 (Collection Expressions)
List<int> numbers = [1, 2, 3, 4, 5];
Dictionary<string, string> roles = new()
{
    ["admin"] = "관리자",
    ["user"] = "일반사용자"
};
```

---

## 2. LINQ (Language Integrated Query)란?

LINQ는 SQL 쿼리를 프로그래밍 언어(C#) 안에 네이티브하게 결합한 C#의 킬러 기능입니다.
Java의 Stream API(`stream().filter(...).map(...)`)와 유사하지만 문법이 훨씬 간결하고, **동일한 코드가 나중에 Entity Framework Core를 통해 실제 SQL 쿼리로 자동 번역**됩니다.

---

## 3. 실무 필수 LINQ 메서드 5선

가장 많이 쓰이는 샘플 데이터를 기준으로 실습합니다:

```csharp
var users = new List<User>
{
    new() { Id = 1, Name = "홍길동", Email = "hong@test.com", IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-10) },
    new() { Id = 2, Name = "김철수", Email = "kim@test.com", IsActive = false, CreatedAt = DateTime.UtcNow.AddDays(-5) },
    new() { Id = 3, Name = "이영희", Email = "lee@test.com", IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-2) }
};
```

### (1) `Where`: 조건 필터링 (Java의 `filter`)
```csharp
// 활성 상태인 사용자만 추출
var activeUsers = users.Where(u => u.IsActive);
```

### (2) `Select`: 객체 변환 및 프로젝션 (Java의 `map`)
```csharp
// User 엔티티를 UserResponse DTO로 변환
var userDtos = users.Select(u => new UserResponse(u.Id, u.Name, u.Email, u.IsActive));
```

### (3) `OrderBy` / `OrderByDescending`: 정렬 (Java의 `sorted`)
```csharp
// ID 기준 오름차순, 이름 기준 내림차순
var sortedUsers = users
    .OrderBy(u => u.Id)
    .ThenByDescending(u => u.Name);
```

### (4) `FirstOrDefault` vs `SingleOrDefault`: 단건 검색
```csharp
// 조건에 맞는 첫 번째 요소를 찾음. 없으면 null 반환
var found = users.FirstOrDefault(u => u.Id == 1);

// SingleOrDefault: 조건에 맞는 요소가 정확히 1개여야 함 (2개 이상이면 InvalidOperationException 예외 발생)
var exact = users.SingleOrDefault(u => u.Email == "hong@test.com");
```

### (5) `Any` / `All`: 조건 검사
```csharp
// 활성 사용자가 1명이라도 있는가? (true/false)
bool hasActive = users.Any(u => u.IsActive);

// 모든 사용자의 이메일이 채워져 있는가?
bool allHaveEmail = users.All(u => !string.IsNullOrEmpty(u.Email));
```

---

## 4. 지연 평가 (Deferred Execution)의 함정과 해결법

LINQ의 가장 중요한 특징은 **실제로 데이터가 소비될 때까지 연산을 실행하지 않는다(지연 평가)**는 점입니다.

```csharp
// ⚠️ 쿼리 정의 시점에는 아무런 필터링도 실행되지 않음!
var query = users.Where(u => u.IsActive);

// ❌ 매번 foreach를 돌 때마다 Where 필터가 재실행될 수 있음
foreach (var u in query) { ... }

// ✅ 해결: ToList() 또는 ToArray()로 결과를 메모리에 즉시 고정
List<User> cachedList = query.ToList();
```

> **실무 팁**: 컨트롤러나 서비스에서 LINQ 결과를 반환할 때는 항상 `.ToList()` 또는 `.ToArray()`를 호출하여 즉시 평가된 고정 컬렉션으로 만들어 반환하는 것이 안전합니다.
