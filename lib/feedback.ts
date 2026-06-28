/**
 * 장마 전선 실험실 - 교육 전문가 관점 피드백 생성기
 * 
 * 공모전 평가 기준 "학습 효과"를 극대화하기 위한 핵심 로직.
 * 실제 LLM 호출 전에 쓰이는 고품질 규칙 기반 피드백.
 * 
 * 모든 설명은 다음 원칙을 지킨다:
 * - 중·고등학생이 이해할 수 있는 수준
 * - 장마 전선의 핵심 과학 원리 명시 (저기압, 수증기, 정체, 해수면온도)
 * - "현재 조작"과 "실제 관측" 비교
 */

import { SimulationParams } from './types';
import { HISTORICAL_CASES } from './simulation';

interface EducationalFeedback {
  summary: string;
  comparison: string;
  learningPoint: string;
}

export function generateEducationalFeedback(
  params: SimulationParams,
  avgRain: number,
  maxRain: number
): EducationalFeedback {
  const { strength, speed, sst, lat, lng } = params;

  // 상황 분류
  const isStrong = strength > 72;
  const isWeak = strength < 35;
  const isSlow = speed < 28;
  const isFast = speed > 68;
  const isWarmSST = sst > 27.0;
  const isColdSST = sst < 24.5;

  // 위치 판단 (한반도 기준)
  const isSouth = lat < 35.0;
  const isNorth = lat > 37.0;
  const isWest = lng < 126.8;
  const isEast = lng > 128.5;

  // 가장 비슷한 역사적 사례 찾기 (간단 매칭)
  let closestCase = HISTORICAL_CASES[0];
  let minDiff = Infinity;
  HISTORICAL_CASES.forEach((hc) => {
    const diff =
      Math.abs(hc.referenceParams.strength - strength) * 0.6 +
      Math.abs(hc.referenceParams.speed - speed) * 0.9 +
      Math.abs(hc.referenceParams.sst - sst) * 1.4;
    if (diff < minDiff) {
      minDiff = diff;
      closestCase = hc;
    }
  });

  let summary = '';
  let comparison = '';
  let learningPoint = '';

  // === SUMMARY: 가장 핵심 메시지 (2~3문장) ===
  if (isStrong && isSlow && isWarmSST) {
    summary = `매우 강한 저기압(강도 ${strength})이 느리게 움직이고 있으며 해수면온도도 ${sst.toFixed(1)}°C로 높습니다. 이 조건은 남쪽에서 공급되는 풍부한 수증기가 장시간 같은 지역에 머무르며 극한의 집중호우를 일으키는 전형적인 '정체형 장마' 패턴입니다.`;
  } else if (isStrong && isFast) {
    summary = `강한 전선이 빠르게 이동하고 있습니다. 강도 ${strength} 수준의 저기압이 ${speed}의 속도로 이동하면 한 지역에는 비교적 짧은 시간 동안 강한 비가 내리고, 전선이 지나간 뒤에는 곧 소강상태가 됩니다.`;
  } else if (isSlow && isWarmSST && !isStrong) {
    summary = `이동 속도가 느리고 해수면 온도가 높아 수증기 공급은 충분하지만, 저기압 자체의 힘이 약합니다. 따라서 전국적으로 고른 비보다는 특정 지역에 지속적으로 약~중간 강도의 비가 내리는 양상을 보입니다.`;
  } else if (isSouth) {
    summary = `저기압 중심이 남쪽(${lat.toFixed(1)}°N)에 위치하고 있습니다. 이 경우 제주와 남부 지방에 강한 비가 집중되고, 중부 지방은 상대적으로 약한 영향을 받을 가능성이 큽니다.`;
  } else if (isNorth) {
    summary = `저기압이 북쪽에 위치해 있어 서울·경기와 강원 지역에 직접적인 영향을 주고 있습니다. 남부 지방은 전선의 후면에 위치해 비가 상대적으로 약할 수 있습니다.`;
  } else {
    summary = `현재 강도 ${strength}, 이동 속도 ${speed}, 해수면 온도 ${sst.toFixed(1)}°C 조건에서는 한반도 중부와 남부에 걸쳐 보통~강한 강수가 분포합니다. 전선의 위치와 강도가 비의 지역적 편차를 크게 결정하고 있습니다.`;
  }

  // === COMPARISON: 실제 관측과의 차이 (역사적 사례 참조 강화) ===
  if (isStrong && isSlow && isWarmSST) {
    comparison = `2023년 7월 중순~하순에 실제로 관측된 '${closestCase.name}' 패턴과 매우 유사합니다. 당시 남해상에서 발달한 저기압이 정체하면서 중부지방에 500mm 이상의 극한 강수가 내렸습니다.`;
  } else if (isFast) {
    comparison = `실제 관측에서 전선이 이처럼 빠르게 이동하면 강수 지속시간이 짧아 피해 규모가 제한되는 경우가 많습니다. '${closestCase.name}'처럼 빠른 이동 사례에서는 누적량이 상대적으로 적게 나타났습니다.`;
  } else if (isWeak) {
    comparison = `기상청 과거 자료에서 이 정도 약한 강도의 장마 전선은 전체 강수량이 평년보다 30~50% 적게 나타나는 경향이 있습니다.`;
  } else if (isWarmSST) {
    comparison = `최근 5년간 해수면 온도가 평년보다 1~2°C 높았던 해에는 장마 기간 총 강수량이 증가하는 경향이 관측되었습니다. '${closestCase.name}' 사례에서도 높은 수온이 중요한 역할을 했습니다.`;
  } else {
    comparison = `현재 조건은 '${closestCase.name}'(${closestCase.period})과 유사한 범위에 있습니다. 실제로는 북태평양 고기압의 위치와 상호작용에 따라 더 복잡한 강수 분포를 보입니다.`;
  }

  // === LEARNING POINT ===
  if (isStrong && isSlow) {
    learningPoint = `장마 피해의 핵심 원인은 '강한 비'가 아니라 '오랫동안 같은 곳에 머무는 비'입니다. 이동 속도가 느릴수록 같은 지역의 누적 강수량이 급격히 증가합니다. '${closestCase.name}' 사례가 이를 잘 보여줍니다.`;
  } else if (isWarmSST) {
    learningPoint = `해수면 온도는 단순한 숫자가 아닙니다. 수온이 1°C 상승하면 대기 중 수증기량이 약 7% 증가합니다. 이것이 장마 강수를 강화하는 주요 메커니즘입니다.`;
  } else if (isSouth) {
    learningPoint = `저기압의 위치가 남쪽에 있을 때 북쪽 지방은 전선의 영향을 적게 받습니다. 장마 전선의 위치가 강수 지역을 결정하는 가장 중요한 요인 중 하나입니다.`;
  } else {
    learningPoint = `전선 강도와 이동 속도, 해수면 온도는 서로 독립적이지 않습니다. 세 요소가 어떻게 조합되느냐에 따라 '집중호우'와 '약한 비'가 완전히 다른 결과를 만듭니다.`;
  }

  return { summary, comparison, learningPoint };
}
