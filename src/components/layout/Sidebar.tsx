'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Search, Package, Link as LinkIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: '대시보드', href: '/dashboard', icon: LayoutDashboard },
  { name: '상품 소싱', href: '/', icon: Search },
  { name: '내 상품 관리', href: '/products', icon: Package },
  { name: '판매 채널 관리', href: '/channels', icon: LinkIcon },
];

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();

  const handleLinkClick = (e: React.MouseEvent, href: string) => {
    // 상품 소싱 페이지만 구현됨
    if (href !== '/') {
      e.preventDefault();
      alert('아직 구현되지 않은 기능이니 조금만 기다려주세요.');
      return;
    }
    
    if (onClose) onClose();
  };

  return (
    <div className="flex h-full w-full flex-col border-r bg-white">
      <div className="flex h-16 items-center justify-between px-6 border-b">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
          <Package className="h-6 w-6" />
          <span>Wholesale Admin</span>
        </Link>
        {/* Mobile Close Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="lg:hidden" 
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="grid gap-1 px-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={(e) => handleLinkClick(e, item.href)}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-primary'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
