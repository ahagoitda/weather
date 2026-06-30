'use client';

/**
 * 장마 전선 실험실 - 메인 페이지
 * 
 * 2026 기상·기후 AI 해커톤 경진대회
 * 
 * 핵심 컨셉:
 * - 사용자가 한반도 지도에서 저기압을 드래그하고 슬라이더로 조작
 * - 실시간으로 강수 패턴이 변화
 * - AI가 교육적 피드백을 즉시 제공
 * 
 * 공모전 평가 기준 대응:
 * - 실현 가능성: JS 기반 surrogate 모델 + Leaflet
 * - 체험·참여형 설계: 직접 드래그 + 슬라이더 + 프리셋
 * - 독창성: "조작 → 즉시 과학 피드백" 루프
 * - 학습 효과: 실제 기상 원리를 반영한 설명
 */

import JangmaMapWrapper from '../components/JangmaMapWrapper';
import ParameterControls from '../components/ParameterControls';
import FeedbackPanel from '../components/FeedbackPanel';
import RainStats from '../components/RainStats';
import HistoricalComparison from '../components/HistoricalComparison';
import FactorAnalysis from '../components/FactorAnalysis';
import { useJangmaStore } from '../store/useJangmaStore';
import { Info } from 'lucide-react';

export default function JangmaFrontLab() {
  const { averageRainfall } = useJangmaStore();

  return (
    <div className="min-h-screen flex flex-col">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-700 flex items-center justify-center text-white font-bold text-xl tracking-tighter">
              L
            </div>
            <div>
              <div className="font-semibold text-xl tracking-tight">장마 전선 실험실</div>
              <div className="text-[10px] text-slate-500 -mt-0.5">JANGMA FRONT LABORATORY</div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <div className="hidden sm:block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
              2026 기상·기후 AI 해커톤
            </div>
            <a 
              href="https://www.kma.go.kr" 
              target="_blank" 
              className="text-slate-500 hover:text-slate-700 flex items-center gap-1 text-xs"
            >
              <Info className="w-3.5 h-3.5" /> 기상청
            </a>
          </div>
        </div>
      </header>

      {/* 히어로 + 문제 정의 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-4">
        <div className="max-w-3xl">
          <div className="inline-block text-xs font-semibold tracking-widest px-3 py-1 bg-slate-900 text-white rounded-full mb-3">
            능동적 기상 학습 도구
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tighter leading-none text-slate-950">
            직접 움직여 보는<br />장마 전선
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl">
            한반도 지도 위에서 저기압을 드래그하고 강도·속도·해수면 온도를 조절하세요.<br />
            AI 서러게이트(대리) 모델이 강수 패턴을 실시간으로 추론하고, 그 결과를 과학적으로 해석해 줍니다.
          </p>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* 지도 영역 - 가장 중요 */}
          <div className="lg:col-span-7 xl:col-span-8">
            <div className="mb-2 flex items-center justify-between">
              <div className="font-medium text-slate-700 text-sm flex items-center gap-2">
                <span>한반도 실시간 시뮬레이션</span>
                <span className="text-[10px] px-1.5 py-px rounded bg-emerald-100 text-emerald-700 font-mono">
                  LIVE
                </span>
              </div>
              <div className="text-xs text-slate-500 tabular-nums">
                현재 평균 강수: <span className="font-medium text-slate-700">{averageRainfall}</span> mm/h
              </div>
            </div>

            <JangmaMapWrapper />

            {/* 지도 하단 설명 */}
            <div className="mt-2 text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
              <div>• 파란색 원 = 저기압 중심 주변 강수 분포</div>
              <div>• 점 = 주요 도시 실시간 강수량</div>
              <div>• 점선 = 추정 장마 전선 위치</div>
            </div>
          </div>

          {/* 컨트롤 패널 */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-5">
            <ParameterControls />
          </div>

          {/* 피드백 + 통계 */}
          <div className="lg:col-span-12 xl:col-span-7 space-y-5">
            <FeedbackPanel />
          </div>

          <div className="lg:col-span-12 xl:col-span-5 space-y-5">
            <RainStats />
            <FactorAnalysis />
            <HistoricalComparison />
          </div>
        </div>

        {/* 교육적 가치 설명 섹션 */}
        <div className="mt-10 pt-8 border-t border-slate-200">
          <div className="max-w-3xl">
            <h2 className="font-semibold text-xl mb-3 tracking-tight">이 도구로 무엇을 배울 수 있나요?</h2>
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div className="rounded-xl border bg-white p-4">
                <div className="font-medium text-slate-800 mb-1">1. 정체의 위험성</div>
                <div className="text-slate-600">전선이 느리게 움직일수록 같은 지역의 누적 강수량이 급격히 증가합니다.</div>
              </div>
              <div className="rounded-xl border bg-white p-4">
                <div className="font-medium text-slate-800 mb-1">2. 해수면 온도의 역할</div>
                <div className="text-slate-600">수온이 높을수록 대기가 더 많은 수증기를 머금을 수 있어 강수가 강화됩니다.</div>
              </div>
              <div className="rounded-xl border bg-white p-4">
                <div className="font-medium text-slate-800 mb-1">3. 위치의 중요성</div>
                <div className="text-slate-600">저기압이 남쪽에 있으면 남부, 북쪽에 있으면 중북부에 집중되는 패턴을 직접 확인하세요.</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-xs text-slate-500 flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
          <div>
            2026 기상·기후 AI 해커톤 경진대회 | 장마 전선 실험실
          </div>
          <div className="flex gap-4">
            <span>AI 서러게이트(대리) 모델 · 실시간 추론</span>
            <span className="hidden sm:inline">•</span>
            <span>교육 목적 시뮬레이션</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
