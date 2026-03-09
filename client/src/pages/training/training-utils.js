import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { calc1RM, calcVolume } from '../../utils/calculations.js';

// ─── Константы ────────────────────────────────────────────────────────────────

export const TRAINING_TYPES = [
  { value: 'strength',   label: 'Силовая',  emoji: '🏋️' },
  { value: 'cardio',     label: 'Кардио',   emoji: '🏃' },
  { value: 'hiit',       label: 'Интервальная (HIIT)', emoji: '⚡' },
  { value: 'stretching', label: 'Растяжка', emoji: '🧘' },
];

export const MUSCLE_GROUPS = [
  { value: 'chest',     label: 'Грудь',    color: 'bg-rose-100   text-rose-700'   },
  { value: 'back',      label: 'Спина',    color: 'bg-blue-100   text-blue-700'   },
  { value: 'shoulders', label: 'Плечи',    color: 'bg-purple-100 text-purple-700' },
  { value: 'biceps',    label: 'Бицепс',   color: 'bg-amber-100  text-amber-700'  },
  { value: 'triceps',   label: 'Трицепс',  color: 'bg-orange-100 text-orange-700' },
  { value: 'legs',      label: 'Ноги',     color: 'bg-green-100  text-green-700'  },
  { value: 'core',      label: 'Пресс',    color: 'bg-yellow-100 text-yellow-700' },
  { value: 'glutes',    label: 'Ягодицы',  color: 'bg-pink-100   text-pink-700'   },
  { value: 'full',      label: 'Всё тело', color: 'bg-stone-100  text-stone-600'  },
];

export const MUSCLE_COLOR = Object.fromEntries(
  MUSCLE_GROUPS.map(m => [m.value, m.color])
);
export const MUSCLE_LABEL = Object.fromEntries(
  MUSCLE_GROUPS.map(m => [m.value, m.label])
);

export const CARDIO_TYPES = [
  'Бег', 'Велосипед', 'Плавание', 'Эллипсоид', 'Гребля', 'Скакалка', 'Ходьба',
];

// ─── Таймер ───────────────────────────────────────────────────────────────────

export function formatTimer(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

// ─── Вычисления по упражнению ─────────────────────────────────────────────────

export function exerciseTonnage(sets) {
  return sets.reduce((sum, s) => {
    const w = parseFloat(s.weight) || 0;
    const r = parseInt(s.reps)    || 0;
    return sum + w * r;
  }, 0);
}

export function exerciseBest1RM(sets) {
  let best = null;
  for (const s of sets) {
    const w = parseFloat(s.weight);
    const r = parseInt(s.reps);
    if (!w || !r) continue;
    const rm = calc1RM(w, r);
    if (rm && (best === null || rm > best)) best = rm;
  }
  return best;
}

export function totalWorkoutTonnage(exercises = []) {
  return exercises.reduce((sum, ex) => sum + exerciseTonnage(ex.sets), 0);
}

// ─── Поиск предыдущего выполнения ────────────────────────────────────────────

export function findLastExercise(trainingLogs, exerciseName) {
  if (!exerciseName?.trim()) return null;
  const name = exerciseName.toLowerCase().trim();
  const sorted = [...trainingLogs].sort((a, b) => b.date.localeCompare(a.date));
  for (const log of sorted) {
    const ex = log.exercises?.find(e => e.name.toLowerCase().trim() === name);
    if (ex) return { date: log.date, exercise: ex };
  }
  return null;
}

export function getPreviousExerciseNames(trainingLogs) {
  const seen = new Set();
  const names = [];
  for (const log of trainingLogs) {
    for (const ex of log.exercises ?? []) {
      if (ex.name && !seen.has(ex.name)) {
        seen.add(ex.name);
        names.push(ex.name);
      }
    }
  }
  return names;
}

// ─── Сборка payload для POST ──────────────────────────────────────────────────

export function buildPayload(draft, elapsedSeconds) {
  const exercises = draft.exercises
    .filter(e => e.name.trim())
    .map(e => ({
      name:        e.name.trim(),
      muscleGroup: e.muscleGroup || undefined,
      sets: e.sets
        .filter(s => parseFloat(s.weight) > 0 && parseInt(s.reps) > 0)
        .map(s => ({
          weight: parseFloat(s.weight),
          reps:   parseInt(s.reps),
          ...(s.rpe ? { rpe: parseFloat(s.rpe) } : {}),
        })),
    }))
    .filter(e => e.sets.length > 0);

  const payload = {
    date:     format(new Date(), 'yyyy-MM-dd'),
    type:     draft.type,
    duration: Math.max(1, Math.round(elapsedSeconds / 60)),
    ...(draft.rating ? { rating: draft.rating } : {}),
    ...(draft.notes.trim() ? { notes: draft.notes.trim() } : {}),
  };

  if (exercises.length > 0) payload.exercises = exercises;

  if (['cardio', 'hiit'].includes(draft.type) && draft.cardio.type) {
    payload.cardio = {
      type:     draft.cardio.type,
      ...(draft.cardio.distance ? { distance: parseFloat(draft.cardio.distance) } : {}),
      ...(draft.cardio.calories ? { calories: parseInt(draft.cardio.calories) }   : {}),
    };
  }

  return payload;
}

// ─── Форматирование даты ──────────────────────────────────────────────────────

export function fmtDate(dateStr) {
  try {
    return format(new Date(dateStr + 'T12:00:00'), 'd MMM yyyy', { locale: ru });
  } catch { return dateStr; }
}

// ─── Пустое упражнение / сет ──────────────────────────────────────────────────

let _exId = 0;
export function newExercise() {
  return { _id: ++_exId, name: '', muscleGroup: '', sets: [newSet()] };
}

export function newSet(prevSet = null) {
  return {
    weight: prevSet?.weight ?? '',
    reps:   prevSet?.reps   ?? '',
    rpe:    '',
  };
}
