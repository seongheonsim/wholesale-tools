'use client';

import React, { useState, useEffect } from 'react';
import { Save, Loader2, Eye, EyeOff, ShieldAlert, Activity, DollarSign, RefreshCcw, Key } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [dbConfigured, setDbConfigured] = useState(true);

  // 사용량 통계 상태
  const [stats, setStats] = useState({
    geminiToday: 0,
    totalCost: 0,
    geminiLimit: 50
  });

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setDbConfigured(false);
      setLoading(false);
      return;
    }
    fetchSettingsAndStats();
  }, []);

  const toggleKeyVisibility = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const fetchSettingsAndStats = async () => {
    setLoading(true);
    try {
      // 1. 모든 설정 가져오기
      const { data: settings } = await supabase.from('settings').select('*');
      
      if (settings) {
        const aid = settings.find(s => s.key_name === 'domeggook_aid');
        const gKey = settings.find(s => s.key_name === 'google_ai_api_key');
        const gLimit = settings.find(s => s.key_name === 'limit_gemini_daily');
        
        if (aid) setApiKey(aid.key_value);
        if (gKey) setGeminiKey(gKey.key_value);
        
        setStats(prev => ({
          ...prev,
          geminiLimit: gLimit ? parseInt(gLimit.key_value) : 50
        }));
      }

      // 2. 사용량 통계 집계
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data: logs } = await supabase.from('ai_usage_logs').select('*');
      
      if (logs) {
        const todayLogs = logs.filter(l => new Date(l.created_at) >= today);
        const totalCost = logs.reduce((sum, l) => sum + (l.cost_estimate || 0), 0);
        
        setStats(prev => ({
          ...prev,
          geminiToday: todayLogs.filter(l => l.engine === 'Gemini').length,
          totalCost: parseFloat(totalCost.toFixed(2))
        }));
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const updates = [
        { key_name: 'domeggook_aid', key_value: apiKey },
        { key_name: 'google_ai_api_key', key_value: geminiKey },
        { key_name: 'limit_gemini_daily', key_value: stats.geminiLimit.toString() }
      ];

      const { error } = await supabase.from('settings').upsert(updates, { onConflict: 'key_name' });
      if (error) throw error;

      setMessage('모든 설정이 성공적으로 저장되었습니다!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Save error:', err);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pt-4 pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">플랫폼 및 AI 설정</h1>
        <p className="text-muted-foreground">도매꾹 API 및 Gemini AI 연동 정보를 관리합니다.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity size={16} /> 오늘 Gemini 사용
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.geminiToday} <span className="text-sm font-normal text-muted-foreground">/ {stats.geminiLimit}회</span></div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
              <div className="bg-amber-500 h-full transition-all" style={{ width: `${Math.min((stats.geminiToday / stats.geminiLimit) * 100, 100)}%` }} />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign size={16} /> 누적 예상 비용
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${stats.totalCost}</div>
            <p className="text-xs text-muted-foreground mt-2">Gemini 추정치 기반</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-white rounded-2xl border shadow-md overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4"><Loader2 className="animate-spin h-10 w-10 text-primary" /><p className="text-slate-500 font-medium">정보를 불러오는 중...</p></div>
        ) : (
          <form onSubmit={handleSaveAll}>
            <div className="p-8 space-y-10">
              {/* 도매꾹 설정 */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b"><RefreshCcw size={20} className="text-slate-400" /><h3 className="font-bold text-lg">도매꾹 연동 설정</h3></div>
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700">도매꾹 API Key (aid)</label>
                  <div className="relative">
                    <Input type={showKeys['aid'] ? "text" : "password"} className="h-12 pr-12 text-base border-slate-200" placeholder="aid를 입력하세요" value={apiKey} onChange={(e) => setApiKey(e.target.value)} required />
                    <button type="button" onClick={() => toggleKeyVisibility('aid')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary p-1">{showKeys['aid'] ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                  </div>
                </div>
              </section>

              {/* AI 서비스 API 설정 */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b"><Key size={20} className="text-blue-400" /><h3 className="font-bold text-lg">AI 서비스 API 설정</h3></div>
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">Google AI API Key <span className="text-[10px] text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full font-bold">Gemini Nano Banana</span></label>
                    <div className="relative">
                      <Input type={showKeys['gemini'] ? "text" : "password"} className="h-12 pr-12 text-base border-slate-200" placeholder="API Key를 입력하세요" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} />
                      <button type="button" onClick={() => toggleKeyVisibility('gemini')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary p-1">{showKeys['gemini'] ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                    </div>
                  </div>
                </div>
              </section>

              {/* AI 과금 한도 설정 */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b"><ShieldAlert size={20} className="text-red-400" /><h3 className="font-bold text-lg">AI 세이프가드 설정</h3></div>
                <div className="grid grid-cols-1 gap-8">
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-700">Gemini 일일 한도 (회/일)</label>
                    <Input type="number" className="h-12 text-base" value={stats.geminiLimit} onChange={(e) => setStats({...stats, geminiLimit: parseInt(e.target.value) || 0})} />
                  </div>
                </div>
              </section>
            </div>

            <div className="p-6 bg-slate-50 border-t flex items-center justify-between">
              <p className="text-sm font-semibold text-green-600 min-h-[20px]">{message}</p>
              <Button type="submit" className="h-12 px-10 text-base font-bold shadow-lg" disabled={saving}>
                {saving ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Save className="mr-2 h-5 w-5" />}
                모든 설정 저장하기
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
