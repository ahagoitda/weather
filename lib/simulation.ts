/**
 * 장마 전선 실험실 - JavaScript 기반 물리 근사 모델 (Surrogate Model)
 * 
 * 실제 머신러닝 대신 교육 목적의 과학적 근사 규칙을 사용.
 * 핵심 원리:
 * 1. 저기압 중심에서 거리에 따른 강수 감쇠 (지수 감쇠)
 * 2. 전선 강도(strength)가 강수량의 1차 결정 요인
 * 3. 해수면 온도(SST)가 수증기 공급량에 영향 (장마 수분 공급원)
 * 4. 이동 속도(speed)는 전선의 공간적 분포와 지속 시간에 영향
 * 5. 한반도 장마 전선은 대체로 남서-북동 방향의 경사를 가짐
 */

import { SimulationParams, ReferencePoint, RainResult, HistoricalCase } from './types';

// 한반도 주요 관측 지점 (실제 기상 관측소 기반)
export const REFERENCE_POINTS: ReferencePoint[] = [
  { name: '서울', lat: 37.57, lng: 126.98 },
  { name: '춘천', lat: 37.90, lng: 127.74 },
  { name: '대전', lat: 36.35, lng: 127.38 },
  { name: '광주', lat: 35.16, lng: 126.85 },
  { name: '부산', lat: 35.18, lng: 129.08 },
  { name: '제주', lat: 33.51, lng: 126.52 },
  { name: '강릉', lat: 37.75, lng: 128.89 },
  { name: '울산', lat: 35.54, lng: 129.31 },
];

// 장마 전선의 기본 기울기 (북서-남동, 약 45도, 실제 장마 전선 특성 반영)
const BASE_FRONT_ANGLE = 135; // degrees

/**
 * 두 지점 사이의 거리 계산 (Haversine formula)
 * @returns 거리 (킬로미터)
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // 지구 반경 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 특정 지점의 강수량 계산 (mm/h)
 * 
 * 과학적 근사 공식:
 * rainfall = base * strengthFactor * sstFactor * distanceDecay * speedFactor
 * 
 * - strengthFactor: 전선 강도가 직접적으로 비례
 * - sstFactor: 높은 해수면 온도는 더 많은 수증기 → 강수 증가
 * - distanceDecay: 중심으로부터 거리에 따라 지수적으로 감소
 * - speedFactor: 이동이 너무 빠르면 강수 지속시간 ↓ (분산 효과)
 */
export function calculateRainfallAtPoint(
  pointLat: number,
  pointLng: number,
  params: SimulationParams
): number {
  const { lat, lng, strength, speed, sst } = params;

  // 1. 거리 계산
  const distance = calculateDistance(pointLat, pointLng, lat, lng);

  // 2. 전선 강도 요인 (0~100 → 0~1.2)
  const strengthFactor = (strength / 100) * 1.35 + 0.05;

  // 3. 해수면 온도 요인 (22~30°C 기준)
  // 25°C를 기준으로, 1도 상승당 약 6~7% 수증기 증가 (Clausius-Clapeyron 관계 근사)
  const sstFactor = 0.75 + ((sst - 24) / 6) * 0.65;

  // 4. 거리 감쇠 함수 (지수 감쇠)
  // 중심에서 80km 이내: 매우 강한 비, 250km 이상: 거의 없음
  const effectiveRadius = 180 + (strength / 100) * 70; // 강할수록 영향 범위 확대
  const distanceDecay = Math.max(
    0,
    Math.exp(-distance / effectiveRadius) * (1 - Math.min(distance / 420, 0.92))
  );

  // 5. 이동 속도 효과
  // 빠른 이동 → 강수가 넓게 분산되지만 지역별 집중도는 낮아짐
  const speedFactor = 1.0 - (speed / 100) * 0.28;

  // 6. 장마 전선의 비대칭성 (실제 장마 특성 반영)
  // 저기압 중심의 남동쪽이 대체로 더 강한 비가 내림 (따뜻한 공기 유입)
  const dx = pointLng - lng;
  const dy = pointLat - lat;
  const angleToPoint = (Math.atan2(dy, dx) * 180) / Math.PI;
  const frontBias = Math.cos(((angleToPoint - BASE_FRONT_ANGLE) * Math.PI) / 180);
  const frontFactor = 0.88 + Math.max(frontBias, -0.4) * 0.45;

  // 최종 강수량 계산 (mm/h)
  let rainfall =
    4.5 + // 기본 오프셋 (약한 비)
    strengthFactor * 52 * distanceDecay * speedFactor * sstFactor * frontFactor;

  // 강도 제한 (현실적 범위: 0 ~ 95 mm/h)
  rainfall = Math.max(0, Math.min(95, rainfall));

  // 강도가 매우 약할 때 추가 감쇠
  if (strength < 15) {
    rainfall *= strength / 18;
  }

  return Math.round(rainfall * 10) / 10;
}

