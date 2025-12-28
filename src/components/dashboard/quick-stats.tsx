'use client';

import { motion } from 'framer-motion';
import { Heart, Activity, Moon, Smile, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui';
import { cn } from '@/lib/utils';

const stats = [
  { icon: Heart, label: 'Heart Rate', value: '72', unit: 'bpm', trend: { value: 2, isPositive: false }, color: 'text-rose-500', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  { icon: Activity, label: 'Blood Pressure', value: '120/80', unit: 'mmHg', color: 'text-purple-500', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  { icon: Moon, label: 'Sleep', value: '7.5', unit: 'hrs', trend: { value: 8, isPositive: true }, color: 'text-indigo-500', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30' },
  { icon: Smile, label: 'Mood', value: '4/5', trend: { value: 5, isPositive: true }, color: 'text-primary-500', bgColor: 'bg-primary-100 dark:bg-primary-900/30' },
];

export function QuickStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
          <Card className="card-hover" padding="md">
            <div className="flex items-start justify-between">
              <div className={cn('p-2.5 rounded-xl', stat.bgColor)}><stat.icon className={cn('h-5 w-5', stat.color)} /></div>
              {stat.trend && (
                <div className={cn('flex items-center gap-1 text-xs font-medium', stat.trend.isPositive ? 'text-green-500' : 'text-red-500')}>
                  {stat.trend.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(stat.trend.value)}%
                </div>
              )}
            </div>
            <div className="mt-4">
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white number-display mt-1">{stat.value}{stat.unit && <span className="text-sm font-normal text-slate-500 ml-1">{stat.unit}</span>}</p>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
