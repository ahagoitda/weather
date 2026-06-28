import type { Metadata } from 'next';
import { Geist, Geist_Mono, Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

const notoSansKR = Noto_Sans_KR({
  variable: '--font-noto-kr',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: '장마 전선 실험실 | 2026 기상·기후 AI 해커톤',
  description: '한반도 지도 위에서 저기압을 직접 움직이고 강도를 조절하며 장마 강수 패턴을 실시간으로 실험해보세요. 기상청 KMA 데이터 기반 교육용 인터랙티브 콘텐츠.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable} ${notoSansKR.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
