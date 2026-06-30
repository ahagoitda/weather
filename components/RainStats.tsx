'use client';

/**
 * 장마 전선 실험실 - 강수량 통계 및 차트
 * Recharts를 사용해 도시별 강수량을 시각화
 */

import { useJangmaStore } from '../store/useJangmaStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getRainColor } from '../lib/simulation';
import { Droplet } from 'lucide-react';

export default function RainStats() {
  const { rainResults, averageRainfall, maxRainfall } = useJangmaStore();

  // Recharts용 데이터 준비
  const chartData = rainResults.map((r) => ({
    name: r.name,
    rainfall: r.rainfall,
    fill: getRainColor(r.rainfall),
  }));

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Droplet className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-lg text-slate-900">현재 강수 분포</span>
        </div>
        <div className="text-right text-xs text-slate-500">
          평균 <span className="font-semibold text-slate-800 tabular-nums">{averageRainfall}</span> mm/h
        </div>
      </div>

      {/* 큰 숫자 하이라이트 */}
      <div className="flex gap-3 mb-5">
        <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
          <div className="text-xs text-slate-500">평균 강수량</div>
          <div className="text-3xl font-semibold tabular-nums text-blue-700 mt-0.5">
            {averageRainfall} <span className="text-base font-normal text-slate-500">mm/h</span>
          </div>
        </div>
        <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
          <div className="text-xs text-slate-500">최대 강수 지역</div>
          <div className="text-3xl font-semibold tabular-nums text-blue-700 mt-0.5">
            {maxRainfall} <span className="text-base font-normal text-slate-500">mm/h</span>
          </div>
        </div>
      </div>

      {/* 막대 차트 */}
      <div className="h-56 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap={16}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12, fill: '#475569' }} 
              axisLine={{ stroke: '#cbd5e1' }}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#64748b' }} 
              axisLine={{ stroke: '#cbd5e1' }}
              label={{ value: 'mm/h', angle: -90, position: 'insideLeft', style: { fontSize: '11px', fill: '#64748b' } }}
            />
            <Tooltip 
              formatter={(value) => [`${value} mm/h`, '강수량']}
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '13px'
              }} 
            />
            <Bar dataKey="rainfall" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 도시별 상세 리스트 */}
      <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-2 text-sm">
        {rainResults.map((r) => (
          <div key={r.name} className="flex justify-between items-center">
            <span className="text-slate-600">{r.name}</span>
            <span className="font-medium tabular-nums" style={{ color: getRainColor(r.rainfall) }}>
              {r.rainfall} <span className="text-xs font-normal text-slate-400">mm/h</span>
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 text-[11px] text-slate-400">
        ※ 이 값은 현재 저기압 위치·강도·속도·해수면온도를 기반으로 한 근사 모델 결과입니다.
      </div>
    </div>
  );
}
