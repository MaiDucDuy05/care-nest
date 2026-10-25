'use client';

import { usePathname } from '@/i18n/routing';
import { ShopHeader } from './shop-header';
import { ShopFooter } from './shop-footer';
import { HealthHeader } from './health-header';
import { HealthFooter } from './health-footer';
import { FloatingChatWidget } from '@/components/chat/floating-chat-widget';

interface AppLayoutShellProps {
  children: React.ReactNode;
}

export function AppLayoutShell({ children }: AppLayoutShellProps) {
  const pathname = usePathname();

  // Xác định rõ ràng 2 phân hệ layout riêng biệt:
  // 1. Phân hệ Dashboard Theo Dõi Sức Khỏe & IoT: /health/*, /subscription/*, /activation, /settings/*
  // 2. Phân hệ Sàn Thương Mại Điện Tử Y Tế: /, /shop/*, /orders/*, /auth/*
  const isHealthDashboard =
    pathname.startsWith('/health') ||
    pathname.startsWith('/subscription') ||
    pathname.startsWith('/activation') ||
    pathname.startsWith('/settings');

  if (isHealthDashboard) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 relative">
        <HealthHeader />
        <main className="flex-1">{children}</main>
        <HealthFooter />
        <FloatingChatWidget />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 relative">
      <ShopHeader />
      <main className="flex-1">{children}</main>
      <ShopFooter />
      <FloatingChatWidget />
    </div>
  );
}

