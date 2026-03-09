// ─── Константы ───────────────────────────────────────────────────────────────

export const ACTIVITY_COEFFICIENTS = {
  sedentary:  1.2,
  light:      1.375,
  moderate:   1.55,
  active:     1.725,
  very_active: 1.9,
};

export const MODE_ADJUSTMENTS = {
  cutting:       { moderate: -300, standard: -500, aggressive: -750 },
  bulking:       { moderate: 200,  standard: 300,  aggressive: 500  },
  recomposition: { moderate: -100, standard: 0,    aggressive: 100  },
};

// Г/кг сухой массы для белка по режиму
export const PROTEIN_RATIO = {
  cutting:       2.2,
  bulking:       2.2,
  recomposition: 2.6, // среднее из диапазона 2.4–2.8 (ТЗ §5.3)
};

// ─── BMR (Миффлин-Сан Жеор) ──────────────────────────────────────────────────
/**
 * Базовый метаболизм.
 * Мужчины: 10×weight + 6.25×height − 5×age + 5
 * Женщины: 10×weight + 6.25×height − 5×age − 161
 */
export function calcBMR(weightKg, heightCm, age, sex) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(sex === 'male' ? base + 5 : base - 161);
}

// ─── TDEE ─────────────────────────────────────────────────────────────────────
/** Суточные энергозатраты = BMR × коэффициент активности */
export function calcTDEE(bmr, activityLevel) {
  const coef = ACTIVITY_COEFFICIENTS[activityLevel] ?? ACTIVITY_COEFFICIENTS.sedentary;
  return Math.round(bmr * coef);
}

// ─── Целевые калории ──────────────────────────────────────────────────────────
/**
 * @param {'cutting'|'bulking'|'recomposition'} mode
 * @param {'moderate'|'standard'|'aggressive'} intensity
 */
export function calcTargetCalories(tdee, mode, intensity = 'standard') {
  const adj = MODE_ADJUSTMENTS[mode]?.[intensity] ?? 0;
  return Math.round(tdee + adj);
}

// ─── Калории для режима рекомпозиции (цикличность) ───────────────────────────
/**
 * Тренировочный день → TDEE + 100
 * День отдыха        → TDEE − 200
 */
export function calcRecompCalories(tdee, isTrainingDay) {
  return isTrainingDay ? Math.round(tdee + 100) : Math.round(tdee - 200);
}

// ─── Состав тела ─────────────────────────────────────────────────────────────
/** Жировая масса, кг */
export function calcFatMass(weightKg, bodyFatPct) {
  return Math.round((weightKg * bodyFatPct) / 100 * 10) / 10;
}

/** Сухая (мышечная) масса, кг */
export function calcLeanMass(weightKg, bodyFatPct) {
  const fat = calcFatMass(weightKg, bodyFatPct);
  return Math.round((weightKg - fat) * 10) / 10;
}

/** @returns {{ fatMass: number, leanMass: number }} */
export function calcBodyComposition(weightKg, bodyFatPct) {
  return {
    fatMass:  calcFatMass(weightKg, bodyFatPct),
    leanMass: calcLeanMass(weightKg, bodyFatPct),
  };
}

// ─── Макросы ─────────────────────────────────────────────────────────────────
/**
 * Белок:   PROTEIN_RATIO[mode] г × сухая масса
 * Жиры:    0.9 г × вес тела
 * Углеводы: остаток калорий / 4
 *
 * @returns {{ protein: number, fat: number, carbs: number }}
 */
export function calcMacros(targetCalories, leanMassKg, weightKg, mode = 'cutting') {
  const proteinRatio = PROTEIN_RATIO[mode] ?? PROTEIN_RATIO.cutting;
  const protein = Math.round(proteinRatio * leanMassKg);
  const fat     = Math.round(0.9 * weightKg);
  const proteinCals = protein * 4;
  const fatCals     = fat * 9;
  const carbCals    = Math.max(0, targetCalories - proteinCals - fatCals);
  const carbs       = Math.round(carbCals / 4);
  return { protein, fat, carbs };
}

// ─── 1RM (Brzycki) ───────────────────────────────────────────────────────────
/**
 * Оценка одноповторного максимума.
 * 1RM = weight × (36 / (37 − reps))
 * При reps ≥ 37 формула даёт ∞ → возвращаем null (недопустимый ввод).
 */
export function calc1RM(weight, reps) {
  if (reps <= 0 || weight <= 0) return null;
  if (reps === 1) return weight;
  if (reps >= 37) return null;
  return Math.round(weight * (36 / (37 - reps)));
}

// ─── Тоннаж ──────────────────────────────────────────────────────────────────
/** Суммарный объём нагрузки: Σ(weight × reps) */
export function calcVolume(sets) {
  if (!Array.isArray(sets)) return 0;
  return sets.reduce((sum, s) => sum + (s.weight ?? 0) * (s.reps ?? 0), 0);
}

// ─── Прогноз достижения цели ─────────────────────────────────────────────────
/**
 * Линейная экстраполяция: сколько недель нужно при текущем темпе.
 * @returns {number|null} недель, или null если темп = 0
 */
export function calcWeeksToGoal(currentWeight, targetWeight, weeklyChange) {
  if (!weeklyChange || weeklyChange === 0) return null;
  const delta = Math.abs(targetWeight - currentWeight);
  return Math.round(delta / Math.abs(weeklyChange));
}
