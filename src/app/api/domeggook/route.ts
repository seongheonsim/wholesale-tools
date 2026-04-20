import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const DOMEGGOOK_API_URL = 'https://domeggook.com/ssl/api/';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  let aid = '';
  
  // Supabase 설정이 되어 있는 경우 DB에서 키 조회를 시도
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key_value')
        .eq('key_name', 'domeggook_aid')
        .single();
      
      if (!error && data?.key_value) {
        aid = data.key_value;
      } else {
        console.warn('DB에서 domeggook_aid 값을 찾을 수 없습니다.');
      }
    } catch (dbError) {
      console.error('DB 설정 조회 실패:', dbError);
    }
  }

  if (!aid) {
    return NextResponse.json(
      { error: '도매꾹 API 키(aid)가 설정되지 않았습니다. 설정 페이지에서 API 키를 먼저 등록해주세요.' }, 
      { status: 400 }
    );
  }

  const kw = searchParams.get('kw') || '';
  const ca = searchParams.get('ca') || '';
  const so = searchParams.get('so') || 'aa'; 
  const sz = searchParams.get('sz') || '20';
  const pg = searchParams.get('pg') || '1';

  const params = new URLSearchParams({
    ver: '4.1',
    mode: 'getItemList',
    aid: aid,
    market: 'dome',
    om: 'json',
    kw: kw,
    ca: ca,
    so: so,
    sz: sz,
    pg: pg,
  });

  const who = searchParams.get('who');
  if (who) params.append('who', who);
  const mnp = searchParams.get('mnp');
  if (mnp) params.append('mnp', mnp);
  const mxp = searchParams.get('mxp');
  if (mxp) params.append('mxp', mxp);
  const mnq = searchParams.get('mnq');
  if (mnq) params.append('mnq', mnq);
  const mxq = searchParams.get('mxq');
  if (mxq) params.append('mxq', mxq);
  const id = searchParams.get('id');
  if (id) params.append('id', id);
  const sgd = searchParams.get('sgd');
  if (sgd === 'true') params.append('sgd', 'true');
  const fdl = searchParams.get('fdl');
  if (fdl === 'true') params.append('fdl', 'true');
  const lwp = searchParams.get('lwp');
  if (lwp === 'true') params.append('lwp', 'true');

  try {
    const response = await fetch(`${DOMEGGOOK_API_URL}?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Domeggook API response was not ok');
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API Proxy Error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
