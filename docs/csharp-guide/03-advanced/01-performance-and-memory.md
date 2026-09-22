# 01. .NET 10 성능 최적화 & 메모리 관리

> **소속**: [🔴 Part 3. 고급](../README.md#part-3-고급--고성능-대규모-아키텍처-운영)  
> **핵심 키워드**: Garbage Collection (GC), LOH, Span<T>, ReadOnlySpan<T>, Native AOT

---

## 1. .NET 10 가비지 컬렉터 (GC) 아키텍처

.NET의 가비지 컬렉터는 메모리를 객체의 수명에 따라 **세대(Generation)**별로 분할하여 검사 비용을 최소화합니다.

```
[ Gen 0 ]  방금 할당된 객체들 (단기 수명, 함수 내 로컬 변수). 빈번하게 수거되며 매우 빠름 (수 ms)
    │  (생존 시 승격)
    ▼
[ Gen 1 ]  Gen 0 수거에서 살아남은 객체들 (중기 수명 버퍼)
    │  (생존 시 승격)
    ▼
[ Gen 2 ]  오래 살아남은 장기 객체들 (싱글톤 서비스, 전역 캐시). Full GC 발생 시 일시 정지(Stop the world) 비용 큼
───────
[ LOH (Large Object Heap) ]  85,000바이트(약 85KB) 이상의 거대 객체(대형 배열, 이미지 버퍼). 파편화 방지 위해 별도 관리
```

> **성능 황금률**: **"가장 빠른 GC는 할당하지 않는 것이다 (Zero Allocation)"**

---

## 2. 제로 할당의 핵심: `Span<T>` & `ReadOnlySpan<T>`

대규모 트래픽 환경에서 문자열을 자르거나(`Substring`), 바이트 배열을 파싱할 때 `new` 키워드로 새로운 힙 객체를 계속 만들면 GC가 멈칫거리게 됩니다.
`Span<T>`은 메모리 복사 없이 **연속된 메모리의 특정 구간을 포인터처럼 가리키는 뷰(View)**입니다.

```csharp
string rawData = "ORDER_20260922_USER9876";

// ❌ 기존 방식: Substring() 호출마다 새로운 string 객체가 힙에 할당됨
string orderId = rawData.Substring(6, 8); // "20260922" (힙 메모리 사용)

// ✅ 고성능 방식: AsSpan()을 사용하면 힙 할당이 0 bytes!
ReadOnlySpan<char> span = rawData.AsSpan(6, 8); // "20260922"
int dateNumber = int.Parse(span); // int 파싱도 Span을 직접 지원
```

---

## 3. Native AOT (Ahead-Of-Time) 컴파일

### (1) JIT vs AOT
* **전통적인 JIT (Just-In-Time)**: 앱 실행 시 IL 코드를 기계어로 컴파일. 초기 구동 시간(Cold-Start)이 다소 걸리고 CLR 런타임 메모리가 필요함.
* **Native AOT**: 빌드 머신에서 미리 특정 OS/CPU 아키텍처용 **완전한 네이티브 바이너리(기계어)**를 생성.

```
                  전통적인 빌드                   Native AOT 빌드
              ─────────────────              ──────────────────
빌드 결과물:      *.dll (IL 바이트코드)          단일 실행 파일 (*.exe 또는 바이너리)
런타임 필요:      .NET 런타임 설치 필수            런타임 필요 없음 (자체 포함)
기동 속도:       수백 ms ~ 수 초                  3ms ~ 10ms (초고속 즉시 기동)
메모리 풋프린트:  30MB ~ 80MB                    8MB ~ 15MB
도커 이미지 크기: 150MB ~ 250MB                  15MB ~ 30MB (Chiseled Ubuntu)
```

### (2) AOT 활성화 방법 (`*.csproj`)
```xml
<PropertyGroup>
  <PublishAot>true</PublishAot>
</PropertyGroup>
```

> **활용 분야**: AWS Lambda, Azure Functions 같은 서버리스 환경 및 대규모 마이크로서비스(Kubernetes Pod) 환경에서 인프라 비용을 극적으로 절감할 수 있습니다.
