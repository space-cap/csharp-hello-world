# 01. 비동기 프로그래밍 완전 정복 (Async / Await)

> **소속**: [🟡 Part 2. 중급](../README.md#part-2-중급--실무-웹-백엔드-핵심-메커니즘)  
> **핵심 키워드**: Task, Task<T>, async/await, 논블로킹 I/O, ThreadPool, CancellationToken

---

## 1. 동기(Sync) vs 비동기(Async) 동작 원리

웹 서버(Kestrel)가 클라이언트로부터 수많은 HTTP 요청을 처리할 때 스레드를 어떻게 사용하는지가 성능의 핵심입니다.

```
[ 동기 방식 (Blocking I/O) ]
요청 도착 ──▶ [스레드 #1 할당] ──▶ DB 쿼리 전송 ──▶ [ 멍하니 대기... (스레드 블로킹) ] ──▶ 응답 수신 ──▶ 결과 반환
※ 문제점: DB 응답이 올 때까지 스레드 #1이 아무 일도 못 하고 묶여 있음 (스레드 고갈 발생)

[ 비동기 방식 (Non-Blocking I/O: async/await) ]
요청 도착 ──▶ [스레드 #1 할당] ──▶ DB 쿼리 전송 ──▶ [스레드 #1은 풀에 반납! 다른 사용자 요청 처리]
                                                            │
                                                   (DB 작업 완료 시)
                                                            ▼
                                        [스레드 풀의 빈 스레드가 이어서 실행] ──▶ 결과 반환
```

---

## 2. C#의 비동기 반환 타입 3총사

| 반환 타입 | 설명 | 사용처 |
| :--- | :--- | :--- |
| `Task` | 반환값이 없는 비동기 메서드 (Java의 `CompletableFuture<Void>`) | `POST`, `DELETE` 등 반환값이 필요 없는 작업 |
| `Task<T>` | `T` 타입의 결과를 반환하는 비동기 메서드 | 조회 API, DB 연산 등 대부분의 실무 비동기 메서드 |
| `ValueTask<T>` | 구조체(Struct) 기반의 초고성능 비동기 타입 (메모리 할당 0) | 결과가 이미 캐시되어 즉시 반환될 확률이 높은 고성능 메서드 |

> ⚠️ **주의 (`async void`)**: 이벤트 핸들러를 제외하고는 **절대 `async void`를 사용하지 마세요.** 예외가 발생했을 때 호출 스택이 깨져 프로세스가 비정상 종료됩니다.

---

## 3. 실무 예제로 보는 `async` / `await`

```csharp
public class UserService : IUserService
{
    private readonly AppDbContext _dbContext;

    public UserService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    // async 키워드가 붙은 메서드 내부에서는 await 키워드를 사용할 수 있습니다.
    public async Task<UserResponse?> GetUserByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        // 1. await를 만나면 현재 스레드를 풀어주고 DB 비동기 I/O를 기다립니다.
        var user = await _dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);

        if (user == null) return null;

        return new UserResponse(user.Id, user.Name, user.Email, user.IsActive);
    }
}
```

---

## 4. 비동기 취소 토큰 (`CancellationToken`)

웹 환경에서는 사용자가 검색 버튼을 연타하거나 응답이 오기 전에 브라우저 탭을 닫아버리는 경우가 빈번합니다.

### 왜 필수인가?
- 클라이언트가 이미 연결을 끊었는데 서버가 계속해서 무거운 쿼리나 파일 작업을 수행하면 **서버 자원이 심각하게 낭비**됩니다.
- ASP.NET Core는 클라이언트의 연결이 끊어지면 자동으로 `HttpContext.RequestAborted` 토큰에 취소 신호를 보냅니다.

```csharp
[HttpGet("search")]
public async Task<ActionResult<IEnumerable<UserResponse>>> Search(
    [FromQuery] string query,
    CancellationToken cancellationToken) // 프레임워크가 자동 주입해 줌!
{
    // DB 쿼리에 cancellationToken을 전달하면 클라이언트가 취소 시 쿼리가 즉시 중단됨
    var results = await _userService.SearchUsersAsync(query, cancellationToken);
    return Ok(results);
}
```

---

## 5. 비동기 병렬 처리 (`Task.WhenAll`)

서로 의존성이 없는 여러 개의 독립된 API나 DB 조회를 동시에 실행할 때 사용합니다.

```csharp
public async Task<DashboardData> GetDashboardAsync()
{
    // 3개의 비동기 작업을 동시에 트리거!
    var usersTask = _userService.GetAllUsersAsync();
    var statsTask = _statService.GetDailyStatsAsync();
    var noticeTask = _noticeService.GetRecentNoticesAsync();

    // 3개 작업이 모두 끝날 때까지 병렬 대기
    await Task.WhenAll(usersTask, statsTask, noticeTask);

    return new DashboardData(
        await usersTask,
        await statsTask,
        await noticeTask
    );
}
```
