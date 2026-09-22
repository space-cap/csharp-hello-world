# 실무 표준 레이어드 아키텍처 (Layered Architecture) 도입 계획서

현재 단일 파일(`Program.cs`)의 Minimal API 형태인 프로젝트를 실무 엔터프라이즈 환경에서 가장 보편적으로 사용되는 **표준 레이어드 구조 (Controller - Service - Model - Middleware)**로 확장합니다.

---

## 1. 아키텍처 설계 개요

Spring Boot의 표준 개발 패턴(`@RestController` - `@Service` - `Repository` - `Entity/DTO`)과 1:1로 대응되는 C# ASP.NET Core 구조를 구축합니다.

```
csharp-hello-world/
├── Controllers/
│   └── UsersController.cs             # [Presentation] RESTful API 컨트롤러 ([ApiController])
├── Services/
│   ├── IUserService.cs                # [Business] 인터페이스 (DI 추상화)
│   └── UserService.cs                 # [Business] 비즈니스 로직 및 인메모리 저장소 (LINQ, async)
├── Models/
│   ├── Entities/
│   │   └── User.cs                    # [Domain] 사용자 엔티티 모델
│   └── DTOs/
│       ├── CreateUserRequest.cs       # [Data Transfer] 사용자 생성 요청 (C# record)
│       └── UserResponse.cs            # [Data Transfer] 사용자 응답 DTO (C# record)
├── Middlewares/
│   └── GlobalExceptionHandlerMiddleware.cs # [Cross-Cutting] 전역 예외 처리 미들웨어
├── Program.cs                         # [Composition Root] DI 등록, 미들웨어 파이프라인 구성
└── Properties/
    └── launchSettings.json            # 실행 및 포트 설정 유지
```

---

## 핵심 고려 사항

- 별도의 외부 NuGet 패키지(예: 무거운 DB 드라이버) 설치 없이 **.NET 10 Web SDK 기본 내장 기능**만으로 동작하도록 설계하여 즉시 빌드 및 실행이 가능합니다.
- 데이터 저장은 실무 패턴을 그대로 학습할 수 있도록 `ConcurrentDictionary` 기반의 스레드 안전(Thread-safe)한 비동기(Async) 인메모리 저장소로 구현됩니다.
- 루트 URL(`http://localhost:5167/`)로 접속 시 API 사용 가이드와 등록된 엔드포인트 목록을 확인할 수 있는 안내 화면을 함께 제공합니다.

---

## 변경 상세 내용

### 1. 도메인 및 DTO 계층 (`Models/`)

#### User.cs
- 사용자 식별자(`Id`), 이름(`Name`), 이메일(`Email`), 가입일시(`CreatedAt`), 활성 여부(`IsActive`)를 가진 도메인 엔티티 정의.

#### UserDto.cs
- C#의 불변 `record` 문법을 활용한 요청/응답 DTO:
  - `CreateUserRequest(string Name, string Email)`
  - `UpdateUserRequest(string Name, bool IsActive)`
  - `UserResponse(int Id, string Name, string Email, DateTime CreatedAt, bool IsActive)`

---

### 2. 비즈니스 서비스 계층 (`Services/`)

#### IUserService.cs
- 비즈니스 인터페이스 정의:
  - `Task<IEnumerable<UserResponse>> GetAllUsersAsync()`
  - `Task<UserResponse?> GetUserByIdAsync(int id)`
  - `Task<UserResponse> CreateUserAsync(CreateUserRequest request)`
  - `Task<UserResponse?> UpdateUserAsync(int id, UpdateUserRequest request)`
  - `Task<bool> DeleteUserAsync(int id)`

#### UserService.cs
- `IUserService` 구현체:
  - 스레드 안전한 `ConcurrentDictionary`와 초기 샘플 데이터 포함
  - C# LINQ 필터링 및 비동기 `Task` 처리

---

### 3. 프레젠테이션 계층 (`Controllers/`)

#### UsersController.cs
- `[ApiController]` 및 `[Route("api/[controller]")]` 기반 컨트롤러
- 생성자 주입을 통한 `IUserService` 의존성 주입(DI)
- HTTP 메서드 매핑: `GET`, `POST`, `PUT`, `DELETE`
- 적절한 HTTP 상태 코드 반환 (`200 OK`, `201 Created`, `404 NotFound`, `400 BadRequest`)

---

### 4. 공통 인프라 계층 (`Middlewares/`)

#### GlobalExceptionHandlerMiddleware.cs
- 컨트롤러 전반에서 발생하는 예외를 잡아서 표준 JSON 형태(RFC 7807 호환 오류 응답)로 반환하는 전역 예외 처리 미들웨어

---

### 5. 애플리케이션 진입점 (`Program.cs`)

#### Program.cs
- 컨트롤러 서비스 등록: `builder.Services.AddControllers()`
- 비즈니스 서비스 DI 등록: `builder.Services.AddScoped<IUserService, UserService>()`
- 미들웨어 파이프라인 구성:
  - 전역 예외 처리 미들웨어 활성화
  - `app.MapControllers()`로 컨트롤러 라우팅 활성화
  - 루트 경로(`/`)에 API 안내 대시보드 엔드포인트 제공

---

## 검증 계획

### CLI 검증
1. **기존 프로세스 정리**:
   - `Stop-Process -Name csharp-hello-world -Force`
2. **프로젝트 빌드 검증**:
   - `dotnet build`
3. **API 엔드포인트 기능 테스트 (PowerShell `Invoke-RestMethod`)**:
   - `GET /` (대시보드/안내)
   - `GET /api/users` (전체 조회)
   - `POST /api/users` (새 사용자 생성)
   - `GET /api/users/{id}` (단건 조회)
   - `DELETE /api/users/{id}` (삭제)
