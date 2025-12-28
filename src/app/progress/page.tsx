'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  Moon,
  Smile,
  Activity,
  Flame,
  Dumbbell,
  Pill,
  UtensilsCrossed,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Loader2,
  Target,
  Zap,
  Droplets,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import { DashboardShell } from '@/components/layout';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface DailyData {
  date: string;
  checkIn?: { mood: number; energy: number };
  vitals?: { systolic: number; diastolic: number; heart_rate: number; weight: number };
  exercise?: { duration: number; calories: number };
  nutrition?: { calories: number; protein: number; carbs: number; fat: number };
  water?: number;
  symptoms?: number;
  medicationAdherence?: number;
}

interface WeeklyStats {
  avgMood: number;
  avgEnergy: number;
  avgHeartRate: number;
  avgSleep: number;
  totalExerciseMinutes: number;
  totalCaloriesBurned: number;
  avgCaloriesConsumed: number;
  avgWaterIntake: number;
  checkInStreak: number;
  medicationAdherence: number;
  symptomCount: number;
}

interface Comparison {
  current: number;
  previous: number;
  change: number;
  trend: 'up' | 'down' | 'same';
}

const timeRanges = [
  { value: '7', label: 'Week' },
  { value: '14', label: '2 Weeks' },
  { value: '30', label: 'Month' },
  { value: '90', label: '3 Months' },
];

