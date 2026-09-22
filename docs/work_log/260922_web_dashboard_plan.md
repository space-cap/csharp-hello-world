# 팀 관리 포털 대시보드 (Web UI) 구축 계획서

기존에 구축된 C# ASP.NET Core 레이어드 API(`UsersController`)를 기반으로, 브라우저에서 직접 팀원 목록 조회, 실시간 통계, 신규 멤버 등록, 정보 수정, 상태 토글 및 삭제가 가능한 **모던 프리미엄 웹 대시보드**를 구축합니다.

---

## 1. 프론트엔드 아키텍처 및 디자인 방향

- **기술 스택**: 순수 HTML5 + 모던 바닐라 CSS3 + 모던 Vanilla JS (ES6+)
- **서빙 방식**: ASP.NET Core 정적 파일 서빙(`UseDefaultFiles()`, `UseStaticFiles()`, `wwwroot/`)
- **디자인 컨셉**: 
  - 다크/라이트 듀얼 테마 지원
  - 글래스모피즘(Glassmorphism) 및 세련된 HSL 인디고/바이올렛 그라데이션
  - Google Fonts (Inter) 타이포그래피
  - 부드러운 인터랙션, 모달 팝업, 반응형 카드 그리드, 토스트(Toast) 알림

---

## 2. 파일 구조

```
csharp-hello-world/
├── wwwroot/
│   ├── index.html                 # 대시보드 메인 마크업
│   ├── css/
│   │   └── style.css              # 모던 바닐라 CSS (디자인 시스템, 반응형, 애니메이션)
│   └── js/
│       └── app.js                 # API 비동기 연동, 모달, 검색/필터링, 상태 관리
├── Program.cs                     # [수정] UseDefaultFiles(), UseStaticFiles() 추가
└── Controllers/
    └── UsersController.cs         # 기존 API 재활용 (GET, POST, PUT, DELETE)
```

---

## 주요 변경 내용

### 1. ASP.NET Core 설정 (`Program.cs`)

#### Program.cs
- `app.UseDefaultFiles()` 및 `app.UseStaticFiles()` 추가하여 `wwwroot/index.html`을 기본 화면으로 서빙
- 루트(`/`)의 기존 텍스트 JSON 엔드포인트를 `/api/info`로 이동하여 정적 파일 서빙과 충돌 방지

---

### 2. 프론트엔드 리소스 (`wwwroot/`)

#### index.html
- **헤더 & 브랜드**: 로고("CoreTeam"), 실시간 서버 상태 인디케이터, 테마 토글 버튼, "새 멤버 추가" 버튼
- **KPI 통계 카드**: 총 팀원 수, 활성 멤버 수, 비활성 멤버 수, 신규 가입자 수
- **컨트롤 바**: 실시간 이름/이메일 검색창, 필터 탭 (전체 / 활성 / 비활성), 새로고침 버튼
- **멤버 카드 그리드**: 아바타, 이름, 이메일, 가입일자, 상태 뱃지, 수정/삭제/토글 액션 버튼
- **모달 컴포넌트**: 멤버 등록/수정 모달 팝업, 삭제 확인 다이얼로그
- **토스트 컨테이너**: 작업 성공/오류 알림 팝업

#### style.css
- CSS 변수(Variables) 기반의 완벽한 다크/라이트 테마 시스템
- 글래스모피즘 카드 스타일링, 반응형 그리드 (`auto-fit`), 호버 마이크로 애니메이션
- 부드러운 모달 전환 및 플로팅 토스트 애니메이션

#### app.js
- `fetch()`를 통한 `UsersController` REST API 통신 (`GET`, `POST`, `PUT`, `DELETE`)
- 실시간 검색 및 필터링 (렌더링 최적화)
- 실시간 KPI 통계 동적 계산 및 카운트 애니메이션
- 폼 입력 검증 및 친절한 토스트 피드백 표시

---

## 검증 계획

### CLI 검증
1. **정적 파일 서빙 및 API 응답 검증**:
   - `dotnet build` 수행하여 빌드 성공 확인
   - `http://localhost:5167/` 요청 시 HTML200 반환 확인
   - `http://localhost:5167/css/style.css`, `http://localhost:5167/js/app.js` 정적 파일 정상 로드 확인

### 브라우저 시각적 검증
1. 브라우저로 `http://localhost:5167` 접속
2. 초기 3명 사용자(홍길동, 김철수, 이영희)가 카드 목록 및 통계 카드에 정상 출력되는지 확인
3. "새 멤버 추가" 클릭 후 신규 사용자 등록 및 즉시 화면 갱신 확인
4. 활성/비활성 상태 토글 및 삭제 기능 검증
5. 다크/라이트 테마 전환 및 모바일 반응형 레이아웃 확인
