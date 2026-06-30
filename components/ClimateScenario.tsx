'use client';

/**
 * 장마 전선 실험실 - 기후변화 시나리오 모드
 *
 * '기상'을 넘어 '기후'로 확장하는 핵심 차별 기능.
 * 같은 장마 전선이라도 미래의 더 따뜻한 바다(해수면온도 상승)에서는
 * 더 많은 수증기가 공급되어 강수가 강해진다는 것을 직접 체감하게 한다.
 *
 * 과학적 근거: 수온 1°C 상승 → 대기 포화수증기량 약 7% 증가 (Clausius–Clapeyron).
 */

import { useMemo } from 'react';
import { useJangmaStore } from '../store/useJangmaStore';
import {
  calculateAllRainfall,
  calculateAverageRainfall,
} from '../lib/simulation';
import { ThermometerSun } from 'lucide-react';

const SCENARIOS = [
  { warming: 0, label: '현재 기후', sub: '기준' },
  { warming: 1.5, label: '+1.5°C', sub: '2050 전망' },
  { warming: 3.0, label: '+3.0°C', sub: '2100 고배출' },
];

export default function ClimateScenario() {
  const { params, climateWarming, setClimateWarming, averageRainfall } = useJangmaStore();

  // 현재 기후(온난화 0) 대비 강수 증가율 — 같은 전선을 기준 기후에서 돌린 값과 비교
  const baselineAvg = useMemo(() => {
    return calculateAverageRainfall(calculateAllRainfall(params));
  }, [params]);

  const deltaPct =
    baselineAvg > 0 ? Math.round(((averageRainfall - baselineAvg) / baselineAvg) * 100) : 0;

  const effectiveSST = (params.sst + climateWarming).toFixed(1);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <ThermometerSun className="w-5 h-5 text-rose-500" />
        <span className="font-semibold text-lg text-slate-900">기후변화 시나리오</span>
      </div>
      <div className="text-xs text-slate-500 mb-4">
        같은 전선을 <b>미래의 더 따뜻한 바다</b>에 두면 장마가 어떻게 변할까요?
      </div>

      <div className="grid grid-cols-3 gap-2">
        {SCENARIOS.map((s) => (
          <button
            key={s.warming}
            onClick={() => setClimateWarming(s.warming)}
            className={`rounded-xl border px-2 py-3 text-center transition ${
              climateWarming === s.warming
                ? 'border-rose-500 bg-rose-50 ring-1 ring-rose-200'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="font-semibold text-slate-800 text-sm">{s.label}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{s.sub}</div>
          </button>
        ))}
      </div>

      {/* 효과 요약 */}
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-slate-200 p-3">
          <div className="text-xs text-slate-500">적용 해수면온도</div>
          <div className="mt-1 text-xl font-semibold tabular-nums text-rose-600">
            {effectiveSST}
            <span className="text-sm font-normal text-slate-500"> °C</span>
          </div>
          {climateWarming > 0 && (
            <div className="text-[11px] text-slate-400 mt-0.5">
              {params.sst.toFixed(1)} + {climateWarming.toFixed(1)}
            </div>
          )}
        </div>
        <div className="rounded-lg border border-slate-200 p-3">
          <div className="text-xs text-slate-500">현재 기후 대비 강수</div>
          <div
            className={`mt-1 text-xl font-semibold tabular-nums ${
              deltaPct > 0 ? 'text-rose-600' : 'text-slate-700'
            }`}
          >
            {deltaPct > 0 ? `+${deltaPct}` : deltaPct}
            <span className="text-sm font-normal text-slate-500"> %</span>
          </div>
        </div>
      </div>

      {climateWarming > 0 && (
        <div className="mt-3 text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-lg p-3 leading-snug">
          해수면온도가 {climateWarming.toFixed(1)}°C 오르면 대기가 더 많은 수증기를 머금어
          (1°C당 약 7%↑), <b>같은 장마 전선이라도 평균 강수가 약 {deltaPct}% 강해집니다.</b>{' '}
          기후위기가 장마 집중호우를 어떻게 악화시키는지 직접 확인해 보세요.
        </div>
      )}

      <div className="mt-3 text-[11px] text-slate-400 leading-snug">
        ※ 해수면온도만 미래값으로 바꿔 비교한 단순화 시나리오입니다. 실제 기후변화는 전선 위치·강도·
        대기 순환 등 여러 요인을 함께 바꿉니다.
      </div>
    </div>
  );
}
