'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Save, ChevronLeft, Loader2, LogOut } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import styles from './page.module.css';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [dbConfigured, setDbConfigured] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setDbConfigured(false);
      setLoading(false);
      return;
    }
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    fetchApiKey();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

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
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>플랫폼 설정</h1>
        
        {!dbConfigured ? (
          <div style={{ padding: '1rem', background: '#fff3cd', color: '#856404', borderRadius: '8px', marginBottom: '2rem', textAlign: 'left' }}>
            <p><strong>⚠️ DB가 연결되지 않았습니다.</strong></p>
            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
              도매꾹 API 기능을 사용하려면 Supabase 환경변수 연결 및 설정을 완료해 주세요.
            </p>
          </div>
        ) : (
          <p className={styles.description}>
            도매꾹 Open API를 사용하기 위해 발급받은 API Key (aid)를 입력해 주세요.<br/>
            저장된 키는 안전하게 데이터베이스에 보관됩니다.
          </p>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <Loader2 className="animate-spin" size={40} color="#007bff" />
            <p style={{ marginTop: '1rem' }}>불러오는 중...</p>
          </div>
        ) : dbConfigured ? (
          <form onSubmit={handleSave}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="apiKey">
                도매꾹 API Key (aid)
              </label>
              <input
                id="apiKey"
                type="password"
                className={styles.input}
                placeholder="도매꾹에서 발급받은 aid를 입력하세요"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
              />
            </div>

            <button type="submit" className={styles.button} disabled={saving}>
              {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              저장하기
            </button>

            {message && <div className={styles.successMessage}>{message}</div>}
          </form>
        ) : null}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
          <Link href="/" className={styles.backLink} style={{ marginTop: 0 }}>
            <ChevronLeft size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
            검색 페이지로 돌아가기
          </Link>
          {dbConfigured && (
            <button 
              onClick={handleLogout}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#dc3545', 
                cursor: 'pointer',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <LogOut size={16} />
              로그아웃
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