/**
 * 모든 참조 지점의 강수량 계산
 */
export function calculateAllRainfall(params: SimulationParams): RainResult[] {
  return REFERENCE_POINTS.map((point) => {
    const rainfall = calculateRainfallAtPoint(point.lat, point.lng, params);
    return {
      ...point,
      rainfall,
      category: getRainCategory(rainfall),
    };
  });
}

/**
 * 강수량 카테고리 분류 (기상청 기준 근사)
 */
export function getRainCategory(rainfall: number): RainResult['category'] {
  if (rainfall < 2) return 'none';
  if (rainfall < 10) return 'light';
  if (rainfall < 30) return 'moderate';
  if (rainfall < 55) return 'heavy';
  return 'extreme';
}

/**
 * 평균 강수량 계산
 */
export function calculateAverageRainfall(results: RainResult[]): number {
  if (results.length === 0) return 0;
  const sum = results.reduce((acc, r) => acc + r.rainfall, 0);
  return Math.round((sum / results.length) * 10) / 10;
}

/**
 * 최대 강수량
 */
export function calculateMaxRainfall(results: RainResult[]): number {
  if (results.length === 0) return 0;
  return Math.max(...results.map((r) => r.rainfall));
}

/**
 * 전선 기울기 계산 (시각화용)
 * 이동 속도와 강도에 따라 약간의 변화를 줌
 */
export function calculateFrontAngle(speed: number, strength: number): number {
  // 기본 각도에서 이동 속도가 빠를수록 전선이 더 수평에 가까워지는 경향 근사
  const variation = (speed - 50) * 0.18 + (strength - 50) * -0.06;
  return BASE_FRONT_ANGLE + variation;
}

/**
 * 색상 매핑 (강수량 → Tailwind/HEX 색상)
 */
export function getRainColor(rainfall: number): string {
  if (rainfall < 2) return '#e0f2fe';      // 거의 없음
  if (rainfall < 8) return '#7dd3fc';       // 약한 비
  if (rainfall < 18) return '#38bdf8';      // 보통
  if (rainfall < 35) return '#0284c8';      // 강한 비
  if (rainfall < 55) return '#0369a1';      // 매우 강한 비
  return '#1e3a8a';                         // 극한 호우
}

/**
 * 범례용 색상 + 라벨
 */
export const RAIN_LEGEND = [
  { min: 0, max: 2, label: '없음', color: '#e0f2fe' },
  { min: 2, max: 10, label: '약', color: '#7dd3fc' },
  { min: 10, max: 30, label: '보통', color: '#38bdf8' },
  { min: 30, max: 55, label: '강', color: '#0284c8' },
  { min: 55, max: 100, label: '극한', color: '#1e3a8a' },
];

/**
 * 현재 상태로부터 요약 통계 생성
 */
export function generateSimulationSummary(params: SimulationParams) {
  const results = calculateAllRainfall(params);
  const avg = calculateAverageRainfall(results);
  const max = calculateMaxRainfall(results);
  const frontAngle = calculateFrontAngle(params.speed, params.strength);

  return {
    averageRainfall: avg,
    maxRainfall: max,
    frontAngle,
    rainResults: results,
  };
}

