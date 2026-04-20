import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const DOMEGGOOK_API_URL = 'https://domeggook.com/ssl/api/';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const itemNo = searchParams.get('itemNo');

  if (!itemNo) {
    return NextResponse.json({ error: '상품 번호(no)가 필요합니다.' }, { status: 400 });
  }

  let aid = '';
  
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key_value')
        .eq('key_name', 'domeggook_aid')
        .single();
      
      if (!error && data?.key_value) {
        aid = data.key_value;
      }
    } catch (dbError) {
      console.error('DB 설정 조회 실패:', dbError);
    }
  }

  if (!aid) {
    return NextResponse.json({ error: 'API 키가 설정되지 않았습니다.' }, { status: 400 });
  }

  const params = new URLSearchParams({
    ver: '4.5',
    mode: 'getItemView',
    aid: aid,
    no: itemNo,
    om: 'json',
  });

  try {
    const response = await fetch(`${DOMEGGOOK_API_URL}?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Domeggook API response was not ok');
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API View Error:', error);
    return NextResponse.json({ error: '상품 정보를 가져오는데 실패했습니다.' }, { status: 500 });
  }
}
