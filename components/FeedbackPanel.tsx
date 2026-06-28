'use client';

/**
 * 장마 전선 실험실 - AI 교육 피드백 패널
 * 
 * 핵심 차별점: 단순 시각화가 아니라 "조작 → 과학적 해석 → 재조작" 루프 제공
 * 
 * 현재는 고품질 규칙 기반 피드백 (즉시 동작).
 * API 키가 있으면 /api/feedback 를 통해 실제 LLM 호출 가능.
 */

import { useEffect, useState } from 'react';
import { useJangmaStore } from '../store/useJangmaStore';
import { generateEducationalFeedback } from '../lib/feedback';
import { Lightbulb, RefreshCw } from 'lucide-react';

export default function FeedbackPanel() {
  const { params, averageRainfall, maxRainfall, lastUpdated } = useJangmaStore();
  const [feedback, setFeedback] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 파라미터가 바뀔 때마다 피드백 생성 (디바운스 없이 빠르게 반응)
  useEffect(() => {
    // 약간의 지연으로 자연스럽게 업데이트 느낌
    const timer = setTimeout(() => {
      const newFeedback = generateEducationalFeedback(params, averageRainfall, maxRainfall);
      setFeedback(newFeedback);
    }, 90);

    return () => clearTimeout(timer);
  }, [params, averageRainfall, maxRainfall, lastUpdated]);

  // 실제 LLM 호출 (선택)
  const fetchRealFeedback = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ params, averageRainfall, maxRainfall }),
      });
      if (res.ok) {
        const data = await res.json();
        setFeedback(data);
      } else {
        // 실패 시 로컬 피드백 유지
        console.warn('LLM fallback used');
      }
    } catch (e) {
      console.warn('LLM request failed, using local feedback');
    } finally {
      setIsLoading(false);
    }
  };

  if (!feedback) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
        <div className="animate-pulse text-slate-400">AI 피드백을 생성 중입니다...</div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-slate-900">AI 교육 피드백</span>
            <span className="ml-2 text-[10px] px-2 py-px rounded bg-amber-100 text-amber-700 font-medium">즉시 해석</span>
          </div>
        </div>
        
        {/* 실제 LLM 사용 버튼 (선택) */}
        <button
          onClick={fetchRealFeedback}
          disabled={isLoading}
          className="text-xs flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? '생성 중...' : '더 정확한 해석 요청'}
        </button>
      </div>

      {/* 메인 요약 (가장 중요) */}
      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
        <div className="text-[13px] leading-relaxed text-slate-800">
          {feedback.summary}
        </div>
      </div>

      {/* 비교 + 학습 포인트 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl border border-slate-200 p-3.5">
          <div className="text-xs font-semibold text-blue-700 mb-1">실제 관측과의 비교</div>
          <div className="text-slate-700 leading-snug">{feedback.comparison}</div>
        </div>
        <div className="rounded-xl border border-slate-200 p-3.5">
          <div className="text-xs font-semibold text-emerald-700 mb-1">학습 포인트</div>
          <div className="text-slate-700 leading-snug">{feedback.learningPoint}</div>
        </div>
      </div>

      <div className="text-[10px] text-slate-400 pt-1">
        이 피드백은 현재 조작 값과 기상학적 원리를 기반으로 생성됩니다. 실제 기상청 관측과 비교해 보세요.
      </div>
    </div>
  );
}
