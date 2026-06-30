/**
 * 장마 전선 실험실 - 핵심 타입 정의
 * 교육용 인터랙티브 장마 전선 시뮬레이션
 */

// 시뮬레이션 파라미터 (사용자가 직접 조작하는 값)
export interface SimulationParams {
  lat: number;      // 저기압 중심 위도
  lng: number;      // 저기압 중심 경도
  strength: number; // 전선 강도 (0~100) - 저기압의 세기
  speed: number;    // 이동 속도 (0~100) - 전선의 이동 속도
  sst: number;      // 해수면 온도 (°C, 22~30)
}

// 한국 주요 도시/지점 (강수량 계산용 reference points)
export interface ReferencePoint {
  name: string;
  lat: number;
  lng: number;
}

// 계산된 강수량 결과
export interface RainResult {
  name: string;
  lat: number;
  lng: number;
  rainfall: number; // 시간당 강수량 (mm/h)
  category: 'none' | 'light' | 'moderate' | 'heavy' | 'extreme';
}

// 전체 시뮬레이션 상태
export interface SimulationState {
  params: SimulationParams;
  rainResults: RainResult[];
  averageRainfall: number;
  maxRainfall: number;
  frontAngle: number; // 전선의 기울기 (도)
}

// 프리셋 시나리오
export interface PresetScenario {
  name: string;
  description: string;
  params: SimulationParams;
}

// AI 피드백 타입
export interface FeedbackResponse {
  summary: string;      // 2~3문장 핵심 설명
  comparison: string;   // 실제 관측 대비 설명
  learningPoint: string; // 교육적 포인트
}

// 슬라이더 설정
export interface SliderConfig {
  key: keyof SimulationParams;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  description: string;
}

// 과거 실제 사례 (교육적 비교용)
//
// 신뢰성 원칙: 시간당 mm 같은 정밀 수치를 임의로 "관측치"라 단정하지 않는다.
// - realWorldRecord: 공개 보도·기상청 자료로 확인 가능한 정성적 사실만 기재
// - source: 출처 표기
// - referenceParams: 이 사례를 서러게이트 모델에서 재현하는 대표 입력 조건
//   (유사도 채점의 기준값은 이 입력으로 모델을 돌려 산출 → 자기일관적)
export interface HistoricalCase {
  id: string;
  name: string;           // 예: "2023년 7월 중부 집중호우"
  period: string;         // "2023.7.13~18"
  description: string;    // 간단한 실제 상황 요약
  realWorldRecord: string; // 공개 기록 기반 실제 관측 사실 (정성적)
  source: string;          // 출처 표기 (예: "기상청·언론 보도")
  referenceParams: SimulationParams; // 모델 재현용 대표 입력 조건
  keyInsight: string;     // 이 사례의 핵심 과학적 특징
}
