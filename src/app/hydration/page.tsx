'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Droplets,
  Plus,
  Minus,
  GlassWater,
  Target,
  TrendingUp,
  Calendar,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Clock,
  Flame,
  Award,
} from 'lucide-react';
import { DashboardShell } from '@/components/layout';
import { Card, Button, Badge, useToast } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { useAchievements } from '@/contexts/achievements-context';

interface WaterLog {
  id: string;
  amount_ml: number;
  logged_at: string;
}

interface DailyWater {
  date: string;
  total_ml: number;
}

const GLASS_SIZE = 250; // ml per glass
const DEFAULT_GOAL = 2000; // ml (8 glasses)

const quickAddOptions = [
  { label: 'Small Glass', ml: 200, icon: '🥛' },
  { label: 'Glass', ml: 250, icon: '🥤' },
  { label: 'Large Glass', ml: 350, icon: '🍶' },
  { label: 'Bottle', ml: 500, icon: '🧴' },
  { label: 'Large Bottle', ml: 750, icon: '💧' },
];

export default function HydrationPage() {
  const { showToast } = useToast();
  const { checkAchievements } = useAchievements();
  const [todayLogs, setTodayLogs] = useState<WaterLog[]>([]);
  const [weeklyData, setWeeklyData] = useState<DailyWater[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailyGoal, setDailyGoal] = useState(DEFAULT_GOAL);
  const [streak, setStreak] = useState(0);
  const [customAmount, setCustomAmount] = useState(250);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setIsLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setIsLoading(false);
      return;
    }

    const dateStr = selectedDate.toISOString().split('T')[0];

    // Fetch today's logs
    const { data: logs } = await supabase
      .from('water_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('logged_at', `${dateStr}T00:00:00`)
      .lte('logged_at', `${dateStr}T23:59:59`)
      .order('logged_at', { ascending: false });

    setTodayLogs(logs || []);

    // Fetch last 7 days for chart
    const weekStart = new Date(selectedDate);
    weekStart.setDate(weekStart.getDate() - 6);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const { data: weekLogs } = await supabase
      .from('water_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('logged_at', `${weekStartStr}T00:00:00`)
      .lte('logged_at', `${dateStr}T23:59:59`);

    // Aggregate by day
    const dailyMap: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - (6 - i));
      dailyMap[d.toISOString().split('T')[0]] = 0;
    }

    (weekLogs || []).forEach((log: WaterLog) => {
      const logDate = log.logged_at.split('T')[0];
      if (dailyMap[logDate] !== undefined) {
        dailyMap[logDate] += log.amount_ml;
      }
    });

    const weeklyArray = Object.entries(dailyMap).map(([date, total_ml]) => ({
      date,
      total_ml,
    }));
    setWeeklyData(weeklyArray);

    // Calculate streak
    const streakCount = await calculateStreak(user.id, supabase);
    setStreak(streakCount);

    setIsLoading(false);
  };

  const calculateStreak = async (userId: string, supabase: any): Promise<number> => {
    const { data: allLogs } = await supabase
      .from('water_logs')
      .select('logged_at, amount_ml')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false });

    if (!allLogs || allLogs.length === 0) return 0;

    // Group by date and sum
    const dailyTotals: Record<string, number> = {};
    allLogs.forEach((log: any) => {
      const date = log.logged_at.split('T')[0];
      dailyTotals[date] = (dailyTotals[date] || 0) + log.amount_ml;
    });

    // Count consecutive days meeting goal
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let currentDate = new Date(today);

    for (let i = 0; i < 60; i++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const total = dailyTotals[dateStr] || 0;

      if (total >= dailyGoal) {
        streak++;
      } else if (i > 0) {
        // Allow missing today
        break;
      }

      currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
  };

  const handleAddWater = async (ml: number) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      showToast('error', 'Please log in');
      return;
    }

    const { error } = await supabase.from('water_logs').insert({
      user_id: user.id,
      amount_ml: ml,
      logged_at: new Date().toISOString(),
    });

    if (error) {
      showToast('error', 'Failed to log water');
      return;
    }

    showToast('success', `Added ${ml}ml of water!`);
    fetchData();
    setTimeout(() => checkAchievements(), 500);
  };

  const handleDeleteLog = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('water_logs').delete().eq('id', id);

    if (!error) {
      showToast('success', 'Entry removed');
      setTodayLogs(todayLogs.filter(l => l.id !== id));
    }
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

  const totalToday = todayLogs.reduce((sum, log) => sum + log.amount_ml, 0);
  const progress = Math.min((totalToday / dailyGoal) * 100, 100);
  const glassesCount = Math.floor(totalToday / GLASS_SIZE);
  const remaining = Math.max(dailyGoal - totalToday, 0);

  const getShortDay = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 2);
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Hydration</h1>
            <p className="text-gray-500 mt-1">Track your daily water intake</p>
          </div>
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
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : (
          <>
            {/* Main Progress Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <Card className="p-6 bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-0">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  {/* Water Glass Visual */}
                  <div className="relative w-32 h-40">
                    <div className="absolute inset-0 bg-white/20 rounded-b-3xl rounded-t-xl border-4 border-white/30 overflow-hidden">
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 bg-white/40"
                        initial={{ height: 0 }}
                        animate={{ height: `${progress}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                      {/* Water ripple effect */}
                      {progress > 0 && (
                        <motion.div
                          className="absolute left-0 right-0 h-2 bg-white/20"
                          style={{ bottom: `${progress}%` }}
                          animate={{ y: [0, -2, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold">{Math.round(progress)}%</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-baseline gap-2 justify-center md:justify-start">
                      <span className="text-5xl font-bold">{totalToday}</span>
                      <span className="text-xl text-white/70">/ {dailyGoal} ml</span>
                    </div>
                    <p className="text-white/80 mt-2">
                      {remaining > 0
                        ? `${remaining} ml remaining to reach your goal`
                        : '🎉 Goal reached! Great job staying hydrated!'}
                    </p>
                    <div className="flex items-center gap-6 mt-4 justify-center md:justify-start">
                      <div className="flex items-center gap-2">
                        <GlassWater className="w-5 h-5" />
                        <span>{glassesCount} glasses</span>
                      </div>
                      {streak > 0 && (
                        <div className="flex items-center gap-2">
                          <Flame className="w-5 h-5 text-orange-300" />
                          <span>{streak} day streak</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Quick Add Buttons */}
            {isToday && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="p-6">
                  <h2 className="font-semibold text-gray-900 mb-4">Quick Add</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {quickAddOptions.map((option) => (
                      <button
                        key={option.ml}
                        onClick={() => handleAddWater(option.ml)}
                        className="flex flex-col items-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                      >
                        <span className="text-2xl">{option.icon}</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-slate-200">{option.label}</span>
                        <span className="text-xs text-gray-500 dark:text-slate-400">{option.ml} ml</span>
                      </button>
                    ))}
                  </div>

                  {/* Custom Amount */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-[#293548]">
                    <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">Custom Amount</p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setCustomAmount(Math.max(50, customAmount - 50))}
                        className="p-2 bg-gray-100 dark:bg-[#1A2742] hover:bg-gray-200 dark:hover:bg-[#293548] rounded-lg transition-colors text-gray-700 dark:text-slate-300"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <div className="flex-1 text-center">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">{customAmount}</span>
                        <span className="text-gray-500 dark:text-slate-400 ml-1">ml</span>
                      </div>
                      <button
                        onClick={() => setCustomAmount(customAmount + 50)}
                        className="p-2 bg-gray-100 dark:bg-[#1A2742] hover:bg-gray-200 dark:hover:bg-[#293548] rounded-lg transition-colors text-gray-700 dark:text-slate-300"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                      <Button onClick={() => handleAddWater(customAmount)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Stats Row */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-500 dark:text-slate-400">Daily Goal</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{dailyGoal} ml</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <GlassWater className="w-4 h-4 text-cyan-500" />
                  <span className="text-sm text-gray-500 dark:text-slate-400">Glasses Today</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{glassesCount}</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-sm text-gray-500 dark:text-slate-400">Current Streak</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{streak} days</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-500 dark:text-slate-400">Week Average</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(weeklyData.reduce((sum, d) => sum + d.total_ml, 0) / 7)} ml
                </p>
              </Card>
            </motion.div>

            {/* Weekly Chart */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900 dark:text-white">Weekly Overview</h2>
                  <Badge variant="secondary">{dailyGoal} ml goal</Badge>
                </div>
                <div className="flex items-end justify-between gap-2 h-32">
                  {weeklyData.map((day, i) => {
                    const height = (day.total_ml / dailyGoal) * 100;
                    const isGoalMet = day.total_ml >= dailyGoal;
                    const isSelected = day.date === selectedDate.toISOString().split('T')[0];

                    return (
                      <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full flex flex-col items-center justify-end h-24 relative">
                          {/* Goal line */}
                          <div className="absolute w-full h-px bg-blue-200 bottom-[100%] z-10" />
                          <motion.div
                            className={cn(
                              "w-full rounded-t-md",
                              isGoalMet ? "bg-blue-500" : "bg-blue-300"
                            )}
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.min(height, 100)}%` }}
                            transition={{ delay: i * 0.05, duration: 0.3 }}
                            style={{ minHeight: day.total_ml > 0 ? '4px' : '0' }}
                          />
                        </div>
                        <span className={cn(
                          "text-xs",
                          isSelected ? "font-bold text-blue-500" : "text-gray-400 dark:text-slate-500"
                        )}>
                          {getShortDay(day.date)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-500 rounded" />
                    <span>Goal met</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-300 rounded" />
                    <span>Below goal</span>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Today's Log */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    {isToday ? "Today's Log" : `Log for ${formatDate(selectedDate)}`}
                  </h2>
                  <span className="text-sm text-gray-500 dark:text-slate-400">{todayLogs.length} entries</span>
                </div>
                {todayLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <Droplets className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-slate-400">No water logged yet</p>
                    {isToday && (
                      <p className="text-sm text-gray-400 mt-1">Use the quick add buttons above to start tracking!</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todayLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#1A2742] rounded-xl group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <Droplets className="w-5 h-5 text-blue-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{log.amount_ml} <span className="text-gray-500 dark:text-slate-400 font-normal">ml</span></p>
                            <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(log.logged_at)}
                            </p>
                          </div>
                        </div>
                        {isToday && (
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Hydration Tips */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-100">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900">Hydration Tips</h3>
                    <ul className="mt-2 space-y-1 text-sm text-blue-700">
                      <li>• Start your day with a glass of water</li>
                      <li>• Drink a glass before each meal</li>
                      <li>• Keep a water bottle at your desk</li>
                      <li>• Set reminders every 2 hours</li>
                      <li>• Eat water-rich foods like fruits and vegetables</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}