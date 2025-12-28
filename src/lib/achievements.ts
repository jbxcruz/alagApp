import { createClient } from '@/lib/supabase/client';

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  criteria_type: string;
  criteria_target: number;
  criteria_field: string;
  points: number;
  sort_order: number;
}

export interface UserAchievement {
  id: string;
  achievement_id: string;
  unlocked_at: string;
  achievement?: Achievement;
}

export interface UserPoints {
  total_points: number;
  current_level: number;
}

export interface AchievementUnlock {
  achievement: Achievement;
  isNew: boolean;
}

// Level thresholds
export const LEVEL_THRESHOLDS = [
  { level: 1, points: 0, title: 'Health Beginner' },
  { level: 2, points: 100, title: 'Health Starter' },
  { level: 3, points: 250, title: 'Health Enthusiast' },
  { level: 4, points: 500, title: 'Health Dedicated' },
  { level: 5, points: 1000, title: 'Health Champion' },
  { level: 6, points: 2000, title: 'Health Master' },
  { level: 7, points: 5000, title: 'Health Legend' },
];

export function getLevelFromPoints(points: number): { level: number; title: string; nextLevel: typeof LEVEL_THRESHOLDS[0] | null; progress: number } {
  let currentLevel = LEVEL_THRESHOLDS[0];
  let nextLevel: typeof LEVEL_THRESHOLDS[0] | null = LEVEL_THRESHOLDS[1];

  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i].points) {
      currentLevel = LEVEL_THRESHOLDS[i];
      nextLevel = LEVEL_THRESHOLDS[i + 1] || null;
      break;
    }
  }

  let progress = 100;
  if (nextLevel) {
    const pointsInLevel = points - currentLevel.points;
    const pointsNeeded = nextLevel.points - currentLevel.points;
    progress = Math.min((pointsInLevel / pointsNeeded) * 100, 100);
  }

  return {
    level: currentLevel.level,
    title: currentLevel.title,
    nextLevel,
    progress,
  };
}

export function getIconColor(color: string): string {
  const colors: Record<string, string> = {
    primary: 'text-primary-500 bg-primary-50',
    green: 'text-green-500 bg-green-50',
    blue: 'text-blue-500 bg-blue-50',
    orange: 'text-orange-500 bg-orange-50',
    red: 'text-red-500 bg-red-50',
    purple: 'text-purple-500 bg-purple-50',
    pink: 'text-pink-500 bg-pink-50',
    yellow: 'text-yellow-500 bg-yellow-50',
  };
  return colors[color] || colors.primary;
}

export async function fetchAllAchievements(): Promise<Achievement[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching achievements:', error);
    return [];
  }

  return data || [];
}

export async function fetchUserAchievements(): Promise<UserAchievement[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('user_achievements')
    .select(`
      id,
      achievement_id,
      unlocked_at,
      achievements (*)
    `)
    .order('unlocked_at', { ascending: false });

  if (error) {
    console.error('Error fetching user achievements:', error);
    return [];
  }

  return (data || []).map((ua: any) => ({
    id: ua.id,
    achievement_id: ua.achievement_id,
    unlocked_at: ua.unlocked_at,
    achievement: ua.achievements,
  }));
}

export async function fetchUserPoints(): Promise<UserPoints> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { total_points: 0, current_level: 1 };
  }

  const { data, error } = await supabase
    .from('user_points')
    .select('total_points, current_level')
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    // Create initial points record
    await supabase.from('user_points').insert({
      user_id: user.id,
      total_points: 0,
      current_level: 1,
    });
    return { total_points: 0, current_level: 1 };
  }

  return data;
}

