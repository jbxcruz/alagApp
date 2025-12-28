'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dumbbell,
  Heart,
  Flame,
  Timer,
  Plus,
  X,
  Loader2,
  Footprints,
  Bike,
  Waves,
  Sparkles,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { DashboardShell } from '@/components/layout';
import { Card, Button, Input, Badge, useToast } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { useAchievements } from '@/contexts/achievements-context';

interface ExerciseLog {
  id: string;
  activity_type: string;
  category: string;
  duration_minutes: number;
  calories_burned: number;
  distance_km: number | null;
  intensity: string;
  notes: string | null;
  logged_at: string;
}

interface ActivityPreset {
  name: string;
  category: string;
  icon: React.ElementType;
  caloriesPerMinute: { light: number; moderate: number; vigorous: number };
  hasDistance?: boolean;
}

const activityPresets: ActivityPreset[] = [
  { name: 'Running', category: 'cardio', icon: Footprints, caloriesPerMinute: { light: 8, moderate: 11, vigorous: 14 }, hasDistance: true },
  { name: 'Walking', category: 'cardio', icon: Footprints, caloriesPerMinute: { light: 3, moderate: 5, vigorous: 7 }, hasDistance: true },
  { name: 'Cycling', category: 'cardio', icon: Bike, caloriesPerMinute: { light: 5, moderate: 8, vigorous: 12 }, hasDistance: true },
  { name: 'Swimming', category: 'cardio', icon: Waves, caloriesPerMinute: { light: 6, moderate: 9, vigorous: 12 } },
  { name: 'Weights', category: 'strength', icon: Dumbbell, caloriesPerMinute: { light: 3, moderate: 5, vigorous: 7 } },
  { name: 'Yoga', category: 'flexibility', icon: Sparkles, caloriesPerMinute: { light: 2, moderate: 3, vigorous: 5 } },
  { name: 'HIIT', category: 'cardio', icon: Flame, caloriesPerMinute: { light: 8, moderate: 12, vigorous: 16 } },
  { name: 'Sports', category: 'sports', icon: Trophy, caloriesPerMinute: { light: 5, moderate: 8, vigorous: 11 } },
];

const categoryColors: Record<string, string> = {
  cardio: 'text-red-500 bg-red-50',
  strength: 'text-blue-500 bg-blue-50',
  flexibility: 'text-purple-500 bg-purple-50',
  sports: 'text-orange-500 bg-orange-50',
  other: 'text-gray-500 bg-gray-100 dark:bg-slate-700',
};

