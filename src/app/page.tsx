'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Download, X, Loader2, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { toPng } from 'html-to-image';
import { DomeggookItem, DomeggookResponse } from '@/types/domeggook';
import ProductCard from '@/components/ProductCard';
import DetailTemplate from '@/components/DetailTemplate';
import styles from './page.module.css';

export default function Home() {
  const [keyword, setKeyword] = useState('');
  const [sort, setSort] = useState('aa'); // 낮은가격순 기본
  const [items, setItems] = useState<DomeggookItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DomeggookItem | null>(null);

  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [mnp, setMnp] = useState('');
  const [mxp, setMxp] = useState('');
  const [mnq, setMnq] = useState('');
  const [mxq, setMxq] = useState('');
  const [who, setWho] = useState('');
  const [lwp, setLwp] = useState(false);
  const [fdl, setFdl] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const buildQueryString = (pageNum: number) => {
    const params = new URLSearchParams();
    if (keyword.trim()) params.append('kw', keyword.trim());
    params.append('so', sort);
    params.append('pg', pageNum.toString());
    if (mnp) params.append('mnp', mnp);
    if (mxp) params.append('mxp', mxp);
    if (mnq) params.append('mnq', mnq);
    if (mxq) params.append('mxq', mxq);
    if (who) params.append('who', who);
    if (lwp) params.append('lwp', 'true');
    if (fdl) params.append('fdl', 'true');
    return params.toString();
  };

  const handleSearch = async (e?: React.FormEvent, pageNum: number = 1) => {
    if (e) e.preventDefault();
    if (!keyword.trim() && !isAdvancedOpen) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/domeggook?${buildQueryString(pageNum)}`);
      const data: DomeggookResponse = await response.json();
      
      if (data.domeggook?.list?.item) {
        // 도매꾹 API는 결과가 1개일 때 배열이 아닐 수 있으므로 처리
        const itemList = Array.isArray(data.domeggook.list.item) 
          ? data.domeggook.list.item 
          : [data.domeggook.list.item];
        setItems(itemList as DomeggookItem[]);
        
        if (data.domeggook.header?.numberOfPages) {
          setTotalPages(parseInt(data.domeggook.header.numberOfPages, 10));
        } else {
          setTotalPages(1);
        }
        setPage(pageNum);
      } else {
        setItems([]);
        setTotalPages(1);
        setPage(1);
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('상품을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadImage = async () => {
    const node = document.getElementById('detail-page-template');
    if (!node) return;

    try {
      const dataUrl = await toPng(node, { 
        cacheBust: true,
        backgroundColor: '#ffffff',
        // 외부 이미지가 포함된 경우 cors 이슈가 발생할 수 있으므로 주의 필요
      });
      const link = document.createElement('a');
      link.download = `detail_${selectedItem?.no || 'product'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Image generation failed', err);
      alert('이미지 생성에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
          <h1>도매꾹 최저가 서칭 플랫폼</h1>
          <Link href="/settings" style={{ position: 'absolute', right: 0, color: '#666' }} title="설정">
            <Settings size={28} />
          </Link>
        </div>
        <p>쉽고 빠른 아이템 도매꾹 소싱 도구</p>
      </header>

      <section className={styles.searchSection}>
        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <div style={{ display: 'flex', width: '100%', gap: '1rem' }}>
            <input
              type="text"
              className={styles.input}
              placeholder="검색어를 입력하세요 (예: 비타민, 마스크)"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <select 
              className={styles.select}
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="aa">낮은가격순</option>
              <option value="ha">인기상품순</option>
              <option value="rd">도매꾹랭킹순</option>
              <option value="da">최근등록순</option>
            </select>
            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <Search size={20} />}
              <span style={{ marginLeft: '0.5rem' }}>검색</span>
            </button>
            <button 
              type="button" 
              className={styles.advancedButton} 
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            >
              상세검색 {isAdvancedOpen ? <ChevronUp size={16} style={{ verticalAlign: 'middle', marginLeft: '4px' }} /> : <ChevronDown size={16} style={{ verticalAlign: 'middle', marginLeft: '4px' }} />}
            </button>
          </div>

          {isAdvancedOpen && (
            <div className={styles.advancedSearch}>
              <div className={styles.filterGroup}>
                <label>가격대</label>
                <input type="number" placeholder="최소" value={mnp} onChange={(e) => setMnp(e.target.value)} />
                <span>~</span>
                <input type="number" placeholder="최대" value={mxp} onChange={(e) => setMxp(e.target.value)} />
              </div>
              <div className={styles.filterGroup}>
                <label>구매수량</label>
                <input type="number" placeholder="최소" value={mnq} onChange={(e) => setMnq(e.target.value)} />
                <span>~</span>
                <input type="number" placeholder="최대" value={mxq} onChange={(e) => setMxq(e.target.value)} />
              </div>
              <div className={styles.filterGroup}>
                <label>배송비</label>
                <select value={who} onChange={(e) => setWho(e.target.value)}>
                  <option value="">전체</option>
                  <option value="S">무료배송</option>
                  <option value="P">선결제</option>
                  <option value="B">착불</option>
                  <option value="C">선택가능</option>
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label style={{ cursor: 'pointer' }}>
                  <input type="checkbox" checked={fdl} onChange={(e) => setFdl(e.target.checked)} />
                  빠른배송
                </label>
                <label style={{ cursor: 'pointer', marginLeft: '0.5rem' }}>
                  <input type="checkbox" checked={lwp} onChange={(e) => setLwp(e.target.checked)} />
                  최저가확인
                </label>
              </div>
            </div>
          )}
        </form>
      </section>

      <main>
        {loading ? (
          <div className={styles.loading}>상품을 찾고 있습니다...</div>
        ) : items.length > 0 ? (
          <>
            <div className={styles.grid}>
              {items.map((item) => (
                <ProductCard 
                  key={item.no} 
                  item={item} 
                  onSelect={(item) => setSelectedItem(item)} 
                />
              ))}
            </div>
            
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button 
                  className={styles.pageButton} 
                  disabled={page === 1}
                  onClick={() => handleSearch(undefined, page - 1)}
                >
                  이전
                </button>
                <span className={styles.pageInfo}>
                  {page} / {totalPages}
                </span>
                <button 
                  className={styles.pageButton} 
                  disabled={page === totalPages}
                  onClick={() => handleSearch(undefined, page + 1)}
                >
                  다음
                </button>
              </div>
            )}
          </>
        ) : (
          <div className={styles.noResults}>
            {keyword ? '검색 결과가 없습니다.' : '검색어를 입력하고 시작하세요.'}
          </div>
        )}
      </main>

      {/* Detail Page Modal */}
      {selectedItem && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <button 
              className={styles.closeButton} 
              onClick={() => setSelectedItem(null)}
            >
              <X size={32} />
            </button>
            
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h2>상품 상세 페이지 미리보기</h2>
              <p>아래 영역이 이미지로 저장됩니다.</p>
            </div>

            <div style={{ overflowX: 'auto', border: '1px solid #ddd', background: '#f5f5f5', padding: '1rem' }}>
              <DetailTemplate item={selectedItem} id="detail-page-template" />
            </div>

            <button className={styles.downloadButton} onClick={handleDownloadImage}>
              <Download size={24} style={{ marginRight: '0.5rem' }} />
              이미지로 다운로드 받기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