export async function checkAndUnlockAchievements(): Promise<AchievementUnlock[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return [];

  const unlocked: AchievementUnlock[] = [];

  // Get all achievements and user's unlocked ones
  const [achievements, userAchievements] = await Promise.all([
    fetchAllAchievements(),
    fetchUserAchievements(),
  ]);

  const unlockedIds = new Set(userAchievements.map(ua => ua.achievement_id));

  // Get counts for various activities
  const [
    checkInsCount,
    vitalsCount,
    exerciseCount,
    nutritionCount,
    medicationsCount,
    medicationDosesCount,
    goalsCount,
    goalsCompletedCount,
    symptomsCount,
    aiConversationsCount,
    caloriesBurned,
    currentStreak,
  ] = await Promise.all([
    getCount('check_ins', user.id),
    getCount('vitals', user.id),
    getCount('exercise_logs', user.id),
    getCount('nutrition_logs', user.id),
    getCount('medications', user.id),
    getCount('medication_doses', user.id),
    getCount('health_goals', user.id),
    getCompletedGoalsCount(user.id),
    getCount('symptom_logs', user.id),
    getCount('ai_conversations', user.id),
    getCaloriesBurned(user.id),
    getCheckInStreak(user.id),
  ]);

  const counts: Record<string, number> = {
    check_ins: checkInsCount,
    vitals: vitalsCount,
    exercise_logs: exerciseCount,
    nutrition_logs: nutritionCount,
    medications: medicationsCount,
    medication_doses: medicationDosesCount,
    health_goals: goalsCount,
    goals_completed: goalsCompletedCount,
    symptom_logs: symptomsCount,
    ai_conversations: aiConversationsCount,
    calories_burned: caloriesBurned,
  };

  // Check each achievement
  for (const achievement of achievements) {
    if (unlockedIds.has(achievement.id)) continue;

    let shouldUnlock = false;

    if (achievement.criteria_type === 'count' || achievement.criteria_type === 'sum') {
      const currentCount = counts[achievement.criteria_field] || 0;
      shouldUnlock = currentCount >= achievement.criteria_target;
    } else if (achievement.criteria_type === 'streak') {
      shouldUnlock = currentStreak >= achievement.criteria_target;
    }

    if (shouldUnlock) {
      // Unlock the achievement
      const { error } = await supabase.from('user_achievements').insert({
        user_id: user.id,
        achievement_id: achievement.id,
      });

      if (!error) {
        unlocked.push({ achievement, isNew: true });

        // Add points
        await addPoints(user.id, achievement.points);
      }
    }
  }

  return unlocked;
}

async function getCount(table: string, userId: string): Promise<number> {
  const supabase = createClient();
  
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    console.error(`Error counting ${table}:`, error);
    return 0;
  }

  return count || 0;
}

async function getCompletedGoalsCount(userId: string): Promise<number> {
  const supabase = createClient();
  
  const { count, error } = await supabase
    .from('health_goals')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_completed', true);

  if (error) return 0;
  return count || 0;
}

async function getCaloriesBurned(userId: string): Promise<number> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('exercise_logs')
    .select('calories_burned')
    .eq('user_id', userId);

  if (error || !data) return 0;
  
  return data.reduce((sum, log) => sum + (log.calories_burned || 0), 0);
}

async function getCheckInStreak(userId: string): Promise<number> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('check_ins')
    .select('check_in_date')
    .eq('user_id', userId)
    .order('check_in_date', { ascending: false })
    .limit(60);

  if (error || !data || data.length === 0) return 0;

  const today = new Date().toISOString().split('T')[0];
  const dates = new Set(data.map(c => c.check_in_date));
  
  let streak = 0;
  let currentDate = new Date(today);

  for (let i = 0; i < 60; i++) {
    const dateStr = currentDate.toISOString().split('T')[0];
    
    if (dates.has(dateStr)) {
      streak++;
    } else if (i > 0) {
      // Allow missing today, but not past days
      break;
    }
    
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
}

async function addPoints(userId: string, points: number): Promise<void> {
  const supabase = createClient();
  
  // Get current points
  const { data: currentData } = await supabase
    .from('user_points')
    .select('total_points')
    .eq('user_id', userId)
    .single();

  const currentPoints = currentData?.total_points || 0;
  const newTotal = currentPoints + points;
  const { level } = getLevelFromPoints(newTotal);

  // Upsert points
  await supabase.from('user_points').upsert({
    user_id: userId,
    total_points: newTotal,
    current_level: level,
    updated_at: new Date().toISOString(),
  });
}

// Function to get achievement progress for display
export async function getAchievementProgress(achievement: Achievement, userId: string): Promise<number> {
  const supabase = createClient();
  
  let current = 0;

  if (achievement.criteria_type === 'count') {
    const { count } = await supabase
      .from(achievement.criteria_field)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    current = count || 0;
  } else if (achievement.criteria_type === 'sum' && achievement.criteria_field === 'calories_burned') {
    current = await getCaloriesBurned(userId);
  } else if (achievement.criteria_type === 'streak') {
    current = await getCheckInStreak(userId);
  }

  return Math.min((current / achievement.criteria_target) * 100, 100);
}