'use client';

/**
 * 장마 전선 실험실 - 3개 핵심 슬라이더 + 프리셋
 */

import { useJangmaStore } from '../store/useJangmaStore';
import { PRESETS } from '../lib/simulation';
import { SliderConfig } from '../lib/types';
import { RotateCcw, Play } from 'lucide-react';

const SLIDERS: SliderConfig[] = [
  {
    key: 'strength',
    label: '전선 강도',
    unit: '',
    min: 10,
    max: 100,
    step: 1,
    description: '저기압의 세기. 강할수록 중심부 강수량이 크게 증가합니다.',
  },
  {
    key: 'speed',
    label: '이동 속도',
    unit: '',
    min: 5,
    max: 100,
    step: 1,
    description: '전선이 이동하는 속도. 느리면 같은 지역에 오랜 시간 비가 내립니다.',
  },
  {
    key: 'sst',
    label: '해수면 온도',
    unit: '°C',
    min: 22,
    max: 29.5,
    step: 0.1,
    description: '남해·동해 수온. 높을수록 수증기 공급이 증가하여 강수가 강해집니다.',
  },
];

export default function ParameterControls() {
  const { params, setSliderValue, applyPreset, resetToDefault, selectedPreset } = useJangmaStore();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-lg text-slate-900">조작 패널</div>
          <div className="text-xs text-slate-500 mt-0.5">값을 바꾸면 지도와 강수 패턴이 즉시 변합니다</div>
        </div>
        <button
          onClick={resetToDefault}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 active:bg-slate-100 transition text-slate-600"
        >
          <RotateCcw className="w-4 h-4" />
          초기화
        </button>
      </div>

      {/* 슬라이더들 */}
      <div className="space-y-6">
        {SLIDERS.map((slider) => {
          const value = params[slider.key as keyof typeof params] as number;
          return (
            <div key={slider.key} className="space-y-2">
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="font-medium text-slate-800">{slider.label}</span>
                  <span className="ml-2 text-xl font-semibold tabular-nums text-blue-700">
                    {value.toFixed(slider.key === 'sst' ? 1 : 0)}
                    <span className="text-sm font-normal text-slate-500 ml-0.5">{slider.unit}</span>
                  </span>
                </div>
              </div>

              <input
                type="range"
                min={slider.min}
                max={slider.max}
                step={slider.step}
                value={value}
                onChange={(e) => setSliderValue(slider.key as any, parseFloat(e.target.value))}
                className="w-full accent-blue-700 cursor-pointer"
              />

              <div className="text-[12px] leading-snug text-slate-500">
                {slider.description}
              </div>
            </div>
          );
        })}
      </div>

      {/* 프리셋 버튼들 - 공모전 데모 핵심 */}
      <div>
        <div className="text-sm font-medium text-slate-700 mb-2.5 flex items-center gap-2">
          <Play className="w-4 h-4" /> 프리셋 시나리오
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset.name)}
              className={`
                text-left px-3.5 py-2.5 rounded-xl border transition-all text-sm
                ${selectedPreset === preset.name 
                  ? 'bg-blue-700 text-white border-blue-700 shadow' 
                  : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'}
              `}
            >
              <div className="font-semibold">{preset.name}</div>
              <div className="text-xs opacity-80 mt-0.5 leading-tight line-clamp-2">
                {preset.description}
              </div>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-slate-400 mt-2">
          실제 과거 장마 사례를 기반으로 한 대표적인 패턴입니다.
        </p>
      </div>
    </div>
  );
}
