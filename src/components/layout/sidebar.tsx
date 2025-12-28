'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Activity, 
  Pill, 
  UtensilsCrossed, 
  SmilePlus, 
  Bot, 
  TrendingUp, 
  Heart, 
  ChevronLeft, 
  ChevronRight,
  Dumbbell,
  Stethoscope,
  Target,
  Droplets,
  FileText,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/vitals', icon: Activity, label: 'Vitals' },
  { href: '/medications', icon: Pill, label: 'Medications' },
  { href: '/nutrition', icon: UtensilsCrossed, label: 'Nutrition' },
  { href: '/hydration', icon: Droplets, label: 'Hydration' },
  { href: '/exercise', icon: Dumbbell, label: 'Exercise' },
  { href: '/symptoms', icon: Stethoscope, label: 'Symptoms' },
  { href: '/check-in', icon: SmilePlus, label: 'Check-in' },
  { href: '/goals', icon: Target, label: 'Goals' },
  { href: '/ai-assistant', icon: Bot, label: 'AI Assistant' },
  { href: '/ai-reports', icon: FileText, label: 'AI Reports' },
  { href: '/progress', icon: TrendingUp, label: 'Progress' },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ isCollapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-white dark:bg-[#0B1120] border-r border-slate-200 dark:border-[#293548] transition-all duration-300 hidden lg:flex flex-col',
        isCollapsed ? 'w-16' : 'w-64'
      )}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-[#293548]">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl overflow-hidden flex-shrink-0">
              <img src="/logo.svg" alt="AlagApp" className="h-full w-full object-cover" />
            </div>
            {!isCollapsed && <span className="text-xl font-bold text-slate-900 dark:text-white">AlagApp</span>}
          </Link>
          <Button variant="ghost" size="icon-sm" onClick={onToggle} className="hidden lg:flex">
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={cn('sidebar-item', isActive && 'active', isCollapsed && 'justify-center px-2')} title={isCollapsed ? item.label : undefined}>
                <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-primary-500')} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Sidebar */}
      <aside className={cn(
        'fixed left-0 top-0 z-50 h-screen w-72 bg-white dark:bg-[#0B1120] border-r border-slate-200 dark:border-[#293548] transition-transform duration-300 lg:hidden flex flex-col',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Mobile Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-[#293548]">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={onMobileClose}>
            <div className="h-9 w-9 rounded-xl overflow-hidden flex-shrink-0">
              <img src="/logo.svg" alt="AlagApp" className="h-full w-full object-cover" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white">AlagApp</span>
          </Link>
          <Button variant="ghost" size="icon-sm" onClick={onMobileClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Mobile Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                onClick={onMobileClose}
                className={cn('sidebar-item', isActive && 'active')}
              >
                <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-primary-500')} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}