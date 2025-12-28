'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Stethoscope,
  Plus,
  X,
  Loader2,
  AlertCircle,
  Brain,
  Heart,
  Thermometer,
  Wind,
  Frown,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { DashboardShell } from '@/components/layout';
import { Card, Button, Input, Badge, useToast } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { useAchievements } from '@/contexts/achievements-context';

interface SymptomLog {
  id: string;
  symptom: string;
  category: string;
  severity: number;
  started_at: string | null;
  duration_hours: number | null;
  is_ongoing: boolean;
  potential_triggers: string[] | null;
  body_location: string | null;
  notes: string | null;
  logged_at: string;
}

interface SymptomPreset {
  name: string;
  category: string;
  icon: React.ElementType;
}

const symptomCategories = [
  { id: 'pain', label: 'Pain', icon: AlertCircle, color: 'text-red-500 bg-red-50' },
  { id: 'digestive', label: 'Digestive', icon: Frown, color: 'text-orange-500 bg-orange-50' },
  { id: 'respiratory', label: 'Respiratory', icon: Wind, color: 'text-blue-500 bg-blue-50' },
  { id: 'mental', label: 'Mental', icon: Brain, color: 'text-purple-500 bg-purple-50' },
  { id: 'energy', label: 'Energy', icon: Heart, color: 'text-green-500 bg-green-50' },
  { id: 'other', label: 'Other', icon: Thermometer, color: 'text-gray-500 bg-gray-100 dark:bg-slate-700' },
];

const commonSymptoms: SymptomPreset[] = [
  { name: 'Headache', category: 'pain', icon: Brain },
  { name: 'Back Pain', category: 'pain', icon: AlertCircle },
  { name: 'Muscle Pain', category: 'pain', icon: AlertCircle },
  { name: 'Joint Pain', category: 'pain', icon: AlertCircle },
  { name: 'Nausea', category: 'digestive', icon: Frown },
  { name: 'Bloating', category: 'digestive', icon: Frown },
  { name: 'Stomach Ache', category: 'digestive', icon: Frown },
  { name: 'Cough', category: 'respiratory', icon: Wind },
  { name: 'Congestion', category: 'respiratory', icon: Wind },
  { name: 'Sore Throat', category: 'respiratory', icon: Wind },
  { name: 'Anxiety', category: 'mental', icon: Brain },
  { name: 'Stress', category: 'mental', icon: Brain },
  { name: 'Brain Fog', category: 'mental', icon: Brain },
  { name: 'Fatigue', category: 'energy', icon: Heart },
  { name: 'Dizziness', category: 'energy', icon: Heart },
  { name: 'Insomnia', category: 'energy', icon: Heart },
  { name: 'Fever', category: 'other', icon: Thermometer },
  { name: 'Chills', category: 'other', icon: Thermometer },
];

const commonTriggers = [
  'Stress', 'Poor Sleep', 'Weather', 'Food', 'Alcohol', 'Caffeine',
  'Exercise', 'Dehydration', 'Screen Time', 'Medication', 'Allergies'
];

