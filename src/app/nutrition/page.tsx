'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UtensilsCrossed,
  Plus,
  X,
  Loader2,
  Coffee,
  Sun,
  Moon,
  Cookie,
  Star,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Heart,
  Flame,
  Droplets,
  Target,
  TrendingUp,
  Search,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { DashboardShell } from '@/components/layout';
import { Card, Button, Input, Badge, useToast } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { useAchievements } from '@/contexts/achievements-context';

interface NutritionLog {
  id: string;
  meal_type: string;
  name: string;
  description: string | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number | null;
  logged_at: string;
}

interface FavoriteMeal {
  id: string;
  name: string;
  description: string | null;
  meal_type: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number | null;
  times_logged: number;
}

interface DietaryPreferences {
  id: string;
  diet_type: string | null;
  allergies: string[];
  intolerances: string[];
  calorie_goal: number;
  protein_goal: number | null;
  carbs_goal: number | null;
  fat_goal: number | null;
}

const mealTypes = [
  { value: 'breakfast', label: 'Breakfast', icon: Coffee, color: 'bg-orange-50 text-orange-500' },
  { value: 'lunch', label: 'Lunch', icon: Sun, color: 'bg-yellow-50 text-yellow-500' },
  { value: 'dinner', label: 'Dinner', icon: Moon, color: 'bg-purple-50 text-purple-500' },
  { value: 'snack', label: 'Snack', icon: Cookie, color: 'bg-pink-50 text-pink-500' },
];

const commonMeals = [
  { name: 'Oatmeal with Berries', type: 'breakfast', calories: 320, protein: 12, carbs: 54, fat: 8 },
  { name: 'Eggs and Toast', type: 'breakfast', calories: 380, protein: 18, carbs: 32, fat: 20 },
  { name: 'Greek Yogurt with Granola', type: 'breakfast', calories: 280, protein: 15, carbs: 35, fat: 8 },
  { name: 'Grilled Chicken Salad', type: 'lunch', calories: 450, protein: 35, carbs: 25, fat: 22 },
  { name: 'Turkey Sandwich', type: 'lunch', calories: 420, protein: 28, carbs: 45, fat: 14 },
  { name: 'Salmon with Vegetables', type: 'dinner', calories: 520, protein: 40, carbs: 20, fat: 30 },
  { name: 'Pasta with Marinara', type: 'dinner', calories: 580, protein: 18, carbs: 85, fat: 15 },
  { name: 'Apple with Peanut Butter', type: 'snack', calories: 200, protein: 5, carbs: 25, fat: 10 },
  { name: 'Protein Shake', type: 'snack', calories: 180, protein: 25, carbs: 8, fat: 4 },
];

