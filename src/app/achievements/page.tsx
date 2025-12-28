'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Star,
  Flame,
  Heart,
  Smile,
  CheckCircle,
  Award,
  Target,
  Dumbbell,
  Utensils,
  Pill,
  Activity,
  Sparkles,
  Lock,
  Loader2,
} from 'lucide-react';
import { DashboardShell } from '@/components/layout';
import { Card, Badge } from '@/components/ui';
import {
  Achievement,
  UserAchievement,
  fetchAllAchievements,
  fetchUserAchievements,
  fetchUserPoints,
  getLevelFromPoints,
  getIconColor,
  getAchievementProgress,
} from '@/lib/achievements';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

const iconMap: Record<string, React.ElementType> = {
  trophy: Trophy,
  star: Star,
  flame: Flame,
  heart: Heart,
  smile: Smile,
  'check-circle': CheckCircle,
  award: Award,
  target: Target,
  dumbbell: Dumbbell,
  utensils: Utensils,
  pill: Pill,
  activity: Activity,
  sparkles: Sparkles,
};

const categoryLabels: Record<string, string> = {
  streaks: 'Streaks',
  milestones: 'Milestones',
  vitals: 'Vitals',
  exercise: 'Exercise',
  nutrition: 'Nutrition',
  medications: 'Medications',
  goals: 'Goals',
  symptoms: 'Symptoms',
  engagement: 'Engagement',
};

interface AchievementWithProgress extends Achievement {
  isUnlocked: boolean;
  unlockedAt?: string;
  progress: number;
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<AchievementWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    setUserId(user.id);

    const [allAchievements, userAchievements, userPoints] = await Promise.all([
      fetchAllAchievements(),
      fetchUserAchievements(),
      fetchUserPoints(),
    ]);

    setTotalPoints(userPoints.total_points);

    const unlockedMap = new Map(
      userAchievements.map(ua => [ua.achievement_id, ua.unlocked_at])
    );

    // Get progress for each achievement
    const achievementsWithProgress = await Promise.all(
      allAchievements.map(async (achievement) => {
        const isUnlocked = unlockedMap.has(achievement.id);
        let progress = 0;
        
        if (!isUnlocked && user) {
          progress = await getAchievementProgress(achievement, user.id);
        } else if (isUnlocked) {
          progress = 100;
        }

        return {
          ...achievement,
          isUnlocked,
          unlockedAt: unlockedMap.get(achievement.id),
          progress,
        };
      })
    );

    setAchievements(achievementsWithProgress);
    setIsLoading(false);
  };

  const levelInfo = getLevelFromPoints(totalPoints);
  const unlockedCount = achievements.filter(a => a.isUnlocked).length;
  const totalCount = achievements.length;

  const categories = Array.from(new Set(achievements.map(a => a.category)));
  
  const filteredAchievements = selectedCategory
    ? achievements.filter(a => a.category === selectedCategory)
    : achievements;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            <p className="text-sm text-gray-500 dark:text-slate-400">Loading achievements...</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Achievements</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Track your health journey milestones</p>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {/* Level Card */}
          <Card className="p-6 bg-gradient-to-br from-primary-500 to-primary-600 text-white border-0">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                <span className="text-3xl font-bold">{levelInfo.level}</span>
              </div>
              <div className="flex-1">
                <p className="text-primary-100 text-sm">Current Level</p>
                <p className="text-xl font-bold">{levelInfo.title}</p>
              </div>
            </div>
            {levelInfo.nextLevel && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-primary-100">{totalPoints} pts</span>
                  <span className="text-primary-100">{levelInfo.nextLevel.points} pts</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${levelInfo.progress}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="h-full bg-white rounded-full"
                  />
                </div>
                <p className="text-xs text-primary-100 mt-1 text-center">
                  {levelInfo.nextLevel.points - totalPoints} pts to Level {levelInfo.nextLevel.level}
                </p>
              </div>
            )}
          </Card>

          {/* Total Points */}
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl flex items-center justify-center">
                <Star className="w-7 h-7 text-yellow-500 fill-yellow-500" />
              </div>
              <div>
                <p className="text-gray-500 dark:text-slate-400 text-sm">Total Points</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalPoints.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          {/* Achievements Progress */}
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary-50 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center">
                <Trophy className="w-7 h-7 text-primary-500" />
              </div>
              <div>
                <p className="text-gray-500 dark:text-slate-400 text-sm">Achievements</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {unlockedCount}<span className="text-lg text-gray-400 dark:text-slate-500">/{totalCount}</span>
                </p>
              </div>
            </div>
            <div className="mt-3">
              <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(unlockedCount / totalCount) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="h-full bg-primary-500 rounded-full"
                />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2"
        >
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              selectedCategory === null
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize',
                selectedCategory === category
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {categoryLabels[category] || category}
            </button>
          ))}
        </motion.div>

        {/* Achievements Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filteredAchievements.map((achievement, index) => {
            const IconComponent = iconMap[achievement.icon] || Trophy;
            const colorClasses = getIconColor(achievement.color);
            
            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <Card
                  className={cn(
                    'p-4 transition-all',
                    achievement.isUnlocked
                      ? 'hover:shadow-md'
                      : 'opacity-60 grayscale hover:opacity-80 hover:grayscale-0'
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="relative">
                      <div
                        className={cn(
                          'w-14 h-14 rounded-xl flex items-center justify-center',
                          achievement.isUnlocked
                            ? colorClasses.split(' ')[1]
                            : 'bg-gray-100 dark:bg-slate-700'
                        )}
                      >
                        <IconComponent
                          className={cn(
                            'w-7 h-7',
                            achievement.isUnlocked
                              ? colorClasses.split(' ')[0]
                              : 'text-gray-400 dark:text-slate-500'
                          )}
                        />
                      </div>
                      {!achievement.isUnlocked && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
                          <Lock className="w-3 h-3 text-gray-500 dark:text-slate-400" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{achievement.name}</h3>
                        <Badge
                          variant="secondary"
                          className={cn(
                            'flex-shrink-0 text-xs',
                            achievement.isUnlocked
                              ? 'bg-yellow-50 text-yellow-600'
                              : 'bg-gray-100 text-gray-500 dark:text-slate-400'
                          )}
                        >
                          +{achievement.points}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{achievement.description}</p>

                      {/* Progress or Unlocked Date */}
                      {achievement.isUnlocked ? (
                        <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Unlocked {formatDate(achievement.unlockedAt!)}
                        </p>
                      ) : (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>Progress</span>
                            <span>{Math.round(achievement.progress)}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-400 rounded-full transition-all"
                              style={{ width: `${achievement.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Empty State */}
        {filteredAchievements.length === 0 && (
          <Card className="p-12 text-center">
            <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No achievements yet</h3>
            <p className="text-gray-500 dark:text-slate-400">Start tracking your health to unlock achievements!</p>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}