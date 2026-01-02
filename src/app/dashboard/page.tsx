'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  Activity,
  Moon,
  Droplets,
  Pill,
  ChevronRight,
  Flame,
  Zap,
  Smile,
  UtensilsCrossed,
  CheckCircle2,
  Plus,
  Scale,
  BarChart3,
  Bot,
} from 'lucide-react';
import { DashboardShell } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface DashboardData {
  user: {
    name: string;
    email: string;
  } | null;
  vitals: {
    heartRate: number | null;
    bloodPressure: { systolic: number; diastolic: number } | null;
    sleep: number | null;
    water: number | null;
    weight: number | null;
  };
  todayCheckIn: {
    mood: number;
    energy: number;
    symptoms: string[];
  } | null;
  nutrition: {
    calories: number;
    calorieGoal: number;
    protein: number;
    carbs: number;
    fat: number;
    meals: number;
  };
  streak: number;
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const formatDate = () => {
  return new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const supabase = createClient();
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, full_name')
        .eq('id', user.id)
        .single();

      // Fetch vitals - handle gracefully if table structure is different
      let heartRate = null;
      let bloodPressure = null;
      let sleep = null;
      let water = null;
      let weight = null;

      try {
        // Try fetching from vitals table with vital_type column
        const [heartRateRes, bpRes, sleepRes, waterRes, weightRes] = await Promise.all([
          supabase.from('vitals').select('value').eq('user_id', user.id).eq('vital_type', 'heart_rate').order('recorded_at', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('vitals').select('value').eq('user_id', user.id).eq('vital_type', 'blood_pressure').order('recorded_at', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('vitals').select('value').eq('user_id', user.id).eq('vital_type', 'sleep_hours').order('recorded_at', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('vitals').select('value').eq('user_id', user.id).eq('vital_type', 'water_intake').order('recorded_at', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('vitals').select('value').eq('user_id', user.id).eq('vital_type', 'weight').order('recorded_at', { ascending: false }).limit(1).maybeSingle(),
        ]);

        if (heartRateRes.data?.value) heartRate = typeof heartRateRes.data.value === 'object' ? heartRateRes.data.value.value : heartRateRes.data.value;
        if (bpRes.data?.value) {
          const bpValue = bpRes.data.value;
          bloodPressure = typeof bpValue === 'object' ? { systolic: bpValue.systolic, diastolic: bpValue.diastolic } : null;
        }
        if (sleepRes.data?.value) sleep = typeof sleepRes.data.value === 'object' ? sleepRes.data.value.value : sleepRes.data.value;
        if (waterRes.data?.value) water = typeof waterRes.data.value === 'object' ? waterRes.data.value.value : waterRes.data.value;
        if (weightRes.data?.value) weight = typeof weightRes.data.value === 'object' ? weightRes.data.value.value : weightRes.data.value;
      } catch (vitalsError) {
        console.log('Vitals fetch error (table might have different structure):', vitalsError);
      }

      // Fetch check-in - handle missing symptoms column
      let checkIn = null;
      try {
        const { data: checkInData } = await supabase
          .from('check_ins')
          .select('mood, energy')
          .eq('user_id', user.id)
          .eq('check_in_date', today)
          .maybeSingle();
        
        if (checkInData) {
          checkIn = { ...checkInData, symptoms: [] };
        }
      } catch (checkInError) {
        console.log('Check-in fetch error:', checkInError);
      }

      const { data: nutritionLogs } = await supabase
        .from('nutrition_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_at', `${today}T00:00:00`)
        .lte('logged_at', `${today}T23:59:59`);

      const { data: recentCheckIns } = await supabase
        .from('check_ins')
        .select('check_in_date')
        .eq('user_id', user.id)
        .order('check_in_date', { ascending: false })
        .limit(30);

      let streak = 0;
      if (recentCheckIns && recentCheckIns.length > 0) {
        const dates = recentCheckIns.map(c => c.check_in_date);
        const todayDate = new Date(today);
        
        for (let i = 0; i < 30; i++) {
          const checkDate = new Date(todayDate);
          checkDate.setDate(checkDate.getDate() - i);
          const dateStr = checkDate.toISOString().split('T')[0];
          
          if (dates.includes(dateStr)) {
            streak++;
          } else if (i > 0) {
            break;
          }
        }
      }

      const nutritionTotals = (nutritionLogs || []).reduce(
        (acc, log) => ({
          calories: acc.calories + (log.calories || 0),
          protein: acc.protein + (log.protein_g || 0),
          carbs: acc.carbs + (log.carbs_g || 0),
          fat: acc.fat + (log.fat_g || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      setData({
        user: {
          name: profile?.first_name || profile?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'User',
          email: user.email || '',
        },
        vitals: {
          heartRate: heartRate,
          bloodPressure: bloodPressure,
          sleep: sleep,
          water: water,
          weight: weight,
        },
        todayCheckIn: checkIn,
        nutrition: {
          ...nutritionTotals,
          calorieGoal: 2000,
          meals: nutritionLogs?.length || 0,
        },
        streak,
      });

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }

    setIsLoading(false);
  };

  const getMoodLabel = (mood: number) => {
    const labels = ['', 'Very Low', 'Low', 'Okay', 'Good', 'Great'];
    return labels[mood] || 'Unknown';
  };

  const getEnergyLabel = (energy: number) => {
    const labels = ['', 'Exhausted', 'Tired', 'Normal', 'Energized', 'High'];
    return labels[energy] || 'Unknown';
  };

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="h-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-primary-500 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const calorieProgress = data?.nutrition.calorieGoal 
    ? Math.min((data.nutrition.calories / data.nutrition.calorieGoal) * 100, 100)
    : 0;

  return (
    <DashboardShell>
      <div className="min-h-[calc(100vh-7rem)] flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4"
        >
          <div>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {formatDate()} <span className="text-gray-400 dark:text-slate-500">·</span> <span className="tabular-nums">{formatTime(currentTime)}</span>
            </p>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {getGreeting()}, {data?.user?.name || 'there'}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Streak Badge - Always visible */}
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors",
              data?.streak && data.streak > 0 
                ? "bg-orange-50 dark:bg-orange-900/20" 
                : "bg-gray-100 dark:bg-slate-700"
            )}>
              <Flame className={cn(
                "w-4 h-4",
                data?.streak && data.streak > 0 
                  ? "text-orange-500" 
                  : "text-gray-300 dark:text-slate-500"
              )} />
              <span className={cn(
                "text-sm font-semibold",
                data?.streak && data.streak > 0 
                  ? "text-orange-600 dark:text-orange-400" 
                  : "text-gray-400 dark:text-slate-500"
              )}>
                {data?.streak || 0} day{(data?.streak || 0) !== 1 ? 's' : ''}
              </span>
            </div>
            
            {!data?.todayCheckIn && (
              <Link href="/check-in">
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Check-in
                </Button>
              </Link>
            )}
          </div>
        </motion.div>

        {/* Main Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
          {/* Left Column */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="lg:col-span-9 flex flex-col gap-4"
          >
            {/* Vitals Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              <Card className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                    <Heart className="w-4 h-4 text-red-500" />
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{data?.vitals.heartRate || '--'}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Heart Rate</p>
              </Card>

              <Card className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                    <Activity className="w-4 h-4 text-purple-500" />
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {data?.vitals.bloodPressure 
                    ? `${data.vitals.bloodPressure.systolic}/${data.vitals.bloodPressure.diastolic}`
                    : '--/--'
                  }
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Blood Pressure</p>
              </Card>

              <Card className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center">
                    <Moon className="w-4 h-4 text-indigo-500" />
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {data?.vitals.sleep?.toFixed(1) || '--'}
                  <span className="text-xs font-normal text-gray-400 dark:text-slate-500 ml-0.5">h</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Sleep</p>
              </Card>

              <Card className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <Scale className="w-4 h-4 text-green-500" />
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {data?.vitals.weight?.toFixed(1) || '--'}
                  <span className="text-xs font-normal text-gray-400 dark:text-slate-500 ml-0.5">kg</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Weight</p>
              </Card>

              <Card className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <Droplets className="w-4 h-4 text-blue-500" />
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{data?.vitals.water || '--'}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Water (cups)</p>
              </Card>
            </div>

            {/* Bottom Row */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
              {/* Nutrition */}
              <Card className="p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                      <UtensilsCrossed className="w-4 h-4 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Nutrition</h3>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{data?.nutrition.meals || 0} meals logged</p>
                    </div>
                  </div>
                  <Link href="/nutrition">
                    <Button variant="ghost" size="sm" className="h-7 px-2">
                      <Plus className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>

                <div className="flex-1 flex flex-col justify-center">
                  <div className="mb-4">
                    <div className="flex items-end justify-between mb-1.5">
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {data?.nutrition.calories.toLocaleString() || 0}
                        <span className="text-sm font-normal text-gray-400 dark:text-slate-500 ml-1">kcal</span>
                      </p>
                      <p className="text-sm text-gray-500 dark:text-slate-400">{Math.round(calorieProgress)}%</p>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${calorieProgress}%` }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className={cn("h-full rounded-full", calorieProgress >= 100 ? "bg-red-500" : "bg-primary-500")}
                      />
                    </div>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">of {data?.nutrition.calorieGoal.toLocaleString()} daily goal</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{data?.nutrition.protein.toFixed(0) || 0}g</p>
                      <p className="text-xs text-blue-500 dark:text-blue-400">Protein</p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                      <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{data?.nutrition.carbs.toFixed(0) || 0}g</p>
                      <p className="text-xs text-orange-500 dark:text-orange-400">Carbs</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                      <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{data?.nutrition.fat.toFixed(0) || 0}g</p>
                      <p className="text-xs text-purple-500 dark:text-purple-400">Fat</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Check-in */}
              <Card className="p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", data?.todayCheckIn ? "bg-green-50 dark:bg-green-900/20" : "bg-gray-100 dark:bg-slate-700")}>
                      {data?.todayCheckIn ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Smile className="w-4 h-4 text-gray-400 dark:text-slate-500" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Daily Check-in</h3>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{data?.todayCheckIn ? 'Completed today' : 'Not completed'}</p>
                    </div>
                  </div>
                  <Link href="/check-in">
                    <Button variant="ghost" size="sm" className="h-7 px-2">
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>

                {data?.todayCheckIn ? (
                  <div className="flex-1 flex flex-col justify-center gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-[#1A2742] rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Smile className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Mood</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{getMoodLabel(data.todayCheckIn.mood)}</span>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className={cn("h-2 flex-1 rounded-full", i <= data.todayCheckIn!.mood ? "bg-green-500" : "bg-gray-200 dark:bg-slate-600")} />
                        ))}
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-[#1A2742] rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-amber-500" />
                          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Energy</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{getEnergyLabel(data.todayCheckIn.energy)}</span>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className={cn("h-2 flex-1 rounded-full", i <= data.todayCheckIn!.energy ? "bg-amber-500" : "bg-gray-200 dark:bg-slate-600")} />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-3">
                      <Smile className="w-6 h-6 text-gray-400 dark:text-slate-500" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">How are you feeling today?</p>
                    <Link href="/check-in"><Button>Start Check-in</Button></Link>
                  </div>
                )}
              </Card>
            </div>
          </motion.div>

          {/* Right Column */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-3 flex flex-col">
            <Card className="p-4 flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/vitals">
                  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center group-hover:bg-red-100 dark:group-hover:bg-red-900/30"><Activity className="w-5 h-5 text-red-500" /></div>
                    <div className="flex-1"><p className="text-sm font-medium text-gray-900 dark:text-white">Log Vitals</p><p className="text-xs text-gray-500 dark:text-slate-400">Record metrics</p></div>
                    <ChevronRight className="w-4 h-4 text-gray-300 dark:text-slate-500" />
                  </div>
                </Link>
                <Link href="/medications">
                  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 bg-pink-50 dark:bg-pink-900/20 rounded-xl flex items-center justify-center group-hover:bg-pink-100 dark:group-hover:bg-pink-900/30"><Pill className="w-5 h-5 text-pink-500" /></div>
                    <div className="flex-1"><p className="text-sm font-medium text-gray-900 dark:text-white">Medications</p><p className="text-xs text-gray-500 dark:text-slate-400">Manage meds</p></div>
                    <ChevronRight className="w-4 h-4 text-gray-300 dark:text-slate-500" />
                  </div>
                </Link>
                <Link href="/nutrition">
                  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center group-hover:bg-orange-100 dark:group-hover:bg-orange-900/30"><UtensilsCrossed className="w-5 h-5 text-orange-500" /></div>
                    <div className="flex-1"><p className="text-sm font-medium text-gray-900 dark:text-white">Nutrition</p><p className="text-xs text-gray-500 dark:text-slate-400">Log meals</p></div>
                    <ChevronRight className="w-4 h-4 text-gray-300 dark:text-slate-500" />
                  </div>
                </Link>
                <Link href="/check-in">
                  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center group-hover:bg-green-100 dark:group-hover:bg-green-900/30"><Smile className="w-5 h-5 text-green-500" /></div>
                    <div className="flex-1"><p className="text-sm font-medium text-gray-900 dark:text-white">Check-in</p><p className="text-xs text-gray-500 dark:text-slate-400">Log mood</p></div>
                    <ChevronRight className="w-4 h-4 text-gray-300 dark:text-slate-500" />
                  </div>
                </Link>
                <Link href="/ai-assistant">
                  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30"><Bot className="w-5 h-5 text-primary-500" /></div>
                    <div className="flex-1"><p className="text-sm font-medium text-gray-900 dark:text-white">AI Assistant</p><p className="text-xs text-gray-500 dark:text-slate-400">Chat with Faith</p></div>
                    <ChevronRight className="w-4 h-4 text-gray-300 dark:text-slate-500" />
                  </div>
                </Link>
                <Link href="/progress">
                  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30"><BarChart3 className="w-5 h-5 text-blue-500" /></div>
                    <div className="flex-1"><p className="text-sm font-medium text-gray-900 dark:text-white">Progress</p><p className="text-xs text-gray-500 dark:text-slate-400">View trends</p></div>
                    <ChevronRight className="w-4 h-4 text-gray-300 dark:text-slate-500" />
                  </div>
                </Link>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardShell>
  );
}