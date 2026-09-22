# 02. 엔터프라이즈 아키텍처 설계 패턴

> **소속**: [🔴 Part 3. 고급](../README.md#part-3-고급--고성능-대규모-아키텍처-운영)  
> **핵심 키워드**: Clean Architecture, 멀티 프로젝트 솔루션, CQRS, MediatR, SignalR

---

## 1. 멀티 프로젝트 기반 클린 아키텍처 (Clean Architecture)

대규모 엔터프라이즈 시스템에서는 비즈니스 로직(도메인)이 특정 데이터베이스(EF Core)나 웹 프레임워크(ASP.NET Core)에 종속되지 않도록 계층을 엄격히 분리합니다.

```
                  ┌────────────────────────┐
                  │      4. Web API        │  (Controllers, Program.cs)
                  └───────────┬────────────┘
                              │ 의존
                              ▼
                  ┌────────────────────────┐
                  │    2. Application      │  (UseCases, DTO, MediatR Handlers)
                  └───────────┬────────────┘
                              │ 의존
                              ▼
                  ┌────────────────────────┐
                  │       1. Domain        │  (순수 엔티티, 도메인 규칙 - 의존성 0)
                  └────────────────────────┘
                              ▲
                              │ 구현
                  ┌───────────┴────────────┐
                  │    3. Infrastructure   │  (EF Core DbContext, 외부 연동)
                  └────────────────────────┘
```

### 각 프로젝트의 역할
1. **`MyProject.Domain`**: 순수 C# 코드. NuGet 패키지 의존성이 전혀 없으며 핵심 비즈니스 엔티티와 도메인 예외를 정의합니다.
2. **`MyProject.Application`**: 비즈니스 흐름(유즈케이스)을 처리합니다. DTO, 서비스 인터페이스, CQRS 핸들러가 위치합니다.
3. **`MyProject.Infrastructure`**: DB 접근(EF Core), 결제 PG 연동, 이메일 발송 등 기술적 구현체를 담당합니다.
4. **`MyProject.WebApi`**: HTTP 엔드포인트와 Swagger, DI 컨테이너를 조립하는 진입점입니다.

---

## 2. CQRS 패턴과 MediatR

CQRS (Command and Query Responsibility Segregation)는 **상태를 변경하는 명령(Command)**과 **데이터를 읽는 조회(Query)**의 책임을 분리하는 기법입니다.

### MediatR 라이브러리 연동
컨트롤러가 서비스의 모든 메서드를 알 필요 없이, **중재자(Mediator)**에게 명령 또는 조회를 던지면 적절한 핸들러가 실행됩니다.

```csharp
// 1. Command 정의: 사용자 생성 명령
public record CreateUserCommand(string Name, string Email) : IRequest<UserResponse>;

// 2. CommandHandler: 실제 비즈니스 처리 담당
public class CreateUserCommandHandler(IUserRepository repo) : IRequestHandler<CreateUserCommand, UserResponse>
{
    public async Task<UserResponse> Handle(CreateUserCommand request, CancellationToken ct)
    {
        var user = new User { Name = request.Name, Email = request.Email };
        await repo.AddAsync(user, ct);
        return new UserResponse(user.Id, user.Name, user.Email, user.IsActive);
    }
}

// 3. Controller에서는 MediatR에 전달만 수행
[HttpPost]
public async Task<ActionResult<UserResponse>> Create([FromBody] CreateUserCommand command)
{
    var result = await _mediator.Send(command);
    return Ok(result);
}
```

---

## 3. 실시간 양방향 푸시 통신: SignalR

채팅, 실시간 알림, 주식 호가창, 대시보드 실시간 갱신을 구현할 때 사용하는 .NET의 대표 프레임워크입니다.
브라우저 환경에 따라 WebSocket을 기본으로 사용하며, 미지원 시 SSE(Server-Sent Events)나 Long Polling으로 자동 폴백됩니다.

```csharp
// 1. Hub 정의 (서버 측 실시간 메시징 허브)
public class NotificationHub : Hub
{
    public async Task SendMessage(string user, string message)
    {
        // 연결된 모든 클라이언트의 "ReceiveMessage" JS 함수 호출!
        await Clients.All.SendAsync("ReceiveMessage", user, message);
    }
}

// 2. Program.cs 라우팅 매핑
app.MapHub<NotificationHub>("/hub/notifications");
```
