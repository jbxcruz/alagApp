'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pill,
  Plus,
  X,
  Loader2,
  Clock,
  Check,
  AlertCircle,
  Calendar,
  ChevronRight,
  TrendingUp,
  Package,
  CheckCircle,
  XCircle,
  SkipForward,
  Trash2,
  Edit,
} from 'lucide-react';
import { DashboardShell } from '@/components/layout';
import { Card, Button, Input, Badge, useToast } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { useAchievements } from '@/contexts/achievements-context';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  time_of_day: string;
  instructions: string | null;
  quantity_remaining: number | null;
  quantity_per_refill: number | null;
  refill_reminder_at: number | null;
  prescribing_doctor: string | null;
  pharmacy: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
}

interface MedicationDose {
  id: string;
  medication_id: string;
  schedule_id: string | null;
  scheduled_at: string;
  taken_at: string | null;
  status: 'pending' | 'taken' | 'skipped' | 'late';
  notes: string | null;
  medication?: Medication;
}

const frequencyOptions = [
  { value: 'once_daily', label: 'Once daily' },
  { value: 'twice_daily', label: 'Twice daily' },
  { value: 'three_times_daily', label: 'Three times daily' },
  { value: 'four_times_daily', label: 'Four times daily' },
  { value: 'every_other_day', label: 'Every other day' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'as_needed', label: 'As needed' },
];

const timeOptions = [
  { value: 'morning', label: 'Morning', time: '08:00' },
  { value: 'afternoon', label: 'Afternoon', time: '12:00' },
  { value: 'evening', label: 'Evening', time: '18:00' },
  { value: 'bedtime', label: 'Bedtime', time: '21:00' },
];

