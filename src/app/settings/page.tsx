'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  User,
  Bell,
  Shield,
  Moon,
  Sun,
  Download,
  Trash2,
  ChevronRight,
  Heart,
  X,
  Loader2,
  FileJson,
  FileSpreadsheet,
  FileText,
  Calendar,
  CheckCircle,
  Activity,
  Pill,
  UtensilsCrossed,
  Droplets,
  Dumbbell,
  Stethoscope,
  SmilePlus,
  Target,
  AlertCircle,
  Info,
} from 'lucide-react';
import { Card, Button, Avatar, Badge, useToast } from '@/components/ui';
import { DashboardShell } from '@/components/layout';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface ExportData {
  exportDate: string;
  user: {
    email: string;
    createdAt: string;
  };
  checkIns: any[];
  vitals: any[];
  medications: any[];
  medicationDoses: any[];
  nutritionLogs: any[];
  waterLogs: any[];
  exerciseLogs: any[];
  symptomLogs: any[];
  healthGoals: any[];
}

const settingsSections = [
  {
    title: 'Account',
    items: [
      { icon: User, label: 'Profile', description: 'Update your personal information', action: 'profile', danger: false },
      { icon: Bell, label: 'Notifications', description: 'Manage notification preferences', action: 'notifications', danger: false },
      { icon: Shield, label: 'Privacy', description: 'Control your data and privacy', action: 'privacy', danger: false },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { icon: Heart, label: 'Emergency Card', description: 'Set up your emergency health info', action: 'emergency', danger: false },
    ],
  },
    {
    title: 'About',
    items: [
      { icon: Info, label: 'About AlagApp', description: 'Learn more about the app and credits', action: 'about', danger: false },
    ],
  },
  {
    title: 'Data',
    items: [
      { icon: Download, label: 'Export Data', description: 'Download all your health data', action: 'export', danger: false },
      { icon: Trash2, label: 'Delete Account', description: 'Permanently delete your account', action: 'delete', danger: true },
    ],
  },
];

const dataCategories = [
  { key: 'checkIns', label: 'Check-ins', icon: SmilePlus, color: 'text-yellow-500 bg-yellow-50' },
  { key: 'vitals', label: 'Vitals', icon: Activity, color: 'text-red-500 bg-red-50' },
  { key: 'medications', label: 'Medications', icon: Pill, color: 'text-purple-500 bg-purple-50' },
  { key: 'medicationDoses', label: 'Medication Doses', icon: Pill, color: 'text-purple-400 bg-purple-50' },
  { key: 'nutritionLogs', label: 'Nutrition', icon: UtensilsCrossed, color: 'text-green-500 bg-green-50' },
  { key: 'waterLogs', label: 'Hydration', icon: Droplets, color: 'text-blue-500 bg-blue-50' },
  { key: 'exerciseLogs', label: 'Exercise', icon: Dumbbell, color: 'text-orange-500 bg-orange-50' },
  { key: 'symptomLogs', label: 'Symptoms', icon: Stethoscope, color: 'text-pink-500 bg-pink-50' },
  { key: 'healthGoals', label: 'Goals', icon: Target, color: 'text-primary-500 bg-primary-50' },
];

