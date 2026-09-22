# C# & .NET 10 단계별 학습 로드맵 (초/중/고급) 작성 계획서

C# 및 .NET 10의 기초가 없는 상태에서 웹 개발을 진행하는 개발자를 위해, 단순한 문법 나열을 넘어 **실무 웹 애플리케이션 개발에 꼭 필요한 핵심 개념과 .NET 10의 최신 특성**을 단계별(초급/중급/고급)로 체계화한 학습 가이드 문서를 작성합니다.

---

## 1. 문서 작성 목적 및 방향성

1. **웹 개발 실무 중심**: 복잡한 이론보다는 실제 ASP.NET Core 웹 프로젝트(방금 만든 `Program.cs`, `Controllers`, `Services` 등)와 직결되는 개념 위주로 구성합니다.
2. **기존 배경 지식과의 연결**: Spring Boot / Java 개발자 관점에서 직관적으로 대응(Mapping)되는 개념을 명시하여 학습 속도를 극대화합니다.
3. **.NET 10 최신 특성 반영**: C# 최신 버전(C# 13/14)과 .NET 10 LTS 환경의 현대적인 문법(Top-level statement, Record, Primary Constructor, Pattern Matching 등)을 강조합니다.

---

## 2. 생성할 문서 위치 및 파일명

- **메인 학습 문서**: [docs/csharp-net10-curriculum.md](file:///h:/lee/csharp-hello-world/docs/csharp-net10-curriculum.md)
- **작업 계획서 아카이빙**: [docs/work_log/260922_csharp_curriculum_plan.md](file:///h:/lee/csharp-hello-world/docs/work_log/260922_csharp_curriculum_plan.md)

---

## 3. 세부 목차 및 다룰 내용 구성

### 🟢 초급 (Beginner) : C# 언어 기초 & .NET 10 웹 개발 첫걸음
> **목표**: `Program.cs`와 Controller, Model 코드를 보고 문법을 자유롭게 읽고 쓸 수 있는 수준

1. **.NET 10 런타임과 생태계 이해**
   - CLR(Common Language Runtime)과 Kestrel 웹 서버
   - `.csproj` 파일 구조와 의존성 관리 (`<TargetFramework>net10.0</TargetFramework>`, NuGet)
   - CLI 기본 명령어 (`dotnet build`, `dotnet run`, `dotnet watch`)
2. **현대적인 C# 기초 문법**
   - 최상위 문(Top-Level Statements)과 네임스페이스 선언
   - 변수, var 타입 추론, Nullable 참조 형식 (`string?`과 null 안전성)
   - 불변 데이터 모델: `class` vs `struct` vs **`record`**
   - 프로퍼티 문법 (`{ get; set; }`, `init` 전용 세터)
   - 기본 생성자(Primary Constructor)로 코드 줄이기
3. **컬렉션과 LINQ (데이터 다루기)**
   - `List<T>`, `Dictionary<TKey, TValue>`, `Array`
   - LINQ의 핵심 메서드 (`Where`, `Select`, `OrderBy`, `FirstOrDefault`, `ToList`)

---

### 🟡 중급 (Intermediate) : 실무 웹 백엔드 핵심 메커니즘
> **목표**: 레이어드 아키텍처 기반으로 DB를 연동하고 안전한 비즈니스 로직을 구축할 수 있는 수준

1. **비동기 프로그래밍 (Async / Await)**
   - `Task`, `Task<T>`, `ValueTask<T>`의 개념
   - 논블로킹(Non-blocking) I/O와 스레드 풀 동작 원리
   - 취소 토큰(`CancellationToken`)을 활용한 타임아웃/취소 처리
2. **ASP.NET Core 핵심 아키텍처**
   - 의존성 주입(DI) 컨테이너: `AddTransient`, `AddScoped`, `AddSingleton`의 수명 주기 비교
   - 미들웨어 파이프라인: `UseRouting()`, `UseStaticFiles()`, 커스텀 미들웨어 동작 원리
   - 컨트롤러(`[ApiController]`) vs Minimal API 선택 기준
   - DTO 검증과 전역 예외 처리 (`ProblemDetails`, `IExceptionHandler`)
3. **데이터베이스 연동 (EF Core 10 & Dapper)**
   - Entity Framework Core의 핵심 구조: `DbContext`, `DbSet<T>`
   - Code-First 마이그레이션 (`dotnet ef migrations`)
   - 관계 매핑 (1:N, N:M)과 Lazy/Eager Loading (`Include`)
   - 초고속 마이크로 ORM Dapper의 활용법

---

### 🔴 고급 (Advanced) : 고성능, 대규모 아키텍처, 운영
> **목표**: 엔터프라이즈 환경에서 성능을 튜닝하고 확장 가능한 시스템을 설계할 수 있는 수준

1. **.NET 10 고성능 & 메모리 최적화**
   - .NET GC(가비지 컬렉터) 세대별 동작 방식
   - 제로 할당(Zero-Allocation) 기법: `Span<T>`, `ReadOnlySpan<T>`, `Memory<T>`
   - Native AOT (Ahead-Of-Time) 컴파일 (초경량 컨테이너, 수 ms 단위 콜드 스타트)
2. **엔터프라이즈 설계 패턴**
   - 멀티 프로젝트 기반 클린 아키텍처 (Clean Architecture / Onion)
   - CQRS 패턴과 MediatR 라이브러리 연동
   - 실시간 양방향 통신: SignalR (WebSocket 기반 실시간 푸시)
3. **보안, 테스트, 배포 운영**
   - JWT 토큰 기반 인증 및 Role/Policy 인가(Authorization)
   - 단위 테스트(xUnit, Moq) 및 통합 테스트(`WebApplicationFactory`)
   - OpenTelemetry 및 구조화된 로깅(Serilog)
   - Docker 컨테이너라이징 및 CI/CD 파이프라인

---

## 4. 검증 계획

- **문서 무결성 검증**: 마크다운 문법 오류, 링크 경로 및 코드 예제 유효성 검토
- **작업 계획서 보존**: [docs/work_log/260922_csharp_curriculum_plan.md](file:///h:/lee/csharp-hello-world/docs/work_log/260922_csharp_curriculum_plan.md) 파일로 아카이빙
