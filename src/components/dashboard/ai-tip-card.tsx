'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Heart, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Button, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { TipCategory, HealthTip } from '@/types';
import { tipCategoryConfig } from '@/config/site';

const demoTips: HealthTip[] = [
  { category: 'food', content: 'Eating protein with breakfast can help stabilize blood sugar levels and reduce mid-morning cravings.', emoji: '🥗' },
  { category: 'medical', content: 'Taking medications at the same time each day helps build a consistent routine and improves adherence.', emoji: '💊' },
  { category: 'quick', content: 'The 20-20-20 rule: Every 20 minutes, look at something 20 feet away for 20 seconds to reduce eye strain.', emoji: '⚡' },
  { category: 'life', content: 'Try the 4-7-8 breathing technique before bed: inhale 4 seconds, hold 7, exhale 8 for better sleep.', emoji: '🌱' },
  { category: 'fitness', content: 'Just 10 minutes of walking counts as exercise and adds up throughout the day.', emoji: '💪' },
];

export function AiTipCard() {
  const [tip, setTip] = useState<HealthTip | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<TipCategory | null>(null);
  const [key, setKey] = useState(0);

  const getRandomTip = (category: TipCategory | null = null) => {
    setLoading(true);
    setSaved(false);
    setTimeout(() => {
      let filtered = category ? demoTips.filter(t => t.category === category) : demoTips;
      setTip(filtered[Math.floor(Math.random() * filtered.length)]);
      setLoading(false);
    }, 400);
  };

  useEffect(() => { getRandomTip(); }, []);

  const handleRefresh = () => { setKey(k => k + 1); getRandomTip(selectedCategory); };
  const handleCategoryClick = (cat: TipCategory) => { const newCat = selectedCategory === cat ? null : cat; setSelectedCategory(newCat); getRandomTip(newCat); };
  const config = tip ? tipCategoryConfig[tip.category] : null;

  return (
    <Card className="relative overflow-hidden" padding="none">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary-100/50 to-transparent dark:from-primary-900/20 rounded-bl-full pointer-events-none" />
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl"><Sparkles className="h-5 w-5 text-yellow-600 dark:text-yellow-400" /></div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">AI Wellness Tip</h3>
              <p className="text-xs text-slate-500">Personalized for you</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => setSaved(!saved)} className={cn(saved && 'text-red-500')}><Heart className={cn('h-4 w-4', saved && 'fill-current')} /></Button>
            <Button variant="ghost" size="icon-sm" onClick={handleRefresh} disabled={loading}><RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /></Button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3 py-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              </div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full animate-pulse" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/5 animate-pulse" />
            </motion.div>
          ) : tip ? (
            <motion.div key={`tip-${key}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="py-2">
              <div className="flex items-start gap-4">
                <span className="text-3xl flex-shrink-0">{tip.emoji}</span>
                <div className="flex-1 min-w-0">
                  <Badge variant="secondary" className={cn('mb-2', config?.color)}>{config?.icon} {config?.label} Tip</Badge>
                  <p className="text-slate-700 dark:text-slate-200 leading-relaxed">{tip.content}</p>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <span className="text-xs text-slate-500 self-center mr-1">Filter:</span>
          {(Object.keys(tipCategoryConfig) as TipCategory[]).map((key) => (
            <Button key={key} variant={selectedCategory === key ? 'default' : 'outline'} size="sm" onClick={() => handleCategoryClick(key)} className="text-xs h-7 px-2">
              {tipCategoryConfig[key].icon} {tipCategoryConfig[key].label}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
}
