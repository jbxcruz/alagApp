'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Activity, 
  Heart, 
  Moon, 
  Scale, 
  Droplet, 
  Wind, 
  Thermometer, 
  X, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  Trash2
} from 'lucide-react';
import { Card, Button, Input, useToast } from '@/components/ui';
import { DashboardShell } from '@/components/layout';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface Vital {
  id: string;
  user_id: string;
  type: string;
  value: number;
  value_secondary?: number | null;
  unit: string;
  notes?: string | null;
  recorded_at: string;
  created_at: string;
}

const vitalTypes = [
  { id: 'blood_pressure', name: 'Blood Pressure', icon: Activity, color: '#8B5CF6', unit: 'mmHg', hasSecondary: true, secondaryLabel: 'Diastolic', primaryLabel: 'Systolic' },
  { id: 'heart_rate', name: 'Heart Rate', icon: Heart, color: '#F43F5E', unit: 'bpm', hasSecondary: false },
  { id: 'sleep', name: 'Sleep', icon: Moon, color: '#6366F1', unit: 'hours', hasSecondary: false },
  { id: 'weight', name: 'Weight', icon: Scale, color: '#14B8A6', unit: 'kg', hasSecondary: false },
  { id: 'glucose', name: 'Blood Glucose', icon: Droplet, color: '#F97316', unit: 'mg/dL', hasSecondary: false },
  { id: 'oxygen', name: 'Oxygen Saturation', icon: Wind, color: '#06B6D4', unit: '%', hasSecondary: false },
  { id: 'temperature', name: 'Temperature', icon: Thermometer, color: '#EF4444', unit: '°C', hasSecondary: false },
];

