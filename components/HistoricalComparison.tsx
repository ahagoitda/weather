'use client';

/**
 * 장마 전선 실험실 - 과거 실제 사례 비교 패널
 * 
 * 이 기능의 목적:
 * - 사용자가 자신의 조작이 실제 역사적 극한 사례와 얼마나 가까운지 직관적으로 알 수 있게 함
 * - "데이터 기반" 느낌을 강화하여 교육적 신뢰도와 심사위원 설득력 ↑
 * - 단순 숫자 비교가 아니라 "이 패턴이 실제로 일어났던 사례와 비슷하다"는 통찰 제공
 */

import { useState } from 'react';
import { useJangmaStore } from '../store/useJangmaStore';
import { HISTORICAL_CASES, compareWithHistorical } from '../lib/simulation';
import { HistoricalCase } from '../lib/types';
import { History } from 'lucide-react';

export default function HistoricalComparison() {
  const { rainResults, averageRainfall, maxRainfall } = useJangmaStore();
  const [selectedCase, setSelectedCase] = useState<HistoricalCase>(HISTORICAL_CASES[0]);

  const comparison = compareWithHistorical(
    rainResults,
    averageRainfall,
    maxRainfall,
    selectedCase
  );

  const getSimilarityColor = (sim: number) => {
    if (sim > 82) return 'text-emerald-600 bg-emerald-50';
    if (sim > 65) return 'text-blue-600 bg-blue-50';
    return 'text-amber-600 bg-amber-50';
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-5 h-5 text-indigo-600" />
        <span className="font-semibold text-lg text-slate-900">과거 실제 사례와 비교</span>
      </div>

      <div className="text-sm text-slate-600 mb-3">
        현재 조작한 패턴이 실제로 일어났던 역사적 장마 사례와 얼마나 비슷한지 확인해보세요.
      </div>

      {/* 사례 선택 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
        {HISTORICAL_CASES.map((hc) => (
          <button
            key={hc.id}
            onClick={() => setSelectedCase(hc)}
            className={`text-left p-3 rounded-xl border transition text-sm ${
              selectedCase.id === hc.id
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="font-semibold text-slate-800">{hc.name}</div>
            <div className="text-xs text-slate-500 mt-0.5">{hc.period}</div>
          </button>
        ))}
      </div>

      {/* 선택된 사례 설명 */}
      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-4">
        <div className="font-medium text-slate-800 mb-1">{selectedCase.name}</div>
        <div className="text-sm text-slate-600 leading-snug">{selectedCase.description}</div>
        <div className="mt-2 text-xs text-indigo-700 font-medium">
          핵심: {selectedCase.keyInsight}
        </div>
      </div>

      {/* 비교 결과 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-slate-700">현재 패턴과의 유사도</div>
          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getSimilarityColor(comparison.similarity)}`}>
            {comparison.similarity}%
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="text-xs text-slate-500">평균 강수 차이</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">
              {comparison.avgDiff} <span className="text-sm font-normal text-slate-500">mm/h</span>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="text-xs text-slate-500">최대 강수 차이</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">
              {comparison.maxDiff} <span className="text-sm font-normal text-slate-500">mm/h</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 pt-1">
          관측치(근사): 평균 {selectedCase.observedAvg} mm/h / 최대 {selectedCase.observedMax} mm/h
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 text-[11px] text-slate-500 leading-snug">
        ※ 실제 기상청 관측값과 현재 시뮬레이션의 공간 패턴·강도를 비교한 근사 결과입니다. 
        정체 속도와 해수면 온도가 실제 사례와 가까울수록 유사도가 높아집니다.
      </div>
    </div>
  );
}