/**
 * 디폴트 초기 파라미터 (장마철 전형적인 위치)
 * 중심을 한반도 중부 남쪽에 배치 (초기 장마 전선 위치)
 */
export const DEFAULT_PARAMS: SimulationParams = {
  lat: 35.8,
  lng: 127.3,
  strength: 62,
  speed: 48,
  sst: 26.4,
};

/**
 * 공모전용 프리셋 시나리오
 */
export const PRESETS: Array<{
  name: string;
  description: string;
  params: SimulationParams;
}> = [
  {
    name: '일반적인 장마',
    description: '2020~2024년 평균적인 장마 전선 패턴',
    params: { lat: 35.8, lng: 127.3, strength: 58, speed: 45, sst: 25.8 },
  },
  {
    name: '2023년 7월 정체형 극한',
    description: '2023.7 중부 집중호우 — 전선이 오래 머무르며 극한 호우 발생',
    params: { lat: 36.4, lng: 127.8, strength: 88, speed: 18, sst: 27.6 },
  },
  {
    name: '빠른 이동형 (분산형)',
    description: '전선이 빠르게 지나가며 전국에 비가 고르게 분산되는 패턴',
    params: { lat: 34.9, lng: 126.6, strength: 71, speed: 79, sst: 26.9 },
  },
  {
    name: '남해 저기압 발달 (2023 스타일)',
    description: '남해상 강발달 사례 — 제주와 남부에 집중되는 패턴',
    params: { lat: 33.7, lng: 126.9, strength: 82, speed: 35, sst: 28.3 },
  },
  {
    name: '약한 장마',
    description: '강수량이 적고 전선이 뚜렷하지 않은 경우',
    params: { lat: 36.2, lng: 128.1, strength: 27, speed: 55, sst: 24.2 },
  },
];

/**
 * 실제 기록 사례 (교육 비교·챌린지용)
 *
 * 신뢰성 원칙(데이터 출처 명시):
 * - realWorldRecord 는 공개 보도·기상청 자료로 확인 가능한 정성적 사실만 담는다.
 * - 유사도/챌린지 채점의 "기준값"은 referenceParams 로 서러게이트 모델을 돌려 산출한다.
 *   즉, 비교 대상이 임의의 가짜 관측 수치가 아니라 '모델이 그 조건에서 만든 강수'이므로
 *   채점이 자기일관적이고 방어 가능하다.
 */
