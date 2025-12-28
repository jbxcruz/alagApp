import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

// Vitals schemas
export const vitalTypes = [
  'blood_pressure', 'heart_rate', 'weight', 'sleep_hours',
  'blood_glucose', 'oxygen_saturation', 'temperature', 'height'
] as const;

export const bloodPressureValueSchema = z.object({
  systolic: z.number().min(60).max(250),
  diastolic: z.number().min(40).max(150),
});

export const singleValueSchema = z.object({
  value: z.number(),
});

export const vitalSchema = z.object({
  vital_type: z.enum(vitalTypes),
  value: z.union([bloodPressureValueSchema, singleValueSchema]),
  notes: z.string().optional(),
  recorded_at: z.string().datetime().optional(),
});

// Medication schemas
export const frequencyTypes = ['daily', 'twice_daily', 'three_times_daily', 'weekly', 'as_needed'] as const;

export const medicationSchema = z.object({
  name: z.string().min(1, 'Medication name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  dosage_unit: z.string().default('mg'),
  frequency: z.enum(frequencyTypes),
  schedule_times: z.array(z.string()).min(1, 'At least one schedule time is required'),
  instructions: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export const medicationLogSchema = z.object({
  medication_id: z.string().uuid(),
  status: z.enum(['taken', 'skipped', 'missed']),
  scheduled_time: z.string(),
  taken_at: z.string().datetime().optional(),
  notes: z.string().optional(),
});

// Nutrition schemas
export const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export const nutritionLogSchema = z.object({
  meal_type: z.enum(mealTypes),
  name: z.string().min(1, 'Meal name is required'),
  description: z.string().optional(),
  calories: z.number().min(0).optional(),
  protein_g: z.number().min(0).optional(),
  carbs_g: z.number().min(0).optional(),
  fat_g: z.number().min(0).optional(),
  fiber_g: z.number().min(0).optional(),
  sugar_g: z.number().min(0).optional(),
  sodium_mg: z.number().min(0).optional(),
});

// Check-in schemas
export const checkInSchema = z.object({
  mood: z.number().min(1).max(5),
  energy: z.number().min(1).max(5),
  symptoms: z.array(z.string()).default([]),
  notes: z.string().nullable().optional().transform(val => val || undefined),
});

// AI schemas
export const aiMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty'),
  conversation_id: z.string().uuid().optional(),
});

// Tip schemas
export const tipCategories = ['food', 'medical', 'quick', 'life', 'fitness'] as const;

export const saveTipSchema = z.object({
  category: z.enum(tipCategories),
  content: z.string().min(1),
  emoji: z.string().optional(),
});

// Types
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type VitalInput = z.infer<typeof vitalSchema>;
export type MedicationInput = z.infer<typeof medicationSchema>;
export type MedicationLogInput = z.infer<typeof medicationLogSchema>;
export type NutritionLogInput = z.infer<typeof nutritionLogSchema>;
export type CheckInInput = z.infer<typeof checkInSchema>;
export type AIMessageInput = z.infer<typeof aiMessageSchema>;
export type SaveTipInput = z.infer<typeof saveTipSchema>;