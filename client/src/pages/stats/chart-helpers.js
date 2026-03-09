import { format, subDays, parseISO, differenceInDays, subWeeks, isWithinInterval } from 'date-fns';
import { ru } from 'date-fns/locale';
import { calcBodyComposition, calc1RM, calcVolume } from '../../utils/calculations.js';

// ─── Период фильтрации ────────────────────────────────────────────────────────

export const PERIODS = [
  { label: '7д',   days: 7   },
  { label: '30д',  days: 30  },
  { label: '90д',  days: 90  },
  { label: 'Всё',  days: null },
];

export function filterByPeriod(arr, days, key = 'date') {
  if (!days) return arr;
  const cutoff = format(subDays(new Date(), days), 'yyyy-MM-dd');
  return arr.filter(d => d[key] >= cutoff);
}

export function fmtTick(dateStr, days) {
  try {
    const d = parseISO(dateStr);
    return days && days <= 30
      ? format(d, 'd MMM', { locale: ru })
      : format(d, 'MMM yy',{ locale: ru });
  } catch { return dateStr; }
}

// ─── Вес + скользящее среднее ─────────────────────────────────────────────────

export function buildWeightSeries(bodyLogs) {
  const sorted = [...bodyLogs]
    .sort((a, b) => a.date.localeCompare(b.date));

  return sorted.map((d, i) => {
    const window = sorted.slice(Math.max(0, i - 6), i + 1);
    const ma = window.reduce((s, x) => s + x.weight, 0) / window.length;
    return {
      date:   d.date,
      weight: d.weight,
      ma:     Math.round(ma * 10) / 10,
    };
  });
}

// ─── Состав тела ─────────────────────────────────────────────────────────────

export function buildCompositionSeries(bodyLogs) {
  return bodyLogs
    .filter(l => l.bodyFat != null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(l => {
      const { leanMass, fatMass } = calcBodyComposition(l.weight, l.bodyFat);
      return { date: l.date, leanMass, fatMass, bodyFat: l.bodyFat };
    });
}

// ─── Обхваты ─────────────────────────────────────────────────────────────────

export const MEASURE_LINES = [
  { key: 'waist',   label: 'Талия',  color: '#f87171' },
  { key: 'chest',   label: 'Грудь',  color: '#60a5fa' },
  { key: 'hips',    label: 'Бёдра',  color: '#34d399' },
  { key: 'armLeft', label: 'Рука',   color: '#fbbf24' },
  { key: 'thighLeft', label: 'Бедро',color: '#a78bfa' },
];

export function buildMeasurementSeries(bodyLogs) {
  return bodyLogs
    .filter(l => l.measurements)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(l => ({ date: l.date, ...l.measurements }));
}

// ─── Калории: план vs факт ────────────────────────────────────────────────────

export function buildCalorieSeries(nutritionLogs, targetCalories) {
  return nutritionLogs
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(l => ({
      date:   l.date,
      actual: l.totals?.calories ?? 0,
      target: targetCalories,
    }));
}

// ─── Средние макросы за период ────────────────────────────────────────────────

export function calcAvgMacros(nutritionLogs) {
  const n = nutritionLogs.length;
  if (!n) return null;
  const sum = nutritionLogs.reduce(
    (s, l) => ({
      calories: s.calories + (l.totals?.calories ?? 0),
      protein:  s.protein  + (l.totals?.protein  ?? 0),
      fat:      s.fat      + (l.totals?.fat      ?? 0),
      carbs:    s.carbs    + (l.totals?.carbs    ?? 0),
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  );
  return {
    calories: Math.round(sum.calories / n),
    protein:  Math.round(sum.protein  / n),
    fat:      Math.round(sum.fat      / n),
    carbs:    Math.round(sum.carbs    / n),
  };
}

// ─── Тоннаж по группам мышц ──────────────────────────────────────────────────

import { MUSCLE_LABEL } from '../training/training-utils.js';

export function buildMuscleTonnage(trainingLogs) {
  const acc = {};
  for (const log of trainingLogs) {
    for (const ex of log.exercises ?? []) {
      const key  = ex.muscleGroup || 'other';
      const vol  = calcVolume(ex.sets);
      acc[key] = (acc[key] || 0) + vol;
    }
  }
  return Object.entries(acc)
    .sort((a, b) => b[1] - a[1])
    .map(([key, tonnage]) => ({
      muscle:  MUSCLE_LABEL[key] ?? key,
      tonnage,
    }));
}

// ─── Прогресс упражнения (1RM over time) ─────────────────────────────────────

export function buildExerciseProgress(trainingLogs, exerciseName) {
  if (!exerciseName) return [];
  const name = exerciseName.toLowerCase().trim();
  const points = [];
  for (const log of trainingLogs) {
    for (const ex of log.exercises ?? []) {
      if (ex.name.toLowerCase().trim() !== name) continue;
      let best = null;
      for (const s of ex.sets) {
        const rm = calc1RM(s.weight, s.reps);
        if (rm && (best === null || rm > best)) best = rm;
      }
      if (best) points.push({ date: log.date, oneRM: best, tonnage: calcVolume(ex.sets) });
    }
  }
  return points.sort((a, b) => a.date.localeCompare(b.date));
}

// ─── Стрик питания ────────────────────────────────────────────────────────────

export function calcStreak(nutritionLogs) {
  const dates = new Set(nutritionLogs.map(l => l.date));
  let streak = 0;
  let check  = format(new Date(), 'yyyy-MM-dd');
  while (dates.has(check)) {
    streak++;
    check = format(subDays(parseISO(check), 1), 'yyyy-MM-dd');
  }
  return streak;
}

// ─── Актуальный недельный темп (последние 4 нед) ──────────────────────────────

export function calcActualWeeklyChange(bodyLogs) {
  if (bodyLogs.length < 2) return null;
  const sorted = [...bodyLogs].sort((a, b) => a.date.localeCompare(b.date));
  const cutoff = format(subWeeks(new Date(), 4), 'yyyy-MM-dd');
  const recent = sorted.filter(l => l.date >= cutoff);
  const data   = recent.length >= 2 ? recent : sorted;
  const first  = data[0];
  const last   = data[data.length - 1];
  const days   = differenceInDays(parseISO(last.date), parseISO(first.date));
  if (days === 0) return null;
  return ((last.weight - first.weight) / days) * 7;
}

// ─── Спаркline (30 дней) для Dashboard ───────────────────────────────────────

export function buildSparkline(bodyLogs) {
  const cutoff = format(subDays(new Date(), 30), 'yyyy-MM-dd');
  return [...bodyLogs]
    .filter(l => l.date >= cutoff)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(l => ({ date: l.date, weight: l.weight }));
}
