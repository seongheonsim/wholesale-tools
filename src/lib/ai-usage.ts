import { supabase } from './supabase';

/**
 * AI 사용량 제어 및 모니터링 유틸리티
 */

// 엔진별 예상 비용 (DALL-E 3 HD 기준 약 $0.08, Gemini 2.0 Flash는 일정 한도 무료 후 과금)
const ENGINE_COSTS: Record<string, number> = {
  'OpenAI': 0.08,
  'Gemini': 0.01, // 임의 산정
};

// 기본 한도 설정
const DEFAULT_DAILY_IMAGE_LIMIT = 50; 

/**
 * 오늘 현재까지의 AI 사용량을 확인하여 추가 생성이 가능한지 판단
 */
export async function checkAiUsageLimit(engine: string) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. 오늘 사용량 집계
    const { count, error: countError } = await supabase
      .from('ai_usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('engine', engine)
      .gte('created_at', today.toISOString());

    if (countError) throw countError;

    // 2. 설정된 한도 가져오기 (없으면 기본값)
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('key_value')
      .eq('key_name', `limit_${engine.toLowerCase()}_daily`)
      .single();

    const limit = settings ? parseInt(settings.key_value) : DEFAULT_DAILY_IMAGE_LIMIT;

    return {
      isAllowed: (count || 0) < limit,
      currentUsage: count || 0,
      limit
    };
  } catch (error) {
    console.error('Usage check error:', error);
    return { isAllowed: true, currentUsage: 0, limit: 999 }; // 에러 시 우선 허용 (서비스 중단 방지)
  }
}

/**
 * AI 호출 성공 시 로그를 기록
 */
export async function logAiUsage(engine: string, type: string = 'image') {
  try {
    const cost = ENGINE_COSTS[engine] || 0;
    
    const { error } = await supabase
      .from('ai_usage_logs')
      .insert({
        engine,
        type,
        cost_estimate: cost
      });

    if (error) throw error;
  } catch (error) {
    console.error('Logging error:', error);
  }
}
