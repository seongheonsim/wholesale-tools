import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { checkAiUsageLimit, logAiUsage } from '@/lib/ai-usage';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const usage = await checkAiUsageLimit('Gemini');
    if (!usage.isAllowed) {
      return NextResponse.json({ error: `오늘 사용 한도(${usage.limit}회)를 초과했습니다.` }, { status: 403 });
    }

    const { data: setting } = await supabase.from('settings').select('key_value').eq('key_name', 'google_ai_api_key').single();
    const apiKey = setting?.key_value || process.env.GOOGLE_AI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API Key가 설정되지 않았습니다.' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const { pagePlan, productInfo } = await request.json();

    const pagePrompt = `
      너는 스마트스토어 1등 상세페이지 디자이너야. 다음 계획에 따라 상세페이지용 [이미지 생성 프롬프트]와 [설명 원고]를 작성하고 실제 이미지를 생성해줘.

      기획안: Page ${pagePlan.page} - ${pagePlan.theme} (${pagePlan.objective})
      상품 정보: ${productInfo.title} / ${productInfo.category}
      
      [지침]:
      1. 비주얼: 고급스러운 배경, 전문 조명, 상품의 특징이 돋보이는 4k 실사 연출.
      2. 텍스트 합성: 이미지 상단에 "${pagePlan.keyword}" 문구를 강조된 폰트로 삽입하도록 프롬프트 설계.
      3. 원고: 모바일 최적화된 짧고 강력한 문장. AIDA 구조 반영.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: [{ role: "user", parts: [{ text: pagePrompt }] }],
    });

    let imageUrl = '';
    let manuscript = '';

    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.text) manuscript = part.text;
        else if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    }

    await logAiUsage('Gemini', 'image');
    
    return NextResponse.json({ 
      success: true, 
      page: pagePlan.page,
      imageUrl,
      manuscript,
      engine: 'Gemini Nano Banana (3.1 Flash)'
    });

  } catch (error: any) {
    console.error('Gemini Page Gen Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
