'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Download, X, Loader2, ChevronDown, ChevronUp, ExternalLink, Image as ImageIcon, User, Info, Truck, Store, Package, Tag, Undo2, ChevronRight, Layers, FileEdit, ZoomIn, Navigation, MousePointer2, CreditCard } from 'lucide-react';
import { toPng } from 'html-to-image';
import { DomeggookItem, DomeggookResponse, DomeggookItemDetail, DomeggookItemDetailResponse } from '@/types/domeggook';
import DetailTemplate from '@/components/DetailTemplate';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

// 안전한 숫자 포맷팅 유틸리티
const formatNumber = (val: any) => {
  if (val === undefined || val === null || val === '') return '0';
  const str = String(val);
  if (str.includes('|') || str.includes('+')) {
    try {
      const parts = str.split('|');
      const prices = parts.map(p => {
        const pricePart = p.includes('+') ? p.split('+')[1] : p;
        return Number(pricePart.replace(/[^0-9.-]+/g, ""));
      }).filter(n => !isNaN(n));
      if (prices.length > 0) {
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return min === max ? min.toLocaleString() : `${min.toLocaleString()} ~ ${max.toLocaleString()}`;
      }
    } catch (e) {
      return str;
    }
  }
  const num = Number(str.replace(/[^0-9.-]+/g, ""));
  return isNaN(num) ? '0' : num.toLocaleString();
};

const formatWithUnit = (val: any, defaultUnit: string) => {
  if (!val) return '-';
  const str = String(val).trim();
  const hasUnit = /[a-zA-Z가-힣]+$/.test(str);
  return hasUnit ? str : `${str}${defaultUnit}`;
};

const validateImage = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
};

const extractImagesFromHtml = (html: string | undefined): string[] => {
  if (!html) return [];
  const div = document.createElement('div');
  div.innerHTML = html;
  const imgs = div.getElementsByTagName('img');
  const urls: string[] = [];
  for (let i = 0; i < imgs.length; i++) {
    const src = imgs[i].getAttribute('src');
    if (src) urls.push(src);
  }
  return [...new Set(urls)];
};

const PriceTierInfo = ({ priceStr }: { priceStr: string | undefined }) => {
  if (!priceStr) return null;
  if (!priceStr.includes('|') && !priceStr.includes('+')) {
    return (
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <span className="text-sm font-bold text-slate-500">기본 단가</span>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-primary">{Number(priceStr).toLocaleString()}</span>
          <span className="text-xs font-bold text-primary">원</span>
        </div>
      </div>
    );
  }
  try {
    const tiers = priceStr.split('|').map(t => {
      const [qty, price] = t.split('+');
      return { qty: Number(qty.replace(/[^0-9]/g, "")), price: Number(price.replace(/[^0-9]/g, "")) };
    });
    return (
      <div className="grid grid-cols-1 gap-3">
        <div className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1.5 px-1">
          <Layers size={13} className="text-primary" /> 수량별 차등 단가 정책
        </div>
        {tiers.map((tier, index) => (
          <div key={index} className="group relative bg-white hover:bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-primary/30 shadow-sm transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-slate-700">{tier.qty.toLocaleString()}개 ~</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-baseline justify-end gap-0.5">
                  <span className="text-xl font-black text-slate-900 group-hover:text-primary transition-colors">
                    {tier.price.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-slate-400">원</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">단가 기준</p>
              </div>
            </div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 group-hover:h-8 bg-primary rounded-r-full transition-all duration-200" />
          </div>
        ))}
      </div>
    );
  } catch (e) {
    return <div className="bg-white p-4 rounded-xl border border-slate-200 text-primary font-black text-center">{priceStr}원</div>;
  }
};

const DetailRow = ({ label, value }: { label: string, value: any }) => (
  <div className="flex justify-between py-2 border-b border-slate-50 last:border-none">
    <span className="text-slate-500 text-sm font-medium">{label}</span>
    <span className="text-slate-900 text-sm font-semibold text-right pl-4">{value || '-'}</span>
  </div>
);

// --- 인터랙티브 이미지 뷰어 컴포넌트 ---
const InteractiveImageViewer = ({ url, onClose }: { url: string, onClose: () => void }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setScale(prev => Math.min(Math.max(prev + delta, 0.5), 5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove]);

  return (
    <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overlay-reset m-0 overflow-hidden select-none" 
         onClick={onClose}
         onWheel={handleWheel}>
      {/* 고정 닫기 버튼 */}
      <div className="fixed top-10 right-10 z-[10001]">
        <Button variant="secondary" size="icon" className="h-16 w-16 rounded-full shadow-2xl bg-white/20 hover:bg-white/40 text-white border-none transition-all" onClick={onClose}>
          <X size={40} strokeWidth={2.5} />
        </Button>
      </div>
      
      {/* 안내 가이드 */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[10001] bg-black/50 px-6 py-3 rounded-full text-white text-sm font-medium flex gap-6 backdrop-blur-md border border-white/10 pointer-events-none">
        <span className="flex items-center gap-2"><MousePointer2 size={16} className="text-primary" /> 드래그하여 이동</span>
        <span className="flex items-center gap-2"><ImageIcon size={16} className="text-primary" /> 휠로 확대/축소</span>
      </div>

      <div className="relative w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing" 
           onMouseDown={handleMouseDown}
           onClick={(e) => e.stopPropagation()}>
        <img 
          ref={imgRef}
          src={url} 
          alt="zoomed" 
          className="max-w-none transition-transform duration-75 ease-out pointer-events-none shadow-2xl"
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            maxHeight: scale > 1 ? 'none' : '90vh',
            maxWidth: scale > 1 ? 'none' : '90vw'
          }} 
        />
      </div>
    </div>
  );
};

