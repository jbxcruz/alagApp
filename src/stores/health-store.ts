import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';

interface Vital {
  id: string;
  vital_type: string;
  value: Record<string, number>;
  notes?: string;
  recorded_at: string;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  schedule_times: string[];
  is_active: boolean;
}

interface MedicationLog {
  id: string;
  medication_id: string;
  status: 'taken' | 'skipped' | 'missed';
  scheduled_time: string;
  log_date: string;
}

interface NutritionLog {
  id: string;
  meal_type: string;
  name: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  logged_at: string;
}

interface CheckIn {
  id: string;
  mood: number;
  energy: number;
  symptoms: string[];
  notes?: string;
  check_in_date: string;
}

interface HealthState {
  vitals: Vital[];
  medications: Medication[];
  medicationLogs: MedicationLog[];
  nutritionLogs: NutritionLog[];
  checkIns: CheckIn[];
  isLoading: boolean;
  
  // Vitals actions
  fetchVitals: (limit?: number) => Promise<void>;
  addVital: (vital: Omit<Vital, 'id'>) => Promise<void>;
  
  // Medications actions
  fetchMedications: () => Promise<void>;
  addMedication: (med: Omit<Medication, 'id'>) => Promise<void>;
  toggleMedicationActive: (id: string) => Promise<void>;
  
  // Medication logs actions
  fetchTodayMedicationLogs: () => Promise<void>;
  logMedication: (log: Omit<MedicationLog, 'id'>) => Promise<void>;
  
  // Nutrition actions
  fetchNutritionLogs: (date?: string) => Promise<void>;
  addNutritionLog: (log: Omit<NutritionLog, 'id'>) => Promise<void>;
  
  // Check-in actions
  fetchCheckIns: (limit?: number) => Promise<void>;
  addCheckIn: (checkIn: Omit<CheckIn, 'id'>) => Promise<void>;
  getTodayCheckIn: () => CheckIn | undefined;
}

export const useHealthStore = create<HealthState>((set, get) => ({
  vitals: [],
  medications: [],
  medicationLogs: [],
  nutritionLogs: [],
  checkIns: [],
  isLoading: false,

  // Vitals
  fetchVitals: async (limit = 20) => {
    set({ isLoading: true });
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('vitals')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(limit);
    
    if (!error && data) {
      set({ vitals: data });
    }
    set({ isLoading: false });
  },

  addVital: async (vital) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;
    
    const { data, error } = await supabase
      .from('vitals')
      .insert({ ...vital, user_id: user.id })
      .select()
      .single();
    
    if (!error && data) {
      set((state) => ({ vitals: [data, ...state.vitals] }));
    }
  },

  // Medications
  fetchMedications: async () => {
    set({ isLoading: true });
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      set({ medications: data });
    }
    set({ isLoading: false });
  },

  addMedication: async (med) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;
    
    const { data, error } = await supabase
      .from('medications')
      .insert({ ...med, user_id: user.id })
      .select()
      .single();
    
    if (!error && data) {
      set((state) => ({ medications: [data, ...state.medications] }));
    }
  },

  toggleMedicationActive: async (id) => {
    const supabase = createClient();
    const med = get().medications.find((m) => m.id === id);
    
    if (!med) return;
    
    const { error } = await supabase
      .from('medications')
      .update({ is_active: !med.is_active })
      .eq('id', id);
    
    if (!error) {
      set((state) => ({
        medications: state.medications.map((m) =>
          m.id === id ? { ...m, is_active: !m.is_active } : m
        ),
      }));
    }
  },

  // Medication logs
  fetchTodayMedicationLogs: async () => {
    const supabase = createClient();
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('medication_logs')
      .select('*')
      .eq('log_date', today);
    
    if (!error && data) {
      set({ medicationLogs: data });
    }
  },

  logMedication: async (log) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;
    
    const { data, error } = await supabase
      .from('medication_logs')
      .insert({ ...log, user_id: user.id })
      .select()
      .single();
    
    if (!error && data) {
      set((state) => ({ medicationLogs: [...state.medicationLogs, data] }));
    }
  },

  // Nutrition
  fetchNutritionLogs: async (date) => {
    set({ isLoading: true });
    const supabase = createClient();
    
    let query = supabase
      .from('nutrition_logs')
      .select('*')
      .order('logged_at', { ascending: false });
    
    if (date) {
      query = query.gte('logged_at', `${date}T00:00:00`).lte('logged_at', `${date}T23:59:59`);
    } else {
      query = query.limit(20);
    }
    
    const { data, error } = await query;
    
    if (!error && data) {
      set({ nutritionLogs: data });
    }
    set({ isLoading: false });
  },

  addNutritionLog: async (log) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;
    
    const { data, error } = await supabase
      .from('nutrition_logs')
      .insert({ ...log, user_id: user.id })
      .select()
      .single();
    
    if (!error && data) {
      set((state) => ({ nutritionLogs: [data, ...state.nutritionLogs] }));
    }
  },

  // Check-ins
  fetchCheckIns: async (limit = 7) => {
    set({ isLoading: true });
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('check_ins')
      .select('*')
      .order('check_in_date', { ascending: false })
      .limit(limit);
    
    if (!error && data) {
      set({ checkIns: data });
    }
    set({ isLoading: false });
  },

  addCheckIn: async (checkIn) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;
    
    const { data, error } = await supabase
      .from('check_ins')
      .insert({ ...checkIn, user_id: user.id })
      .select()
      .single();
    
    if (!error && data) {
      set((state) => ({ checkIns: [data, ...state.checkIns] }));
    }
  },

  getTodayCheckIn: () => {
    const today = new Date().toISOString().split('T')[0];
    return get().checkIns.find((c) => c.check_in_date === today);
  },
}));