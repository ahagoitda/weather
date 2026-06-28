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
- 실시간으로 8개 주요 도시의 강수량이 변함
- 색상 원으로 강수 강도 시각화
- AI가 교육 전문가 관점에서 2~3문장 피드백 즉시 제공

## 기술 스택

- **Framework**: Next.js 14 (App Router) + TypeScript
- **지도**: Leaflet + React-Leaflet
- **시각화**: Recharts
- **상태 관리**: Zustand
- **스타일**: Tailwind CSS
- **배포**: Vercel

**핵심 차별점**: 완전한 ML 모델 대신 JavaScript 기반의 **물리 근사 규칙**(Surrogate Model)을 사용하여 브라우저에서 즉시 동작하면서도 과학적으로 의미 있는 결과를 제공합니다.

## 주요 기능

1. **드래그 가능한 저기압 마커** — Leaflet에서 직접 위치 이동
2. **3개 슬라이더**
   - 전선 강도 (10~100)
   - 이동 속도 (5~100)
   - 해수면 온도 (22~29.5°C)
3. **실시간 강수 시각화** — 8개 도시 + 컬러 원 + 전선 라인
4. **AI 교육 피드백** — 고품질 규칙 기반 + 선택적 Gemini/Grok 연동
5. **5개 프리셋 시나리오** — 실제 과거 사례 기반
6. **반응형** — 모바일에서도 완벽 동작

## 로컬 실행

```bash
npm install
npm run dev
```

http://localhost:3000 에서 확인 가능

## Vercel 배포

1. `vercel` CLI 또는 GitHub 연동
2. (선택) Gemini 피드백 사용 시 환경 변수 설정:
   ```
   GEMINI_API_KEY=your_key_here
   ```
3. 자동 배포 완료

## GitHub Pages 배포 (데모용)

이 프로젝트는 정적 내보내기(`output: 'export'`)로 GitHub Pages에 배포됩니다.

1. 레포 Settings → Pages → **Source**를 "GitHub Actions"로 변경
2. `main` 브랜치에 푸시하면 자동 빌드 + 배포됨
3. 배포 후 사이트: https://ahagoitda.github.io/weather/

**주의**: 
- LLM 기반 피드백은 API 키가 필요하므로 GitHub Pages에서는 규칙 기반 피드백만 동작합니다.
- 완전한 데모는 Vercel 추천.

## 프로젝트 구조

## 프로젝트 구조

```
app/
├── api/feedback/route.ts   # 선택적 LLM 피드백
├── layout.tsx
└── page.tsx
components/
├── JangmaMap.tsx           # 핵심 Leaflet 지도 + 드래그
├── ParameterControls.tsx   # 슬라이더 + 프리셋
├── FeedbackPanel.tsx       # AI 교육 피드백
├── RainStats.tsx           # Recharts 차트
└── JangmaMapWrapper.tsx
lib/
├── simulation.ts           # 물리 근사 강수 계산 엔진 (핵심)
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
