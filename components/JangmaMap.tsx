'use client';

/**
 * 장마 전선 실험실 - Leaflet 기반 인터랙티브 지도
 * 
 * 기능:
 * - 한반도 중심 지도 (OpenStreetMap)
 * - 드래그 가능한 저기압 중심 마커 ("L" 기호)
 * - 참조 지점별 강수량 색상 원 (실시간 업데이트)
 * - 장마 전선 라인 시각화
 * - 모바일 터치 대응
 */

import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useJangmaStore } from '../store/useJangmaStore';
import { getRainColor, REFERENCE_POINTS } from '../lib/simulation';

// next.config.ts와 동일한 basePath (정적 자산은 수동 prefix 필요)
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '/weather';

// Leaflet 기본 아이콘 문제 해결 (Next.js 번들러 환경)
// 외부 CDN 대신 public/leaflet 에 번들된 로컬 자산을 사용해 오프라인 환경에서도 동작하게 한다.
const DefaultIcon = L.icon({
  iconUrl: `${BASE_PATH}/leaflet/marker-icon.png`,
  iconRetinaUrl: `${BASE_PATH}/leaflet/marker-icon-2x.png`,
  shadowUrl: `${BASE_PATH}/leaflet/marker-shadow.png`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// 저기압 전용 커스텀 아이콘 (파란색 L 마커)
function createLowPressureIcon(isDragging: boolean) {
  return L.divIcon({
    className: 'low-pressure-marker',
    html: `
      <div style="
        width: 48px;
        height: 48px;
        background: ${isDragging ? '#1e40af' : '#1e3a8a'};
        border: 3px solid #bae6fd;
        border-radius: 9999px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(30, 58, 138, 0.5);
        transition: transform 0.1s ease;
        transform: ${isDragging ? 'scale(1.1)' : 'scale(1)'};
      ">
        <span style="
          color: white;
          font-weight: 700;
          font-size: 22px;
          font-family: system-ui, sans-serif;
          letter-spacing: -1px;
          user-select: none;
        ">L</span>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -24],
  });
}

interface JangmaMapProps {
  className?: string;
}

export default function JangmaMap({ className = '' }: JangmaMapProps) {
  const { params, rainResults, setPosition, setDragging, isDragging } = useJangmaStore();

  // 저기압 아이콘 (드래그 상태에 따라 시각적 피드백)
  const lowPressureIcon = useMemo(
    () => createLowPressureIcon(isDragging),
    [isDragging]
  );

  // 현재 강수량 결과 맵핑 (빠른 조회)
  const rainMap = useMemo(() => {
    const map = new Map<string, number>();
    rainResults.forEach((r) => map.set(r.name, r.rainfall));
    return map;
  }, [rainResults]);

  // 지도 중심 (파라미터 변경 시 부드럽게 따라가진 않음 — 안정성 위해 고정 중심)
  const mapCenter: [number, number] = [36.3, 127.8];
  const mapZoom = 7;

  // 드래그 가능한 마커 이벤트
  const markerEventHandlers = useMemo(
    () => ({
      dragstart: () => {
        setDragging(true);
      },
      dragend: (e: L.LeafletEvent) => {
        const marker = e.target as L.Marker;
        const pos = marker.getLatLng();
        setPosition(pos.lat, pos.lng);
        setDragging(false);
      },
    }),
    [setPosition, setDragging]
  );

  // 전선 라인 좌표 계산 (강도와 속도에 따라 길이/방향 변화)
  const frontLine = useMemo(() => {
    const { lat, lng, strength, speed } = params;
    const angle = (135 + (speed - 50) * 0.25) * (Math.PI / 180); // 라디안
    const length = 1.4 + (strength / 100) * 0.9; // 도 단위

    const dx = Math.cos(angle) * length;
    const dy = Math.sin(angle) * length * 0.72; // 위경도 비율 보정

    return [
      [lat - dy, lng - dx],
      [lat + dy, lng + dx],
    ] as [number, number][];
  }, [params]);

  /**
   * 장마 전선 강수 밴드 생성
   * 실제 장마전선은 저기압 중심을 따라 길게 뻗은 밴드 형태다.
   * 여기서는 전선 라인을 따라 여러 지점에 강수 원을 배치해 "밴드" 느낌을 준다.
   */
  const rainBand = useMemo(() => {
    const { lat, lng, strength, speed } = params;
    const band: React.ReactNode[] = [];

    const angle = (135 + (speed - 50) * 0.25) * (Math.PI / 180);
    const length = 1.1 + (strength / 100) * 0.75;

    const numPoints = 7;
    const bandWidthFactor = 0.55 + (strength / 100) * 0.25; // 강할수록 밴드가 넓음

    for (let i = 0; i < numPoints; i++) {
      const t = (i - (numPoints - 1) / 2) / ((numPoints - 1) / 2); // -1 ~ 1
      const offsetLat = Math.sin(angle) * length * t * 0.65;
      const offsetLng = Math.cos(angle) * length * t * 0.65;

      const pointLat = lat + offsetLat;
      const pointLng = lng + offsetLng;

      // 밴드 중심선에서 약간 수직 방향으로 퍼짐 (전선 폭)
      const perpAngle = angle + Math.PI / 2;
      const width = 0.22 * bandWidthFactor;

      // 밴드 중심 + 양쪽으로 약간씩
      const positions = [
        [pointLat, pointLng],
        [pointLat + Math.sin(perpAngle) * width, pointLng + Math.cos(perpAngle) * width * 0.8],
        [pointLat - Math.sin(perpAngle) * width, pointLng - Math.cos(perpAngle) * width * 0.8],
      ];

      const baseIntensity = Math.min(0.95, strength / 105 + 0.25);
      const radius = 26000 + strength * 220; // 밴드 폭

      positions.forEach((pos, idx) => {
        const opacity = 0.18 + baseIntensity * (idx === 0 ? 0.38 : 0.24);
        band.push(
          <Circle
            key={`band-${i}-${idx}`}
            center={pos as [number, number]}
            radius={radius * (idx === 0 ? 1 : 0.72)}
            pathOptions={{
              color: getRainColor(strength * 0.65 + 12),
              fillColor: getRainColor(strength * 0.7 + 10),
              fillOpacity: opacity,
              weight: 0.8,
              opacity: 0.55,
            }}
          />
        );
      });
    }

    return band;
  }, [params]);

  // 참조 지점별 강수 원 (시각화 핵심)
  const rainCircles = useMemo(() => {
    return rainResults.map((result) => {
      const intensity = Math.min(1, result.rainfall / 65);
      const radius = 22000 + intensity * 34000; // 미터 단위

      return (
        <Circle
          key={result.name}
          center={[result.lat, result.lng]}
          radius={radius}
          pathOptions={{
            color: getRainColor(result.rainfall),
            fillColor: getRainColor(result.rainfall),
            fillOpacity: 0.28 + intensity * 0.32,
            weight: 1.5,
            opacity: 0.75,
          }}
        />
      );
    });
  }, [rainResults]);

  return (
    <div className={`relative w-full h-full rounded-xl overflow-hidden border border-slate-200 shadow-inner ${className}`}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ width: '100%', height: '100%', background: '#f8fafc' }}
        zoomControl={true}
        attributionControl={true}
      >
        {/* 기본 타일 (OpenStreetMap) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 장마 전선 라인 (시각적 힌트) */}
        <Polyline
          positions={frontLine}
          pathOptions={{
            color: '#1e40af',
            weight: 2.5,
            opacity: 0.65,
            dashArray: '6, 5',
          }}
        />

        {/* 실제 장마전선 느낌의 길쭉한 강수 밴드 */}
        {rainBand}

        {/* 강수량 시각화 원 (주요 도시 기준) */}
        {rainCircles}

        {/* 참조 지점 작은 점 + 라벨 */}
        {REFERENCE_POINTS.map((point) => {
          const rainfall = rainMap.get(point.name) || 0;
          const color = getRainColor(rainfall);
          return (
            <Circle
              key={`dot-${point.name}`}
              center={[point.lat, point.lng]}
              radius={4200}
              pathOptions={{
                color: '#0f172a',
                fillColor: color,
                fillOpacity: 0.95,
                weight: 1.5,
              }}
            />
          );
        })}

        {/* 드래그 가능한 저기압 중심 마커 */}
        <Marker
          position={[params.lat, params.lng]}
          icon={lowPressureIcon}
          draggable={true}
          eventHandlers={markerEventHandlers}
        />
      </MapContainer>

      {/* 지도 위 오버레이 정보 */}
      <div className="absolute top-3 left-3 z-[500] bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 shadow border border-slate-200">
        저기압 중심을 <span className="font-semibold text-blue-700">드래그</span>하세요
      </div>

      {/* 범례 (지도 내부) */}
      <div className="absolute bottom-3 right-3 z-[500] bg-white/95 backdrop-blur px-3 py-2 rounded-lg border border-slate-200 shadow text-[11px]">
        <div className="font-semibold text-slate-700 mb-1.5">강수량 (mm/h)</div>
        <div className="flex gap-1.5 flex-wrap">
          {[
            { v: 3, l: '약' },
            { v: 15, l: '보통' },
            { v: 40, l: '강' },
            { v: 70, l: '극한' },
          ].map((item) => (
            <div key={item.l} className="flex items-center gap-1">
              <div 
                className="w-3 h-3 rounded-full border border-slate-300" 
                style={{ background: getRainColor(item.v) }} 
              />
              <span className="text-slate-600">{item.l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
