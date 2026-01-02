'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Menu, Bell, Sun, Moon, Heart, LayoutDashboard, Activity, Pill, 
  UtensilsCrossed, Bot, Trophy, User, Settings, LogOut, X, Clock, 
  AlertCircle, Droplets, Dumbbell, SmilePlus, Target, Trash2, CheckCheck,
  Sparkles
} from 'lucide-react';
import { Button, Avatar } from '@/components/ui';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

const mobileNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/vitals', icon: Activity, label: 'Vitals' },
  { href: '/medications', icon: Pill, label: 'Meds' },
  { href: '/nutrition', icon: UtensilsCrossed, label: 'Food' },
  { href: '/ai-assistant', icon: Bot, label: 'AI' },
];

interface Notification {
  id: string;
  type: 'medication' | 'checkin' | 'goal' | 'hydration' | 'exercise' | 'vitals' | 'tip' | 'achievement';
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionUrl?: string;
  dismissed?: boolean;
}

interface StoredNotifications {
  notifications: Notification[];
  lastGenerated: string;
  dismissedIds: string[];
  readIds: string[];
}

const STORAGE_KEY = 'alagapp_notifications';
const GENERATION_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userInitials, setUserInitials] = useState<string>('');
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Initialize dark mode from localStorage (default to light mode)
  useEffect(() => {
    // Always remove dark class first to ensure light mode is default
    document.documentElement.classList.remove('dark');
    
    const savedDarkMode = localStorage.getItem('darkMode');
    // Only enable dark mode if explicitly set to 'true' in localStorage
    if (savedDarkMode === 'true') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      // Ensure light mode is set in localStorage if not already set
      if (savedDarkMode !== 'false') {
        localStorage.setItem('darkMode', 'false');
      }
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  };

  // Load notifications from localStorage
  const loadStoredNotifications = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: StoredNotifications = JSON.parse(stored);
        setDismissedIds(new Set(data.dismissedIds || []));
        setReadIds(new Set(data.readIds || []));
        return data;
      }
    } catch (e) {
      console.log('Failed to load notifications:', e);
    }
    return null;
  }, []);

  // Save notifications to localStorage
  const saveNotifications = useCallback((notifs: Notification[], dismissed: Set<string>, read: Set<string>) => {
    try {
      const data: StoredNotifications = {
        notifications: notifs,
        lastGenerated: new Date().toISOString(),
        dismissedIds: Array.from(dismissed),
        readIds: Array.from(read),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.log('Failed to save notifications:', e);
    }
  }, []);

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsProfileLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, full_name')
          .eq('id', user.id)
          .single();
        
        if (profile?.first_name) {
          // New schema with first_name, last_name
          // Display full first_name (e.g., "John Bert")
          setUserName(profile.first_name);
          
          // Generate initials: first letter of first_name + first letter of last_name
          // e.g., "John Bert" + "Cruz" = "JC"
          const firstInitial = profile.first_name.charAt(0).toUpperCase();
          const lastInitial = profile.last_name ? profile.last_name.charAt(0).toUpperCase() : '';
          setUserInitials(lastInitial ? `${firstInitial}${lastInitial}` : firstInitial);
        } else if (profile?.full_name) {
          // Legacy schema with full_name (e.g., "John Bert Cruz")
          const nameParts = profile.full_name.trim().split(' ');
          if (nameParts.length >= 2) {
            // Show all except last part as display name (e.g., "John Bert")
            const displayName = nameParts.slice(0, -1).join(' ');
            setUserName(displayName);
            // Initials: first letter + last name's first letter (e.g., "JC")
            const firstInitial = nameParts[0].charAt(0).toUpperCase();
            const lastInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase();
            setUserInitials(`${firstInitial}${lastInitial}`);
          } else {
            // Only one name
            setUserName(nameParts[0]);
            setUserInitials(nameParts[0].charAt(0).toUpperCase());
          }
        } else {
          setUserName(user.email?.split('@')[0] || 'User');
          setUserInitials(user.email?.charAt(0).toUpperCase() || 'U');
        }
      }
      setIsProfileLoading(false);
    };

    fetchUserProfile();
  }, []);

  // Generate notifications based on user data
  const generateNotifications = useCallback(async (forceRegenerate = false) => {
    // Check if we should regenerate
    const stored = loadStoredNotifications();
    if (stored && !forceRegenerate) {
      const lastGen = new Date(stored.lastGenerated).getTime();
      const now = Date.now();
      
      // If generated within interval, use stored notifications
      if (now - lastGen < GENERATION_INTERVAL) {
        const activeNotifs = stored.notifications.filter(n => !stored.dismissedIds.includes(n.id));
        setNotifications(activeNotifs.map(n => ({
          ...n,
          read: stored.readIds.includes(n.id),
        })));
        return;
      }
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    const newNotifications: Notification[] = [];
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentHour = now.getHours();

    // Keep dismissed IDs from previous session
    const currentDismissed = stored?.dismissedIds || [];
    const currentRead = stored?.readIds || [];

    try {
      // 1. Check-in reminder (morning, afternoon, evening)
      const { data: todayCheckIn } = await supabase
        .from('check_ins')
        .select('id')
        .eq('user_id', user.id)
        .eq('check_in_date', today)
        .maybeSingle();

      if (!todayCheckIn) {
        let checkInId = '';
        let checkInMsg = '';
        
        if (currentHour >= 6 && currentHour < 12) {
          checkInId = `checkin-morning-${today}`;
          checkInMsg = "Good morning! Start your day with a quick check-in. How are you feeling?";
        } else if (currentHour >= 12 && currentHour < 18) {
          checkInId = `checkin-afternoon-${today}`;
          checkInMsg = "Afternoon check-in time! Take a moment to log how you're doing.";
        } else if (currentHour >= 18) {
          checkInId = `checkin-evening-${today}`;
          checkInMsg = "Evening reflection time. How was your day? Complete your check-in.";
        }

        if (checkInId && !currentDismissed.includes(checkInId)) {
          newNotifications.push({
            id: checkInId,
            type: 'checkin',
            title: 'Daily Check-in',
            message: checkInMsg,
            time: now.toISOString(),
            read: currentRead.includes(checkInId),
            actionUrl: '/check-in',
          });
        }
      }

      // 2. Medication reminders
      const { data: medications } = await supabase
        .from('medications')
        .select('id, name, dosage, schedule_times')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (medications && medications.length > 0) {
        medications.forEach(med => {
          const medId = `med-${med.id}-${today}`;
          if (!currentDismissed.includes(medId)) {
            newNotifications.push({
              id: medId,
              type: 'medication',
              title: 'Medication Reminder',
              message: `Time to take ${med.name}${med.dosage ? ` (${med.dosage})` : ''}`,
              time: now.toISOString(),
              read: currentRead.includes(medId),
              actionUrl: '/medications',
            });
          }
        });
      }

      // 3. Hydration reminder
      const { data: waterLogs } = await supabase
        .from('water_logs')
        .select('amount_ml')
        .eq('user_id', user.id)
        .gte('logged_at', `${today}T00:00:00`);

      const totalWater = waterLogs?.reduce((sum, log) => sum + (log.amount_ml || 0), 0) || 0;
      const waterGoal = 2000; // 2L default

      if (totalWater < waterGoal * 0.5 && currentHour >= 14) {
        const hydrationId = `hydration-${today}`;
        if (!currentDismissed.includes(hydrationId)) {
          newNotifications.push({
            id: hydrationId,
            type: 'hydration',
            title: 'Stay Hydrated! 💧',
            message: `You've had ${totalWater}ml today. Try to drink more water!`,
            time: now.toISOString(),
            read: currentRead.includes(hydrationId),
            actionUrl: '/hydration',
          });
        }
      }

      // 4. Exercise reminder (if no exercise logged today and it's afternoon)
      if (currentHour >= 15 && currentHour <= 20) {
        const { data: todayExercise } = await supabase
          .from('exercise_logs')
          .select('id')
          .eq('user_id', user.id)
          .gte('logged_at', `${today}T00:00:00`)
          .maybeSingle();

        if (!todayExercise) {
          const exerciseId = `exercise-${today}`;
          if (!currentDismissed.includes(exerciseId)) {
            newNotifications.push({
              id: exerciseId,
              type: 'exercise',
              title: 'Time to Move! 🏃',
              message: "You haven't logged any exercise today. Even a short walk counts!",
              time: now.toISOString(),
              read: currentRead.includes(exerciseId),
              actionUrl: '/exercise',
            });
          }
        }
      }

      // 5. Vitals reminder (if no vitals logged today)
      const { data: todayVitals } = await supabase
        .from('vitals')
        .select('id')
        .eq('user_id', user.id)
        .gte('recorded_at', `${today}T00:00:00`)
        .limit(1);

      if (!todayVitals || todayVitals.length === 0) {
        const vitalsId = `vitals-${today}`;
        if (!currentDismissed.includes(vitalsId)) {
          newNotifications.push({
            id: vitalsId,
            type: 'vitals',
            title: 'Log Your Vitals',
            message: "Track your health by logging today's vitals.",
            time: now.toISOString(),
            read: currentRead.includes(vitalsId),
            actionUrl: '/vitals',
          });
        }
      }

      // 6. Goal progress notifications
      const { data: goals } = await supabase
        .from('health_goals')
        .select('id, title, current_value, target_value')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (goals && goals.length > 0) {
        goals.forEach(goal => {
          const progress = (goal.current_value / goal.target_value) * 100;
          
          if (progress >= 90 && progress < 100) {
            const goalId = `goal-almost-${goal.id}`;
            if (!currentDismissed.includes(goalId)) {
              newNotifications.push({
                id: goalId,
                type: 'goal',
                title: 'Almost There! 🎯',
                message: `You're ${Math.round(progress)}% to completing: ${goal.title}`,
                time: now.toISOString(),
                read: currentRead.includes(goalId),
                actionUrl: '/goals',
              });
            }
          } else if (progress >= 100) {
            const goalId = `goal-complete-${goal.id}`;
            if (!currentDismissed.includes(goalId)) {
              newNotifications.push({
                id: goalId,
                type: 'achievement',
                title: 'Goal Achieved! 🏆',
                message: `Congratulations! You completed: ${goal.title}`,
                time: now.toISOString(),
                read: currentRead.includes(goalId),
                actionUrl: '/goals',
              });
            }
          }
        });
      }

      // 7. Daily health tip (rotate through tips)
      const tips = [
        { id: 'tip-water', message: "Drinking water before meals can help with digestion and weight management." },
        { id: 'tip-sleep', message: "Aim for 7-9 hours of sleep. Good sleep improves mood and energy." },
        { id: 'tip-walk', message: "A 10-minute walk after meals can help regulate blood sugar levels." },
        { id: 'tip-stretch', message: "Take stretch breaks every hour if you sit for long periods." },
        { id: 'tip-breathing', message: "Try 5 deep breaths when stressed. It activates your relaxation response." },
        { id: 'tip-vegetables', message: "Try to fill half your plate with vegetables at each meal." },
        { id: 'tip-screen', message: "Reduce screen time 1 hour before bed for better sleep quality." },
      ];

      const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
      const tipIndex = dayOfYear % tips.length;
      const todayTip = tips[tipIndex];
      const tipId = `${todayTip.id}-${today}`;

      if (!currentDismissed.includes(tipId) && newNotifications.length < 5) {
        newNotifications.push({
          id: tipId,
          type: 'tip',
          title: '💡 Health Tip',
          message: todayTip.message,
          time: now.toISOString(),
          read: currentRead.includes(tipId),
        });
      }

    } catch (e) {
      console.log('Error generating notifications:', e);
    }

    // Sort by unread first, then by time
    newNotifications.sort((a, b) => {
      if (a.read !== b.read) return a.read ? 1 : -1;
      return new Date(b.time).getTime() - new Date(a.time).getTime();
    });

    setNotifications(newNotifications);
    saveNotifications(newNotifications, new Set(currentDismissed), new Set(currentRead));
  }, [loadStoredNotifications, saveNotifications]);

  // Initialize notifications
  useEffect(() => {
    generateNotifications();
    
    // Refresh every 30 minutes
    const interval = setInterval(() => generateNotifications(true), 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [generateNotifications]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    localStorage.removeItem(STORAGE_KEY);
    router.push('/login');
  };

  const markAsRead = (id: string) => {
    const newReadIds = new Set(readIds);
    newReadIds.add(id);
    setReadIds(newReadIds);
    
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
    
    saveNotifications(notifications, dismissedIds, newReadIds);
  };

  const markAllAsRead = () => {
    const newReadIds = new Set(notifications.map(n => n.id));
    setReadIds(newReadIds);
    
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    
    saveNotifications(notifications, dismissedIds, newReadIds);
  };

  const dismissNotification = (id: string) => {
    const newDismissedIds = new Set(dismissedIds);
    newDismissedIds.add(id);
    setDismissedIds(newDismissedIds);
    
    const updatedNotifications = notifications.filter(n => n.id !== id);
    setNotifications(updatedNotifications);
    
    saveNotifications(updatedNotifications, newDismissedIds, readIds);
  };

  const clearAllNotifications = () => {
    const allIds = notifications.map(n => n.id);
    const newDismissedIds = new Set([...Array.from(dismissedIds), ...allIds]);
    setDismissedIds(newDismissedIds);
    setNotifications([]);
    
    saveNotifications([], newDismissedIds, readIds);
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
      setShowNotifications(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'medication': return <Pill className="h-4 w-4 text-pink-500" />;
      case 'checkin': return <SmilePlus className="h-4 w-4 text-yellow-500" />;
      case 'goal': return <Target className="h-4 w-4 text-blue-500" />;
      case 'hydration': return <Droplets className="h-4 w-4 text-cyan-500" />;
      case 'exercise': return <Dumbbell className="h-4 w-4 text-orange-500" />;
      case 'vitals': return <Activity className="h-4 w-4 text-red-500" />;
      case 'achievement': return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'tip': return <Sparkles className="h-4 w-4 text-purple-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {/* Desktop Navbar */}
      <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-[#0B1120]/80 backdrop-blur-lg border-b border-slate-200 dark:border-[#293548]">
        <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
            <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
              <div className="h-8 w-8 rounded-lg overflow-hidden">
                <img src="/logo.svg" alt="AlagApp" className="h-full w-full object-cover" />
              </div>
              <span className="font-bold text-slate-900 dark:text-white">AlagApp</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="hidden sm:flex">
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Link href="/achievements">
              <Button variant="ghost" size="icon" className={cn(pathname === '/achievements' && 'bg-primary-50 dark:bg-primary-900/30 text-primary-500')}>
                <Trophy className="h-5 w-5" />
              </Button>
            </Link>
            
            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#131C2E] rounded-xl shadow-xl border border-gray-200 dark:border-[#293548] z-50 max-h-[80vh] overflow-hidden">
                  {/* Header */}
                  <div className="p-3 border-b border-gray-100 dark:border-[#293548] flex items-center justify-between bg-gray-50 dark:bg-[#0B1120]">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Notifications
                      {unreadCount > 0 && (
                        <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-1">
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllAsRead}
                          className="p-1.5 text-gray-400 hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-[#1A2742] rounded-lg transition-colors"
                          title="Mark all as read"
                        >
                          <CheckCheck className="h-4 w-4" />
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button 
                          onClick={clearAllNotifications}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-[#1A2742] rounded-lg transition-colors"
                          title="Clear all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Notifications List */}
                  <div className="overflow-y-auto max-h-96">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-[#1A2742] rounded-full flex items-center justify-center mx-auto mb-3">
                          <Bell className="h-8 w-8 text-gray-300 dark:text-slate-500" />
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">All caught up!</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">No new notifications</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={cn(
                            'p-3 border-b border-gray-50 dark:border-[#293548]/50 last:border-0 transition-colors cursor-pointer',
                            !notification.read 
                              ? 'bg-primary-50/50 dark:bg-primary-900/20 hover:bg-primary-50 dark:hover:bg-primary-900/30' 
                              : 'hover:bg-gray-50 dark:hover:bg-[#1A2742]'
                          )}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex gap-3">
                            <div className={cn(
                              "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center",
                              !notification.read ? 'bg-white dark:bg-[#1A2742] shadow-sm' : 'bg-gray-100 dark:bg-[#1A2742]'
                            )}>
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className={cn(
                                  "text-sm text-gray-900 dark:text-white line-clamp-1",
                                  !notification.read && "font-semibold"
                                )}>
                                  {notification.title}
                                </p>
                                {!notification.read && (
                                  <span className="flex-shrink-0 w-2 h-2 bg-primary-500 rounded-full mt-1.5" />
                                )}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center justify-between mt-1.5">
                                <p className="text-[10px] text-gray-400 dark:text-slate-500 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTime(notification.time)}
                                </p>
                                {notification.actionUrl && (
                                  <span className="text-[10px] text-primary-500 font-medium">
                                    Tap to view →
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                dismissNotification(notification.id);
                              }}
                              className="flex-shrink-0 p-1.5 hover:bg-gray-200 dark:hover:bg-[#1A2742] rounded-full transition-colors"
                            >
                              <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="p-2 border-t border-gray-100 dark:border-[#293548] bg-gray-50 dark:bg-[#0B1120]">
                      <button
                        onClick={() => generateNotifications(true)}
                        className="w-full text-center text-xs text-gray-500 dark:text-slate-400 hover:text-primary-500 py-1.5 transition-colors"
                      >
                        Refresh notifications
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Profile Dropdown */}
            <div className="relative mr-5 sm:mr-6" ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-[#1A2742] transition-colors"
              >
                {isProfileLoading ? (
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                ) : (
                  <Avatar fallback={userInitials || 'U'} size="sm" />
                )}
              </button>
              
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#131C2E] rounded-xl shadow-lg border border-gray-200 dark:border-[#293548] py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-[#293548]">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{userName || 'User'}</p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-[#1A2742] transition-colors"
                  >
                    <User className="h-4 w-4 text-gray-500 dark:text-slate-400" />
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-[#1A2742] transition-colors"
                  >
                    <Settings className="h-4 w-4 text-gray-500 dark:text-slate-400" />
                    Settings
                  </Link>
                  <div className="border-t border-gray-100 dark:border-[#293548] my-1" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full"
                  >
                    <LogOut className="h-4 w-4" />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#0B1120] border-t border-slate-200 dark:border-[#293548] lg:hidden">
        <div className="flex items-center justify-around h-14 w-full max-w-full px-1 mb-5">
          {mobileNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors flex-1 min-w-0',
                  isActive ? 'text-primary-500' : 'text-slate-500 dark:text-slate-400'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="text-[10px] font-medium truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
        {/* Safe area spacer for iOS */}
        <div className="pb-safe" />
      </nav>
    </>
  );
}