export default function SettingsPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [dateRange, setDateRange] = useState<'all' | '30' | '90' | '365'>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(dataCategories.map(c => c.key));
  const [exportProgress, setExportProgress] = useState(0);
  const [dataCounts, setDataCounts] = useState<Record<string, number>>({});
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  
  // Delete account states
  const [deleteStep, setDeleteStep] = useState<'password' | 'confirm' | 'deleting'>('password');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState<string[]>([]);
  const [deleteError, setDeleteError] = useState('');

  // Initialize dark mode from localStorage/system preference
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark') ||
      localStorage.getItem('darkMode') === 'true' ||
      (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    fetchUser();
    fetchDataCounts();
  }, []);

  const fetchUser = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    
    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      setProfile(profileData);
    }
  };

  const fetchDataCounts = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const counts: Record<string, number> = {};

    const tables = [
      { key: 'checkIns', table: 'check_ins' },
      { key: 'vitals', table: 'vitals' },
      { key: 'medications', table: 'medications' },
      { key: 'medicationDoses', table: 'medication_doses' },
      { key: 'nutritionLogs', table: 'nutrition_logs' },
      { key: 'waterLogs', table: 'water_logs' },
      { key: 'exerciseLogs', table: 'exercise_logs' },
      { key: 'symptomLogs', table: 'symptom_logs' },
      { key: 'healthGoals', table: 'health_goals' },
    ];

    for (const { key, table } of tables) {
      try {
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        counts[key] = count || 0;
      } catch {
        counts[key] = 0;
      }
    }

    setDataCounts(counts);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
    
    showToast('success', `${newDarkMode ? 'Dark' : 'Light'} mode enabled`);
  };

  const toggleCategory = (key: string) => {
    setSelectedCategories(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      showToast('error', 'Please log in to export data');
      setIsExporting(false);
      return;
    }

    // Calculate date filter
    let dateFilter: string | null = null;
    if (dateRange !== 'all') {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));
      dateFilter = startDate.toISOString();
    }

    const exportData: ExportData = {
      exportDate: new Date().toISOString(),
      user: {
        email: user.email || '',
        createdAt: user.created_at || '',
      },
      checkIns: [],
      vitals: [],
      medications: [],
      medicationDoses: [],
      nutritionLogs: [],
      waterLogs: [],
      exerciseLogs: [],
      symptomLogs: [],
      healthGoals: [],
    };

    const totalCategories = selectedCategories.length;
    let completed = 0;

    // Fetch each selected category
    if (selectedCategories.includes('checkIns')) {
      let query = supabase.from('check_ins').select('*').eq('user_id', user.id);
      if (dateFilter) query = query.gte('check_in_date', dateFilter.split('T')[0]);
      const { data } = await query.order('check_in_date', { ascending: false });
      exportData.checkIns = data || [];
      completed++;
      setExportProgress(Math.round((completed / totalCategories) * 100));
    }

    if (selectedCategories.includes('vitals')) {
      let query = supabase.from('vitals').select('*').eq('user_id', user.id);
      if (dateFilter) query = query.gte('recorded_at', dateFilter);
      const { data } = await query.order('recorded_at', { ascending: false });
      exportData.vitals = data || [];
      completed++;
      setExportProgress(Math.round((completed / totalCategories) * 100));
    }

    if (selectedCategories.includes('medications')) {
      const { data } = await supabase.from('medications').select('*').eq('user_id', user.id);
      exportData.medications = data || [];
      completed++;
      setExportProgress(Math.round((completed / totalCategories) * 100));
    }

    if (selectedCategories.includes('medicationDoses')) {
      let query = supabase.from('medication_doses').select('*').eq('user_id', user.id);
      if (dateFilter) query = query.gte('scheduled_at', dateFilter);
      const { data } = await query.order('scheduled_at', { ascending: false });
      exportData.medicationDoses = data || [];
      completed++;
      setExportProgress(Math.round((completed / totalCategories) * 100));
    }

    if (selectedCategories.includes('nutritionLogs')) {
      let query = supabase.from('nutrition_logs').select('*').eq('user_id', user.id);
      if (dateFilter) query = query.gte('logged_at', dateFilter);
      const { data } = await query.order('logged_at', { ascending: false });
      exportData.nutritionLogs = data || [];
      completed++;
      setExportProgress(Math.round((completed / totalCategories) * 100));
    }

    if (selectedCategories.includes('waterLogs')) {
      let query = supabase.from('water_logs').select('*').eq('user_id', user.id);
      if (dateFilter) query = query.gte('logged_at', dateFilter);
      const { data } = await query.order('logged_at', { ascending: false });
      exportData.waterLogs = data || [];
      completed++;
      setExportProgress(Math.round((completed / totalCategories) * 100));
    }

    if (selectedCategories.includes('exerciseLogs')) {
      let query = supabase.from('exercise_logs').select('*').eq('user_id', user.id);
      if (dateFilter) query = query.gte('logged_at', dateFilter);
      const { data } = await query.order('logged_at', { ascending: false });
      exportData.exerciseLogs = data || [];
      completed++;
      setExportProgress(Math.round((completed / totalCategories) * 100));
    }

    if (selectedCategories.includes('symptomLogs')) {
      let query = supabase.from('symptom_logs').select('*').eq('user_id', user.id);
      if (dateFilter) query = query.gte('logged_at', dateFilter);
      const { data } = await query.order('logged_at', { ascending: false });
      exportData.symptomLogs = data || [];
      completed++;
      setExportProgress(Math.round((completed / totalCategories) * 100));
    }

    if (selectedCategories.includes('healthGoals')) {
      const { data } = await supabase.from('health_goals').select('*').eq('user_id', user.id);
      exportData.healthGoals = data || [];
      completed++;
      setExportProgress(Math.round((completed / totalCategories) * 100));
    }

    // Generate file
    const filename = `alagapp-export-${new Date().toISOString().split('T')[0]}`;

    if (exportFormat === 'json') {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // CSV export - combine all data into one CSV
      const allData: any[] = [];
      
      for (const category of dataCategories) {
        const data = exportData[category.key as keyof ExportData];
        if (Array.isArray(data) && data.length > 0) {
          data.forEach(item => {
            allData.push({
              category: category.label,
              ...item
            });
          });
        }
      }
      
      if (allData.length > 0) {
        const headers = Object.keys(allData[0]);
        const csv = [
          headers.join(','),
          ...allData.map(row =>
            headers.map(h => {
              const val = row[h];
              if (val === null || val === undefined) return '';
              if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
              if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
                return `"${val.replace(/"/g, '""')}"`;
              }
              return val;
            }).join(',')
          ),
        ].join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        showToast('info', 'No data to export');
        setIsExporting(false);
        return;
      }
    }

    showToast('success', 'Data exported successfully!');
    setIsExporting(false);
    setShowExportModal(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteStep === 'password') {
      // Verify password first
      if (!deletePassword) {
        setDeleteError('Please enter your password');
        return;
      }
      
      setIsDeleting(true);
      setDeleteError('');
      
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({
          email: user?.email || '',
          password: deletePassword,
        });
        
        if (error) {
          setDeleteError('Invalid password. Please try again.');
          setIsDeleting(false);
          return;
        }
        
        // Password verified, move to confirmation step
        setDeleteStep('confirm');
        setIsDeleting(false);
      } catch (err) {
        setDeleteError('An error occurred. Please try again.');
        setIsDeleting(false);
      }
    } else if (deleteStep === 'confirm') {
      // Check confirmation text
      if (deleteConfirmText !== 'REMOVE ACCOUNT') {
        setDeleteError('Please type "REMOVE ACCOUNT" exactly to confirm');
        return;
      }
      
      // Start deletion process
      setDeleteStep('deleting');
      setIsDeleting(true);
      setDeleteError('');
      setDeleteProgress(['Starting account deletion...']);
      
      const deletionSteps = [
        'Deleting AI messages...',
        'Deleting AI conversations...',
        'Deleting medication doses...',
        'Deleting medications...',
        'Deleting nutrition logs...',
        'Deleting water logs...',
        'Deleting exercise logs...',
        'Deleting symptom logs...',
        'Deleting vitals...',
        'Deleting check-ins...',
        'Deleting health goals...',
        'Deleting saved tips...',
        'Deleting profile...',
        'Removing account...',
      ];
      
      // Simulate progress updates
      for (let i = 0; i < deletionSteps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setDeleteProgress(prev => [...prev, deletionSteps[i]]);
      }
      
      try {
        const response = await fetch('/api/account/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: deletePassword }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to delete account');
        }
        
        setDeleteProgress(prev => [...prev, '✓ Account deleted successfully!']);
        
        // Wait a moment to show success message
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Sign out and redirect
        const supabase = createClient();
        await supabase.auth.signOut();
        
        // Redirect to login with success message
        router.push('/login?deleted=true');
      } catch (err: any) {
        setDeleteError(err.message || 'Failed to delete account. Please contact support.');
        setIsDeleting(false);
        setDeleteStep('confirm');
      }
    }
  };
  
  const resetDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteStep('password');
    setDeletePassword('');
    setDeleteConfirmText('');
    setDeleteError('');
    setDeleteProgress([]);
    setIsDeleting(false);
  };

  const handleSettingAction = (action: string) => {
    switch (action) {
      case 'profile':
        router.push('/profile');
        break;
      case 'notifications':
        showToast('info', 'Notification settings coming soon');
        break;
      case 'privacy':
        showToast('info', 'Privacy settings coming soon');
        break;
      case 'emergency':
        router.push('/profile');
        break;
      case 'export':
        setShowExportModal(true);
        break;
      case 'delete':
        setShowDeleteModal(true);
        break;
      case 'about':
        router.push('/about');
        break;
    }
  };

  const totalRecords = Object.values(dataCounts).reduce((sum, count) => sum + count, 0);

  return (
    <>
    <DashboardShell>
      <div className="max-w-2xl mx-auto px-4 sm:px-0 space-y-4 sm:space-y-6 pb-24 lg:pb-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">Manage your account and preferences</p>
        </motion.div>

        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <Avatar fallback={profile?.full_name || user?.email || 'User'} size="xl" />
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">{user?.email || 'demo@alagapp.com'}</p>
                <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'December 2024'}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => router.push('/profile')}
              >
                Edit Profile
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Dark Mode Toggle */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-xl transition-colors",
                  darkMode ? "bg-indigo-900/50" : "bg-indigo-100"
                )}>
                  {darkMode ? (
                    <Moon className="h-5 w-5 text-indigo-400" />
                  ) : (
                    <Sun className="h-5 w-5 text-indigo-500" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {darkMode ? 'Dark Mode' : 'Light Mode'}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleDarkMode}
                className={cn(
                  'relative w-14 h-8 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                  darkMode ? 'bg-primary-500' : 'bg-gray-300'
                )}
                aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                <span
                  className={cn(
                    'absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center',
                    darkMode ? 'translate-x-7' : 'translate-x-1'
                  )}
                >
                  {darkMode ? (
                    <Moon className="h-3.5 w-3.5 text-primary-500" />
                  ) : (
                    <Sun className="h-3.5 w-3.5 text-yellow-500" />
                  )}
                </span>
              </button>
            </div>
          </Card>
        </motion.div>

        {/* Settings Sections */}
        {settingsSections.map((section, si) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + si * 0.1 }}
          >
            <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 sm:mb-3 px-1">
              {section.title}
            </h3>
            <Card className="divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden">
              {section.items.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleSettingAction(item.action)}
                  className={cn(
                    'w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 transition-colors text-left',
                    item.danger
                      ? 'hover:bg-red-50 dark:hover:bg-red-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  )}
                >
                  <div
                    className={cn(
                      'p-2 sm:p-2.5 rounded-xl flex-shrink-0',
                      item.danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-700'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'h-4 w-4 sm:h-5 sm:w-5',
                        item.danger ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'font-medium text-sm sm:text-base',
                        item.danger ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
                      )}
                    >
                      {item.label}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight
                    className={cn(
                      'h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0',
                      item.danger ? 'text-red-400' : 'text-gray-400 dark:text-gray-500'
                    )}
                  />
                </button>
              ))}
            </Card>
          </motion.div>
        ))}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center py-4 sm:py-6 text-xs sm:text-sm text-gray-400 dark:text-gray-500"
        >
          <p>AlagApp v1.0.0</p>
          <p className="mt-1">Made with ❤️ for your health</p>
        </motion.div>
      </div>

      {/* Export Modal */}
      <AnimatePresence>
        {showExportModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => !isExporting && setShowExportModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-xl z-50 flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b dark:border-gray-700 flex-shrink-0">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Export Your Data</h2>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{totalRecords} total records</p>
                </div>
                <button
                  onClick={() => !isExporting && setShowExportModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  disabled={isExporting}
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Format Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">Export Format</label>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <button
                      onClick={() => setExportFormat('json')}
                      className={cn(
                        'flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl border-2 transition-all',
                        exportFormat === 'json'
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      )}
                    >
                      <FileJson className={cn('w-5 h-5 sm:w-6 sm:h-6', exportFormat === 'json' ? 'text-primary-500' : 'text-gray-400')} />
                      <div className="text-left">
                        <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">JSON</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Structured data</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setExportFormat('csv')}
                      className={cn(
                        'flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl border-2 transition-all',
                        exportFormat === 'csv'
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      )}
                    >
                      <FileSpreadsheet className={cn('w-5 h-5 sm:w-6 sm:h-6', exportFormat === 'csv' ? 'text-primary-500' : 'text-gray-400')} />
                      <div className="text-left">
                        <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">CSV</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Spreadsheet</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">Date Range</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { value: 'all', label: 'All Time' },
                      { value: '30', label: '30 Days' },
                      { value: '90', label: '90 Days' },
                      { value: '365', label: '1 Year' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setDateRange(option.value as any)}
                        className={cn(
                          'py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all',
                          dateRange === option.value
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Data Categories */}
                <div>
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data to Include</label>
                    <button
                      onClick={() =>
                        setSelectedCategories(
                          selectedCategories.length === dataCategories.length
                            ? []
                            : dataCategories.map(c => c.key)
                        )
                      }
                      className="text-xs text-primary-500 hover:underline"
                    >
                      {selectedCategories.length === dataCategories.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
                    {dataCategories.map((category) => {
                      const count = dataCounts[category.key] || 0;
                      const isSelected = selectedCategories.includes(category.key);

                      return (
                        <button
                          key={category.key}
                          onClick={() => toggleCategory(category.key)}
                          className={cn(
                            'w-full flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl border-2 transition-all',
                            isSelected 
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                              : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
                          )}
                        >
                          <div className={cn('w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0', category.color)}>
                            <category.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{category.label}</p>
                          </div>
                          <Badge variant="secondary" className="text-xs">{count}</Badge>
                          {isSelected && <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl flex-shrink-0">
                {isExporting ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Exporting...</span>
                      <span className="font-medium text-gray-900 dark:text-white">{exportProgress}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${exportProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1 order-2 sm:order-1" 
                      onClick={() => setShowExportModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 order-1 sm:order-2"
                      onClick={handleExport}
                      disabled={selectedCategories.length === 0}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export {selectedCategories.length > 0 ? `${selectedCategories.length} Categories` : ''}
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardShell>

    {/* Delete Account Modal - Outside DashboardShell */}
    <AnimatePresence>
      {showDeleteModal && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[100]"
            onClick={() => !isDeleting && resetDeleteModal()}
          />
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-white dark:bg-[#131C2E] rounded-2xl shadow-xl flex flex-col max-h-[80vh] pointer-events-auto"
            >
              {/* Header */}
              <div className="p-6 text-center border-b border-gray-200 dark:border-[#293548]">
                <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  {deleteStep === 'deleting' ? (
                    <Loader2 className="w-7 h-7 text-red-500 animate-spin" />
                  ) : (
                    <AlertCircle className="w-7 h-7 text-red-500" />
                  )}
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {deleteStep === 'password' && 'Delete Account'}
                  {deleteStep === 'confirm' && 'Confirm Deletion'}
                  {deleteStep === 'deleting' && 'Deleting Account...'}
                </h2>
                <p className="text-gray-500 dark:text-slate-400 mt-2 text-sm">
                  {deleteStep === 'password' && 'Enter your password to continue'}
                  {deleteStep === 'confirm' && 'This action cannot be undone'}
                  {deleteStep === 'deleting' && 'Please wait while we remove your data'}
                </p>
              </div>

              {/* Content */}
              <div className="p-6 flex-1 overflow-y-auto">
                {deleteStep === 'password' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800/30">
                      <p className="text-sm text-red-700 dark:text-red-400">
                        <strong>Warning:</strong> All your health data will be permanently deleted, including:
                      </p>
                      <ul className="mt-2 text-sm text-red-600 dark:text-red-400 space-y-1">
                        <li>• Check-ins, vitals, and health goals</li>
                        <li>• Medications and dose history</li>
                        <li>• Nutrition, hydration, and exercise logs</li>
                        <li>• Symptoms and AI conversations</li>
                        <li>• Your profile and all settings</li>
                      </ul>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        Enter your password
                      </label>
                      <input
                        type="password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        placeholder="Your password"
                        className="w-full px-4 py-3 border border-gray-200 dark:border-[#293548] rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-[#1A2742] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500"
                      />
                    </div>
                    
                    {deleteError && (
                      <p className="text-sm text-red-500 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {deleteError}
                      </p>
                    )}
                  </div>
                )}

                {deleteStep === 'confirm' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800/30">
                      <p className="text-sm text-red-700 dark:text-red-400">
                        <strong>Final confirmation required.</strong> Type <span className="font-mono font-bold">REMOVE ACCOUNT</span> below to permanently delete your account.
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        Type "REMOVE ACCOUNT" to confirm
                      </label>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                        placeholder="REMOVE ACCOUNT"
                        className="w-full px-4 py-3 border border-gray-200 dark:border-[#293548] rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-[#1A2742] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 font-mono"
                      />
                    </div>
                    
                    {deleteError && (
                      <p className="text-sm text-red-500 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {deleteError}
                      </p>
                    )}
                  </div>
                )}

                {deleteStep === 'deleting' && (
                  <div className="space-y-3">
                    <div className="max-h-48 overflow-y-auto space-y-2 p-3 bg-gray-50 dark:bg-[#1A2742] rounded-xl font-mono text-sm">
                      {deleteProgress.map((step, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={cn(
                            "flex items-center gap-2",
                            step.startsWith('✓') 
                              ? "text-green-600 dark:text-green-400" 
                              : "text-gray-600 dark:text-slate-400"
                          )}
                        >
                          {step.startsWith('✓') ? (
                            <CheckCircle className="w-4 h-4 flex-shrink-0" />
                          ) : index === deleteProgress.length - 1 ? (
                            <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 flex-shrink-0 text-green-500" />
                          )}
                          <span>{step}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              {deleteStep !== 'deleting' && (
                <div className="p-6 border-t border-gray-200 dark:border-[#293548] bg-gray-50 dark:bg-[#0B1120]">
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1" 
                      onClick={resetDeleteModal}
                      disabled={isDeleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                      onClick={handleDeleteAccount}
                      disabled={isDeleting || (deleteStep === 'confirm' && deleteConfirmText !== 'REMOVE ACCOUNT')}
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : deleteStep === 'password' ? (
                        'Continue'
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Permanently Delete
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
    </>
  );
}