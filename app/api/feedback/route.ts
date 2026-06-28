import { NextRequest, NextResponse } from 'next/server';
import { SimulationParams } from '../../../lib/types';

/**
 * /api/feedback
 * 
 * 선택적 실제 LLM 피드백 제공
 * 
 * 1. 환경변수 GEMINI_API_KEY 또는 GROK_API_KEY가 있으면 실제 호출
 * 2. 없으면 클라이언트가 이미 가지고 있는 고품질 로컬 피드백을 사용하도록 501 반환
 * 
 * 이 구조는 Vercel 배포 시 즉시 동작하면서도 미래 확장을 쉽게 만듦
 */

const SYSTEM_PROMPT = `당신은 대한민국 중·고등학생을 대상으로 하는 기상 교육 전문가입니다.
사용자가 장마 전선(저기압)을 조작한 결과를 실제 관측 데이터와 비교하며 과학적으로 설명해야 합니다.

규칙:
- 반드시 2~3문장으로만 답변하세요.
- 저기압, 수증기, 정체, 해수면온도, 전선 이동 같은 핵심 용어를 사용하세요.
- "실제 2023년 장마 사례", "기상청 관측" 등 구체적 표현을 자연스럽게 포함하세요.
- 학생이 과학적 원리를 깨닫게 하는 학습 포인트를 담으세요.
- 친절하고 명확한 한국어로 답변하세요.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { params, averageRainfall, maxRainfall } = body as {
      params: SimulationParams;
      averageRainfall: number;
      maxRainfall: number;
    };

    if (!params) {
      return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
    }

    const userMessage = `현재 설정:
- 저기압 위치: ${params.lat.toFixed(1)}°N, ${params.lng.toFixed(1)}°E
- 전선 강도: ${params.strength}
- 이동 속도: ${params.speed}
- 해수면 온도: ${params.sst.toFixed(1)}°C
- 평균 강수량: ${averageRainfall} mm/h
- 최대 강수량: ${maxRainfall} mm/h

이 조작이 실제 장마 전선 관측과 어떤 차이가 있는지, 학생이 이해할 수 있도록 2~3문장으로 설명해주세요.`;

    // Gemini API 우선 시도
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                { role: 'user', parts: [{ text: SYSTEM_PROMPT + '\n\n' + userMessage }] },
              ],
              generationConfig: {
                temperature: 0.65,
                maxOutputTokens: 220,
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (text) {
            return NextResponse.json({
              summary: text.trim(),
              comparison: '실제 관측 기반 해석',
              learningPoint: '조작 결과가 실제 장마 메커니즘과 어떻게 연결되는지 확인하세요.',
            });
          }
        }
      } catch (err) {
        console.error('Gemini call failed:', err);
      }
    }

    // Grok (xAI) 지원 (선택)
    const grokKey = process.env.GROK_API_KEY;
    if (grokKey) {
      try {
        const response = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${grokKey}`,
          },
          body: JSON.stringify({
            model: 'grok-3-latest',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: userMessage },
            ],
            temperature: 0.7,
            max_tokens: 220,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.choices?.[0]?.message?.content || '';
          if (text) {
            return NextResponse.json({
              summary: text.trim(),
              comparison: '실제 관측 기반 해석',
              learningPoint: '조작 결과가 실제 장마 메커니즘과 어떻게 연결되는지 확인하세요.',
            });
          }
        }
      } catch (err) {
        console.error('Grok call failed:', err);
      }
    }

    // LLM을 사용할 수 없을 때
    return NextResponse.json(
      { 
        error: 'No LLM key configured. Using built-in educational feedback.',
        fallback: true 
      },
      { status: 501 }
    );
  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