export default function ExercisePage() {
  const { showToast } = useToast();
  const { checkAchievements } = useAchievements();
  const [exercises, setExercises] = useState<ExerciseLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [selectedActivity, setSelectedActivity] = useState<ActivityPreset | null>(null);
  const [customActivity, setCustomActivity] = useState('');
  const [duration, setDuration] = useState(30);
  const [intensity, setIntensity] = useState<'light' | 'moderate' | 'vigorous'>('moderate');
  const [distance, setDistance] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchExercises();
  }, [selectedDate]);

  const fetchExercises = async () => {
    setIsLoading(true);
    const supabase = createClient();
    const dateStr = selectedDate.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('exercise_logs')
      .select('*')
      .gte('logged_at', `${dateStr}T00:00:00`)
      .lte('logged_at', `${dateStr}T23:59:59`)
      .order('logged_at', { ascending: false });

    if (!error) {
      setExercises(data || []);
    }
    setIsLoading(false);
  };

  const calculateCalories = () => {
    if (!selectedActivity) return 0;
    const rate = selectedActivity.caloriesPerMinute[intensity];
    return Math.round(rate * duration);
  };

  const handleSave = async () => {
    if (!selectedActivity && !customActivity) {
      showToast('error', 'Please select an activity');
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

    const { error } = await supabase.from('exercise_logs').insert({
      user_id: user.id,
      activity_type: selectedActivity?.name || customActivity,
      category: selectedActivity?.category || 'other',
      duration_minutes: duration,
      calories_burned: calculateCalories(),
      distance_km: distance ? parseFloat(distance) : null,
      intensity,
      notes: notes || null,
      logged_at: new Date().toISOString(),
    });

    if (error) {
      showToast('error', 'Failed to save exercise');
    } else {
      showToast('success', 'Exercise logged!');
      setShowModal(false);
      resetForm();
      fetchExercises();
      setTimeout(() => checkAchievements(), 500);
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('exercise_logs').delete().eq('id', id);
    if (!error) {
      showToast('success', 'Exercise deleted');
      setExercises(exercises.filter(e => e.id !== id));
    }
  };

  const resetForm = () => {
    setSelectedActivity(null);
    setCustomActivity('');
    setDuration(30);
    setIntensity('moderate');
    setDistance('');
    setNotes('');
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const totalCalories = exercises.reduce((sum, e) => sum + (e.calories_burned || 0), 0);
  const totalMinutes = exercises.reduce((sum, e) => sum + e.duration_minutes, 0);

  const formatDate = (date: Date) => {
    if (isToday) return 'Today';
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Exercise</h1>
            <p className="text-gray-500 dark:text-slate-400 mt-1">Track your workouts and activities</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#1A2742] rounded-lg p-1">
              <button onClick={() => changeDate(-1)} className="p-2 hover:bg-white dark:hover:bg-[#293548] rounded-md transition-colors text-gray-700 dark:text-slate-300">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-3 py-1 min-w-[120px] text-center">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(selectedDate)}</span>
              </div>
              <button
                onClick={() => changeDate(1)}
                disabled={isToday}
                className={cn("p-2 rounded-md transition-colors", isToday ? "text-gray-300 dark:text-slate-600" : "hover:bg-white dark:hover:bg-[#293548] text-gray-700 dark:text-slate-300")}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <Button onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Log Exercise
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCalories}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Calories Burned</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Timer className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalMinutes}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Minutes Active</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{exercises.length}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Workouts</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <Heart className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {exercises.length > 0 ? Math.round(totalMinutes / exercises.length) : 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Avg Duration</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Activities</h2>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              </div>
            ) : exercises.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Dumbbell className="w-8 h-8 text-gray-400 dark:text-slate-500" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">No exercises logged</h3>
                <p className="text-gray-500 dark:text-slate-400 mb-4">Start tracking your workouts!</p>
                <Button onClick={() => setShowModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Log Exercise
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {exercises.map((exercise) => {
                  const preset = activityPresets.find(p => p.name === exercise.activity_type);
                  const IconComponent = preset?.icon || Dumbbell;
                  const colorClass = categoryColors[exercise.category] || categoryColors.other;
                  
                  return (
                    <div key={exercise.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-[#1A2742] rounded-xl group">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", colorClass.split(' ')[1])}>
                        <IconComponent className={cn("w-6 h-6", colorClass.split(' ')[0])} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900 dark:text-white">{exercise.activity_type}</h3>
                          <Badge variant="secondary" className="text-xs capitalize">{exercise.intensity}</Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Timer className="w-3.5 h-3.5" />{exercise.duration_minutes} min
                          </span>
                          <span className="flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5" />{exercise.calories_burned} cal
                          </span>
                          {exercise.distance_km && <span>{exercise.distance_km} km</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(exercise.id)}
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
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Log Exercise</h2>
                  <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-[#1A2742] rounded-lg text-gray-500 dark:text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">Select Activity</label>
                    <div className="grid grid-cols-4 gap-2">
                      {activityPresets.map((activity) => (
                        <button
                          key={activity.name}
                          onClick={() => { setSelectedActivity(activity); setCustomActivity(''); }}
                          className={cn(
                            "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all",
                            selectedActivity?.name === activity.name
                              ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                              : "border-gray-200 dark:border-[#293548] hover:border-gray-300 dark:hover:border-[#3B4A63] hover:bg-sky-50 dark:hover:bg-sky-900/20"
                          )}
                        >
                          <activity.icon className={cn("w-5 h-5", selectedActivity?.name === activity.name ? "text-primary-500" : "text-gray-500 dark:text-slate-400")} />
                          <span className="text-xs text-gray-600 dark:text-slate-300 text-center leading-tight">{activity.name}</span>
                        </button>
                      ))}
                    </div>
                    <div className="mt-3">
                      <Input
                        placeholder="Or enter custom activity..."
                        value={customActivity}
                        onChange={(e) => { setCustomActivity(e.target.value); setSelectedActivity(null); }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Duration: {duration} minutes</label>
                    <input
                      type="range"
                      min="5"
                      max="180"
                      step="5"
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                    />
                    <div className="flex justify-between text-xs text-gray-400 dark:text-slate-500 mt-1">
                      <span>5 min</span>
                      <span>180 min</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Intensity</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['light', 'moderate', 'vigorous'] as const).map((level) => (
                        <button
                          key={level}
                          onClick={() => setIntensity(level)}
                          className={cn(
                            "py-2 px-4 rounded-lg text-sm font-medium capitalize transition-all",
                            intensity === level
                              ? level === 'light' ? 'bg-green-500 text-white' :
                                level === 'moderate' ? 'bg-yellow-500 text-white' :
                                'bg-red-500 text-white'
                              : "bg-gray-100 dark:bg-[#1A2742] text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-[#293548]"
                          )}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  {(selectedActivity?.hasDistance || !selectedActivity) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Distance (km) - Optional</label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="e.g., 5.5"
                        value={distance}
                        onChange={(e) => setDistance(e.target.value)}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Notes (optional)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="How was your workout?"
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-[#293548] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none bg-white dark:bg-[#1A2742] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500"
                    />
                  </div>

                  {(selectedActivity || customActivity) && (
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-orange-700 dark:text-orange-400">Estimated Calories</span>
                        <span className="text-xl font-bold text-orange-600 dark:text-orange-400">{calculateCalories()} cal</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-[#293548] bg-gray-50 dark:bg-[#0B1120] rounded-b-2xl">
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button className="flex-1" onClick={handleSave} disabled={isSaving || (!selectedActivity && !customActivity)}>
                      {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Log Exercise'}
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