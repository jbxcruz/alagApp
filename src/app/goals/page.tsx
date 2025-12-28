'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Plus,
  X,
  Loader2,
  Droplets,
  Moon,
  Dumbbell,
  UtensilsCrossed,
  Smile,
  Pill,
  Check,
  Trash2,
  Trophy,
  Flame,
  TrendingUp,
} from 'lucide-react';
import { DashboardShell } from '@/components/layout';
import { Card, Button, Input, Badge, useToast } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { useAchievements } from '@/contexts/achievements-context';

interface HealthGoal {
  id: string;
  title: string;
  description: string | null;
  category: string;
  goal_type: string;
  target_value: number;
  target_unit: string;
  comparison: string;
  is_active: boolean;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

interface GoalProgress {
  goal_id: string;
  date: string;
  current_value: number;
  is_achieved: boolean;
}

const goalTemplates = [
  { title: 'Drink 8 cups of water', category: 'hydration', target_value: 8, target_unit: 'cups', icon: Droplets, color: 'text-blue-500 bg-blue-50' },
  { title: 'Sleep 7+ hours', category: 'sleep', target_value: 7, target_unit: 'hours', icon: Moon, color: 'text-indigo-500 bg-indigo-50' },
  { title: 'Exercise 3 times a week', category: 'exercise', target_value: 3, target_unit: 'times', icon: Dumbbell, color: 'text-green-500 bg-green-50' },
  { title: 'Stay under 2000 calories', category: 'nutrition', target_value: 2000, target_unit: 'kcal', icon: UtensilsCrossed, color: 'text-orange-500 bg-orange-50' },
  { title: 'Complete daily check-ins', category: 'check_in', target_value: 1, target_unit: 'check-in', icon: Smile, color: 'text-pink-500 bg-pink-50' },
  { title: 'Take all medications', category: 'medication', target_value: 100, target_unit: '%', icon: Pill, color: 'text-purple-500 bg-purple-50' },
];

const categoryIcons: Record<string, React.ElementType> = {
  hydration: Droplets,
  sleep: Moon,
  exercise: Dumbbell,
  nutrition: UtensilsCrossed,
  check_in: Smile,
  medication: Pill,
  custom: Target,
};

const categoryColors: Record<string, string> = {
  hydration: 'text-blue-500 bg-blue-50',
  sleep: 'text-indigo-500 bg-indigo-50',
  exercise: 'text-green-500 bg-green-50',
  nutrition: 'text-orange-500 bg-orange-50',
  check_in: 'text-pink-500 bg-pink-50',
  medication: 'text-purple-500 bg-purple-50',
  custom: 'text-gray-500 bg-gray-100 dark:bg-slate-700',
};

export default function GoalsPage() {
  const { showToast } = useToast();
  const { checkAchievements } = useAchievements();
  const [goals, setGoals] = useState<HealthGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<'active' | 'completed' | 'all'>('active');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('custom');
  const [goalType, setGoalType] = useState('daily');
  const [targetValue, setTargetValue] = useState('');
  const [targetUnit, setTargetUnit] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    setIsLoading(true);
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('health_goals')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) {
      setGoals(data || []);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!title || !targetValue) {
      showToast('error', 'Please fill in required fields');
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

    const { error } = await supabase.from('health_goals').insert({
      user_id: user.id,
      title,
      description: description || null,
      category,
      goal_type: goalType,
      target_value: parseFloat(targetValue),
      target_unit: targetUnit || 'units',
      comparison: 'gte',
      is_active: true,
      is_completed: false,
    });

    if (error) {
      showToast('error', 'Failed to create goal');
    } else {
      showToast('success', 'Goal created!');
      setShowModal(false);
      resetForm();
      fetchGoals();
      setTimeout(() => checkAchievements(), 500);
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('health_goals').delete().eq('id', id);
    if (!error) {
      showToast('success', 'Goal deleted');
      setGoals(goals.filter(g => g.id !== id));
    }
  };

  const handleComplete = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('health_goals')
      .update({ is_completed: true, completed_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      showToast('success', 'Goal completed!');
      fetchGoals();
      setTimeout(() => checkAchievements(), 500);
    }
  };

  const handleTemplateSelect = (template: typeof goalTemplates[0]) => {
    setTitle(template.title);
    setCategory(template.category);
    setTargetValue(template.target_value.toString());
    setTargetUnit(template.target_unit);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('custom');
    setGoalType('daily');
    setTargetValue('');
    setTargetUnit('');
  };

  const filteredGoals = goals.filter(g => {
    if (filter === 'active') return g.is_active && !g.is_completed;
    if (filter === 'completed') return g.is_completed;
    return true;
  });

  const activeGoals = goals.filter(g => g.is_active && !g.is_completed);
  const completedGoals = goals.filter(g => g.is_completed);

  return (
    <DashboardShell>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Health Goals</h1>
            <p className="text-gray-500 mt-1">Set and track your wellness targets</p>
          </div>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Goal
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-3 gap-4"
        >
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeGoals.length}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Active Goals</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <Trophy className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedGoals.length}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Completed</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {goals.length > 0 ? Math.round((completedGoals.length / goals.length) * 100) : 0}%
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Success Rate</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2"
        >
          {(['active', 'completed', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors",
                filter === f ? "bg-primary-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {f}
            </button>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
          ) : filteredGoals.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-gray-400 dark:text-slate-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {filter === 'completed' ? 'No completed goals yet' : 'No active goals'}
              </h3>
              <p className="text-gray-500 mb-4">
                {filter === 'completed' ? 'Complete some goals to see them here' : 'Create a goal to start tracking'}
              </p>
              {filter !== 'completed' && (
                <Button onClick={() => setShowModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Goal
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredGoals.map((goal) => {
                const IconComponent = categoryIcons[goal.category] || Target;
                const colorClass = categoryColors[goal.category] || categoryColors.custom;

                return (
                  <Card key={goal.id} className={cn("p-5", goal.is_completed && "opacity-75")}>
                    <div className="flex items-start gap-4">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", colorClass.split(' ')[1])}>
                        <IconComponent className={cn("w-6 h-6", colorClass.split(' ')[0])} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">{goal.title}</h3>
                            {goal.description && (
                              <p className="text-sm text-gray-500 mt-1">{goal.description}</p>
                            )}
                          </div>
                          {goal.is_completed && (
                            <Badge variant="secondary" className="bg-green-50 text-green-600 flex-shrink-0">
                              <Check className="w-3 h-3 mr-1" />
                              Done
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mt-3">
                          <Badge variant="secondary" className="text-xs capitalize">
                            {goal.goal_type}
                          </Badge>
                          <span className="text-sm text-gray-500 dark:text-slate-400">
                            Target: {goal.target_value} {goal.target_unit}
                          </span>
                        </div>

                        {!goal.is_completed && (
                          <div className="flex items-center gap-2 mt-4">
                            <Button
                              size="sm"
                              onClick={() => handleComplete(goal.id)}
                              className="flex-1"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Mark Complete
                            </Button>
                            <button
                              onClick={() => handleDelete(goal.id)}
                              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        {goal.is_completed && goal.completed_at && (
                          <p className="text-xs text-gray-400 mt-3">
                            Completed {new Date(goal.completed_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
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
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create Goal</h2>
                  <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-[#1A2742] rounded-lg text-gray-500 dark:text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Quick Templates</label>
                    <div className="grid grid-cols-2 gap-2">
                      {goalTemplates.map((template) => (
                        <button
                          key={template.title}
                          onClick={() => handleTemplateSelect(template)}
                          className={cn(
                            "flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all",
                            title === template.title
                              ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                              : "border-gray-200 dark:border-[#293548] hover:border-gray-300 dark:hover:border-[#3d4f6f] bg-white dark:bg-[#1A2742]"
                          )}
                        >
                          <template.icon className={cn("w-5 h-5", template.color.split(' ')[0])} />
                          <span className="text-sm text-gray-700 dark:text-slate-300 line-clamp-1">{template.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Goal Title *</label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Drink more water"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Description (optional)</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Why is this goal important to you?"
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-[#293548] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none bg-white dark:bg-[#1A2742] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Target Value *</label>
                      <Input
                        type="number"
                        value={targetValue}
                        onChange={(e) => setTargetValue(e.target.value)}
                        placeholder="e.g., 8"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Unit</label>
                      <Input
                        value={targetUnit}
                        onChange={(e) => setTargetUnit(e.target.value)}
                        placeholder="e.g., cups, hours"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Frequency</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['daily', 'weekly', 'monthly'].map((type) => (
                        <button
                          key={type}
                          onClick={() => setGoalType(type)}
                          className={cn(
                            "py-2 rounded-lg text-sm font-medium capitalize transition-all",
                            goalType === type
                              ? "bg-primary-500 text-white"
                              : "bg-gray-100 dark:bg-[#1A2742] text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-[#293548]"
                          )}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-[#293548] bg-gray-50 dark:bg-[#0B1120] rounded-b-2xl">
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button className="flex-1" onClick={handleSave} disabled={isSaving || !title || !targetValue}>
                      {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create Goal'}
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