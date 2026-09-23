# C# & ASP.NET Core 자주 겪는 에러 & 트러블슈팅 FAQ

C# 및 ASP.NET Core 개발 중 초보자가 가장 흔히 겪는 **대표적인 오류 7가지와 원인, 즉시 해결 명령어 모음집**입니다. 문제가 생겼을 때 이 문서를 먼저 찾아보세요!

---

## 📑 에러 목록 바로가기
1. [파일 잠금 에러 (MSB3026 / MSB3027)](#1-파일-잠금-에러-msb3026--msb3027)
2. ['dotnet' 명령어를 찾을 수 없음 (CommandNotFoundException)](#2-dotnet-명령어를-찾을-수-없음)
3. [포트 충돌 에러 (Address already in use)](#3-포트-충돌-에러-address-already-in-use)
4. [CORS 오류 (Failed to fetch / Access-Control-Allow-Origin)](#4-cors-오류-failed-to-fetch)
5. [배열 형식 추론 에러 (CS0826)](#5-배열-형식-추론-에러-cs0826)
6. [널 참조 에러 (NullReferenceException)](#6-널-참조-에러-nullreferenceexception)
7. [JSON 대소문자 매핑 불일치 문제](#7-json-대소문자-매핑-불일치-문제)

---

## 1. 파일 잠금 에러 (MSB3026 / MSB3027)

### 🚨 에러 메시지
```text
warning MSB3026: "apphost.exe"을(를) "csharp-hello-world.exe"(으)로 복사할 수 없습니다.
The process cannot access the file ... because it is being used by another process.
파일이 "csharp-hello-world (28368)"에 의해 잠겨 있습니다.
error MSB3027: 재시도 횟수(10)를 초과하여 작업을 수행하지 못했습니다.
```

### 🔍 원인
Windows OS에서는 **실행 중인 `.exe` 파일**을 덮어쓰거나 삭제할 수 없습니다. 이전에 실행한 서버 프로세스가 터미널이나 백그라운드에서 아직 켜져 있는 상태에서 `dotnet run`이나 `dotnet build`를 다시 시도했기 때문입니다.

### ✅ 즉시 해결법
터미널에서 프로세스를 강제 종료합니다.

**PowerShell에서 실행:**
```powershell
Stop-Process -Name csharp-hello-world -Force -ErrorAction SilentlyContinue
```

**명령 프롬프트 (CMD)에서 실행:**
```cmd
taskkill /F /IM csharp-hello-world.exe
```

> **예방 팁**: 서버를 구동 중인 터미널 창에서 반드시 <kbd>Ctrl</kbd> + <kbd>C</kbd>를 눌러 완전히 종료한 후 다시 실행하세요.

---

## 2. 'dotnet' 명령어를 찾을 수 없음

### 🚨 에러 메시지
```text
dotnet : 'dotnet' 용어가 cmdlet, 함수, 스크립트 파일 또는 실행할 수 있는 프로그램 이름으로 인식되지 않습니다.
```

### 🔍 원인
Windows 시스템 환경 변수 `PATH`에 .NET 설치 경로가 등록되어 있지 않거나, SDK 설치 직후 터미널 창을 재시작하지 않은 경우입니다.

### ✅ 즉시 해결법
1. **임시 실행**: 전체 경로로 직접 실행해 봅니다.
   ```powershell
   & "C:\Program Files\dotnet\dotnet.exe" --version
   ```
2. **영구 해결**:
   - `Windows 키` ➔ **'시스템 환경 변수 편집'** 검색 후 실행
   - **'환경 변수(N)...'** 버튼 클릭
   - `시스템 변수`의 **Path** 항목을 더블클릭하고 아래 경로를 추가:
     ```text
     C:\Program Files\dotnet\
     ```
   - 열려 있는 모든 터미널(VS Code, PowerShell, CMD)을 완전히 닫고 다시 엽니다.

---

## 3. 포트 충돌 에러 (Address already in use)

### 🚨 에러 메시지
```text
System.IO.IOException: Failed to bind to address http://localhost:5167: address already in use.
```

### 🔍 원인
다른 프로그램이나 종료되지 않은 이전 .NET 프로세스가 이미 `5167` 포트를 점유하고 있기 때문입니다.

### ✅ 즉시 해결법

#### 방법 A: 해당 포트를 점유 중인 프로세스 찾아 죽이기
```powershell
# 5167 포트를 쓰는 프로세스의 PID 찾기
netstat -ano | findstr :5167

# 찾은 PID 번호로 강제 종료 (예: PID가 1234인 경우)
taskkill /F /PID 1234
```

#### 방법 B: 프로젝트 포트 번호 변경하기
[Properties/launchSettings.json](file:///h:/lee/csharp-hello-world/Properties/launchSettings.json) 파일을 열고 포트 번호를 다른 번호(예: `5200`, `7100`)로 수정합니다:
```json
"applicationUrl": "http://localhost:5200"
```

---

## 4. CORS 오류 (Failed to fetch)

### 🚨 브라우저 콘솔 에러 메시지
```text
Access to fetch at 'http://localhost:5167/api/users' from origin 'http://localhost:3000'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present.
```

### 🔍 원인
브라우저의 보안 정책(SOP) 때문에, 프론트엔드 포트(예: 3000)와 백엔드 API 포트(예: 5167)가 다르면 브라우저가 통신을 차단합니다. 백엔드에서 명시적으로 허용해 주어야 합니다.

### ✅ 즉시 해결법
[Program.cs](file:///h:/lee/csharp-hello-world/Program.cs)에 CORS 미들웨어를 추가합니다:

```csharp
var builder = WebApplication.CreateBuilder(args);

// 1. 모든 오리진 허용 정책 등록 (개발용)
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

// 2. 반드시 라우팅/컨트롤러 매핑 전에 app.UseCors() 호출!
app.UseCors("AllowAll");

app.MapControllers();
app.Run();
```

---

## 5. 배열 형식 추론 에러 (CS0826)

### 🚨 컴파일 에러 메시지
```text
error CS0826: 암시적으로 형식화된 배열에 가장 적합한 형식이 없습니다.
```

### 🔍 원인
`new[] { ... }` 문법으로 배열을 만들 때, 요소들의 형태나 속성이 서로 다르면 컴파일러가 공통 타입을 추론하지 못해 에러가 발생합니다.

```csharp
// ❌ 에러: 첫 번째 요소는 속성 2개, 두 번째는 속성 3개라 타입 불일치!
var endpoints = new[]
{
    new { method = "GET", path = "/api/users" },
    new { method = "POST", path = "/api/users", body = new { name = "홍길동" } }
};
```

### ✅ 즉시 해결법
배열 앞에 `new object[]`를 명시하여 모든 객체를 담을 수 있도록 선언합니다:

```csharp
// ✅ 해결: new object[] 명시
var endpoints = new object[]
{
    new { method = "GET", path = "/api/users" },
    new { method = "POST", path = "/api/users", body = new { name = "홍길동" } }
};
```

---

## 6. 널 참조 에러 (NullReferenceException)

### 🚨 에러 메시지
```text
System.NullReferenceException: Object reference not set to an instance of an object.
```

### 🔍 원인
값이 없는 `null` 상태인 객체의 프로퍼티나 메서드에 접근하려 했기 때문입니다.

### ✅ 즉시 해결법: C# Null 안전 연산자 활용하기

```csharp
User? user = GetUserOrNull();

// ❌ 위험한 코드: user가 null이면 런타임에 즉시 사망
string name = user.Name; 

// ✅ 안전한 방법 1: Null 조건부 연산자 (?.)
string? name = user?.Name;

// ✅ 안전한 방법 2: Null 병합 연산자 (??)로 기본값 제공
string displayName = user?.Name ?? "이름 없음";

// ✅ 안전한 방법 3: 가드 절 (Guard Clause)
if (user == null)
{
    return NotFound(new { message = "사용자를 찾을 수 없습니다." });
}
```

---

## 7. JSON 대소문자 매핑 불일치 문제

### 🚨 상황
C# 모델에서는 분명히 대문자로 시작하는 `Name`, `IsActive`로 정의했는데, 프론트엔드 자바스크립트에서 `data.Name`을 읽으려니 `undefined`가 나오는 현상.

### 🔍 원인
ASP.NET Core의 기본 JSON 직렬화기(`System.Text.Json`)는 웹 표준 관례에 따라 **모든 프로퍼티를 카멜케이스(camelCase, 첫 글자 소문자)**로 자동 변환하여 클라이언트에 내려줍니다.

- C# 프로퍼티: `public string Name { get; set; }` ➔ JSON: `"name": "홍길동"`
- C# 프로퍼티: `public bool IsActive { get; set; }` ➔ JSON: `"isActive": true`

### ✅ 즉시 해결법
1. **프론트엔드 JS에서는 항상 소문자로 읽기**:
   ```javascript
   // 올바른 접근:
   console.log(user.name);
   console.log(user.isActive);
   ```
2. **C#에서 강제로 특정 JSON 키 이름을 지정하고 싶을 때**:
   ```csharp
   using System.Text.Json.Serialization;

   public class User
   {
       [JsonPropertyName("user_name")] // 원하는 키 이름 강제 지정
       public string Name { get; set; } = string.Empty;
   }
   ```