export default function SymptomsPage() {
  const { showToast } = useToast();
  const { checkAchievements } = useAchievements();
  const [symptoms, setSymptoms] = useState<SymptomLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [selectedSymptom, setSelectedSymptom] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('pain');
  const [severity, setSeverity] = useState(5);
  const [isOngoing, setIsOngoing] = useState(true);
  const [durationHours, setDurationHours] = useState('');
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [bodyLocation, setBodyLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSymptoms();
  }, [selectedDate]);

  const fetchSymptoms = async () => {
    setIsLoading(true);
    const supabase = createClient();
    const dateStr = selectedDate.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('symptom_logs')
      .select('*')
      .gte('logged_at', `${dateStr}T00:00:00`)
      .lte('logged_at', `${dateStr}T23:59:59`)
      .order('logged_at', { ascending: false });

    if (!error) {
      setSymptoms(data || []);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!selectedSymptom) {
      showToast('error', 'Please select or enter a symptom');
      return;
    }

    setIsSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      showToast('error', 'Please log in');
      setIsSaving(false);
      return;
    }

    const { error } = await supabase.from('symptom_logs').insert({
      user_id: user.id,
      symptom: selectedSymptom,
      category: selectedCategory,
      severity,
      is_ongoing: isOngoing,
      duration_hours: durationHours ? parseFloat(durationHours) : null,
      potential_triggers: selectedTriggers.length > 0 ? selectedTriggers : null,
      body_location: bodyLocation || null,
      notes: notes || null,
      logged_at: new Date().toISOString(),
    });

    if (error) {
      showToast('error', 'Failed to log symptom');
    } else {
      showToast('success', 'Symptom logged');
      setShowModal(false);
      resetForm();
      fetchSymptoms();
      setTimeout(() => checkAchievements(), 500);
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('symptom_logs').delete().eq('id', id);
    if (!error) {
      showToast('success', 'Symptom deleted');
      setSymptoms(symptoms.filter(s => s.id !== id));
    }
  };

  const resetForm = () => {
    setSelectedSymptom('');
    setSelectedCategory('pain');
    setSeverity(5);
    setIsOngoing(true);
    setDurationHours('');
    setSelectedTriggers([]);
    setBodyLocation('');
    setNotes('');
  };

  const toggleTrigger = (trigger: string) => {
    setSelectedTriggers(prev =>
      prev.includes(trigger) ? prev.filter(t => t !== trigger) : [...prev, trigger]
    );
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  const formatDate = (date: Date) => {
    if (isToday) return 'Today';
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getSeverityColor = (sev: number) => {
    if (sev <= 3) return 'text-green-600 bg-green-50';
    if (sev <= 6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getSeverityLabel = (sev: number) => {
    if (sev <= 3) return 'Mild';
    if (sev <= 6) return 'Moderate';
    return 'Severe';
  };

  const getCategoryInfo = (cat: string) => {
    return symptomCategories.find(c => c.id === cat) || symptomCategories[5];
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Symptoms</h1>
            <p className="text-gray-500 mt-1">Track how you&apos;re feeling</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#1A2742] rounded-lg p-1">
              <button onClick={() => changeDate(-1)} className="p-2 hover:bg-white dark:hover:bg-[#293548] rounded-md transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-3 py-1 min-w-[120px] text-center">
                <span className="text-sm font-medium">{formatDate(selectedDate)}</span>
              </div>
              <button
                onClick={() => changeDate(1)}
                disabled={isToday}
                className={cn("p-2 rounded-md transition-colors", isToday ? "text-gray-300 dark:text-slate-600" : "hover:bg-white")}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <Button onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Log Symptom
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 md:grid-cols-3 gap-4"
        >
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{symptoms.length}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Symptoms Today</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {symptoms.filter(s => s.is_ongoing).length}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Ongoing</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {symptoms.length > 0 ? (symptoms.reduce((a, s) => a + s.severity, 0) / symptoms.length).toFixed(1) : '0'}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Avg Severity</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Symptom Log</h2>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              </div>
            ) : symptoms.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Stethoscope className="w-8 h-8 text-gray-400 dark:text-slate-500" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">No symptoms logged</h3>
                <p className="text-gray-500 dark:text-slate-400 mb-4">Track your symptoms to identify patterns</p>
                <Button onClick={() => setShowModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Log Symptom
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {symptoms.map((symptom) => {
                  const catInfo = getCategoryInfo(symptom.category);
                  const IconComponent = catInfo.icon;
                  
                  return (
                    <div key={symptom.id} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-[#1A2742] rounded-xl group">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", catInfo.color.split(' ')[1])}>
                        <IconComponent className={cn("w-6 h-6", catInfo.color.split(' ')[0])} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-gray-900 dark:text-white">{symptom.symptom}</h3>
                          <Badge variant="secondary" className={cn("text-xs", getSeverityColor(symptom.severity))}>
                            {getSeverityLabel(symptom.severity)} ({symptom.severity}/10)
                          </Badge>
                          {symptom.is_ongoing && (
                            <Badge variant="secondary" className="text-xs bg-orange-50 dark:bg-orange-900/30 text-orange-600">
                              Ongoing
                            </Badge>
                          )}
                        </div>
                        {symptom.potential_triggers && symptom.potential_triggers.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {symptom.potential_triggers.map((trigger) => (
                              <span key={trigger} className="text-xs px-2 py-0.5 bg-white dark:bg-[#293548] rounded-full text-gray-500 dark:text-slate-400">
                                {trigger}
                              </span>
                            ))}
                          </div>
                        )}
                        {symptom.notes && (
                          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{symptom.notes}</p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">
                          {new Date(symptom.logged_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(symptom.id)}
                        className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </motion.div>

        <AnimatePresence>
          {showModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-50"
                onClick={() => setShowModal(false)}
              />
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="w-full max-w-lg bg-white dark:bg-[#131C2E] rounded-2xl shadow-xl flex flex-col max-h-[80vh] pointer-events-auto"
                >
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#293548]">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Log Symptom</h2>
                  <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-[#1A2742] rounded-lg text-gray-500 dark:text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Common Symptoms</label>
                    <div className="flex flex-wrap gap-2">
                      {commonSymptoms.slice(0, 12).map((s) => (
                        <button
                          key={s.name}
                          onClick={() => { setSelectedSymptom(s.name); setSelectedCategory(s.category); }}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-sm transition-all",
                            selectedSymptom === s.name
                              ? "bg-primary-500 text-white"
                              : "bg-gray-100 dark:bg-[#1A2742] text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-[#293548]"
                          )}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3">
                      <Input
                        placeholder="Or type your symptom..."
                        value={selectedSymptom}
                        onChange={(e) => setSelectedSymptom(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Category</label>
                    <div className="grid grid-cols-3 gap-2">
                      {symptomCategories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded-lg border-2 transition-all",
                            selectedCategory === cat.id
                              ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                              : "border-gray-200 dark:border-[#293548] hover:border-gray-300 dark:hover:border-[#3d4f6f] bg-white dark:bg-[#1A2742]"
                          )}
                        >
                          <cat.icon className={cn("w-4 h-4", cat.color.split(' ')[0])} />
                          <span className="text-xs text-gray-700 dark:text-slate-300">{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Severity: {severity}/10 - {getSeverityLabel(severity)}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={severity}
                      onChange={(e) => setSeverity(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>Mild</span>
                      <span>Moderate</span>
                      <span>Severe</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Status</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsOngoing(true)}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                          isOngoing ? "bg-orange-500 text-white" : "bg-gray-100 dark:bg-[#1A2742] text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-[#293548]"
                        )}
                      >
                        Ongoing
                      </button>
                      <button
                        onClick={() => setIsOngoing(false)}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                          !isOngoing ? "bg-green-500 text-white" : "bg-gray-100 dark:bg-[#1A2742] text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-[#293548]"
                        )}
                      >
                        Resolved
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Possible Triggers</label>
                    <div className="flex flex-wrap gap-2">
                      {commonTriggers.map((trigger) => (
                        <button
                          key={trigger}
                          onClick={() => toggleTrigger(trigger)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-sm transition-all",
                            selectedTriggers.includes(trigger)
                              ? "bg-purple-500 text-white"
                              : "bg-gray-100 dark:bg-[#1A2742] text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-[#293548]"
                          )}
                        >
                          {trigger}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Notes (optional)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any additional details..."
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-[#293548] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none bg-white dark:bg-[#1A2742] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-[#293548] bg-gray-50 dark:bg-[#0B1120] rounded-b-2xl">
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button className="flex-1" onClick={handleSave} disabled={isSaving || !selectedSymptom}>
                      {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Log Symptom'}
                    </Button>
                  </div>
                </div>
              </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>
      </div>
    </DashboardShell>
  );
}