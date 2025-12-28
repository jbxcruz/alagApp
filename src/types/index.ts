export type VitalType = 
  | 'blood_pressure'
  | 'heart_rate'
  | 'weight'
  | 'sleep_hours'
  | 'blood_glucose'
  | 'oxygen_saturation'
  | 'temperature';

export type TipCategory = 'food' | 'medical' | 'quick' | 'life' | 'fitness';

export interface HealthTip {
  category: TipCategory;
  content: string;
  emoji: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  time: string;
  taken: boolean;
}

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: Date;
}