export const HISTORICAL_CASES: HistoricalCase[] = [
  {
    id: '2023-central',
    name: '2023년 7월 중부·충청 집중호우',
    period: '2023.7.13~18',
    description: '장마 전선이 중부·충청에 장기 정체하며 기록적 호우. 오송 지하차도 침수 등 큰 인명·재산 피해로 이어졌다.',
    realWorldRecord: '청주·괴산 등 충청권에 일강수량 300mm 이상이 관측되었고, 정체된 전선이 같은 지역에 비를 퍼부었습니다.',
    source: '기상청·언론 보도 (2023.7)',
    referenceParams: { lat: 36.5, lng: 127.5, strength: 90, speed: 15, sst: 27.5 },
    keyInsight: '이동 속도가 극도로 느리고 강도가 높았던 정체형 전선의 대표 사례. 해수면 온도도 평년보다 높아 수증기 공급이 풍부했다.',
  },
  {
    id: '2022-seoul',
    name: '2022년 8월 수도권 기록적 폭우',
    period: '2022.8.8~11',
    description: '정체된 강한 비구름이 수도권에 집중되며 서울 도심이 침수. 짧은 시간에 극단적으로 많은 비가 쏟아진 사례.',
    realWorldRecord: '서울 동작구에서 시간당 약 141.5mm가 관측되어 서울 기상 관측 사상 최고 수준을 기록했고, 강남 등 도심이 침수됐습니다.',
    source: '기상청 (2022.8.8)',
    referenceParams: { lat: 37.5, lng: 127.0, strength: 95, speed: 12, sst: 27.0 },
    keyInsight: '전선이 거의 움직이지 않고 강한 비구름이 같은 지역(수도권)에 반복 유입되면서 단시간 극한 강수가 발생했다.',
  },
  {
    id: '2020-long',
    name: '2020년 역대 최장 장마',
    period: '2020.6.24~8.16',
    description: '중부지방 장마가 54일간 이어지며 역대 최장 기록. 오랜 기간 전국 곳곳에 반복적인 호우와 침수 피해가 발생했다.',
    realWorldRecord: '2020년 중부지방 장마는 54일로 1973년 이후 가장 길었고, 누적 강수량이 평년을 크게 웃돌았습니다.',
    source: '기상청 장마 통계 (2020)',
    referenceParams: { lat: 36.2, lng: 127.6, strength: 72, speed: 30, sst: 26.0 },
    keyInsight: '한 번의 극한 강도보다, 전선이 오래 머물며 비가 반복된 "지속 시간"이 피해를 키운 사례.',
  },
  {
    id: '2023-jeju',
    name: '2023년 여름 남부·제주 호우',
    period: '2023.7',
    description: '남해상에서 발달한 저기압의 영향으로 제주 산간과 남부지방에 매우 많은 비가 집중됐다.',
    realWorldRecord: '제주 산간을 중심으로 매우 높은 일강수량이 기록됐으며, 높은 해수면 온도가 풍부한 수증기를 공급했습니다.',
    source: '기상청·언론 보도 (2023.7)',
    referenceParams: { lat: 33.6, lng: 127.0, strength: 85, speed: 22, sst: 28.3 },
    keyInsight: '해수면 온도가 매우 높았고 저기압이 남쪽에 오래 머물면서 남부에 극심한 비가 집중된 사례.',
  },
];

/**
 * 현재 시뮬레이션과 사례(또는 목표 조건) 비교 — 모델 기반 자기일관 채점
 *
 * 기준값을 가짜 관측치가 아니라 referenceParams 로 모델을 돌려 산출한다.
 * "같은 모델 안에서 목표 조건을 얼마나 재현했는가"를 측정하므로 방어 가능하다.
 */
export function compareWithHistorical(
  currentResults: RainResult[],
  currentAvg: number,
  currentMax: number,
  historical: HistoricalCase
): {
  similarity: number;           // 0~100
  avgDiff: number;
  maxDiff: number;
  targetAvg: number;
  targetMax: number;
  targetMaxCity: string;
  closestCities: string[];
} {
  // 기준값: 사례의 대표 입력 조건으로 모델을 돌린 결과
  const target = generateSimulationSummary(historical.referenceParams);
  const targetAvg = target.averageRainfall;
  const targetMax = target.maxRainfall;
  const targetMaxCity = target.rainResults.reduce((a, b) => (b.rainfall > a.rainfall ? b : a)).name;

  const avgDiff = Math.abs(currentAvg - targetAvg);
  const maxDiff = Math.abs(currentMax - targetMax);

  // 유사도 계산 (평균과 최대를 종합, 차이가 작을수록 높음)
  const avgScore = Math.max(0, 100 - avgDiff * 3.2);
  const maxScore = Math.max(0, 100 - maxDiff * 1.8);
  let similarity = Math.round((avgScore + maxScore) / 2);

  // 공간 패턴(최대 강수 지역)이 일치하면 가산
  const currentMaxCity = currentResults.reduce((a, b) => (b.rainfall > a.rainfall ? b : a)).name;
  if (currentMaxCity === targetMaxCity) similarity = Math.min(100, similarity + 12);

  similarity = Math.max(5, Math.min(99, similarity));

  return {
    similarity,
    avgDiff: Math.round(avgDiff * 10) / 10,
    maxDiff: Math.round(maxDiff * 10) / 10,
    targetAvg,
    targetMax,
    targetMaxCity,
    closestCities: [currentMaxCity],
  };
}
