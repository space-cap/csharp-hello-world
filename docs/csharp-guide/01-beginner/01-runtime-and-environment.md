# 01. .NET 10 런타임과 개발 환경

> **소속**: [🟢 Part 1. 초급](../README.md#part-1-초급--언어-기초--net-10-웹-개발-입문)  
> **핵심 키워드**: CLR, Kestrel, csproj, NuGet, CLI, launchSettings.json

---

## 1. .NET 10 플랫폼 아키텍처

Java와 C#은 가상 머신(VM) 위에서 동작한다는 기본 철학이 매우 유사합니다.

```
[ 개발자가 작성한 C# 소스코드 (.cs) ]
                 │
                 ▼ (Roslyn 컴파일러)
[ IL (Intermediate Language) 중간 언어 + 메타데이터 (.dll) ]
                 │
                 ▼ (CLR의 JIT 컴파일러)
[ 실행 환경의 네이티브 기계어 (x64 / ARM64) 직접 실행 ]
```

### (1) CLR (Common Language Runtime)
- Java의 **JVM**에 해당하는 .NET의 런타임 엔진입니다.
- 메모리 관리(Garbage Collection), 스레드 관리, 예외 처리, 타입 안전성 검사를 담당합니다.
- .NET 10 CLR은 JIT(Just-In-Time) 컴파일러에 Dynamic PGO(Profile-Guided Optimization)가 극대화되어 실행 시간에 가장 자주 호출되는 코드를 자동으로 최고 속도로 재최적화합니다.

### (2) Kestrel 내장 웹 서버
- ASP.NET Core의 기본 내장 HTTP 서버입니다. (Spring Boot의 Tomcat에 대응)
- libuv 기반의 비동기 I/O를 적극 활용하며, 운영체제(Linux, Windows, macOS)에 최적화된 소켓 드라이버를 직접 사용합니다.
- 가볍고 빠르며 수십만 RPS(초당 요청 수)를 가볍게 소화하여 C++/Rust 기반 서버와 어깨를 나란히 합니다.

---

## 2. 프로젝트 파일(`*.csproj`) 완전 분석

Java의 `pom.xml`이나 `build.gradle`에 해당하는 C#의 프로젝트 설정 파일입니다.

```xml
<Project Sdk="Microsoft.NET.Sdk.Web">

  <PropertyGroup>
    <!-- 1. 타겟 프레임워크: .NET 10 LTS 지정 -->
    <TargetFramework>net10.0</TargetFramework>

    <!-- 2. Nullable 참조 형식 활성화 (컴파일 타임 null 검증) -->
    <Nullable>enable</Nullable>

    <!-- 3. 자주 쓰이는 기본 네임스페이스 자동 using (System, System.Linq 등) -->
    <ImplicitUsings>enable</ImplicitUsings>

    <!-- 4. 프로젝트의 루트 네임스페이스 -->
    <RootNamespace>csharp_hello_world</RootNamespace>
  </PropertyGroup>

  <!-- 외부 라이브러리(NuGet 패키지) 의존성 -->
  <ItemGroup>
    <!-- 예: EF Core SQLite 패키지 설치 시 여기에 자동 추가됨 -->
    <!-- <PackageReference Include="Microsoft.EntityFrameworkCore.Sqlite" Version="10.0.0" /> -->
  </ItemGroup>

</Project>
```

---

## 3. 실무 필수 .NET CLI 명령어

터미널에서 가장 빈번하게 사용하는 필수 명령어 목록입니다.

| 명령어 | 설명 | 실무 활용 팁 |
| :--- | :--- | :--- |
| `dotnet --version` | 설치된 .NET SDK 버전 확인 | 개발 환경 검증 시 |
| `dotnet build` | 프로젝트 컴파일 및 오류 확인 | 빌드 오류 점검 |
| `dotnet run` | 프로젝트 빌드 및 즉시 실행 | 로컬 개발 서버 구동 |
| `dotnet watch` | 코드 변경 시 자동 리로드 (Hot Reload) | 프론트/API 동시 개발 시 강력 추천 |
| `dotnet add package <이름>` | NuGet 패키지(외부 라이브러리) 설치 | Maven/Gradle 의존성 추가와 동일 |
| `dotnet clean` | `bin/`, `obj/` 빌드 산출물 초기화 | 파일 락이나 빌드 꼬임 발생 시 |

---

## 4. 환경 설정 파일 (`launchSettings.json` vs `appsettings.json`)

### (1) `Properties/launchSettings.json` (로컬 개발 전용)
- 개발자의 로컬 PC에서 `dotnet run` 할 때 사용할 **포트 번호(HTTP/HTTPS)**와 **환경 변수**를 지정합니다.
- Git에 공유되거나 로컬 전용으로 둘 수 있으며, **실제 프로덕션 배포 시에는 전혀 읽히지 않습니다.**

```json
{
  "profiles": {
    "http": {
      "commandName": "Project",
      "applicationUrl": "http://localhost:5167",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    }
  }
}
```

### (2) `appsettings.json` (실무 설정 파일)
- Spring Boot의 `application.yml`에 대응되는 핵심 설정 파일입니다.
- DB 연결 문자열(Connection String), 외부 API 키, 로깅 레벨 등을 정의합니다.
- 환경에 따라 `appsettings.Development.json`, `appsettings.Production.json`으로 자동 오버라이드됩니다.
