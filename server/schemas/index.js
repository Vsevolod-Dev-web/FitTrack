import { z } from 'zod';

export const ProfileSchema = z.object({
  name: z.string().min(1),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sex: z.enum(['male', 'female']),
  height: z.number().min(100).max(250),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  currentMode: z.enum(['cutting', 'bulking', 'recomposition']),
  goals: z.object({
    targetWeight: z.number().min(20).max(300),
    targetBodyFat: z.number().min(1).max(70),
    weeklyWeightChange: z.number().min(0).max(2),
  }),
});

export const BodyLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weight: z.number().min(20).max(300),
  bodyFat: z.number().min(1).max(70).optional(),
  measurements: z.object({
    waist: z.number().min(40).max(200).optional(),
    chest: z.number().min(40).max(200).optional(),
    hips: z.number().min(40).max(200).optional(),
    armLeft: z.number().min(10).max(100).optional(),
    armRight: z.number().min(10).max(100).optional(),
    thighLeft: z.number().min(20).max(120).optional(),
    thighRight: z.number().min(20).max(120).optional(),
  }).optional(),
  method: z.enum(['caliper', 'bioimpedance', 'visual']).optional(),
  notes: z.string().optional(),
});

export const NutritionLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  meals: z.array(z.object({
    name: z.string(),
    time: z.string().optional(),
    items: z.array(z.object({
      foodId: z.string().optional(),
      name: z.string(),
      grams: z.number().min(0),
      calories: z.number().min(0),
      protein: z.number().min(0),
      fat: z.number().min(0),
      carbs: z.number().min(0),
    })),
  })),
  water: z.number().min(0).optional(),
  totals: z.object({
    calories: z.number().min(0),
    protein: z.number().min(0),
    fat: z.number().min(0),
    carbs: z.number().min(0),
  }).optional(),
});

export const TrainingLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(['strength', 'cardio', 'hiit', 'stretching']),
  duration: z.number().min(1).max(600),
  exercises: z.array(z.object({
    name: z.string(),
    muscleGroup: z.string().optional(),
    sets: z.array(z.object({
      weight: z.number().min(0),
      reps: z.number().min(0),
      rpe: z.number().min(1).max(10).optional(),
    })),
  })).optional(),
  cardio: z.object({
    type: z.string(),
    distance: z.number().min(0).optional(),
    calories: z.number().min(0).optional(),
  }).optional(),
  notes: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
});

export const FoodItemSchema = z.object({
  name: z.string().min(1),
  per100g: z.object({
    calories: z.number().min(0),
    protein: z.number().min(0),
    fat: z.number().min(0),
    carbs: z.number().min(0),
  }),
  source: z.enum(['custom', 'openfoodfacts']).optional(),
  barcode: z.string().optional(),
});
