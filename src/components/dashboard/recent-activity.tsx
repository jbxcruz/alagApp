'use client';

import { Activity, Pill, UtensilsCrossed, Smile, Heart } from 'lucide-react';
import { Card } from '@/components/ui';
import { formatRelativeTime } from '@/lib/utils';

const activities = [
  { id: '1', icon: Activity, iconColor: 'text-purple-500', iconBg: 'bg-purple-100 dark:bg-purple-900/30', title: 'Blood pressure logged', description: '118/78 mmHg', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  { id: '2', icon: Pill, iconColor: 'text-primary-500', iconBg: 'bg-primary-100 dark:bg-primary-900/30', title: 'Took Vitamin D', description: '1000 IU', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000) },
  { id: '3', icon: UtensilsCrossed, iconColor: 'text-orange-500', iconBg: 'bg-orange-100 dark:bg-orange-900/30', title: 'Breakfast logged', description: '420 calories', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000) },
  { id: '4', icon: Smile, iconColor: 'text-yellow-500', iconBg: 'bg-yellow-100 dark:bg-yellow-900/30', title: 'Daily check-in completed', description: 'Mood: Great, Energy: High', timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000) },
  { id: '5', icon: Heart, iconColor: 'text-rose-500', iconBg: 'bg-red-100 dark:bg-red-900/30', title: 'Heart rate logged', description: '72 bpm', timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000) },
];

export function RecentActivity() {
  return (
    <Card padding="md">
      <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Recent Activity</h3>
      <div className="space-y-1">
        {activities.map((activity, i) => (
          <div key={activity.id} className="flex items-start gap-3 p-2 -mx-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <div className="relative flex flex-col items-center">
              <div className={`p-2 rounded-lg ${activity.iconBg}`}><activity.icon className={`h-4 w-4 ${activity.iconColor}`} /></div>
              {i < activities.length - 1 && <div className="w-px h-full bg-slate-200 dark:bg-slate-700 absolute top-10 left-1/2 -translate-x-1/2" />}
            </div>
            <div className="flex-1 min-w-0 pb-4">
              <p className="text-sm font-medium text-slate-900 dark:text-white">{activity.title}</p>
              <p className="text-sm text-slate-500">{activity.description}</p>
              <p className="text-xs text-slate-400 mt-1">{formatRelativeTime(activity.timestamp)}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
