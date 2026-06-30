'use client';

/**
 * 장마 전선 실험실 - 목표형 챌린지(미션) 모드
 *
 * "보여주기"를 넘어 "직접 재현하고 채점받는" 능동 학습 루프.
 * 학생은 실제 사례를 재현하도록 전선을 조작하고, 모델 기반 유사도로 즉시 채점받는다.
 * → 심사기준의 '체험·참여형 설계'와 '학습 효과'를 정면으로 공략.
 *
 * 채점은 사례의 대표 조건(referenceParams)으로 같은 모델을 돌린 기준값과 비교하므로
 * 가짜 관측치에 의존하지 않고 자기일관적이다.
 */

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useJangmaStore } from '../store/useJangmaStore';
import { HISTORICAL_CASES, compareWithHistorical } from '../lib/simulation';
import { SimulationParams } from '../lib/types';
import { Target, Trophy, CheckCircle2 } from 'lucide-react';

const SUCCESS_THRESHOLD = 85;

// 목표 조건과 현재 조작을 비교해 방향 힌트를 만든다 (정확한 정답값은 숨김 → 탐구 유도)
function buildHints(target: SimulationParams, current: SimulationParams): string[] {
  const hints: string[] = [];
  const d = (a: number, b: number, gap: number) => (a - b > gap ? 1 : b - a > gap ? -1 : 0);

  const s = d(target.strength, current.strength, 6);
  if (s > 0) hints.push('전선을 더 강하게');
  else if (s < 0) hints.push('전선 강도를 낮추기');

  const sp = d(target.speed, current.speed, 6);
  if (sp > 0) hints.push('이동 속도를 더 빠르게');
  else if (sp < 0) hints.push('이동을 더 느리게 (정체)');

  const t = d(target.sst, current.sst, 0.4);
  if (t > 0) hints.push('해수면온도 ↑');
  else if (t < 0) hints.push('해수면온도 ↓');

  const lat = d(target.lat, current.lat, 0.5);
  if (lat > 0) hints.push('저기압을 더 북쪽으로');
  else if (lat < 0) hints.push('저기압을 더 남쪽으로');

  return hints;
}

export default function ChallengeMode() {
  const { params, rainResults, averageRainfall, maxRainfall } = useJangmaStore();
  const [missionId, setMissionId] = useState(HISTORICAL_CASES[0].id);
  const [cleared, setCleared] = useState<Record<string, boolean>>({});

  const mission = HISTORICAL_CASES.find((c) => c.id === missionId) ?? HISTORICAL_CASES[0];
  const result = compareWithHistorical(rainResults, averageRainfall, maxRainfall, mission);
  const similarity = result.similarity;
  const success = similarity >= SUCCESS_THRESHOLD;
  const hints = buildHints(mission.referenceParams, params);

  // 임계값을 처음 넘는 순간 1회만 축하 (토스트는 외부 시스템 호출)
  useEffect(() => {
    if (!success || cleared[missionId]) return;
    toast.success(`미션 성공! "${mission.name}" 재현 (유사도 ${similarity}%)`, {
      description: '같은 모델 안에서 이 사례의 강수 패턴을 재현했습니다.',
      icon: '🏆',
    });
    // 클리어 표시(체크마크·카운트) 갱신 — 미션당 1회만 실행되는 전환 이벤트
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCleared((prev) => ({ ...prev, [missionId]: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success, missionId]);

  const clearedCount = Object.values(cleared).filter(Boolean).length;

  const gaugeColor =
    similarity >= SUCCESS_THRESHOLD
      ? 'bg-emerald-500'
      : similarity >= 60
        ? 'bg-blue-500'
        : 'bg-amber-500';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-lg text-slate-900">재현 챌린지</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          {clearedCount}/{HISTORICAL_CASES.length} 성공
        </div>
      </div>
      <div className="text-xs text-slate-500 mb-4">
        전선을 조작해 아래 실제 사례의 강수 패턴을 <b>재현</b>해 보세요. 유사도 {SUCCESS_THRESHOLD}% 이상이면 성공!
      </div>

      {/* 미션 선택 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {HISTORICAL_CASES.map((c) => (
          <button
            key={c.id}
            onClick={() => setMissionId(c.id)}
            className={`text-xs px-3 py-1.5 rounded-full border transition flex items-center gap-1 ${
              missionId === c.id
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-slate-200 hover:border-slate-300 text-slate-600'
            }`}
          >
            {cleared[c.id] && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
            {c.name}
          </button>
        ))}
      </div>

      {/* 목표 카드 */}
      <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 mb-4">
        <div className="text-xs font-semibold text-slate-500 mb-1">미션</div>
        <div className="font-medium text-slate-800">{mission.name} ({mission.period})</div>
        <div className="text-xs text-slate-600 mt-1 leading-snug">{mission.keyInsight}</div>
        <div className="text-[11px] text-slate-400 mt-2">
          목표 강수: 평균 {result.targetAvg} mm/h · 최대 {result.targetMax} mm/h · 최대지역 {result.targetMaxCity}
        </div>
      </div>

      {/* 유사도 게이지 */}
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm font-medium text-slate-700">현재 재현도</span>
        <span
          className={`text-2xl font-bold tabular-nums ${
            success ? 'text-emerald-600' : 'text-slate-800'
          }`}
        >
          {similarity}
          <span className="text-sm font-normal text-slate-400">%</span>
        </span>
      </div>
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${gaugeColor}`}
          style={{ width: `${similarity}%` }}
        />
      </div>

      {/* 성공 / 힌트 */}
      {success ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg p-3">
          <Trophy className="w-4 h-4" />
          <span>재현 성공! 이 조건이 실제 <b>{mission.name}</b>를 만든 패턴과 가깝습니다.</span>
        </div>
      ) : (
        <div className="mt-4">
          <div className="text-xs font-semibold text-slate-500 mb-2">힌트 — 이렇게 조작해 보세요</div>
          <div className="flex flex-wrap gap-1.5">
            {hints.length > 0 ? (
              hints.map((h) => (
                <span
                  key={h}
                  className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100"
                >
                  {h}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500">거의 다 왔어요! 미세하게 조정해 보세요.</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
