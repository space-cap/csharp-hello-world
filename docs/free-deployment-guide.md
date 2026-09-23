# C# ASP.NET Core 무료 클라우드 배포 가이드

본 문서는 C# ASP.NET Core 웹 애플리케이션(백엔드 API + 정적 웹 UI)을 **신용카드 등록 없이 완전 무료로 인터넷에 배포(무료 HTTPS 도메인 제공)**하기 위한 실무 가이드입니다.

---

## 🏆 무료 호스팅 플랫폼 비교 및 추천

C#은 백엔드 서버(Kestrel)가 상시 구동되어야 하므로 단순 정적 파일 호스팅(GitHub Pages, Vercel 등)이 아닌, **컨테이너 웹 서비스를 무료로 제공하는 PaaS(Platform as a Service)**를 사용해야 합니다.

| 플랫폼 | 무료 티어 스펙 | 특징 및 장점 | 추천도 |
| :--- | :--- | :--- | :--- |
| **🥇 Render (render.com)** | **무료 웹 서비스 (Free Web Service)**<br>RAM 512MB, 무료 SSL (`*.onrender.com`) | **가장 추천!** 카드 등록 불필요, GitHub 레포지토리 연결 시 `Dockerfile`로 자동 빌드 및 자동 배포 지원 | ⭐⭐⭐⭐⭐ (최우선 추천) |
| **🥈 Koyeb (koyeb.com)** | **무료 나노 인스턴스 1개 영구 제공**<br>무료 SSL, 글로벌 엣지 네트워크 | Dockerfile 기반 초고속 배포, 직관적인 대시보드 | ⭐⭐⭐⭐ |
| **Fly.io (fly.io)** | 무료 크레딧 기반 | 전 세계 엣지 배포 가능하나 가입 시 해외 결제 카드 인증 필요 | ⭐⭐⭐ |
| **Azure App Service (F1)** | F1 Free 티어 (하루 60분 무료 CPU) | 마이크로소프트 공식 클라우드이나 무료 플랜 제약이 큼 | ⭐⭐ |

> 💡 **Render를 가장 추천하는 이유**:  
> 1. 신용카드 등록 없이 GitHub 계정만으로 즉시 가입 가능  
> 2. `git push` 할 때마다 자동으로 감지하여 무중단 빌드 & 배포  
> 3. 무료로 `https://[프로젝트명].onrender.com` 영구 도메인 및 SSL 인증서 자동 발급

---

## 🚀 Render.com 무료 배포 3단계 상세 절차

### 1단계: 프로젝트에 `Dockerfile` 및 `.dockerignore` 준비

Render는 프로젝트 루트에 있는 `Dockerfile`을 감지하여 .NET 10 환경을 자동으로 빌드하고 실행합니다.

#### (1) `Dockerfile` (초경량 멀티 스테이지 빌드)
```dockerfile
# 1. 빌드 스테이지 (.NET 10 SDK)
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# 캐시 효율을 위해 csproj 먼저 복사 및 복원
COPY ["csharp-hello-world.csproj", "./"]
RUN dotnet restore

# 전체 소스 복사 및 Release 빌드/발행
COPY . .
RUN dotnet publish "csharp-hello-world.csproj" -c Release -o /app/publish /p:UseAppHost=false

# 2. 실행 스테이지 (초경량 ASP.NET Core 런타임)
FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS final
WORKDIR /app

# 클라우드 환경 기본 포트 설정 (8080)
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "csharp-hello-world.dll"]
```

#### (2) `.dockerignore` (빌드 제외 설정)
```dockerignore
**/.git
**/.vs
**/.idea
**/.vscode
**/bin
**/obj
**/TestResults
```

---

### 2단계: GitHub에 최신 코드 푸시 (Push)

로컬의 커밋들을 GitHub 원격 저장소의 `main` 브랜치로 푸시합니다.
```bash
git push origin main
```

---

### 3단계: Render.com에서 웹 서비스 생성 (3분 컷)

1. **[render.com](https://render.com)** 에 접속하여 **Sign In with GitHub**으로 로그인합니다.
2. 상단 우측의 **`New +`** 버튼을 클릭하고 **`Web Service`**를 선택합니다.
3. **Connect a repository** 목록에서 배포할 **`csharp-hello-world`** 저장소를 선택하고 **`Connect`**를 클릭합니다.
4. 기본 설정 화면에서 아래 항목들을 확인합니다:
   - **Name**: 원하는 서비스 이름 입력 (예: `my-csharp-portal`)
   - **Region**: `Singapore` 또는 `Frankfurt` (한국 접속 시 Singapore 추천)
   - **Branch**: `main`
   - **Runtime / Environment**: `Docker` (자동 감지됨)
   - **Instance Type**: **`Free`** ($0/month) 선택
5. 맨 아래 **`Create Web Service`** 버튼을 누릅니다!
6. 약 2~3분간 도커 빌드가 진행된 후, 상단에 표시되는 **`https://my-csharp-portal.onrender.com`** 링크를 클릭하면 전 세계 어디서든 동작하는 웹페이지가 열립니다.

---

## ⚠️ 무료 티어 이용 시 꼭 알아두어야 할 점

1. **콜드 스타트 (Cold Start / Sleep)**:
   - 무료 인스턴스는 15분 동안 외부 요청(트래픽)이 없으면 서버가 절전 모드(Spin down)로 들어갑니다.
   - 이후 다시 접속할 때 첫 요청에서 서버가 켜지느라 약 30~50초 정도 로딩이 발생할 수 있습니다.
   - 한 번 켜진 이후에는 매우 빠른 속도로 정상 작동합니다.
2. **메모리 한도 (512MB RAM)**:
   - .NET 10은 기본 메모리 사용량이 약 30~50MB 수준으로 매우 가벼우므로 512MB 무료 한도 안에서 충분히 여유롭게 작동합니다.
3. **인메모리 데이터 초기화**:
   - 현재 프로젝트는 별도 외부 DB 없이 C#의 인메모리(`ConcurrentDictionary`)를 사용 중이므로, 서버가 재시작(절전 모드 해제 또는 재배포)되면 추가한 사용자가 초기 3명(홍길동, 김철수, 이영희)으로 리셋됩니다.
   - 영구 저장이 필요할 경우 SQLite 파일 마운트 또는 무료 PostgreSQL(Render에서 무료 DB 제공)을 연결하면 해결됩니다.
