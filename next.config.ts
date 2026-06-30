import type { NextConfig } from "next";

// 배포 대상에 따라 basePath를 결정한다.
// - GitHub Pages(정적 데모): /weather (기본값)
// - Vercel(루트 + 서버리스 LLM): NEXT_PUBLIC_BASE_PATH="" 로 빌드
// 이 값은 클라이언트(fetch 등)와 공유되어야 하므로 NEXT_PUBLIC_ 접두사를 사용한다.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '/weather';

// 정적 export는 Request 기반 Route Handler(/api/feedback)를 지원하지 않으므로,
// 생성형 LLM 보강을 쓰려면 서버 런타임(Vercel 등)에서 빌드해야 한다.
const staticExport = process.env.NEXT_PUBLIC_LLM_ENABLED !== 'true';

const nextConfig: NextConfig = {
  ...(staticExport ? { output: 'export' as const } : {}),
  basePath: basePath || undefined,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
