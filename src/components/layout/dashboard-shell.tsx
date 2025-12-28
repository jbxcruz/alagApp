'use client';

import { useState } from 'react';
import { Sidebar } from './sidebar';
import { Navbar } from './navbar';
import { cn } from '@/lib/utils';
import { AchievementsProvider } from '@/contexts/achievements-context';
import { ToastProvider } from '@/components/ui';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <ToastProvider>
      <AchievementsProvider>
        <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120]">
          {/* Mobile Sidebar Overlay */}
          {mobileMenuOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}
          
          <Sidebar 
            isCollapsed={sidebarCollapsed} 
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            mobileOpen={mobileMenuOpen}
            onMobileClose={() => setMobileMenuOpen(false)}
          />
          
          <div className={cn('transition-all duration-300', sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64')}>
            <Navbar onMenuClick={() => setMobileMenuOpen(true)} />
            <main className="p-3 sm:p-4 lg:p-6 pb-24 lg:pb-6">
              <div className="max-w-7xl mx-auto">{children}</div>
            </main>
          </div>
        </div>
      </AchievementsProvider>
    </ToastProvider>
  );
}