
-- AlagApp Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  height_cm DECIMAL(5,2),
  
  -- Preferences
  units_weight TEXT DEFAULT 'kg' CHECK (units_weight IN ('kg', 'lbs')),
  units_height TEXT DEFAULT 'cm' CHECK (units_height IN ('cm', 'ft')),
  units_temperature TEXT DEFAULT 'celsius' CHECK (units_temperature IN ('celsius', 'fahrenheit')),
  units_glucose TEXT DEFAULT 'mg/dL' CHECK (units_glucose IN ('mg/dL', 'mmol/L')),
  
  -- Notifications
  notify_medications BOOLEAN DEFAULT true,
  notify_checkins BOOLEAN DEFAULT true,
  notify_tips BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VITALS TABLE
-- ============================================
CREATE TABLE public.vitals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  vital_type TEXT NOT NULL CHECK (vital_type IN (
    'blood_pressure', 'heart_rate', 'weight', 'sleep_hours',
    'blood_glucose', 'oxygen_saturation', 'temperature', 'height'
  )),
  
  -- Values (using JSONB for flexibility with different vital types)
  value JSONB NOT NULL,
  -- Examples:
  -- blood_pressure: {"systolic": 120, "diastolic": 80}
  -- heart_rate: {"value": 72}
  -- weight: {"value": 70.5}
  -- sleep_hours: {"value": 7.5}
  
  notes TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vitals_user_id ON public.vitals(user_id);
CREATE INDEX idx_vitals_type ON public.vitals(vital_type);
CREATE INDEX idx_vitals_recorded_at ON public.vitals(recorded_at DESC);

-- ============================================
-- MEDICATIONS TABLE
-- ============================================
CREATE TABLE public.medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  dosage_unit TEXT DEFAULT 'mg',
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'twice_daily', 'three_times_daily', 'weekly', 'as_needed')),
  
  -- Schedule times (array of times like ["08:00", "20:00"])
  schedule_times TEXT[] DEFAULT ARRAY['08:00'],
  
  instructions TEXT,
  is_active BOOLEAN DEFAULT true,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_medications_user_id ON public.medications(user_id);
CREATE INDEX idx_medications_active ON public.medications(is_active);

-- ============================================
-- MEDICATION LOGS TABLE
-- ============================================
CREATE TABLE public.medication_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  
  status TEXT NOT NULL CHECK (status IN ('taken', 'skipped', 'missed')),
  scheduled_time TIME NOT NULL,
  taken_at TIMESTAMPTZ,
  notes TEXT,
  
  log_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_medication_logs_user_id ON public.medication_logs(user_id);
CREATE INDEX idx_medication_logs_date ON public.medication_logs(log_date DESC);

-- ============================================
-- NUTRITION LOGS TABLE
-- ============================================
CREATE TABLE public.nutrition_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  name TEXT NOT NULL,
  description TEXT,
  
  -- Nutritional info
  calories INTEGER,
  protein_g DECIMAL(6,2),
  carbs_g DECIMAL(6,2),
  fat_g DECIMAL(6,2),
  fiber_g DECIMAL(6,2),
  sugar_g DECIMAL(6,2),
  sodium_mg DECIMAL(8,2),
  
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nutrition_logs_user_id ON public.nutrition_logs(user_id);
CREATE INDEX idx_nutrition_logs_date ON public.nutrition_logs(logged_at DESC);

-- ============================================
-- CHECK-INS TABLE
-- ============================================
CREATE TABLE public.check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 5),
  energy INTEGER NOT NULL CHECK (energy >= 1 AND energy <= 5),
  symptoms TEXT[] DEFAULT ARRAY[]::TEXT[],
  notes TEXT,
  
  check_in_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_check_ins_user_id ON public.check_ins(user_id);
CREATE INDEX idx_check_ins_date ON public.check_ins(check_in_date DESC);
-- Ensure one check-in per day per user
CREATE UNIQUE INDEX idx_check_ins_unique_daily ON public.check_ins(user_id, check_in_date);

-- ============================================
-- AI CONVERSATIONS TABLE
-- ============================================
CREATE TABLE public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_conversations_user_id ON public.ai_conversations(user_id);

-- ============================================
-- AI MESSAGES TABLE
-- ============================================
CREATE TABLE public.ai_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);

-- ============================================
-- SAVED TIPS TABLE
-- ============================================
CREATE TABLE public.saved_tips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  category TEXT NOT NULL CHECK (category IN ('food', 'medical', 'quick', 'life', 'fitness')),
  content TEXT NOT NULL,
  emoji TEXT,
  
  saved_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_saved_tips_user_id ON public.saved_tips(user_id);

-- ============================================
-- EMERGENCY CARD TABLE
-- ============================================
CREATE TABLE public.emergency_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  blood_type TEXT,
  allergies TEXT[] DEFAULT ARRAY[]::TEXT[],
  conditions TEXT[] DEFAULT ARRAY[]::TEXT[],
  medications TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relation TEXT,
  
  doctor_name TEXT,
  doctor_phone TEXT,
  
  additional_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_cards ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Vitals policies
CREATE POLICY "Users can view own vitals" ON public.vitals
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own vitals" ON public.vitals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own vitals" ON public.vitals
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own vitals" ON public.vitals
  FOR DELETE USING (auth.uid() = user_id);

-- Medications policies
CREATE POLICY "Users can view own medications" ON public.medications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own medications" ON public.medications
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own medications" ON public.medications
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own medications" ON public.medications
  FOR DELETE USING (auth.uid() = user_id);

-- Medication logs policies
CREATE POLICY "Users can view own medication logs" ON public.medication_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own medication logs" ON public.medication_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own medication logs" ON public.medication_logs
  FOR UPDATE USING (auth.uid() = user_id);

-- Nutrition logs policies
CREATE POLICY "Users can view own nutrition logs" ON public.nutrition_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own nutrition logs" ON public.nutrition_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own nutrition logs" ON public.nutrition_logs
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own nutrition logs" ON public.nutrition_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Check-ins policies
CREATE POLICY "Users can view own check-ins" ON public.check_ins
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own check-ins" ON public.check_ins
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own check-ins" ON public.check_ins
  FOR UPDATE USING (auth.uid() = user_id);

-- AI conversations policies
CREATE POLICY "Users can view own conversations" ON public.ai_conversations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own conversations" ON public.ai_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own conversations" ON public.ai_conversations
  FOR DELETE USING (auth.uid() = user_id);

-- AI messages policies (through conversation ownership)
CREATE POLICY "Users can view messages in own conversations" ON public.ai_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.ai_conversations WHERE id = conversation_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can insert messages in own conversations" ON public.ai_messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.ai_conversations WHERE id = conversation_id AND user_id = auth.uid())
  );

-- Saved tips policies
CREATE POLICY "Users can view own saved tips" ON public.saved_tips
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved tips" ON public.saved_tips
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved tips" ON public.saved_tips
  FOR DELETE USING (auth.uid() = user_id);

-- Emergency cards policies
CREATE POLICY "Users can view own emergency card" ON public.emergency_cards
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own emergency card" ON public.emergency_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own emergency card" ON public.emergency_cards
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_medications_updated_at
  BEFORE UPDATE ON public.medications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_emergency_cards_updated_at
  BEFORE UPDATE ON public.emergency_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();