export default function ProgressPage() {
  const [selectedRange, setSelectedRange] = useState('7');
  const [isLoading, setIsLoading] = useState(true);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [comparisons, setComparisons] = useState<Record<string, Comparison>>({});

  useEffect(() => {
    fetchData();
  }, [selectedRange]);

  const fetchData = async () => {
    setIsLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setIsLoading(false);
      return;
    }

    const days = parseInt(selectedRange);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - days);

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    const prevStartStr = prevStartDate.toISOString().split('T')[0];

    // Fetch all data in parallel
    const [
      checkInsRes,
      vitalsRes,
      exerciseRes,
      nutritionRes,
      waterRes,
      symptomsRes,
      medicationDosesRes,
      prevCheckInsRes,
      prevExerciseRes,
    ] = await Promise.all([
      supabase.from('check_ins').select('*').eq('user_id', user.id).gte('check_in_date', startStr).lte('check_in_date', endStr),
      supabase.from('vitals').select('*').eq('user_id', user.id).gte('recorded_at', `${startStr}T00:00:00`).lte('recorded_at', `${endStr}T23:59:59`),
      supabase.from('exercise_logs').select('*').eq('user_id', user.id).gte('logged_at', `${startStr}T00:00:00`).lte('logged_at', `${endStr}T23:59:59`),
      supabase.from('nutrition_logs').select('*').eq('user_id', user.id).gte('logged_at', `${startStr}T00:00:00`).lte('logged_at', `${endStr}T23:59:59`),
      supabase.from('water_logs').select('*').eq('user_id', user.id).gte('logged_at', `${startStr}T00:00:00`).lte('logged_at', `${endStr}T23:59:59`),
      supabase.from('symptom_logs').select('*').eq('user_id', user.id).gte('logged_at', `${startStr}T00:00:00`).lte('logged_at', `${endStr}T23:59:59`),
      supabase.from('medication_doses').select('*').eq('user_id', user.id).gte('scheduled_at', `${startStr}T00:00:00`).lte('scheduled_at', `${endStr}T23:59:59`),
      // Previous period for comparison
      supabase.from('check_ins').select('*').eq('user_id', user.id).gte('check_in_date', prevStartStr).lt('check_in_date', startStr),
      supabase.from('exercise_logs').select('*').eq('user_id', user.id).gte('logged_at', `${prevStartStr}T00:00:00`).lt('logged_at', `${startStr}T00:00:00`),
    ]);

    const checkIns = checkInsRes.data || [];
    const vitals = vitalsRes.data || [];
    const exercises = exerciseRes.data || [];
    const nutrition = nutritionRes.data || [];
    const waterLogs = waterRes.data || [];
    const symptoms = symptomsRes.data || [];
    const medicationDoses = medicationDosesRes.data || [];
    const prevCheckIns = prevCheckInsRes.data || [];
    const prevExercises = prevExerciseRes.data || [];

    // Build daily data
    const dailyMap: Record<string, DailyData> = {};
    
    for (let i = 0; i < days; i++) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyMap[dateStr] = { date: dateStr };
    }

    // Process check-ins
    checkIns.forEach((ci: any) => {
      const dateStr = ci.check_in_date;
      if (dailyMap[dateStr]) {
        dailyMap[dateStr].checkIn = { mood: ci.mood, energy: ci.energy };
      }
    });

    // Process vitals
    vitals.forEach((v: any) => {
      const dateStr = v.recorded_at?.split('T')[0];
      if (dailyMap[dateStr]) {
        dailyMap[dateStr].vitals = {
          systolic: v.systolic,
          diastolic: v.diastolic,
          heart_rate: v.heart_rate,
          weight: v.weight,
        };
      }
    });

    // Process exercises (aggregate by day)
    exercises.forEach((e: any) => {
      const dateStr = e.logged_at.split('T')[0];
      if (dailyMap[dateStr]) {
        if (!dailyMap[dateStr].exercise) {
          dailyMap[dateStr].exercise = { duration: 0, calories: 0 };
        }
        dailyMap[dateStr].exercise!.duration += e.duration_minutes || 0;
        dailyMap[dateStr].exercise!.calories += e.calories_burned || 0;
      }
    });

    // Process nutrition (aggregate by day)
    nutrition.forEach((n: any) => {
      const dateStr = n.logged_at.split('T')[0];
      if (dailyMap[dateStr]) {
        if (!dailyMap[dateStr].nutrition) {
          dailyMap[dateStr].nutrition = { calories: 0, protein: 0, carbs: 0, fat: 0 };
        }
        dailyMap[dateStr].nutrition!.calories += n.calories || 0;
        dailyMap[dateStr].nutrition!.protein += n.protein_g || 0;
        dailyMap[dateStr].nutrition!.carbs += n.carbs_g || 0;
        dailyMap[dateStr].nutrition!.fat += n.fat_g || 0;
      }
    });

    // Process water logs (aggregate by day)
    waterLogs.forEach((w: any) => {
      const dateStr = w.logged_at.split('T')[0];
      if (dailyMap[dateStr]) {
        dailyMap[dateStr].water = (dailyMap[dateStr].water || 0) + (w.amount_ml || 0);
      }
    });

    // Process symptoms (count by day)
    symptoms.forEach((s: any) => {
      const dateStr = s.logged_at.split('T')[0];
      if (dailyMap[dateStr]) {
        dailyMap[dateStr].symptoms = (dailyMap[dateStr].symptoms || 0) + 1;
      }
    });

    // Convert to array and sort
    const sortedDailyData = Object.values(dailyMap).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    setDailyData(sortedDailyData);

    // Calculate stats
    const moodValues = checkIns.map((c: any) => c.mood).filter(Boolean);
    const energyValues = checkIns.map((c: any) => c.energy).filter(Boolean);
    const heartRates = vitals.map((v: any) => v.heart_rate).filter(Boolean);
    
    const takenDoses = medicationDoses.filter((d: any) => d.status === 'taken' || d.status === 'late').length;
    const totalDoses = medicationDoses.length;

    const newStats: WeeklyStats = {
      avgMood: moodValues.length > 0 ? moodValues.reduce((a: number, b: number) => a + b, 0) / moodValues.length : 0,
      avgEnergy: energyValues.length > 0 ? energyValues.reduce((a: number, b: number) => a + b, 0) / energyValues.length : 0,
      avgHeartRate: heartRates.length > 0 ? heartRates.reduce((a: number, b: number) => a + b, 0) / heartRates.length : 0,
      avgSleep: 0, // Would need sleep tracking
      totalExerciseMinutes: exercises.reduce((sum: number, e: any) => sum + (e.duration_minutes || 0), 0),
      totalCaloriesBurned: exercises.reduce((sum: number, e: any) => sum + (e.calories_burned || 0), 0),
      avgCaloriesConsumed: nutrition.length > 0 
        ? nutrition.reduce((sum: number, n: any) => sum + (n.calories || 0), 0) / days 
        : 0,
      avgWaterIntake: waterLogs.length > 0
        ? waterLogs.reduce((sum: number, w: any) => sum + (w.amount_ml || 0), 0) / days
        : 0,
      checkInStreak: calculateStreak(checkIns),
      medicationAdherence: totalDoses > 0 ? (takenDoses / totalDoses) * 100 : 100,
      symptomCount: symptoms.length,
    };
    setStats(newStats);

    // Calculate comparisons
    const prevMoodValues = prevCheckIns.map((c: any) => c.mood).filter(Boolean);
    const prevExerciseMinutes = prevExercises.reduce((sum: number, e: any) => sum + (e.duration_minutes || 0), 0);

    const newComparisons: Record<string, Comparison> = {
      mood: calculateComparison(
        moodValues.length > 0 ? moodValues.reduce((a: number, b: number) => a + b, 0) / moodValues.length : 0,
        prevMoodValues.length > 0 ? prevMoodValues.reduce((a: number, b: number) => a + b, 0) / prevMoodValues.length : 0
      ),
      exercise: calculateComparison(newStats.totalExerciseMinutes, prevExerciseMinutes),
      checkIns: calculateComparison(checkIns.length, prevCheckIns.length),
    };
    setComparisons(newComparisons);

    setIsLoading(false);
  };

  const calculateStreak = (checkIns: any[]): number => {
    if (checkIns.length === 0) return 0;
    
    const dates = new Set(checkIns.map((c: any) => c.check_in_date));
    const today = new Date().toISOString().split('T')[0];
    
    let streak = 0;
    let currentDate = new Date(today);
    
    for (let i = 0; i < 60; i++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      if (dates.has(dateStr)) {
        streak++;
      } else if (i > 0) {
        break;
      }
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    return streak;
  };

  const calculateComparison = (current: number, previous: number): Comparison => {
    const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;
    return {
      current,
      previous,
      change,
      trend: change > 2 ? 'up' : change < -2 ? 'down' : 'same',
    };
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'same', positive: boolean = true) => {
    if (trend === 'same') return <Minus className="w-3 h-3" />;
    if (trend === 'up') {
      return positive 
        ? <TrendingUp className="w-3 h-3 text-green-500" />
        : <TrendingUp className="w-3 h-3 text-red-500" />;
    }
    return positive 
      ? <TrendingDown className="w-3 h-3 text-red-500" />
      : <TrendingDown className="w-3 h-3 text-green-500" />;
  };

  const getTrendBadge = (comparison: Comparison | undefined, positive: boolean = true) => {
    if (!comparison) return null;
    
    const { change, trend } = comparison;
    const absChange = Math.abs(change);
    
    if (trend === 'same') {
      return <Badge variant="secondary">No change</Badge>;
    }
    
    const isPositive = (trend === 'up' && positive) || (trend === 'down' && !positive);
    
    return (
      <Badge variant={isPositive ? 'success' : 'error'} className="flex items-center gap-1">
        {getTrendIcon(trend, positive)}
        {absChange.toFixed(0)}%
      </Badge>
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getShortDay = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 2);
  };

  // Simple bar chart component
  const BarChart = ({ 
    data, 
    getValue, 
    color, 
    maxValue,
    label,
    unit,
  }: { 
    data: DailyData[]; 
    getValue: (d: DailyData) => number | undefined;
    color: string;
    maxValue: number;
    label: string;
    unit: string;
  }) => {
    const displayData = data.slice(-7); // Show last 7 days
    
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-700 dark:text-slate-200">{label}</span>
          <span className="text-xs text-gray-400 dark:text-slate-500">{unit}</span>
        </div>
        <div className="flex items-end justify-between gap-1 h-24">
          {displayData.map((item, i) => {
            const value = getValue(item) || 0;
            const height = maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 0;
            
            return (
              <div key={item.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col items-center justify-end h-20">
                  <span className="text-xs text-gray-500 mb-1">
                    {value > 0 ? (value % 1 === 0 ? value : value.toFixed(1)) : '-'}
                  </span>
                  <motion.div
                    className={cn("w-full rounded-t-md", color)}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    style={{ minHeight: value > 0 ? '4px' : '0' }}
                  />
                </div>
                <span className="text-xs text-gray-400 dark:text-slate-500">{getShortDay(item.date)}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Progress & Analytics</h1>
            <p className="text-gray-500 dark:text-slate-400 mt-1">Track your health trends over time</p>
          </div>
          <div className="flex gap-2">
            {timeRanges.map((range) => (
              <Button
                key={range.value}
                variant={selectedRange === range.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedRange(range.value)}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Smile className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-500 dark:text-slate-400">Avg Mood</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.avgMood ? stats.avgMood.toFixed(1) : '-'}/5
                </p>
                {getTrendBadge(comparisons.mood)}
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-orange-500" />
                  <span className="text-sm text-gray-500 dark:text-slate-400">Avg Energy</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.avgEnergy ? stats.avgEnergy.toFixed(1) : '-'}/5
                </p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-gray-500 dark:text-slate-400">Avg Heart Rate</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.avgHeartRate ? Math.round(stats.avgHeartRate) : '-'} <span className="text-sm font-normal text-gray-400 dark:text-slate-500">bpm</span>
                </p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-primary-500" />
                  <span className="text-sm text-gray-500 dark:text-slate-400">Check-in Streak</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.checkInStreak || 0} <span className="text-sm font-normal text-gray-400 dark:text-slate-500">days</span>
                </p>
                <Badge variant="success" className="mt-1">
                  <Flame className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              </Card>
            </motion.div>

            {/* Activity Stats */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Dumbbell className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-500 dark:text-slate-400">Exercise</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.totalExerciseMinutes || 0} <span className="text-sm font-normal text-gray-400 dark:text-slate-500">min</span>
                </p>
                {getTrendBadge(comparisons.exercise)}
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-sm text-gray-500 dark:text-slate-400">Calories Burned</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.totalCaloriesBurned || 0} <span className="text-sm font-normal text-gray-400 dark:text-slate-500">cal</span>
                </p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <UtensilsCrossed className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-500 dark:text-slate-400">Avg Daily Calories</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.avgCaloriesConsumed ? Math.round(stats.avgCaloriesConsumed) : '-'} <span className="text-sm font-normal text-gray-400 dark:text-slate-500">cal</span>
                </p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Pill className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-gray-500 dark:text-slate-400">Med Adherence</span>
                </div>
                <p className={cn(
                  "text-2xl font-bold",
                  stats && stats.medicationAdherence >= 90 ? "text-green-500" :
                  stats && stats.medicationAdherence >= 70 ? "text-yellow-500" : "text-gray-900 dark:text-white"
                )}>
                  {stats?.medicationAdherence ? Math.round(stats.medicationAdherence) : 100}%
                </p>
              </Card>
            </motion.div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Smile className="w-5 h-5 text-yellow-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Mood Trend</h3>
                  </div>
                  <BarChart
                    data={dailyData}
                    getValue={(d) => d.checkIn?.mood}
                    color="bg-yellow-400"
                    maxValue={5}
                    label="Daily Mood"
                    unit="1-5 scale"
                  />
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-5 h-5 text-orange-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Energy Levels</h3>
                  </div>
                  <BarChart
                    data={dailyData}
                    getValue={(d) => d.checkIn?.energy}
                    color="bg-orange-400"
                    maxValue={5}
                    label="Daily Energy"
                    unit="1-5 scale"
                  />
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Dumbbell className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Exercise Duration</h3>
                  </div>
                  <BarChart
                    data={dailyData}
                    getValue={(d) => d.exercise?.duration}
                    color="bg-blue-500"
                    maxValue={120}
                    label="Daily Exercise"
                    unit="minutes"
                  />
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <UtensilsCrossed className="w-5 h-5 text-green-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Calorie Intake</h3>
                  </div>
                  <BarChart
                    data={dailyData}
                    getValue={(d) => d.nutrition?.calories}
                    color="bg-green-500"
                    maxValue={3000}
                    label="Daily Calories"
                    unit="kcal"
                  />
                </Card>
              </motion.div>
            </div>

            {/* Insights Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-primary-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Insights & Highlights</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats && stats.checkInStreak >= 3 && (
                    <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-800">Great Consistency!</p>
                        <p className="text-sm text-green-600">
                          You&apos;ve checked in for {stats.checkInStreak} days straight. Keep it up!
                        </p>
                      </div>
                    </div>
                  )}

                  {stats && stats.totalExerciseMinutes >= 150 && (
                    <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
                      <Dumbbell className="w-5 h-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-800">Exercise Goal Met!</p>
                        <p className="text-sm text-blue-600">
                          You&apos;ve exercised {stats.totalExerciseMinutes} minutes this period.
                        </p>
                      </div>
                    </div>
                  )}

                  {stats && stats.medicationAdherence >= 90 && (
                    <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-xl">
                      <Pill className="w-5 h-5 text-purple-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-purple-800">Excellent Adherence!</p>
                        <p className="text-sm text-purple-600">
                          {Math.round(stats.medicationAdherence)}% medication compliance.
                        </p>
                      </div>
                    </div>
                  )}

                  {stats && stats.avgMood >= 4 && (
                    <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-xl">
                      <Smile className="w-5 h-5 text-yellow-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-800">Positive Mood!</p>
                        <p className="text-sm text-yellow-600">
                          Your average mood is {stats.avgMood.toFixed(1)}/5. You&apos;re doing great!
                        </p>
                      </div>
                    </div>
                  )}

                  {stats && stats.symptomCount > 5 && (
                    <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-xl">
                      <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-orange-800">Symptom Alert</p>
                        <p className="text-sm text-orange-600">
                          You logged {stats.symptomCount} symptoms. Consider reviewing patterns.
                        </p>
                      </div>
                    </div>
                  )}

                  {comparisons.exercise && comparisons.exercise.trend === 'up' && comparisons.exercise.change > 20 && (
                    <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl">
                      <TrendingUp className="w-5 h-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-800">Activity Boost!</p>
                        <p className="text-sm text-green-600">
                          Exercise is up {Math.round(comparisons.exercise.change)}% from last period.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Empty state for insights */}
                {stats && stats.checkInStreak < 3 && stats.totalExerciseMinutes < 150 && stats.avgMood < 4 && (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-slate-400">
                      Keep logging your health data to see personalized insights here!
                    </p>
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Weekly Activity Summary */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Daily Activity Summary</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b">
                        <th className="pb-3 font-medium">Date</th>
                        <th className="pb-3 font-medium text-center">Mood</th>
                        <th className="pb-3 font-medium text-center">Energy</th>
                        <th className="pb-3 font-medium text-center">Exercise</th>
                        <th className="pb-3 font-medium text-center">Calories</th>
                        <th className="pb-3 font-medium text-center">Symptoms</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyData.slice(-7).reverse().map((day) => (
                        <tr key={day.date} className="border-b border-gray-100">
                          <td className="py-3 font-medium text-gray-900 dark:text-white">{formatDate(day.date)}</td>
                          <td className="py-3 text-center">
                            {day.checkIn?.mood ? (
                              <span className={cn(
                                "inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
                                day.checkIn.mood >= 4 ? "bg-green-100 text-green-700" :
                                day.checkIn.mood >= 3 ? "bg-yellow-100 text-yellow-700" :
                                "bg-red-100 text-red-700"
                              )}>
                                {day.checkIn.mood}
                              </span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="py-3 text-center">
                            {day.checkIn?.energy ? (
                              <span className={cn(
                                "inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
                                day.checkIn.energy >= 4 ? "bg-orange-100 text-orange-700" :
                                day.checkIn.energy >= 3 ? "bg-yellow-100 text-yellow-700" :
                                "bg-gray-100 text-gray-700 dark:text-slate-200"
                              )}>
                                {day.checkIn.energy}
                              </span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="py-3 text-center">
                            {day.exercise?.duration ? (
                              <span className="text-blue-600 font-medium">{day.exercise.duration}m</span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="py-3 text-center">
                            {day.nutrition?.calories ? (
                              <span className="text-green-600 font-medium">{day.nutrition.calories}</span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="py-3 text-center">
                            {day.symptoms ? (
                              <span className={cn(
                                "inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
                                day.symptoms >= 3 ? "bg-red-100 text-red-700" :
                                "bg-orange-100 text-orange-700"
                              )}>
                                {day.symptoms}
                              </span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}