export default function NutritionPage() {
  const { showToast } = useToast();
  const { checkAchievements } = useAchievements();
  const [meals, setMeals] = useState<NutritionLog[]>([]);
  const [favorites, setFavorites] = useState<FavoriteMeal[]>([]);
  const [preferences, setPreferences] = useState<DietaryPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showLogModal, setShowLogModal] = useState(false);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'favorites'>('today');

  // Form state
  const [mealType, setMealType] = useState('breakfast');
  const [mealName, setMealName] = useState('');
  const [description, setDescription] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [saveAsFavorite, setSaveAsFavorite] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiConfidence, setAiConfidence] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  useEffect(() => {
    fetchFavorites();
    fetchPreferences();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    await fetchMeals();
    setIsLoading(false);
  };

  const fetchMeals = async () => {
    const supabase = createClient();
    const dateStr = selectedDate.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('nutrition_logs')
      .select('*')
      .gte('logged_at', `${dateStr}T00:00:00`)
      .lte('logged_at', `${dateStr}T23:59:59`)
      .order('logged_at', { ascending: true });

    if (!error && data) {
      setMeals(data);
    }
  };

  const fetchFavorites = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('favorite_meals')
      .select('*')
      .order('times_logged', { ascending: false });

    if (!error && data) {
      setFavorites(data);
    }
  };

  const fetchPreferences = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    const { data, error } = await supabase
      .from('dietary_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!error && data) {
      setPreferences(data);
    } else {
      // Create default preferences
      const { data: newPrefs } = await supabase
        .from('dietary_preferences')
        .insert({
          user_id: user.id,
          calorie_goal: 2000,
          allergies: [],
          intolerances: [],
        })
        .select()
        .single();
      
      if (newPrefs) setPreferences(newPrefs);
    }
  };

  const handleSave = async () => {
    if (!mealName || !calories) {
      showToast('error', 'Please fill in meal name and calories');
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

    // Save nutrition log
    const insertData = {
      user_id: user.id,
      meal_type: mealType,
      name: mealName,
      description: description || null,
      calories: parseInt(calories) || 0,
      protein_g: protein ? parseFloat(protein) : 0,
      carbs_g: carbs ? parseFloat(carbs) : 0,
      fat_g: fat ? parseFloat(fat) : 0,
      fiber_g: fiber ? parseFloat(fiber) : null,
      logged_at: new Date().toISOString(),
    };
    
    console.log('Inserting nutrition log:', insertData);
    
    const { data, error } = await supabase.from('nutrition_logs').insert(insertData).select();

    if (error) {
      console.error('Supabase error:', error);
      showToast('error', `Failed to log meal: ${error.message}`);
      setIsSaving(false);
      return;
    }
    
    console.log('Insert successful:', data);

    // Save as favorite if checked
    if (saveAsFavorite) {
      await supabase.from('favorite_meals').insert({
        user_id: user.id,
        name: mealName,
        description: description || null,
        meal_type: mealType,
        calories: parseInt(calories),
        protein_g: protein ? parseFloat(protein) : 0,
        carbs_g: carbs ? parseFloat(carbs) : 0,
        fat_g: fat ? parseFloat(fat) : 0,
        fiber_g: fiber ? parseFloat(fiber) : null,
        times_logged: 1,
      });
      fetchFavorites();
    }

    showToast('success', 'Meal logged!');
    setShowLogModal(false);
    resetForm();
    fetchMeals();
    setTimeout(() => checkAchievements(), 500);
    setIsSaving(false);
  };

  const handleLogFavorite = async (favorite: FavoriteMeal) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase.from('nutrition_logs').insert({
      user_id: user.id,
      meal_type: favorite.meal_type,
      name: favorite.name,
      description: favorite.description,
      calories: favorite.calories,
      protein_g: favorite.protein_g,
      carbs_g: favorite.carbs_g,
      fat_g: favorite.fat_g,
      fiber_g: favorite.fiber_g,
      logged_at: new Date().toISOString(),
    });

    if (!error) {
      // Update times_logged
      await supabase
        .from('favorite_meals')
        .update({ 
          times_logged: favorite.times_logged + 1,
          last_logged_at: new Date().toISOString(),
        })
        .eq('id', favorite.id);

      showToast('success', `${favorite.name} logged!`);
      fetchMeals();
      fetchFavorites();
      setShowFavoritesModal(false);
      setTimeout(() => checkAchievements(), 500);
    }
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('nutrition_logs').delete().eq('id', id);
    if (!error) {
      showToast('success', 'Meal deleted');
      setMeals(meals.filter(m => m.id !== id));
    }
  };

  const handleDeleteFavorite = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('favorite_meals').delete().eq('id', id);
    if (!error) {
      showToast('success', 'Favorite removed');
      setFavorites(favorites.filter(f => f.id !== id));
    }
  };

  const selectCommonMeal = (meal: typeof commonMeals[0]) => {
    setMealName(meal.name);
    setMealType(meal.type);
    setCalories(meal.calories.toString());
    setProtein(meal.protein.toString());
    setCarbs(meal.carbs.toString());
    setFat(meal.fat.toString());
  };

  const resetForm = () => {
    setMealType('breakfast');
    setMealName('');
    setDescription('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setFiber('');
    setSaveAsFavorite(false);
    setSearchQuery('');
    setAiConfidence(null);
  };

  const analyzeWithAI = async () => {
    if (!mealName.trim()) {
      showToast('error', 'Please enter a meal name first');
      return;
    }

    setIsAnalyzing(true);
    setAiConfidence(null);

    try {
      const response = await fetch('/api/ai/meal-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealName: mealName.trim(),
          description: description.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        setCalories(data.data.calories.toString());
        setProtein(data.data.protein_g.toString());
        setCarbs(data.data.carbs_g.toString());
        setFat(data.data.fat_g.toString());
        setFiber(data.data.fiber_g?.toString() || '0');
        
        if (data.data.description && !description) {
          setDescription(data.data.description);
        }
        
        setAiConfidence(data.data.confidence || 'medium');
        showToast('success', 'Nutrition analyzed! Review and adjust if needed.');
      } else {
        showToast('error', 'Failed to analyze meal');
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      showToast('error', 'Failed to analyze meal');
    }

    setIsAnalyzing(false);
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

  // Calculate totals
  const totals = {
    calories: meals.reduce((sum, m) => sum + (m.calories || 0), 0),
    protein: meals.reduce((sum, m) => sum + (m.protein_g || 0), 0),
    carbs: meals.reduce((sum, m) => sum + (m.carbs_g || 0), 0),
    fat: meals.reduce((sum, m) => sum + (m.fat_g || 0), 0),
  };

  const calorieGoal = preferences?.calorie_goal || 2000;
  const calorieProgress = Math.min((totals.calories / calorieGoal) * 100, 100);

  const getMealIcon = (type: string) => {
    const mealType = mealTypes.find(m => m.value === type);
    return mealType?.icon || UtensilsCrossed;
  };

  const getMealColor = (type: string) => {
    const mealType = mealTypes.find(m => m.value === type);
    return mealType?.color || 'bg-gray-50 text-gray-500';
  };

  const filteredCommonMeals = searchQuery
    ? commonMeals.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : commonMeals;

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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Nutrition</h1>
            <p className="text-gray-500 dark:text-slate-400 mt-1">Track your meals and macros</p>
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
            <Button onClick={() => { resetForm(); setShowLogModal(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Log Meal
            </Button>
          </div>
        </motion.div>

        {/* Calorie Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="p-6 bg-gradient-to-br from-primary-500 to-primary-600 text-white border-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-lg font-medium text-primary-100">Daily Intake</h2>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-4xl font-bold">{totals.calories}</span>
                  <span className="text-primary-200">/ {calorieGoal} cal</span>
                </div>
                <div className="mt-4 h-3 bg-white/20 rounded-full overflow-hidden w-full md:w-64">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${calorieProgress}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className={cn(
                      "h-full rounded-full",
                      calorieProgress > 100 ? "bg-red-400" : "bg-white"
                    )}
                  />
                </div>
                <p className="text-sm text-primary-200 mt-2">
                  {calorieGoal - totals.calories > 0
                    ? `${calorieGoal - totals.calories} cal remaining`
                    : `${totals.calories - calorieGoal} cal over goal`}
                </p>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Droplets className="w-6 h-6" />
                  </div>
                  <p className="text-2xl font-bold">{Math.round(totals.protein)}g</p>
                  <p className="text-sm text-primary-200">Protein</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Flame className="w-6 h-6" />
                  </div>
                  <p className="text-2xl font-bold">{Math.round(totals.carbs)}g</p>
                  <p className="text-sm text-primary-200">Carbs</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Target className="w-6 h-6" />
                  </div>
                  <p className="text-2xl font-bold">{Math.round(totals.fat)}g</p>
                  <p className="text-sm text-primary-200">Fat</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2"
        >
          <button
            onClick={() => setActiveTab('today')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              activeTab === 'today' ? "bg-primary-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            Today&apos;s Meals
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
              activeTab === 'favorites' ? "bg-primary-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            <Star className="w-4 h-4" />
            Favorites
            {favorites.length > 0 && (
              <span className={cn(
                "px-1.5 py-0.5 text-xs rounded-full",
                activeTab === 'favorites' ? "bg-white/20" : "bg-gray-200"
              )}>
                {favorites.length}
              </span>
            )}
          </button>
        </motion.div>

        {/* Content */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
          ) : activeTab === 'today' ? (
            <Card className="divide-y divide-gray-100">
              {meals.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UtensilsCrossed className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">No meals logged</h3>
                  <p className="text-gray-500 mb-4">Start tracking your nutrition!</p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button onClick={() => setShowLogModal(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Log Meal
                    </Button>
                    {favorites.length > 0 && (
                      <Button variant="outline" onClick={() => setShowFavoritesModal(true)}>
                        <Star className="w-4 h-4 mr-2" />
                        Quick Add from Favorites
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {meals.map((meal) => {
                    const IconComponent = getMealIcon(meal.meal_type);
                    const colorClass = getMealColor(meal.meal_type);
                    
                    return (
                      <div
                        key={meal.id}
                        className="p-3 sm:p-4 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors group"
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0", colorClass)}>
                            <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <h3 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base line-clamp-2">{meal.name}</h3>
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 capitalize mt-0.5">
                                  {meal.meal_type} • {new Date(meal.logged_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                                  {meal.calories} <span className="text-gray-500 dark:text-slate-400 font-normal text-xs sm:text-sm">cal</span>
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-1.5">
                              <p className="text-xs text-gray-400 dark:text-slate-500">
                                P: {meal.protein_g}g • C: {meal.carbs_g}g • F: {meal.fat_g}g
                              </p>
                              <button
                                onClick={() => handleDelete(meal.id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div className="p-4">
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => setShowLogModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Log Another Meal
                      </Button>
                      {favorites.length > 0 && (
                        <Button variant="outline" onClick={() => setShowFavoritesModal(true)}>
                          <Star className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </Card>
          ) : (
            /* Favorites Tab */
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 dark:text-white">Favorite Meals</h2>
                <p className="text-sm text-gray-500 dark:text-slate-400">{favorites.length} saved</p>
              </div>
              {favorites.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-gray-400 dark:text-slate-500" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">No favorites yet</h3>
                  <p className="text-gray-500 dark:text-slate-400 mb-4">Save meals you eat often for quick logging</p>
                  <Button onClick={() => setShowLogModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Log a Meal
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {favorites.map((favorite) => {
                    const IconComponent = getMealIcon(favorite.meal_type);
                    const colorClass = getMealColor(favorite.meal_type);
                    
                    return (
                      <div
                        key={favorite.id}
                        className="p-4 border border-gray-200 dark:border-[#293548] rounded-xl hover:border-primary-300 dark:hover:border-primary-700 transition-colors group"
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", colorClass)}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 dark:text-white truncate">{favorite.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400">{favorite.calories} cal</p>
                            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                              P: {favorite.protein_g}g • C: {favorite.carbs_g}g • F: {favorite.fat_g}g
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Button
                                size="sm"
                                onClick={() => handleLogFavorite(favorite)}
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Quick Log
                              </Button>
                              <button
                                onClick={() => handleDeleteFavorite(favorite.id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {favorite.times_logged}x
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}
        </motion.div>

        {/* Log Meal Modal */}
        <AnimatePresence>
          {showLogModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-50"
                onClick={() => { setShowLogModal(false); resetForm(); }}
              />
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="w-full max-w-lg bg-white dark:bg-[#131C2E] rounded-2xl shadow-xl flex flex-col max-h-[80vh] pointer-events-auto"
                >
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#293548]">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Log Meal</h2>
                  <button onClick={() => { setShowLogModal(false); resetForm(); }} className="p-2 hover:bg-gray-100 dark:hover:bg-[#1A2742] rounded-lg text-gray-500 dark:text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                  {/* Quick Add */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Quick Add</label>
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search common meals..."
                        className="pl-10"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                      {filteredCommonMeals.map((meal, i) => (
                        <button
                          key={i}
                          onClick={() => selectCommonMeal(meal)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-sm transition-all",
                            mealName === meal.name
                              ? "bg-primary-500 text-white"
                              : "bg-gray-100 dark:bg-[#1A2742] text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-[#293548]"
                          )}
                        >
                          {meal.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Meal Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Meal Type</label>
                    <div className="grid grid-cols-4 gap-2">
                      {mealTypes.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setMealType(type.value)}
                          className={cn(
                            "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all",
                            mealType === type.value
                              ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                              : "border-gray-200 dark:border-[#293548] hover:border-gray-300 dark:hover:border-[#3B4A63] hover:bg-sky-50 dark:hover:bg-sky-900/20"
                          )}
                        >
                          <type.icon className={cn("w-5 h-5", mealType === type.value ? "text-primary-500" : "text-gray-400 dark:text-slate-500")} />
                          <span className="text-xs text-gray-700 dark:text-slate-300">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Meal Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Meal Name *</label>
                    <Input
                      value={mealName}
                      onChange={(e) => setMealName(e.target.value)}
                      placeholder="e.g., Grilled Chicken Salad"
                    />
                  </div>

                  {/* Description (optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Description (optional)</label>
                    <Input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g., with olive oil dressing, cherry tomatoes"
                    />
                  </div>

                  {/* AI Analysis Button */}
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-100 dark:border-purple-800/30 rounded-xl p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles className="w-4 h-4 text-purple-500" />
                          <span className="font-medium text-gray-900 dark:text-white text-sm">AI Nutrition Analyzer</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                          Enter a meal name and let AI estimate the nutritional values
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={analyzeWithAI}
                        disabled={isAnalyzing || !mealName.trim()}
                        className="bg-white border-purple-200 hover:bg-purple-50 text-purple-700"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-1.5" />
                            Analyze
                          </>
                        )}
                      </Button>
                    </div>
                    {aiConfidence && (
                      <div className={cn(
                        "mt-3 flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg",
                        aiConfidence === 'high' ? "bg-green-100 text-green-700" :
                        aiConfidence === 'medium' ? "bg-yellow-100 text-yellow-700" :
                        "bg-orange-100 text-orange-700"
                      )}>
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>
                          {aiConfidence === 'high' 
                            ? 'High confidence - values based on recognized meal' 
                            : aiConfidence === 'medium'
                            ? 'Medium confidence - verify and adjust as needed'
                            : 'Low confidence - please verify these estimates'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Calories */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Calories *</label>
                    <Input
                      type="number"
                      value={calories}
                      onChange={(e) => setCalories(e.target.value)}
                      placeholder="e.g., 450"
                    />
                  </div>

                  {/* Macros */}
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Protein (g)</label>
                      <Input
                        type="number"
                        value={protein}
                        onChange={(e) => setProtein(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Carbs (g)</label>
                      <Input
                        type="number"
                        value={carbs}
                        onChange={(e) => setCarbs(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Fat (g)</label>
                      <Input
                        type="number"
                        value={fat}
                        onChange={(e) => setFat(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Fiber (g)</label>
                      <Input
                        type="number"
                        value={fiber}
                        onChange={(e) => setFiber(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Save as Favorite */}
                  <label className="flex items-center gap-3 p-3 bg-yellow-50 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveAsFavorite}
                      onChange={(e) => setSaveAsFavorite(e.target.checked)}
                      className="w-4 h-4 text-primary-500 rounded"
                    />
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium text-gray-700">Save as favorite for quick logging</span>
                    </div>
                  </label>
                </div>

                <div className="p-6 border-t bg-gray-50 dark:bg-[#0B1120] rounded-b-2xl">
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => { setShowLogModal(false); resetForm(); }}>
                      Cancel
                    </Button>
                    <Button className="flex-1" onClick={handleSave} disabled={isSaving || !mealName || !calories}>
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Log Meal'
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>

        {/* Quick Add Favorites Modal */}
        <AnimatePresence>
          {showFavoritesModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-50"
                onClick={() => setShowFavoritesModal(false)}
              />
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="w-full max-w-md bg-white dark:bg-[#131C2E] rounded-2xl shadow-xl max-h-[70vh] flex flex-col pointer-events-auto"
                >
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#293548]">
                  <h2 className="text-xl font-semibold text-gray-900">Quick Add from Favorites</h2>
                  <button onClick={() => setShowFavoritesModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-[#1A2742] rounded-lg text-gray-500 dark:text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-2">
                    {favorites.map((favorite) => {
                      const IconComponent = getMealIcon(favorite.meal_type);
                      const colorClass = getMealColor(favorite.meal_type);
                      
                      return (
                        <button
                          key={favorite.id}
                          onClick={() => handleLogFavorite(favorite)}
                          className="w-full p-4 flex items-center gap-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", colorClass)}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900">{favorite.name}</h3>
                            <p className="text-sm text-gray-500">
                              {favorite.calories} cal • P: {favorite.protein_g}g • C: {favorite.carbs_g}g • F: {favorite.fat_g}g
                            </p>
                          </div>
                          <Plus className="w-5 h-5 text-primary-500" />
                        </button>
                      );
                    })}
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