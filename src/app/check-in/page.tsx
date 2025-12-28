'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Heart, Zap, Brain, Loader2 } from 'lucide-react';
import { Card, Button, useToast } from '@/components/ui';
import { DashboardShell } from '@/components/layout';
import { cn } from '@/lib/utils';
import { useAchievements } from '@/contexts/achievements-context';

const moodOptions = [
  { value: 1, emoji: '😢', label: 'Very Bad' },
  { value: 2, emoji: '😕', label: 'Bad' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Great' },
];

const energyOptions = [
  { value: 1, label: 'Very Low', color: 'bg-red-500' },
  { value: 2, label: 'Low', color: 'bg-orange-500' },
  { value: 3, label: 'Moderate', color: 'bg-yellow-500' },
  { value: 4, label: 'High', color: 'bg-lime-500' },
  { value: 5, label: 'Very High', color: 'bg-green-500' },
];

const symptoms = ['Headache', 'Fatigue', 'Anxiety', 'Stress', 'Back Pain', 'Insomnia', 'Nausea', 'Dizziness'];

export default function CheckInPage() {
  const { showToast } = useToast();
  const { checkAchievements } = useAchievements();
  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const toggleSymptom = (s: string) => setSelectedSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const handleSubmit = async () => {
    if (!mood || !energy) return;
    
    setIsSubmitting(true);
    
    try {
      const payload: { mood: number; energy: number; symptoms: string[]; notes?: string } = {
        mood,
        energy,
        symptoms: selectedSymptoms,
      };
      
      // Only include notes if it's not empty
      if (notes && notes.trim()) {
        payload.notes = notes.trim();
      }
      
      const res = await fetch('/api/check-ins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save check-in');
      }

      setIsSubmitted(true);
      showToast('success', 'Check-in saved successfully!');
      
      // Check for new achievements
      setTimeout(() => {
        checkAchievements();
      }, 500);
      
    } catch (error: any) {
      showToast('error', error.message || 'Failed to save check-in');
    }
    
    setIsSubmitting(false);
  };

  const handleReset = () => {
    setMood(null);
    setEnergy(null);
    setSelectedSymptoms([]);
    setNotes('');
    setIsSubmitted(false);
  };

  if (isSubmitted) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
            <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-6">
              <Check className="h-10 w-10 text-primary-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Check-in Complete!</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Your daily wellness has been recorded.</p>
            <Button onClick={handleReset}>Submit Another</Button>
          </motion.div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 px-1">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="page-title">Daily Check-in</h1>
          <p className="page-description">How are you feeling today?</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card padding="lg">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2"><Heart className="h-5 w-5 text-pink-500" />Mood</h2>
            <div className="grid grid-cols-5 gap-1 sm:gap-2">
              {moodOptions.map((o) => (
                <button key={o.value} onClick={() => setMood(o.value)} className={cn('flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-4 rounded-xl border-2 transition-all', mood === o.value ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300')}>
                  <span className="text-xl sm:text-3xl">{o.emoji}</span>
                  <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 hidden sm:block">{o.label}</span>
                </button>
              ))}
            </div>
            {mood && <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-2 sm:hidden">{moodOptions[mood - 1].label}</p>}
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card padding="lg">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2"><Zap className="h-5 w-5 text-yellow-500" />Energy Level</h2>
            <div className="flex gap-1 sm:gap-2">
              {energyOptions.map((o) => (
                <button key={o.value} onClick={() => setEnergy(o.value)} className={cn('flex-1 h-10 sm:h-12 rounded-xl transition-all text-sm sm:text-base', energy === o.value ? `${o.color} text-white font-medium` : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700')}>
                  {o.value}
                </button>
              ))}
            </div>
            {energy && <p className="text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">{energyOptions[energy - 1].label}</p>}
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card padding="lg">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2"><Brain className="h-5 w-5 text-purple-500" />Any symptoms? <span className="text-xs font-normal text-slate-400">(optional)</span></h2>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {symptoms.map((s) => (
                <button key={s} onClick={() => toggleSymptom(s)} className={cn('px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all', selectedSymptoms.includes(s) ? 'bg-purple-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700')}>
                  {s}
                </button>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card padding="lg">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-3 sm:mb-4">Notes <span className="text-xs font-normal text-slate-400">(optional)</span></h2>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How was your day? Anything noteworthy?" rows={3} className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm sm:text-base" />
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Button className="w-full" size="lg" onClick={handleSubmit} disabled={!mood || !energy || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Complete Check-in'
            )}
          </Button>
        </motion.div>
      </div>
    </DashboardShell>
  );
}