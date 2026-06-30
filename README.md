# 장마 전선 실험실 (Jangma Front Laboratory)

> **2026 기상·기후 AI 해커톤 경진대회** 출품작  
> 한반도 지도 위에서 저기압을 직접 움직이며 장마 강수 패턴을 실시간으로 실험하는 교육용 인터랙티브 웹 앱

## 핵심 아이디어

단순한 관찰이 아닌 **"조작 → 즉시 과학적 피드백 → 재조작"** 루프를 통해 중·고등학생이 장마 전선의 원리를 능동적으로 이해할 수 있게 합니다.

### 문제
- 2020~2025년 장마 집중호우 연평균 피해액 2,000억 원 초과
- 기존 기상 교육 콘텐츠 대부분 정적 지도와 영상 설명에 그침
- 학생들이 장마 전선의 이동과 강수 생성 원리를 직접 실험할 기회 부족

### 솔루션
한반도 지도에서 **저기압 마커를 드래그**하고 **3가지 슬라이더**로 조작하면:
- AI 서러게이트 모델이 실시간으로 8개 주요 도시의 강수량을 추론
- 색상 원으로 강수 강도 시각화
- AI가 교육 전문가 관점에서 2~3문장 피드백 즉시 제공

## AI 적용 포인트 (기상·기후 AI 해커톤)

이 프로젝트의 "AI"는 두 개의 층으로 구성됩니다.

1. **AI 서러게이트(대리) 모델** — 핵심 추론 엔진(`lib/simulation.ts`).
   수치예보(NWP)처럼 무거운 물리 시뮬레이션을 대신해 입력(위치·강도·속도·해수면온도)에서
   강수 출력으로의 관계를 경량 함수로 **에뮬레이트**합니다. Clausius–Clapeyron 관계
   (수온 1°C↑ → 수증기 ~7%↑), 거리 지수감쇠, 전선 비대칭성 등 기상 물리를 반영해
   브라우저에서 지연 없이 추론합니다. *(서러게이트 모델은 기후·기상 ML에서 널리 쓰이는 기법입니다.)*
2. **설명가능한 요인 분해(XAI)** — `FactorAnalysis`가 각 입력이 출력 강수에 기여한 정도를
   분해해 보여줘 "블랙박스가 아닌" 모델임을 강조합니다.
3. **생성형 LLM 보강(선택)** — 서버 배포 시 Gemini/Grok로 자연어 해석을 생성합니다.
   (정적 데모에서는 기본 비활성)

## 기술 스택

- **Framework**: Next.js 16 (App Router, Turbopack) + TypeScript
- **지도**: Leaflet + React-Leaflet
- **시각화**: Recharts
- **상태 관리**: Zustand
- **스타일**: Tailwind CSS v4
- **AI 추론**: 경량 서러게이트 모델(클라이언트) + 선택적 생성형 LLM(서버)
- **배포**: GitHub Pages(정적 데모) / Vercel(LLM 포함 풀 데모)

## 주요 기능

1. **드래그 가능한 저기압 마커** — Leaflet에서 직접 위치 이동
2. **3개 슬라이더**
   - 전선 강도 (10~100)
   - 이동 속도 (5~100)
   - 해수면 온도 (22~29.5°C)
3. **실시간 강수 시각화** — 8개 도시 + 컬러 원 + 전선 라인
4. **AI 교육 피드백** — 서러게이트 모델 출력 기반 해석 + 선택적 Gemini/Grok 연동
5. **5개 프리셋 시나리오** — 실제 과거 사례 기반
6. **반응형** — 모바일에서도 완벽 동작

## 로컬 실행

```bash
npm install
npm run dev
```

http://localhost:3000 에서 확인 가능

## 배포

### GitHub Pages — 기본 정적 데모 (서러게이트 모델만)

정적 내보내기(`output: 'export'`)로 배포됩니다. 정적 호스팅에는 서버리스 API route를
둘 수 없으므로 생성형 LLM 버튼은 자동으로 숨겨지고, 클라이언트 서러게이트 모델 + 규칙 기반
해석만 동작합니다.

1. 레포 Settings → Pages → **Source**를 "GitHub Actions"로 변경
2. `main` 브랜치에 푸시하면 자동 빌드 + 배포됨
3. 배포 후 사이트: https://ahagoitda.github.io/weather/

### Vercel — LLM 포함 풀 데모

생성형 LLM 해석까지 보여주려면 서버 런타임이 필요하므로 Vercel을 권장합니다.

```bash
# 루트 경로 + LLM 활성화로 빌드
NEXT_PUBLIC_BASE_PATH=""           # Vercel은 루트(/)에서 서빙
NEXT_PUBLIC_LLM_ENABLED=true       # /api/feedback 라우트 + 'AI 해석 요청' 버튼 노출
GEMINI_API_KEY=your_key_here       # (또는 GROK_API_KEY)
```

> 환경 변수 설명
> - `NEXT_PUBLIC_BASE_PATH` — 앱이 서빙되는 하위 경로. GitHub Pages는 `/weather`(기본값), Vercel은 빈 문자열.
> - `NEXT_PUBLIC_LLM_ENABLED` — `true`면 서버 런타임으로 빌드되어 LLM 보강이 켜집니다. 미설정 시 정적 export.

## 프로젝트 구조

```
app/
├── api/feedback/route.ts   # 선택적 생성형 LLM 피드백 (서버 배포 시)
├── layout.tsx
└── page.tsx
components/
├── JangmaMap.tsx           # 핵심 Leaflet 지도 + 드래그
├── ParameterControls.tsx   # 슬라이더 + 프리셋
├── FeedbackPanel.tsx       # AI 교육 피드백
├── FactorAnalysis.tsx      # 설명가능한 요인 분해 (XAI)
├── HistoricalComparison.tsx# 과거 사례 비교
├── RainStats.tsx           # Recharts 차트
└── JangmaMapWrapper.tsx
lib/
├── simulation.ts           # AI 서러게이트(대리) 추론 엔진 (핵심)
├── types.ts
└── feedback.ts             # 교육 피드백 생성기
store/
└── useJangmaStore.ts
```

## 교육적 설계 포인트

- **강도 ↑ + 속도 ↓ + 수온 ↑** = 정체형 극한 호우 (2023년 사례)
- **속도 ↑** = 빠른 이동으로 피해 범위 분산
- **위치** = 남쪽 vs 북쪽에 따른 지역별 강수 편차 직접 체감

## 향후 확장 아이디어

- 실제 KMA API 연동 (과거 관측 데이터 비교)
- 시간 축 재생 (애니메이션)
- 사용자 실험 기록 공유 기능
- 더 정교한 surrogate 모델 (Python → ONNX)

## 라이선스

교육 및 해커톤 목적으로 자유롭게 사용 가능

---

**팀명**: (여기에 팀명)  
**제출일**: 2026년
