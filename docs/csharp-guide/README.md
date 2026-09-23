# C# & .NET 10 엔터프라이즈 웹 개발 완벽 가이드

> **대상**: C# 및 .NET 10이 처음이지만 실무 웹 백엔드를 제대로 구축하고 싶은 개발자 (Spring Boot / Java 개발자 환영)  
> **환경**: .NET 10 LTS, C# 13/14, ASP.NET Core Web API

---

## 📚 전체 목차 (Handbook Index)

### 🟢 [Part 1] 초급 : 언어 기초 & .NET 10 웹 개발 입문
1. [01. .NET 10 런타임과 개발 환경](./01-beginner/01-runtime-and-environment.md)
   - CLR 가상머신과 Kestrel 초고속 웹 서버의 구조
   - `.csproj` 프로젝트 파일 구성 및 NuGet 패키지 관리
   - 실무 필수 .NET CLI 명령어 (`build`, `run`, `watch`)
2. [02. 현대적인 C# 핵심 문법](./01-beginner/02-modern-csharp-syntax.md)
   - Top-Level Statements와 간결해진 진입점
   - Nullable 참조 형식 (`string?`)과 컴파일 타임 null 안전성
   - DTO의 표준: `record` 타입과 불변 객체 모델
   - 프로퍼티(`{ get; set; }`, `init`)와 기본 생성자(Primary Constructor)
3. [03. 컬렉션과 LINQ 데이터 가공](./01-beginner/03-collections-and-linq.md)
   - `List<T>`, `Dictionary<TKey, TValue>`, `HashSet<T>`
   - LINQ 핵심 연산자 (`Where`, `Select`, `OrderBy`, `FirstOrDefault`, `GroupBy`)
   - 지연 평가(Deferred Execution)와 메모리 즉시 평가(`ToList`)

---

### 🟡 [Part 2] 중급 : 실무 웹 백엔드 핵심 메커니즘
1. [01. 비동기 프로그래밍 완전 정복 (Async / Await)](./02-intermediate/01-async-programming.md)
   - 논블로킹(Non-blocking) I/O와 스레드 풀(Thread Pool) 동작 원리
   - `Task`, `Task<T>`, `ValueTask<T>`의 차이점과 올바른 선택
   - 비동기 취소 토큰(`CancellationToken`)을 활용한 리소스 보호
2. [02. ASP.NET Core 핵심 웹 아키텍처](./02-intermediate/02-aspnetcore-architecture.md)
   - 내장 의존성 주입(DI) 컨테이너: `Transient`, `Scoped`, `Singleton` 수명 주기
   - 미들웨어(Middleware) 파이프라인과 글로벌 예외 처리 (`ProblemDetails`)
   - 컨트롤러(`[ApiController]`) 표준 개발 패턴과 모델 유효성 검증
3. [03. 데이터베이스 연동 & ORM (EF Core 10 & Dapper)](./02-intermediate/03-data-access-and-efcore.md)
   - Entity Framework Core 10 핵심: `DbContext`, `DbSet<T>`
   - Code-First 마이그레이션 (`dotnet ef migrations`)
   - 연관 관계 매핑(1:N, N:M)과 즉시 로딩(`Include`)
   - 대용량 초고속 쿼리를 위한 마이크로 ORM Dapper 활용

---

### 🔴 [Part 3] 고급 : 고성능, 대규모 아키텍처, 운영
1. [01. .NET 10 성능 최적화 & 메모리 관리](./03-advanced/01-performance-and-memory.md)
   - .NET 10 세대별 가비지 컬렉터(GC)와 LOH(대형 객체 힙) 동작 원리
   - 제로 할당(Zero-Allocation) 테크닉: `Span<T>` & `ReadOnlySpan<T>`
   - Native AOT (Ahead-Of-Time) 컴파일과 서버리스 최적화
2. [02. 엔터프라이즈 아키텍처 설계 패턴](./03-advanced/02-enterprise-architecture.md)
   - 멀티 프로젝트 기반 클린 아키텍처 (Domain, Application, Infrastructure, WebApi)
   - CQRS 패턴과 MediatR 파이프라인
   - SignalR을 활용한 실시간 양방향 푸시 통신
3. [03. 보안, 테스트, 배포 운영 (DevOps)](./03-advanced/03-security-testing-devops.md)
   - JWT 토큰 기반 인증 및 Policy 기반 인가(Authorization)
   - 단위 테스트(xUnit, Moq) 및 통합 테스트(`WebApplicationFactory`)
   - 구조화된 로깅(Serilog), 관측성(OpenTelemetry), Docker 컨테이너 패키징
4. [04. C# ASP.NET Core 무료 클라우드 배포 가이드](../free-deployment-guide.md)
   - Render.com 및 Koyeb 무료 호스팅 플랫폼 비교
---

### 🎁 [Appendix] 초보자 실전 부록 & 워크북
1. [📋 실무 치트시트 & 복붙 코드 템플릿](../csharp-cheatsheet.md)
   - REST Controller, Service/Interface, DTO, LINQ 10선, appsettings 읽기 패턴
2. [🚨 자주 겪는 에러 & 트러블슈팅 FAQ](../troubleshooting-faq.md)
   - 파일 잠금 에러(MSB3026), 포트 충돌, CORS 오류, CS0826 배열 추론 해결법
3. [🛠️ 단계별 실습 워크북 (부서 관리 CRUD 완성하기)](../hands-on-tutorial.md)
   - Entity ➔ DTO ➔ Service ➔ Controller ➔ DI 바닥부터 직접 구현하는 실습 가이드

---

## 🗺️ 추천 학습 경로 (Learning Path)

```
[ 현재 프로젝트 코드 둘러보기 ]
   │  Program.cs, UsersController.cs, UserService.cs
   ▼
[ 1단계 : 초급 01 ~ 03 ] ──▶ C# 문법과 LINQ로 비즈니스 로직 작성 역량 확보
   │
   ▼
[ 2단계 : 중급 01 ~ 03 ] ──▶ async/await, DI, EF Core로 실무 REST API 구축
   │
   ▼
[ 3단계 : 고급 01 ~ 03 ] ──▶ Clean Architecture, 성능 튜닝, 보안 및 운영 배포
```
