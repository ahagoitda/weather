'use client';

import dynamic from 'next/dynamic';

// Leaflet은 SSR이 불가능하므로 동적 로딩 필수
const JangmaMap = dynamic(() => import('./JangmaMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[420px] bg-slate-100 flex items-center justify-center rounded-xl border">
      <div className="text-slate-500">지도를 불러오는 중...</div>
    </div>
  ),
});

export default function JangmaMapWrapper() {
  return <JangmaMap className="min-h-[420px] md:min-h-[520px]" />;
}
