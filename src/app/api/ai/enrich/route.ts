import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { title, category, thumbDesc } = await request.json();

    // 1. DB에서 API Key 가져오기
    const { data: setting } = await supabase.from('settings').select('key_value').eq('key_name', 'google_ai_api_key').single();
    const apiKey = setting?.key_value || process.env.GOOGLE_AI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API Key가 필요합니다.' }, { status: 500 });
    }

    // 2. 최신 SDK 방식 적용
    const ai = new GoogleGenAI({ apiKey });

    // STEP 0. 초기 분석 및 데이터 학습 프롬프트
    const analysisPrompt = `
      상품명: ${title} / 카테고리: ${category} / 대표 이미지 설명: ${thumbDesc || '이미지 없음'}.

      이 상품의 인터넷 판매 데이터와 구매 후기를 검색/분석해서 가장 큰 장점 5가지와 타겟 고객층(나이, 성별, 라이프스타일)을 정리해줘.
      전체 상세페이지를 10페이지 구성으로 기획하고, 각 페이지의 핵심 소구 포인트를 정해줘.
      응답은 반드시 다음 JSON 형식을 지켜줘:
      {
        "advantages": ["장점1", "장점2", ...],
        "targetAudience": { "age": "...", "gender": "...", "lifestyle": "..." },
        "masterPlan": [
          { "page": 1, "theme": "Main Title", "objective": "후킹", "keyword": "헤드라인 키워드" },
          ... (10페이지까지)
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [{ role: "user", parts: [{ text: analysisPrompt }] }],
    });

    if (!response.candidates || !response.candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error('AI 분석 데이터를 생성하지 못했습니다.');
    }

    const text = response.candidates[0].content.parts[0].text;
    const analysisData = JSON.parse(text.replace(/```json|```/g, '').trim());

    return NextResponse.json({ 
      success: true, 
      analysis: analysisData,
      masterPlan: analysisData.masterPlan
    });

  } catch (error: any) {
    console.error('Step 0 Analysis Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
