'use client';

import React, { useState, useEffect } from 'react';
import { Save, Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import styles from './page.module.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [dbConfigured, setDbConfigured] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setDbConfigured(false);
      setLoading(false);
      return;
    }
    fetchApiKey();
  }, []);

  const fetchApiKey = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key_value')
        .eq('key_name', 'domeggook_aid')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching API key:', error);
      } else if (data) {
        setApiKey(data.key_value);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ 
          key_name: 'domeggook_aid', 
          key_value: apiKey 
        }, { onConflict: 'key_name' });

      if (error) throw error;

      setMessage('성공적으로 저장되었습니다!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Save error:', err);
      alert('저장 중 오류가 발생했습니다. DB 설정을 확인해주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">플랫폼 설정</h1>
        <p className="text-muted-foreground">도매꾹 Open API 연동 및 관리자 설정을 관리합니다.</p>
      </div>
      
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {!dbConfigured ? (
          <div className="p-4 bg-amber-50 border-b border-amber-100 text-amber-800">
            <p className="font-semibold flex items-center gap-2">
              <span className="text-xl">⚠️</span> DB가 연결되지 않았습니다.
            </p>
            <p className="text-sm mt-1">
              도매꾹 API 기능을 사용하려면 Supabase 환경변수 연결 및 설정을 완료해 주세요.
            </p>
          </div>
        ) : (
          <div className="p-6 border-b bg-slate-50/50">
            <p className="text-sm text-slate-600 leading-relaxed">
              도매꾹 Open API를 사용하기 위해 발급받은 **API Key (aid)**를 입력해 주세요.
              저장된 키는 데이터베이스에 암호화되어 안전하게 보관됩니다.
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin h-10 w-10 text-primary" />
            <p className="text-slate-500 font-medium">설정 정보를 불러오는 중...</p>
          </div>
        ) : dbConfigured ? (
          <form onSubmit={handleSave} className="p-8 space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700" htmlFor="apiKey">
                도매꾹 API Key (aid)
              </label>
              <div className="relative group">
                <Input
                  id="apiKey"
                  type={showApiKey ? "text" : "password"}
                  className="h-12 pr-12 text-base border-slate-200 focus:border-primary focus:ring-primary transition-all"
                  placeholder="도매꾹에서 발급받은 aid를 입력하세요"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors p-1"
                  title={showApiKey ? "키 숨기기" : "키 보기"}
                >
                  {showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-8">
              <div className="min-h-[24px]">
                {message && (
                  <p className="text-sm font-semibold text-green-600 animate-in fade-in slide-in-from-left-2">
                    {message}
                  </p>
                )}
              </div>
              <Button 
                type="submit" 
                className="h-12 px-8 text-base font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]" 
                disabled={saving}
              >
                {saving ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Save className="mr-2 h-5 w-5" />}
                저장하기
              </Button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
}