export default function Home() {
  const [keyword, setKeyword] = useState('');
  const [sort, setSort] = useState('aa');
  const [items, setItems] = useState<DomeggookItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DomeggookItem | null>(null);
  const [itemDetail, setItemDetail] = useState<DomeggookItemDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [validImages, setValidImages] = useState<Array<{url: string, label: string}>>([]);
  const [descImages, setDescImages] = useState<string[]>([]);
  const [activeThumb, setActiveThumb] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [isNavOpen, setIsNavOpen] = useState(false);

  // 팝업 스크롤 컨테이너를 직접 제어하기 위한 Ref
  const popupScrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = {
    description: useRef<HTMLDivElement>(null),
    images: useRef<HTMLDivElement>(null),
    seller: useRef<HTMLDivElement>(null),
  };

  const scrollToTop = () => {
    if (popupScrollRef.current) {
      popupScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setIsNavOpen(false);
  };

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setIsNavOpen(false);
  };

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
        const itemList = Array.isArray(data.domeggook.list.item) ? data.domeggook.list.item : [data.domeggook.list.item];
        setItems(itemList as DomeggookItem[]);
        if (data.domeggook.header?.numberOfPages) setTotalPages(parseInt(data.domeggook.header.numberOfPages, 10));
        else setTotalPages(1);
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

  const handleFetchDetail = async (itemNo: string) => {
    setDetailLoading(true);
    setItemDetail(null);
    setActiveThumb(null);
    setValidImages([]);
    setDescImages([]);
    setIsNavOpen(false);
    try {
      const response = await fetch(`/api/domeggook/view?itemNo=${itemNo}`);
      const data: DomeggookItemDetailResponse = await response.json();
      if (data.domeggook) {
        const detail = data.domeggook;
        const candidates = [
          { url: detail.thumb?.original, label: '원본' },
          { url: detail.thumb?.large, label: '일반' },
          { url: detail.thumb?.largePng, label: 'PNG' },
          { url: detail.thumb?.small, label: '소형' },
        ].filter(t => t.url);
        const results = await Promise.all(candidates.map(async (img) => ({ ...img, isValid: await validateImage(img.url) })));
        const filtered = results.filter(r => r.isValid).map(({url, label}) => ({url, label}));
        setValidImages(filtered);
        if (filtered.length > 0) setActiveThumb(filtered[0].url);
        const extracted = extractImagesFromHtml(detail.desc?.contents?.item);
        setDescImages(extracted);
        setItemDetail(detail);
      } else {
        alert('상세 정보를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('Fetch detail error:', error);
      alert('상세 정보를 가져오는데 실패했습니다.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDownloadImage = async () => {
    const node = document.getElementById('detail-page-template');
    if (!node) return;
    try {
      const dataUrl = await toPng(node, { cacheBust: true, backgroundColor: '#ffffff' });
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">상품 소싱</h2>
          <p className="text-muted-foreground mt-2">도매꾹의 상품을 검색하고 상세페이지를 AI로 가공합니다.</p>
        </div>
      </div>

      <Card className="shadow-md">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-col gap-4">
            <div className="flex flex-wrap md:flex-nowrap gap-4">
              <Input
                type="text"
                placeholder="검색어 (예: 비타민, 마스크)"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="flex-1 h-12 text-base"
              />
              <select 
                className="h-12 rounded-md border border-input bg-background px-4 py-2 text-base ring-offset-background"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="aa">낮은가격순</option>
                <option value="ha">인기상품순</option>
                <option value="rd">도매꾹랭킹순</option>
                <option value="da">최근등록순</option>
              </select>
              <Button type="submit" disabled={loading} className="h-12 px-6 text-base">
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Search className="mr-2 h-5 w-5" />}
                검색
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="h-12 px-6 text-base"
                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              >
                상세검색 {isAdvancedOpen ? <ChevronUp className="ml-2 h-5 w-5" /> : <ChevronDown className="ml-2 h-5 w-5" />}
              </Button>
            </div>

            {isAdvancedOpen && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg mt-2 border">
                <div className="space-y-2">
                  <label className="text-sm font-medium">가격대</label>
                  <div className="flex items-center gap-2">
                    <Input type="number" placeholder="최소" value={mnp} onChange={(e) => setMnp(e.target.value)} className="h-12 text-base" />
                    <span>~</span>
                    <Input type="number" placeholder="최대" value={mxp} onChange={(e) => setMxp(e.target.value)} className="h-12 text-base" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">구매수량</label>
                  <div className="flex items-center gap-2">
                    <Input type="number" placeholder="최소" value={mnq} onChange={(e) => setMnq(e.target.value)} className="h-12 text-base" />
                    <span>~</span>
                    <Input type="number" placeholder="최대" value={mxq} onChange={(e) => setMxq(e.target.value)} className="h-12 text-base" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">배송비</label>
                  <select 
                    className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background"
                    value={who} 
                    onChange={(e) => setWho(e.target.value)}
                  >
                    <option value="">전체</option>
                    <option value="S">무료배송</option>
                    <option value="P">선결제</option>
                    <option value="B">착불</option>
                    <option value="C">선택가능</option>
                  </select>
                </div>
                <div className="space-y-3 pt-8 flex flex-col justify-center">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <Checkbox checked={fdl} onCheckedChange={(c) => setFdl(c === true)} className="h-5 w-5" />
                    <span className="text-base font-medium leading-none">빠른배송</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <Checkbox checked={lwp} onCheckedChange={(c) => setLwp(c === true)} className="h-5 w-5" />
                    <span className="text-base font-medium leading-none">최저가확인</span>
                  </label>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      <Card shadow-md="true">
        <CardHeader className="py-4">
          <CardTitle className="text-lg">검색 결과 {items.length > 0 && <span className="text-muted-foreground text-sm font-normal ml-2">(페이지 {page}/{totalPages})</span>}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t overflow-x-auto">
            <div className="min-w-[800px]">
              <Table>
                <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[50px] text-center">
                    <Checkbox />
                  </TableHead>
                  <TableHead className="w-[80px]">이미지</TableHead>
                  <TableHead>상품명</TableHead>
                  <TableHead>공급사 (ID)</TableHead>
                  <TableHead className="text-right">도매가</TableHead>
                  <TableHead className="text-right">최소수량</TableHead>
                  <TableHead className="text-center">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin mb-2" />
                      데이터를 불러오는 중입니다...
                    </TableCell>
                  </TableRow>
                ) : items.length > 0 ? (
                  items.map((item) => (
                    <TableRow 
                      key={item.no} 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleFetchDetail(item.no)}
                    >
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        <Checkbox />
                      </TableCell>
                      <TableCell>
                        <div className="relative h-12 w-12 rounded-md overflow-hidden border">
                          <img src={item.thumb} alt="thumb" className="object-cover w-full h-full" />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium max-w-[300px] truncate" title={item.title}>
                        {item.title}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.id}</TableCell>
                      <TableCell className="text-right font-semibold text-red-600">
                        {formatNumber(item.price)}원
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(item.unitQty)}개</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button variant="secondary" size="sm" onClick={() => setSelectedItem(item)}>
                            <ImageIcon className="h-4 w-4 mr-1" />
                            상세 생성
                          </Button>
                          <a href={item.url} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" className="px-2">
                              <ExternalLink className="h-4 w-4 text-blue-600" />
                            </Button>
                          </a>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                      {keyword ? '검색 결과가 없습니다.' : '검색어를 입력하고 소싱을 시작하세요.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 p-4 border-t bg-white rounded-b-xl">
              <Button variant="outline" disabled={page === 1} onClick={() => handleSearch(undefined, page - 1)}>이전</Button>
              <span className="text-sm font-medium">{page} / {totalPages}</span>
              <Button variant="outline" disabled={page === totalPages} onClick={() => handleSearch(undefined, page + 1)}>다음</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Detail Info Popup */}
      {itemDetail && itemDetail.basis && (
        <div className="fixed z-[9999] bg-black/50 flex items-center justify-center p-4 md:p-10 backdrop-blur-[2px] overlay-reset overflow-hidden">
          <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 relative">
            
            {/* Compressed Floating Navigation - Optimized Speed & UI */}
            <div className="absolute right-6 bottom-[125px] z-20 flex flex-col items-end gap-3">
              {isNavOpen && (
                <div className="flex flex-col gap-2 mb-2 animate-in slide-in-from-bottom-2 fade-in duration-75">
                  <Button variant="outline" className="bg-white/90 backdrop-blur-md shadow-lg rounded-full px-5 h-12 flex items-center gap-2 border-primary/20 text-primary font-bold hover:bg-primary hover:text-white transition-all duration-75" onClick={scrollToTop}>
                    <ImageIcon size={18} /> 기본/배송 정보
                  </Button>
                  <Button variant="outline" className="bg-white/90 backdrop-blur-md shadow-lg rounded-full px-5 h-12 flex items-center gap-2 border-primary/20 text-primary font-bold hover:bg-primary hover:text-white transition-all duration-75" onClick={() => scrollToSection(sectionRefs.description)}>
                    <FileEdit size={18} /> 상세 설명
                  </Button>
                  <Button variant="outline" className="bg-white/90 backdrop-blur-md shadow-lg rounded-full px-5 h-12 flex items-center gap-2 border-primary/20 text-primary font-bold hover:bg-primary hover:text-white transition-all duration-75" onClick={() => scrollToSection(sectionRefs.images)}>
                    <ImageIcon size={18} /> 이미지 목록
                  </Button>
                  <Button variant="outline" className="bg-white/90 backdrop-blur-md shadow-lg rounded-full px-5 h-12 flex items-center gap-2 border-primary/20 text-primary font-bold hover:bg-primary hover:text-white transition-all duration-75" onClick={() => scrollToSection(sectionRefs.seller)}>
                    <User size={18} /> 판매자 정보
                  </Button>
                </div>
              )}
              <Button 
                size="icon" 
                className="h-16 w-16 rounded-full shadow-2xl bg-primary/80 backdrop-blur-sm text-primary-foreground hover:scale-105 active:scale-95 transition-all duration-75"
                onClick={() => setIsNavOpen(!isNavOpen)}
              >
                {isNavOpen ? <X size={32} /> : <Navigation size={32} />}
              </Button>
            </div>

            <div className="flex items-center justify-between px-8 py-5 border-b bg-white sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <span className="shrink-0 text-xs font-bold text-primary px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20">{itemDetail.basis.status}</span>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 line-clamp-1">{itemDetail.basis.title}</h2>
                  <p className="text-sm text-muted-foreground">상품번호: {itemDetail.basis.no} | 등록일: {itemDetail.basis.dateReg}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setItemDetail(null)} className="rounded-full"><X className="h-6 w-6" /></Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-12 bg-slate-50/30 scroll-smooth" ref={popupScrollRef}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1 space-y-6">
                  <div className="space-y-4">
                    <div className="aspect-square rounded-2xl overflow-hidden border bg-white shadow-sm flex items-center justify-center transition-all duration-300">
                      {activeThumb ? <img src={activeThumb} alt="main-thumb" className="w-full h-full object-cover animate-in fade-in duration-500" /> : <div className="flex flex-col items-center text-slate-300"><ImageIcon size={48} /><p className="text-xs mt-2">이미지 없음</p></div>}
                    </div>
                    {validImages.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {validImages.map((t, i) => (
                          <button key={i} onClick={() => setActiveThumb(t.url)} className={cn("relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all", activeThumb === t.url ? "border-primary shadow-md scale-105" : "border-transparent hover:border-slate-300")}>
                            <img src={t.url} alt={`thumb-${i}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-x-0 bottom-0 bg-black/40 text-[8px] text-white py-0.5 text-center font-bold">{t.label}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-4"><PriceTierInfo priceStr={itemDetail.price?.dome} /><div className="grid grid-cols-2 gap-4"><div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">최소수량</p><p className="text-lg font-black text-slate-900">{itemDetail.qty?.domeMoq || 0}개</p></div><div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">도매단위</p><p className="text-lg font-black text-slate-900">{itemDetail.qty?.domeUnit || 0}개</p></div></div></div>
                </div>
                <div className="lg:col-span-2 space-y-8">
                  <div className="space-y-4">
                    <h4 className="flex items-center gap-2 font-bold text-slate-800"><Store className="h-5 w-5 text-blue-500" /> 기본 및 판매 방식</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-1 bg-white p-5 rounded-2xl border shadow-sm">
                      <DetailRow label="판매방식" value={itemDetail.basis.section} /><DetailRow label="과세여부" value={itemDetail.basis.tax} /><DetailRow label="성인용품" value={itemDetail.basis.adult === 'true' ? '예' : '아니오'} /><DetailRow label="가격협상" value={itemDetail.basis.nego === 'disable' ? '불가' : '가능'} /><DetailRow label="등록일" value={itemDetail.basis.dateReg} /><DetailRow label="현재고" value={`${formatNumber(itemDetail.qty?.inventory)}개`} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="flex items-center gap-2 font-bold text-slate-800"><Truck className="h-5 w-5 text-green-500" /> 배송 정책</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-1 bg-white p-5 rounded-2xl border shadow-sm">
                      <DetailRow label="배송방법" value={itemDetail.deli?.method} /><DetailRow label="결제방식" value={itemDetail.deli?.pay} /><DetailRow label="배송상태" value={itemDetail.deli?.wating} /><DetailRow label="평균발송일" value={`${itemDetail.deli?.sendAvg || 0}일`} /><DetailRow label="빠른배송" value={itemDetail.deli?.fastDeli === 'true' ? '지원' : '미지원'} /><DetailRow label="해외배송" value={itemDetail.deli?.fromOversea === 'true' ? '예' : '아니오'} /><DetailRow label="추가배송비(제주)" value={`${formatNumber(itemDetail.deli?.feeExtra?.jeju)}원`} /><DetailRow label="추가배송비(도서)" value={`${formatNumber(itemDetail.deli?.feeExtra?.islands)}원`} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="flex items-center gap-2 font-bold text-slate-800"><Package className="h-5 w-5 text-orange-500" /> 상품 규격 및 정보</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-1 bg-white p-5 rounded-2xl border shadow-sm">
                      <DetailRow label="제조사" value={itemDetail.detail?.manufacturer} /><DetailRow label="원산지" value={itemDetail.detail?.country} /><DetailRow label="모델명" value={itemDetail.detail?.model} /><DetailRow label="규격(Size)" value={formatWithUnit(itemDetail.detail?.size, 'cm')} /><DetailRow label="무게(Weight)" value={formatWithUnit(itemDetail.detail?.weight, 'kg')} /><DetailRow label="해외직구" value={itemDetail.detail?.oversea === 'true' ? '예' : '아니오'} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-6" ref={sectionRefs.description}>
                <h4 className="flex items-center gap-2 font-bold text-xl text-slate-800 border-b pb-4"><FileEdit className="h-6 w-6 text-indigo-500" /> 상품 상세 설명</h4>
                <div className="bg-white p-8 rounded-3xl border shadow-inner min-h-[300px] overflow-x-hidden">
                  {itemDetail.desc?.contents?.item ? <div className="prose max-w-full domeggook-desc" dangerouslySetInnerHTML={{ __html: itemDetail.desc.contents.item }} /> : <div className="flex flex-col items-center justify-center py-20 text-slate-300"><Info size={48} strokeWidth={1} /><p className="mt-4 font-medium">등록된 상세 설명이 없습니다.</p></div>}
                </div>
              </div>
              <div className="space-y-6" ref={sectionRefs.images}>
                <h4 className="flex items-center gap-2 font-bold text-xl text-slate-800 border-b pb-4"><ImageIcon className="h-6 w-6 text-pink-500" /> 본문 추출 이미지 ({descImages.length}장)</h4>
                <p className="text-sm text-muted-foreground -mt-2">본문에 포함된 이미지를 따로 모았습니다. 클릭하면 크게 볼 수 있습니다.</p>
                {descImages.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {descImages.map((url, i) => (
                      <div key={i} className="group relative aspect-square bg-white rounded-xl border border-slate-100 overflow-hidden cursor-zoom-in hover:shadow-lg transition-all duration-200" onClick={() => setZoomedImage(url)}>
                        <img src={url} alt={`desc-img-${i}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-colors"><ZoomIn className="text-white opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all" /></div>
                      </div>
                    ))}
                  </div>
                ) : <div className="py-10 text-center text-slate-400 bg-white rounded-2xl border border-dashed">상세 설명에서 이미지를 찾을 수 없습니다.</div>}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch" ref={sectionRefs.seller}>
                <div className="flex flex-col space-y-4 h-full">
                  <h4 className="flex items-center gap-2 font-bold text-slate-800"><Tag className="h-5 w-5 text-purple-500" /> 카테고리 및 키워드</h4>
                  <div className="bg-white p-6 rounded-2xl border shadow-sm flex-1 space-y-6">
                    <div><p className="text-[10px] text-muted-foreground uppercase font-bold mb-3 tracking-widest">분류 경로</p><div className="flex flex-wrap items-center gap-x-2 gap-y-3 text-sm font-semibold">{itemDetail.category?.parents?.elem?.map((c, i) => (<React.Fragment key={i}><span className="text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">{c.name}</span><ChevronRight size={14} className="text-slate-300" /></React.Fragment>))}<span className="text-primary bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10">{itemDetail.category?.current?.name}</span></div></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase font-bold mb-3 tracking-widest">검색 키워드</p><div className="flex flex-wrap gap-2">{itemDetail.basis.keywords?.kw?.map((k, i) => (<span key={i} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-[11px] font-bold border border-slate-200/50 hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all cursor-default">#{k}</span>))}</div></div>
                  </div>
                </div>
                <div className="flex flex-col space-y-4 h-full mt-0 md:mt-0">
                  <h4 className="flex items-center gap-2 font-bold text-slate-800"><User className="h-5 w-5 text-teal-500" /> 판매자 및 기업 정보</h4>
                  <div className="bg-white p-6 rounded-2xl border shadow-sm flex-1 flex flex-col">
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-50"><div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xl">{itemDetail.seller?.nick?.substring(0, 1) || 'S'}</div><div><p className="font-bold text-lg leading-tight">{itemDetail.seller?.nick} <span className="text-slate-400 font-normal text-xs ml-1">({itemDetail.seller?.id})</span></p><p className="text-[11px] text-muted-foreground mt-1">사업자구분: {itemDetail.seller?.type} | 만족도: {itemDetail.seller?.score?.avg}</p></div></div>
                    <div className="space-y-1 flex-1"><DetailRow label="상호명" value={itemDetail.seller?.company?.name} /><DetailRow label="대표자" value={itemDetail.seller?.company?.boss} /><DetailRow label="사업자번호" value={itemDetail.seller?.company?.cno} /><DetailRow label="전화번호" value={itemDetail.seller?.company?.phone} /><DetailRow label="사업장주소" value={itemDetail.seller?.company?.addr} /></div>
                  </div>
                </div>
              </div>
              <div className="space-y-4 pb-16">
                <h4 className="flex items-center gap-2 font-bold text-slate-800"><Undo2 className="h-5 w-5 text-red-500" /> 반품/교환 안내</h4>
                <div className="bg-white p-6 rounded-2xl border shadow-sm">
                  <DetailRow label="반품배송비" value={`${formatNumber(itemDetail.return?.deliAmt)}원`} /><DetailRow label="반품연락처" value={itemDetail.return?.addr?.phone} /><DetailRow label="반품주소" value={`${itemDetail.return?.addr?.address1 || ''} ${itemDetail.return?.addr?.address2 || ''}`} />
                </div>
              </div>
            </div>
            <div className="p-6 bg-white border-t flex justify-end gap-3 sticky bottom-0 z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
              <Button variant="outline" onClick={() => setItemDetail(null)} className="h-12 px-6 text-base">닫기</Button>
              <Button onClick={() => { const baseItem = items.find(i => i.no === String(itemDetail.basis?.no)); if (baseItem) { setSelectedItem(baseItem); setItemDetail(null); } }} className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 text-base">상세페이지 생성기로 이동</Button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Image Viewer - Zoom & Pan Support */}
      {zoomedImage && <InteractiveImageViewer url={zoomedImage} onClose={() => setZoomedImage(null)} />}

      {detailLoading && (
        <div className="fixed z-[10000] bg-black/20 flex items-center justify-center backdrop-blur-[2px] overlay-reset">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 border border-white/50">
            <Loader2 className="h-12 w-12 text-primary animate-spin" /><p className="font-bold text-slate-800 text-xl tracking-tight">상품 정보를 분석하고 있습니다...</p>
          </div>
        </div>
      )}

      {selectedItem && (
        <div className="fixed z-[9999] bg-black/50 flex items-center justify-center p-4 md:p-10 backdrop-blur-[2px] overlay-reset overflow-hidden">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-8 py-5 border-b bg-white sticky top-0 z-10">
              <div className="flex items-center gap-4"><div className="bg-blue-100 p-2 rounded-lg"><FileEdit className="h-6 w-6 text-blue-600" /></div><div><h2 className="text-xl font-bold text-slate-900 line-clamp-1">AI 상세페이지 생성기</h2><p className="text-sm text-muted-foreground">{selectedItem.title}</p></div></div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedItem(null)} className="rounded-full"><X className="h-6 w-6" /></Button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3"><Info className="h-5 w-5 text-blue-500 mt-0.5" /><p className="text-sm text-blue-700 leading-relaxed">선택한 상품의 원본 데이터를 바탕으로 AI가 최적화된 상세페이지 문구를 생성합니다. 아래 미리보기를 확인하고 통이미지로 다운로드하여 마켓에 바로 사용하세요.</p></div>
                <div className="border shadow-2xl bg-white rounded-lg overflow-hidden transform scale-[0.95] origin-top transition-all"><DetailTemplate item={selectedItem} id="detail-page-template" /></div>
              </div>
            </div>
            <div className="p-6 bg-white border-t flex justify-end gap-3 sticky bottom-0 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
              <Button variant="outline" onClick={() => setSelectedItem(null)} className="h-12 px-6 text-base">취소</Button>
              <Button onClick={handleDownloadImage} className="h-12 px-8 bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg shadow-green-200 text-base"><Download className="mr-2 h-5 w-5" />통이미지 다운로드</Button>
              <Button className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-200 text-base">마켓 일괄 등록 대기열 추가</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