export default function MedicationsPage() {
  const { showToast } = useToast();
  const { checkAchievements } = useAchievements();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [todaysDoses, setTodaysDoses] = useState<MedicationDose[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [activeTab, setActiveTab] = useState<'today' | 'all'>('today');

  // Form state
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('once_daily');
  const [selectedTimes, setSelectedTimes] = useState<string[]>(['morning']);
  const [instructions, setInstructions] = useState('');
  const [quantityRemaining, setQuantityRemaining] = useState('');
  const [doctor, setDoctor] = useState('');
  const [pharmacy, setPharmacy] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    await Promise.all([fetchMedications(), fetchTodaysDoses()]);
    setIsLoading(false);
  };

  const fetchMedications = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMedications(data);
    }
  };

  const fetchTodaysDoses = async () => {
    const supabase = createClient();
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('medication_doses')
      .select(`
        *,
        medication:medications(*)
      `)
      .gte('scheduled_at', `${today}T00:00:00`)
      .lte('scheduled_at', `${today}T23:59:59`)
      .order('scheduled_at', { ascending: true });

    if (!error && data) {
      setTodaysDoses(data.map((d: any) => ({
        ...d,
        medication: d.medication,
      })));
    }
  };

  const handleSave = async () => {
    if (!name || !dosage) {
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

    const medicationData = {
      user_id: user.id,
      name,
      dosage,
      frequency,
      time_of_day: selectedTimes.join(','),
      instructions: instructions || null,
      quantity_remaining: quantityRemaining ? parseInt(quantityRemaining) : null,
      refill_reminder_at: quantityRemaining ? 10 : null,
      prescribing_doctor: doctor || null,
      pharmacy: pharmacy || null,
      is_active: true,
    };

    let error;
    if (isEditing && selectedMedication) {
      const { error: updateError } = await supabase
        .from('medications')
        .update(medicationData)
        .eq('id', selectedMedication.id);
      error = updateError;
    } else {
      const { data: newMed, error: insertError } = await supabase
        .from('medications')
        .insert(medicationData)
        .select()
        .single();
      error = insertError;

      // Create schedules for the medication
      if (!error && newMed) {
        await createSchedulesAndDoses(newMed.id, user.id, selectedTimes);
      }
    }

    if (error) {
      showToast('error', 'Failed to save medication');
    } else {
      showToast('success', isEditing ? 'Medication updated!' : 'Medication added!');
      setShowAddModal(false);
      resetForm();
      fetchData();
      if (!isEditing) {
        setTimeout(() => checkAchievements(), 500);
      }
    }
    setIsSaving(false);
  };

  const createSchedulesAndDoses = async (medicationId: string, userId: string, times: string[]) => {
    const supabase = createClient();
    const today = new Date();
    
    for (const timeSlot of times) {
      const timeOption = timeOptions.find(t => t.value === timeSlot);
      if (!timeOption) continue;

      // Create schedule
      const { data: schedule } = await supabase
        .from('medication_schedules')
        .insert({
          medication_id: medicationId,
          user_id: userId,
          time_of_day: timeOption.time,
          days_of_week: [0, 1, 2, 3, 4, 5, 6],
          is_active: true,
        })
        .select()
        .single();

      if (schedule) {
        // Create today's dose
        const scheduledAt = new Date(today);
        const [hours, minutes] = timeOption.time.split(':');
        scheduledAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        await supabase.from('medication_doses').insert({
          medication_id: medicationId,
          schedule_id: schedule.id,
          user_id: userId,
          scheduled_at: scheduledAt.toISOString(),
          status: 'pending',
        });
      }
    }
  };

  const handleTakeDose = async (dose: MedicationDose) => {
    const supabase = createClient();
    const now = new Date();
    const scheduledTime = new Date(dose.scheduled_at);
    const isLate = now.getTime() - scheduledTime.getTime() > 30 * 60 * 1000;

    const { error } = await supabase
      .from('medication_doses')
      .update({
        status: isLate ? 'late' : 'taken',
        taken_at: now.toISOString(),
      })
      .eq('id', dose.id);

    if (!error) {
      showToast('success', 'Dose marked as taken');
      fetchTodaysDoses();
      setTimeout(() => checkAchievements(), 500);

      if (dose.medication?.quantity_remaining) {
        await supabase
          .from('medications')
          .update({ quantity_remaining: dose.medication.quantity_remaining - 1 })
          .eq('id', dose.medication_id);
        fetchMedications();
      }
    }
  };

  const handleSkipDose = async (dose: MedicationDose) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('medication_doses')
      .update({ status: 'skipped' })
      .eq('id', dose.id);

    if (!error) {
      showToast('info', 'Dose skipped');
      fetchTodaysDoses();
    }
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('medications').delete().eq('id', id);
    if (!error) {
      showToast('success', 'Medication deleted');
      setMedications(medications.filter(m => m.id !== id));
      setShowDetailModal(false);
    }
  };

  const handleToggleActive = async (medication: Medication) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('medications')
      .update({ is_active: !medication.is_active })
      .eq('id', medication.id);

    if (!error) {
      showToast('success', medication.is_active ? 'Medication deactivated' : 'Medication activated');
      fetchMedications();
    }
  };

  const openEditModal = (medication: Medication) => {
    setSelectedMedication(medication);
    setName(medication.name);
    setDosage(medication.dosage);
    setFrequency(medication.frequency);
    setSelectedTimes(medication.time_of_day?.split(',') || ['morning']);
    setInstructions(medication.instructions || '');
    setQuantityRemaining(medication.quantity_remaining?.toString() || '');
    setDoctor(medication.prescribing_doctor || '');
    setPharmacy(medication.pharmacy || '');
    setIsEditing(true);
    setShowAddModal(true);
  };

  const resetForm = () => {
    setName('');
    setDosage('');
    setFrequency('once_daily');
    setSelectedTimes(['morning']);
    setInstructions('');
    setQuantityRemaining('');
    setDoctor('');
    setPharmacy('');
    setIsEditing(false);
    setSelectedMedication(null);
  };

  const toggleTime = (time: string) => {
    setSelectedTimes(prev =>
      prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time]
    );
  };

  const calculateAdherence = () => {
    const takenOrLate = todaysDoses.filter(d => d.status === 'taken' || d.status === 'late').length;
    const total = todaysDoses.length;
    return total > 0 ? Math.round((takenOrLate / total) * 100) : 100;
  };

  const activeMedications = medications.filter(m => m.is_active);
  const completedDoses = todaysDoses.filter(d => d.status === 'taken' || d.status === 'late');
  const lowStockMedications = medications.filter(m => 
    m.quantity_remaining !== null && 
    m.refill_reminder_at !== null && 
    m.quantity_remaining <= m.refill_reminder_at
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'taken': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'late': return <CheckCircle className="w-5 h-5 text-yellow-500" />;
      case 'skipped': return <XCircle className="w-5 h-5 text-gray-400 dark:text-slate-500" />;
      default: return <Clock className="w-5 h-5 text-blue-500" />;
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Medications</h1>
            <p className="text-gray-500 mt-1">Manage your medications and track doses</p>
          </div>
          <Button onClick={() => { resetForm(); setShowAddModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Medication
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                <Pill className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeMedications.length}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Active Meds</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {completedDoses.length}/{todaysDoses.length}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Today&apos;s Doses</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className={cn(
                  "text-2xl font-bold",
                  calculateAdherence() >= 90 ? "text-green-500" :
                  calculateAdherence() >= 70 ? "text-yellow-500" : "text-red-500"
                )}>
                  {calculateAdherence()}%
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Adherence</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                lowStockMedications.length > 0 ? "bg-orange-50 dark:bg-orange-900/20" : "bg-gray-50 dark:bg-slate-700"
              )}>
                <Package className={cn(
                  "w-5 h-5",
                  lowStockMedications.length > 0 ? "text-orange-500" : "text-gray-400 dark:text-slate-500"
                )} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{lowStockMedications.length}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Need Refill</p>
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
            Today&apos;s Schedule
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              activeTab === 'all' ? "bg-primary-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            All Medications
          </button>
        </motion.div>

        {/* Content */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
          ) : activeTab === 'today' ? (
            <Card className="p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Today&apos;s Medication Schedule</h2>
              {todaysDoses.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-gray-400 dark:text-slate-500" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">No doses scheduled</h3>
                  <p className="text-gray-500 dark:text-slate-400 mb-4">Add medications to see your daily schedule</p>
                  <Button onClick={() => setShowAddModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Medication
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {todaysDoses.map((dose) => (
                    <div
                      key={dose.id}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl transition-colors",
                        dose.status === 'pending' ? "bg-blue-50 dark:bg-blue-900/20" :
                        dose.status === 'taken' ? "bg-green-50 dark:bg-green-900/20" :
                        dose.status === 'late' ? "bg-yellow-50 dark:bg-yellow-900/20" :
                        "bg-gray-50 dark:bg-slate-700"
                      )}
                    >
                      {getStatusIcon(dose.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {dose.medication?.name || 'Unknown'}
                          </h3>
                          <Badge variant="secondary" className="text-xs">
                            {dose.medication?.dosage}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          {formatTime(dose.scheduled_at)}
                          {dose.status === 'taken' && dose.taken_at && (
                            <span className="text-green-600">
                              • Taken at {formatTime(dose.taken_at)}
                            </span>
                          )}
                          {dose.status === 'late' && (
                            <span className="text-yellow-600">• Taken late</span>
                          )}
                          {dose.status === 'skipped' && (
                            <span className="text-gray-400 dark:text-slate-500">• Skipped</span>
                          )}
                        </div>
                      </div>
                      {dose.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <Button size="sm" onClick={() => handleTakeDose(dose)}>
                            <Check className="w-4 h-4 mr-1" />
                            Take
                          </Button>
                          <button
                            onClick={() => handleSkipDose(dose)}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Skip dose"
                          >
                            <SkipForward className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ) : (
            <Card className="divide-y divide-gray-100 dark:divide-slate-700">
              {medications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Pill className="w-8 h-8 text-gray-400 dark:text-slate-500" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">No medications</h3>
                  <p className="text-gray-500 dark:text-slate-400 mb-4">Add your first medication to get started</p>
                  <Button onClick={() => setShowAddModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Medication
                  </Button>
                </div>
              ) : (
                medications.map((medication) => (
                  <div
                    key={medication.id}
                    className={cn(
                      "p-4 flex items-center justify-between hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors cursor-pointer",
                      !medication.is_active && "opacity-60"
                    )}
                    onClick={() => { setSelectedMedication(medication); setShowDetailModal(true); }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        medication.is_active ? "bg-primary-50 dark:bg-primary-900/20" : "bg-gray-100 dark:bg-slate-700"
                      )}>
                        <Pill className={cn(
                          "w-6 h-6",
                          medication.is_active ? "text-primary-500" : "text-gray-400 dark:text-slate-500"
                        )} />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{medication.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400">{medication.dosage} • {medication.frequency.replace(/_/g, ' ')}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {medication.time_of_day && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {medication.time_of_day.split(',').join(', ')}
                            </span>
                          )}
                          {medication.quantity_remaining !== null && (
                            <span className={cn(
                              "text-xs flex items-center gap-1",
                              medication.quantity_remaining <= (medication.refill_reminder_at || 10)
                                ? "text-orange-500"
                                : "text-gray-400 dark:text-slate-500"
                            )}>
                              <Package className="w-3 h-3" />
                              {medication.quantity_remaining} left
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={medication.is_active ? "success" : "secondary"}>
                        {medication.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <ChevronRight className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                    </div>
                  </div>
                ))
              )}
            </Card>
          )}
        </motion.div>

        {/* Low Stock Alert */}
        {lowStockMedications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-4 bg-orange-50 border-orange-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
                <div>
                  <h3 className="font-medium text-orange-800">Refill Reminder</h3>
                  <p className="text-sm text-orange-600 mt-1">
                    {lowStockMedications.map(m => m.name).join(', ')} {lowStockMedications.length === 1 ? 'is' : 'are'} running low.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Add/Edit Modal */}
        <AnimatePresence>
          {showAddModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-50"
                onClick={() => { setShowAddModal(false); resetForm(); }}
              />
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="w-full max-w-lg bg-white dark:bg-[#131C2E] rounded-2xl shadow-xl flex flex-col max-h-[80vh] pointer-events-auto"
                >
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#293548]">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {isEditing ? 'Edit Medication' : 'Add Medication'}
                  </h2>
                  <button onClick={() => { setShowAddModal(false); resetForm(); }} className="p-2 hover:bg-gray-100 dark:hover:bg-[#1A2742] rounded-lg text-gray-500 dark:text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Medication Name *</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Vitamin D"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Dosage *</label>
                    <Input
                      value={dosage}
                      onChange={(e) => setDosage(e.target.value)}
                      placeholder="e.g., 1000 IU, 500mg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Frequency</label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-[#293548] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-[#1A2742] text-gray-900 dark:text-white"
                    >
                      {frequencyOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Time of Day</label>
                    <div className="grid grid-cols-2 gap-2">
                      {timeOptions.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => toggleTime(opt.value)}
                          className={cn(
                            "p-3 rounded-xl border-2 text-sm font-medium transition-all",
                            selectedTimes.includes(opt.value)
                              ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
                              : "border-gray-200 dark:border-[#293548] hover:border-gray-300 dark:hover:border-[#3B4A63] text-gray-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-sky-900/20"
                          )}
                        >
                          {opt.label}
                          <span className="block text-xs text-gray-400 dark:text-slate-500 mt-0.5">{opt.time}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Instructions (optional)</label>
                    <Input
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="e.g., Take with food"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Quantity Remaining (optional)</label>
                    <Input
                      type="number"
                      value={quantityRemaining}
                      onChange={(e) => setQuantityRemaining(e.target.value)}
                      placeholder="e.g., 30"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Doctor (optional)</label>
                      <Input
                        value={doctor}
                        onChange={(e) => setDoctor(e.target.value)}
                        placeholder="Dr. Smith"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Pharmacy (optional)</label>
                      <Input
                        value={pharmacy}
                        onChange={(e) => setPharmacy(e.target.value)}
                        placeholder="CVS"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-[#293548] bg-gray-50 dark:bg-[#0B1120] rounded-b-2xl">
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => { setShowAddModal(false); resetForm(); }}>
                      Cancel
                    </Button>
                    <Button className="flex-1" onClick={handleSave} disabled={isSaving || !name || !dosage}>
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        isEditing ? 'Update' : 'Add Medication'
                      )}
                    </Button>
                  </div>
                </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>

        {/* Detail Modal */}
        <AnimatePresence>
          {showDetailModal && selectedMedication && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-50"
                onClick={() => setShowDetailModal(false)}
              />
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="w-full max-w-md bg-white dark:bg-[#131C2E] rounded-2xl shadow-xl pointer-events-auto"
                >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-14 h-14 rounded-xl flex items-center justify-center",
                      selectedMedication.is_active ? "bg-primary-50 dark:bg-primary-900/20" : "bg-gray-100 dark:bg-slate-700"
                    )}>
                      <Pill className={cn(
                        "w-7 h-7",
                        selectedMedication.is_active ? "text-primary-500" : "text-gray-400 dark:text-slate-500"
                      )} />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedMedication.name}</h2>
                      <p className="text-gray-500 dark:text-slate-400">{selectedMedication.dosage}</p>
                    </div>
                    <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-[#1A2742] rounded-lg text-gray-500 dark:text-slate-400">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="flex justify-between py-2 border-b border-gray-200 dark:border-[#293548]">
                      <span className="text-gray-500 dark:text-slate-400">Frequency</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedMedication.frequency.replace(/_/g, ' ')}</span>
                    </div>
                    {selectedMedication.time_of_day && (
                      <div className="flex justify-between py-2 border-b border-gray-200 dark:border-[#293548]">
                        <span className="text-gray-500 dark:text-slate-400">Time</span>
                        <span className="font-medium text-gray-900 dark:text-white capitalize">{selectedMedication.time_of_day.split(',').join(', ')}</span>
                      </div>
                    )}
                    {selectedMedication.instructions && (
                      <div className="flex justify-between py-2 border-b border-gray-200 dark:border-[#293548]">
                        <span className="text-gray-500 dark:text-slate-400">Instructions</span>
                        <span className="font-medium text-gray-900 dark:text-white">{selectedMedication.instructions}</span>
                      </div>
                    )}
                    {selectedMedication.quantity_remaining !== null && (
                      <div className="flex justify-between py-2 border-b border-gray-200 dark:border-[#293548]">
                        <span className="text-gray-500 dark:text-slate-400">Quantity Left</span>
                        <span className={cn(
                          "font-medium",
                          selectedMedication.quantity_remaining <= 10 ? "text-orange-500" : "text-gray-900 dark:text-white"
                        )}>
                          {selectedMedication.quantity_remaining}
                        </span>
                      </div>
                    )}
                    {selectedMedication.prescribing_doctor && (
                      <div className="flex justify-between py-2 border-b border-gray-200 dark:border-[#293548]">
                        <span className="text-gray-500 dark:text-slate-400">Doctor</span>
                        <span className="font-medium text-gray-900 dark:text-white">{selectedMedication.prescribing_doctor}</span>
                      </div>
                    )}
                    {selectedMedication.pharmacy && (
                      <div className="flex justify-between py-2 border-b border-gray-200 dark:border-[#293548]">
                        <span className="text-gray-500 dark:text-slate-400">Pharmacy</span>
                        <span className="font-medium text-gray-900 dark:text-white">{selectedMedication.pharmacy}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500 dark:text-slate-400">Status</span>
                      <Badge variant={selectedMedication.is_active ? "success" : "secondary"}>
                        {selectedMedication.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-2">
                    <Button onClick={() => { setShowDetailModal(false); openEditModal(selectedMedication); }}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Medication
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleToggleActive(selectedMedication)}
                    >
                      {selectedMedication.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="outline"
                      className="text-red-500 hover:bg-red-50 dark:bg-red-900/20"
                      onClick={() => handleDelete(selectedMedication.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
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