'use client';

import Link from 'next/link';
import { Activity, UtensilsCrossed, SmilePlus, Bot } from 'lucide-react';
import { Card } from '@/components/ui';

const actions = [
  { icon: Activity, label: 'Log Vital', href: '/vitals', color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50' },
  { icon: UtensilsCrossed, label: 'Add Meal', href: '/nutrition', color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50' },
  { icon: SmilePlus, label: 'Check-in', href: '/check-in', color: 'text-primary-500', bg: 'bg-primary-100 dark:bg-primary-900/30 hover:bg-primary-200 dark:hover:bg-primary-900/50' },
  { icon: Bot, label: 'Ask AI', href: '/ai-assistant', color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50' },
];

export function QuickActions() {
  return (
    <Card padding="md">
      <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
      <div className="space-y-2">
        {actions.map((action) => (
          <Link key={action.label} href={action.href}>
            <button className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${action.bg}`}>
              <action.icon className={`h-5 w-5 ${action.color}`} />
              <span className="font-medium text-slate-700 dark:text-slate-200">{action.label}</span>
            </button>
          </Link>
        ))}
      </div>
    </Card>
  );
}
