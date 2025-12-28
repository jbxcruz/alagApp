'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Camera,
  Save,
  Loader2,
  Heart,
  Droplets,
  Activity,
  Scale,
  Ruler,
  AlertCircle,
  CheckCircle,
  Edit3,
  X,
} from 'lucide-react';
import { Card, Button, Avatar, Badge, useToast } from '@/components/ui';
import { DashboardShell } from '@/components/layout';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  blood_type: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  allergies: string[] | null;
  medical_conditions: string[] | null;
  created_at: string;
  avatar_url: string | null;
}

interface HealthStats {
  totalCheckIns: number;
  totalVitals: number;
  totalMedications: number;
  totalExercises: number;
  memberSince: string;
  currentStreak: number;
}

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];

export default function ProfilePage() {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<HealthStats | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    height_cm: '',
    weight_kg: '',
    blood_type: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    allergies: '',
    medical_conditions: '',
  });

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, []);

  const fetchProfile = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setIsLoading(false);
      return;
    }

    // Try to get existing profile
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (existingProfile) {
      setProfile({ ...existingProfile, email: user.email || '' });
      setFormData({
        full_name: existingProfile.full_name || '',
        phone: existingProfile.phone || '',
        date_of_birth: existingProfile.date_of_birth || '',
        gender: existingProfile.gender || '',
        height_cm: existingProfile.height_cm?.toString() || '',
        weight_kg: existingProfile.weight_kg?.toString() || '',
        blood_type: existingProfile.blood_type || '',
        emergency_contact_name: existingProfile.emergency_contact_name || '',
        emergency_contact_phone: existingProfile.emergency_contact_phone || '',
        allergies: existingProfile.allergies?.join(', ') || '',
        medical_conditions: existingProfile.medical_conditions?.join(', ') || '',
      });
    } else {
      // Create new profile
      const newProfile = {
        id: user.id,
        email: user.email || '',
        full_name: null,
        created_at: new Date().toISOString(),
      };
      setProfile(newProfile as UserProfile);
    }

    setIsLoading(false);
  };

  const fetchStats = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const [checkIns, vitals, medications, exercises] = await Promise.all([
      supabase.from('check_ins').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('vitals').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('medications').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('exercise_logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    ]);

    // Calculate streak
    const { data: recentCheckIns } = await supabase
      .from('check_ins')
      .select('check_in_date')
      .eq('user_id', user.id)
      .order('check_in_date', { ascending: false })
      .limit(30);

    let streak = 0;
    if (recentCheckIns && recentCheckIns.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const dates = recentCheckIns.map(c => c.check_in_date);
      
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date();
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];
        
        if (dates.includes(dateStr)) {
          streak++;
        } else if (i > 0) {
          break;
        }
      }
    }

    setStats({
      totalCheckIns: checkIns.count || 0,
      totalVitals: vitals.count || 0,
      totalMedications: medications.count || 0,
      totalExercises: exercises.count || 0,
      memberSince: user.created_at || new Date().toISOString(),
      currentStreak: streak,
    });
  };

  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);
    const supabase = createClient();

    const updateData = {
      id: profile.id,
      full_name: formData.full_name || null,
      phone: formData.phone || null,
      date_of_birth: formData.date_of_birth || null,
      gender: formData.gender || null,
      height_cm: formData.height_cm ? parseFloat(formData.height_cm) : null,
      weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
      blood_type: formData.blood_type || null,
      emergency_contact_name: formData.emergency_contact_name || null,
      emergency_contact_phone: formData.emergency_contact_phone || null,
      allergies: formData.allergies ? formData.allergies.split(',').map(s => s.trim()).filter(Boolean) : null,
      medical_conditions: formData.medical_conditions ? formData.medical_conditions.split(',').map(s => s.trim()).filter(Boolean) : null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('profiles')
      .upsert(updateData);

    if (error) {
      showToast('error', 'Failed to save profile');
      console.error('Profile save error:', error);
    } else {
      showToast('success', 'Profile updated successfully!');
      setProfile({ ...profile, ...updateData });
      setIsEditing(false);
    }

    setIsSaving(false);
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your personal information</p>
          </div>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save
              </Button>
            </div>
          )}
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                <Avatar 
                  fallback={formData.full_name || profile?.email || 'User'} 
                  size="xl" 
                  src={profile?.avatar_url}
                />
                {isEditing && (
                  <button className="absolute bottom-0 right-0 p-2 bg-primary-500 text-white rounded-full shadow-lg hover:bg-primary-600 transition-colors">
                    <Camera className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Basic Info */}
              <div className="flex-1 text-center sm:text-left">
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Your full name"
                    className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white bg-transparent border-b-2 border-primary-500 focus:outline-none w-full sm:w-auto"
                  />
                ) : (
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {formData.full_name || 'Add your name'}
                  </h2>
                )}
                <p className="text-gray-500 flex items-center justify-center sm:justify-start gap-2 mt-1">
                  <Mail className="w-4 h-4" />
                  {profile?.email}
                </p>
                {formData.date_of_birth && (
                  <p className="text-sm text-gray-400 mt-1">
                    {calculateAge(formData.date_of_birth)} years old
                  </p>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-primary-50 dark:bg-primary-900/30 rounded-xl">
                  <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{stats?.currentStreak || 0}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Day Streak</p>
                </div>
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats?.totalCheckIns || 0}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Check-ins</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          <Card className="p-4 text-center">
            <Activity className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.totalVitals || 0}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">Vitals Logged</p>
          </Card>
          <Card className="p-4 text-center">
            <Heart className="w-6 h-6 text-pink-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.totalMedications || 0}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">Medications</p>
          </Card>
          <Card className="p-4 text-center">
            <Activity className="w-6 h-6 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.totalExercises || 0}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">Workouts</p>
          </Card>
          <Card className="p-4 text-center">
            <Calendar className="w-6 h-6 text-primary-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {stats?.memberSince ? new Date(stats.memberSince).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '-'}
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400">Member Since</p>
          </Card>
        </motion.div>

        {/* Personal Information */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary-500" />
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{formData.phone || '-'}</p>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date of Birth
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">
                    {formData.date_of_birth ? formatDate(formData.date_of_birth) : '-'}
                  </p>
                )}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Gender
                </label>
                {isEditing ? (
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select gender</option>
                    {genderOptions.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-900 dark:text-white">{formData.gender || '-'}</p>
                )}
              </div>

              {/* Blood Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Blood Type
                </label>
                {isEditing ? (
                  <select
                    value={formData.blood_type}
                    onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select blood type</option>
                    {bloodTypes.map(bt => (
                      <option key={bt} value={bt}>{bt}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-900 dark:text-white">{formData.blood_type || '-'}</p>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Body Measurements */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-500" />
              Body Measurements
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Height */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Height (cm)
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.height_cm}
                    onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                    placeholder="170"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">
                    {formData.height_cm ? `${formData.height_cm} cm` : '-'}
                  </p>
                )}
              </div>

              {/* Weight */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Weight (kg)
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.weight_kg}
                    onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                    placeholder="70"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">
                    {formData.weight_kg ? `${formData.weight_kg} kg` : '-'}
                  </p>
                )}
              </div>
            </div>

            {/* BMI Calculator */}
            {formData.height_cm && formData.weight_kg && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Body Mass Index (BMI)</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {(parseFloat(formData.weight_kg) / Math.pow(parseFloat(formData.height_cm) / 100, 2)).toFixed(1)}
                    </p>
                  </div>
                  <Badge variant={
                    (() => {
                      const bmi = parseFloat(formData.weight_kg) / Math.pow(parseFloat(formData.height_cm) / 100, 2);
                      if (bmi < 18.5) return 'secondary';
                      if (bmi < 25) return 'success';
                      if (bmi < 30) return 'warning';
                      return 'error';
                    })()
                  }>
                    {(() => {
                      const bmi = parseFloat(formData.weight_kg) / Math.pow(parseFloat(formData.height_cm) / 100, 2);
                      if (bmi < 18.5) return 'Underweight';
                      if (bmi < 25) return 'Normal';
                      if (bmi < 30) return 'Overweight';
                      return 'Obese';
                    })()}
                  </Badge>
                </div>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Emergency Contact */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Emergency Contact
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contact Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.emergency_contact_name}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{formData.emergency_contact_name || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contact Phone
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{formData.emergency_contact_phone || '-'}</p>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Medical Information */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500" />
              Medical Information
            </h3>
            
            <div className="space-y-4">
              {/* Allergies */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Allergies
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    placeholder="Penicillin, Peanuts, Shellfish (comma separated)"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {formData.allergies ? (
                      formData.allergies.split(',').map((allergy, i) => (
                        <Badge key={i} variant="error">{allergy.trim()}</Badge>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-slate-400">No allergies listed</p>
                    )}
                  </div>
                )}
              </div>

              {/* Medical Conditions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Medical Conditions
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.medical_conditions}
                    onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })}
                    placeholder="Diabetes, Hypertension (comma separated)"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {formData.medical_conditions ? (
                      formData.medical_conditions.split(',').map((condition, i) => (
                        <Badge key={i} variant="warning">{condition.trim()}</Badge>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-slate-400">No conditions listed</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </DashboardShell>
  );
}