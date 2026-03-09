// BMR — формула Миффлина-Сан Жеора
export function calcBMR(weightKg, heightCm, age, sex) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(sex === 'male' ? base + 5 : base - 161);
}

// TDEE
const ACTIVITY_COEFFICIENTS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function calcTDEE(bmr, activityLevel) {
  return Math.round(bmr * (ACTIVITY_COEFFICIENTS[activityLevel] ?? 1.2));
}

// Целевые калории
const MODE_ADJUSTMENTS = {
  cutting:       { moderate: -300, standard: -500, aggressive: -750 },
  bulking:       { moderate: 200,  standard: 300,  aggressive: 500  },
  recomposition: { moderate: -100, standard: 0,    aggressive: 100  },
};

export function calcTargetCalories(tdee, mode, intensity = 'standard') {
  const adj = MODE_ADJUSTMENTS[mode]?.[intensity] ?? 0;
  return Math.round(tdee + adj);
}

// Макросы (на основе целевых калорий и сухой массы)
export function calcMacros(targetCalories, leanMassKg, weightKg) {
  const protein = Math.round(2.2 * leanMassKg);
  const fat = Math.round(0.9 * weightKg);
  const proteinCals = protein * 4;
  const fatCals = fat * 9;
  const carbCals = Math.max(0, targetCalories - proteinCals - fatCals);
  const carbs = Math.round(carbCals / 4);
  return { protein, fat, carbs };
}

// 1RM estimate (формула Brzycki)
export function calc1RM(weight, reps) {
  if (reps === 1) return weight;
  return Math.round(weight * (36 / (37 - reps)));
}

// Тоннаж
export function calcVolume(sets) {
  return sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
}

// Сухая масса и жировая масса
export function calcBodyComposition(weightKg, bodyFatPct) {
  const fatMass = Math.round((weightKg * bodyFatPct) / 100 * 10) / 10;
  const leanMass = Math.round((weightKg - fatMass) * 10) / 10;
  return { fatMass, leanMass };
}

// Линейная экстраполяция (прогноз цели)
export function calcWeeksToGoal(currentWeight, targetWeight, weeklyChange) {
  if (!weeklyChange || weeklyChange === 0) return null;
  const delta = targetWeight - currentWeight;
  const weeks = Math.abs(delta / weeklyChange);
  return Math.round(weeks);
}
