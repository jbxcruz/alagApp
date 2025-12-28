'use client';

import Link from 'next/link';
import { Pill, Check, Clock, ArrowRight } from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

const medications = [
  { id: '1', name: 'Vitamin D', dosage: '1000 IU', time: '8:00 AM', taken: true },
  { id: '2', name: 'Omega-3', dosage: '1000mg', time: '12:00 PM', taken: false },
  { id: '3', name: 'Melatonin', dosage: '3mg', time: '9:00 PM', taken: false },
];

export function MedicationsToday() {
  const completed = medications.filter(m => m.taken).length;
  const progress = (completed / medications.length) * 100;

  return (
    <Card padding="none" className="h-full flex flex-col">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary-100 dark:bg-primary-900/30"><Pill className="h-5 w-5 text-primary-500" /></div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Today&apos;s Medications</h3>
              <p className="text-sm text-slate-500">{completed}/{medications.length} completed</p>
            </div>
          </div>
          <Badge variant={completed === medications.length ? 'success' : 'secondary'}>{Math.round(progress)}%</Badge>
        </div>
        <div className="mt-4 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-primary-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex-1 p-4 space-y-2 overflow-y-auto">
        {medications.map((med) => (
          <div key={med.id} className={cn('flex items-center gap-3 p-3 rounded-xl transition-colors', med.taken ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700')}>
            <button className={cn('w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-colors', med.taken ? 'bg-primary-500 border-primary-500 text-white' : 'border-slate-300 dark:border-slate-600 hover:border-primary-500')}>
              {med.taken && <Check className="h-4 w-4" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className={cn('font-medium', med.taken ? 'text-primary-700 dark:text-primary-400' : 'text-slate-900 dark:text-white')}>{med.name}</p>
              <p className="text-sm text-slate-500">{med.dosage}</p>
            </div>
            <div className="flex items-center gap-1 text-sm text-slate-500"><Clock className="h-3.5 w-3.5" />{med.time}</div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <Link href="/medications"><Button variant="ghost" className="w-full justify-between">View All Medications<ArrowRight className="h-4 w-4" /></Button></Link>
      </div>
    </Card>
  );
}