export default function VitalsPage() {
  const { showToast } = useToast();
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Form state
  const [selectedType, setSelectedType] = useState(vitalTypes[0]);
  const [value, setValue] = useState('');
  const [valueSecondary, setValueSecondary] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchVitals();
  }, [selectedDate]);

  const fetchVitals = async () => {
    setIsLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setIsLoading(false);
      return;
    }

    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('vitals')
      .select('*')
      .eq('user_id', user.id)
      .gte('recorded_at', startOfDay.toISOString())
      .lte('recorded_at', endOfDay.toISOString())
      .order('recorded_at', { ascending: false });

    if (error) {
      console.error('Error fetching vitals:', error);
      showToast('error', 'Failed to load vitals');
    } else {
      setVitals(data || []);
    }

    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!value) {
      showToast('error', 'Please enter a value');
      return;
    }

    if (selectedType.hasSecondary && !valueSecondary) {
      showToast('error', 'Please enter both values');
      return;
    }

    setIsSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      showToast('error', 'Please log in to save vitals');
      setIsSaving(false);
      return;
    }

    const { error } = await supabase.from('vitals').insert({
      user_id: user.id,
      type: selectedType.id,
      value: parseFloat(value),
      value_secondary: selectedType.hasSecondary ? parseFloat(valueSecondary) : null,
      unit: selectedType.unit,
      notes: notes || null,
      recorded_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error saving vital:', error);
      showToast('error', 'Failed to save vital');
    } else {
      showToast('success', 'Vital logged successfully!');
      resetForm();
      setShowModal(false);
      fetchVitals();
    }

    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('vitals').delete().eq('id', id);

    if (error) {
      showToast('error', 'Failed to delete vital');
    } else {
      showToast('success', 'Vital deleted');
      fetchVitals();
    }
  };

  const resetForm = () => {
    setSelectedType(vitalTypes[0]);
    setValue('');
    setValueSecondary('');
    setNotes('');
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    if (newDate <= new Date()) {
      setSelectedDate(newDate);
    }
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  const formatDate = (date: Date) => {
    if (isToday) return 'Today';
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatValue = (vital: Vital) => {
    if (vital.type === 'blood_pressure' && vital.value_secondary) {
      return `${vital.value}/${vital.value_secondary}`;
    }
    return vital.value.toString();
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  // Get latest reading for each vital type
  const getLatestReading = (type: string) => {
    return vitals.find(v => v.type === type);
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Vitals</h1>
            <p className="text-gray-500 dark:text-slate-400 mt-1">Track and monitor your health metrics</p>
          </div>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Log Vital
          </Button>
        </motion.div>

        {/* Date Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="flex items-center justify-center gap-4 p-2 bg-gray-100 dark:bg-[#1A2742] rounded-xl w-fit mx-auto">
            <button
              onClick={() => changeDate(-1)}
              className="p-2 hover:bg-white dark:hover:bg-[#293548] rounded-lg transition-colors text-gray-700 dark:text-slate-300"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-medium text-gray-900 dark:text-white min-w-[120px] text-center">
              {formatDate(selectedDate)}
            </span>
            <button
              onClick={() => changeDate(1)}
              disabled={isToday}
              className={cn(
                "p-2 rounded-lg transition-colors",
                isToday 
                  ? "text-gray-300 dark:text-slate-600 cursor-not-allowed" 
                  : "hover:bg-white dark:hover:bg-[#293548] text-gray-700 dark:text-slate-300"
              )}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* Vital Type Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {vitalTypes.map((v, i) => {
            const latest = getLatestReading(v.id);
            return (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.05 }}
              >
                <Card 
                  className="cursor-pointer transition-all hover:shadow-md hover:bg-sky-50 dark:hover:bg-sky-900/20" 
                  padding="md"
                  onClick={() => {
                    setSelectedType(v);
                    setShowModal(true);
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ backgroundColor: `${v.color}20` }}
                  >
                    <v.icon className="h-5 w-5" style={{ color: v.color }} />
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{v.name}</h3>
                  {latest ? (
                    <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                      {formatValue(latest)} <span className="text-sm font-normal text-gray-500 dark:text-slate-400">{v.unit}</span>
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">No reading today</p>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Recent Readings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card padding="none">
            <div className="p-6 border-b border-gray-200 dark:border-[#293548]">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Readings</h2>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              </div>
            ) : vitals.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-slate-400">No vitals logged for {formatDate(selectedDate).toLowerCase()}</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => setShowModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Log your first vital
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-[#293548]">
                {vitals.map((v) => {
                  const config = vitalTypes.find((t) => t.id === v.type);
                  const Icon = config?.icon || Activity;
                  return (
                    <div
                      key={v.id}
                      className="p-4 flex items-center justify-between hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${config?.color}20` }}
                        >
                          <Icon className="h-5 w-5" style={{ color: config?.color }} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{config?.name}</p>
                          <p className="text-sm text-gray-500 dark:text-slate-400">{formatTime(v.recorded_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatValue(v)}</p>
                          <p className="text-sm text-gray-500 dark:text-slate-400">{v.unit}</p>
                        </div>
                        <button
                          onClick={() => handleDelete(v.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Log Vital Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => { setShowModal(false); resetForm(); }}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-lg bg-white dark:bg-[#131C2E] rounded-2xl shadow-xl flex flex-col max-h-[80vh] pointer-events-auto"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#293548]">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Log Vital</h2>
                  <button
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-[#1A2742] rounded-lg text-gray-500 dark:text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Vital Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
                      Select Vital Type
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {vitalTypes.map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => {
                            setSelectedType(type);
                            setValue('');
                            setValueSecondary('');
                          }}
                          className={cn(
                            "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all",
                            selectedType.id === type.id
                              ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                              : "border-gray-200 dark:border-[#293548] hover:border-gray-300 dark:hover:border-[#3B4A63] hover:bg-sky-50 dark:hover:bg-sky-900/20"
                          )}
                        >
                          <type.icon
                            className="w-5 h-5"
                            style={{ color: selectedType.id === type.id ? type.color : undefined }}
                          />
                          <span className={cn(
                            "text-xs text-center leading-tight",
                            selectedType.id === type.id 
                              ? "text-primary-700 dark:text-primary-300 font-medium" 
                              : "text-gray-600 dark:text-slate-400"
                          )}>
                            {type.name.split(' ')[0]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Value Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      {selectedType.hasSecondary ? selectedType.primaryLabel : 'Value'} ({selectedType.unit})
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder={
                        selectedType.id === 'blood_pressure' ? 'e.g., 120' :
                        selectedType.id === 'heart_rate' ? 'e.g., 72' :
                        selectedType.id === 'sleep' ? 'e.g., 7.5' :
                        selectedType.id === 'weight' ? 'e.g., 70' :
                        selectedType.id === 'glucose' ? 'e.g., 100' :
                        selectedType.id === 'oxygen' ? 'e.g., 98' :
                        'e.g., 36.5'
                      }
                    />
                  </div>

                  {/* Secondary Value for Blood Pressure */}
                  {selectedType.hasSecondary && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        {selectedType.secondaryLabel} ({selectedType.unit})
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        value={valueSecondary}
                        onChange={(e) => setValueSecondary(e.target.value)}
                        placeholder="e.g., 80"
                      />
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Notes (optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any additional notes..."
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-[#293548] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none bg-white dark:bg-[#1A2742] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-[#293548] bg-gray-50 dark:bg-[#0B1120] rounded-b-2xl">
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => { setShowModal(false); resetForm(); }}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleSave}
                      disabled={isSaving || !value || (selectedType.hasSecondary && !valueSecondary)}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Vital'
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </DashboardShell>
  );
}