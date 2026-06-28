/**
 * 장마 전선 실험실 - 전역 상태 관리 (Zustand)
 * 
 * 모든 파라미터, 계산 결과, UI 상태를 중앙에서 관리.
 * 매 파라미터 변경 시 즉시 강수량 재계산 (실시간 반응).
 */

import { create } from 'zustand';
import {
  SimulationParams,
  RainResult,
} from '../lib/types';
import {
  DEFAULT_PARAMS,
  PRESETS,
} from '../lib/simulation';
import {
  calculateAllRainfall,
  calculateAverageRainfall,
  calculateMaxRainfall,
  calculateFrontAngle,
} from '../lib/simulation';

interface JangmaStore {
  // 현재 시뮬레이션 상태
  params: SimulationParams;
  rainResults: RainResult[];
  averageRainfall: number;
  maxRainfall: number;
  frontAngle: number;

  // UI 상태
  isDragging: boolean;
  lastUpdated: number;
  selectedPreset: string | null;

  // 액션
  updateParams: (newParams: Partial<SimulationParams>) => void;
  setPosition: (lat: number, lng: number) => void;
  setSliderValue: (key: keyof SimulationParams, value: number) => void;
  applyPreset: (presetName: string) => void;
  resetToDefault: () => void;
  setDragging: (dragging: boolean) => void;

  // 파생 값
  getCurrentState: () => {
    params: SimulationParams;
    rainResults: RainResult[];
    averageRainfall: number;
    maxRainfall: number;
  };
}

function recompute(params: SimulationParams) {
  const rainResults = calculateAllRainfall(params);
  const averageRainfall = calculateAverageRainfall(rainResults);
  const maxRainfall = calculateMaxRainfall(rainResults);
  const frontAngle = calculateFrontAngle(params.speed, params.strength);

  return { rainResults, averageRainfall, maxRainfall, frontAngle };
}

export const useJangmaStore = create<JangmaStore>((set, get) => {
  // 초기 계산
  const initial = recompute(DEFAULT_PARAMS);

  return {
    // 초기 상태
    params: DEFAULT_PARAMS,
    rainResults: initial.rainResults,
    averageRainfall: initial.averageRainfall,
    maxRainfall: initial.maxRainfall,
    frontAngle: initial.frontAngle,
    isDragging: false,
    lastUpdated: Date.now(),
    selectedPreset: null,

    // 파라미터 전체 업데이트 (여러 값 동시 변경 시)
    updateParams: (newParams) => {
      const current = get().params;
      const updated: SimulationParams = { ...current, ...newParams };
      const computed = recompute(updated);

      set({
        params: updated,
        ...computed,
        lastUpdated: Date.now(),
        selectedPreset: null, // 수동 조작 시 프리셋 해제
      });
    },

    // 지도에서 저기압 위치만 변경
    setPosition: (lat, lng) => {
      const current = get().params;
      const updated: SimulationParams = {
        ...current,
        lat: Math.max(32.5, Math.min(39.5, lat)), // 한반도 영역 제한
        lng: Math.max(124.5, Math.min(131.5, lng)),
      };
      const computed = recompute(updated);

      set({
        params: updated,
        ...computed,
        lastUpdated: Date.now(),
        selectedPreset: null,
      });
    },

    // 개별 슬라이더 값 변경
    setSliderValue: (key, value) => {
      const current = get().params;
      const updated: SimulationParams = { ...current, [key]: value };
      const computed = recompute(updated);

      set({
        params: updated,
        ...computed,
        lastUpdated: Date.now(),
        selectedPreset: null,
      });
    },

    // 프리셋 적용
    applyPreset: (presetName) => {
      const preset = PRESETS.find((p) => p.name === presetName);
      if (!preset) return;

      const computed = recompute(preset.params);

      set({
        params: { ...preset.params },
        ...computed,
        lastUpdated: Date.now(),
        selectedPreset: presetName,
      });
    },

    // 초기화
    resetToDefault: () => {
      const computed = recompute(DEFAULT_PARAMS);
      set({
        params: { ...DEFAULT_PARAMS },
        ...computed,
        lastUpdated: Date.now(),
        selectedPreset: null,
      });
    },

    setDragging: (dragging) => {
      set({ isDragging: dragging });
    },

    getCurrentState: () => {
      const state = get();
      return {
        params: state.params,
        rainResults: state.rainResults,
        averageRainfall: state.averageRainfall,
        maxRainfall: state.maxRainfall,
      };
    },
  };
});
