import { useState } from 'react';
import { Trash2, ChevronDown, ChevronUp, Star } from 'lucide-react';
import { calc1RM } from '../../utils/calculations.js';
import {
  TRAINING_TYPES, MUSCLE_COLOR, MUSCLE_LABEL,
  exerciseTonnage, exerciseBest1RM, totalWorkoutTonnage, fmtDate,
} from './training-utils.js';
import { InfoTip } from '../../components/info-tip.jsx';

// ─── Карточка упражнения ──────────────────────────────────────────────────────

function ExerciseCard({ exercise }) {
  const tonnage  = exerciseTonnage(exercise.sets);
  const best1rm  = exerciseBest1RM(exercise.sets);
  const muscleColor = MUSCLE_COLOR[exercise.muscleGroup] ?? 'bg-stone-100 text-stone-600';

  // Компактное представление сетов: группируем одинаковые
  const setsSummary = (() => {
    if (!exercise.sets?.length) return '—';
    const counts = {};
    exercise.sets.forEach(s => {
      const key = `${s.weight}×${s.reps}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([k, n]) => n > 1 ? `${n}×${k}` : k)
      .join('  ');
  })();

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-semibold text-stone-800">{exercise.name}</span>
        {exercise.muscleGroup && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${muscleColor}`}>
            {MUSCLE_LABEL[exercise.muscleGroup] ?? exercise.muscleGroup}
          </span>
        )}
      </div>

      <p className="text-xs text-stone-500 font-mono tabular-nums">{setsSummary}</p>

      <div className="flex gap-3 text-xs text-stone-400">
        {tonnage > 0 && (
          <span>
            <InfoTip tip="Суммарный объём: вес × повторения">Тоннаж</InfoTip>{' '}
            <b className="text-stone-600">{tonnage}</b> кг
          </span>
        )}
        {best1rm && (
          <span>
            <InfoTip tip="Расчётный максимум на 1 повторение">1RM</InfoTip>{' '}
            <b className="text-forest-600">{best1rm}</b> кг
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Основная карточка тренировки ─────────────────────────────────────────────

export default function TrainingCard({ log, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  const typeInfo  = TRAINING_TYPES.find(t => t.value === log.type)
    ?? { label: log.type, emoji: '🏅' };
  const tonnage   = totalWorkoutTonnage(log.exercises);
  const hasDetail = (log.exercises?.length > 0) || log.cardio || log.notes;

  return (
    <div className="card space-y-3">
      {/* Верхняя строка */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-forest-50 rounded-xl flex items-center justify-center text-xl shrink-0">
            {typeInfo.emoji}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-stone-800">{typeInfo.label}</span>
              {log.rating > 0 && (
                <span className="flex gap-0.5">
                  {Array.from({ length: log.rating }).map((_, i) => (
                    <Star key={i} size={11} className="text-amber-400" fill="#fbbf24" />
                  ))}
                </span>
              )}
            </div>
            <p className="text-xs text-stone-400">
              {fmtDate(log.date)} · {log.duration} мин
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasDetail && (
            <button
              type="button" onClick={() => setExpanded(v => !v)}
              className="text-stone-400 hover:text-stone-600 transition-colors p-1"
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
          <button
            type="button" onClick={() => onDelete(log.id)}
            className="text-stone-300 hover:text-red-500 transition-colors p-1"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Краткая сводка */}
      <div className="flex gap-4 text-xs flex-wrap">
        {log.exercises?.length > 0 && (
          <span className="text-stone-500">
            <b className="text-stone-700">{log.exercises.length}</b> упражн.
          </span>
        )}
        {tonnage > 0 && (
          <span className="text-stone-500">
            <InfoTip tip="Суммарный объём нагрузки: вес × повторения">Тоннаж</InfoTip>{' '}
            <b className="text-stone-700">{tonnage}</b> кг
          </span>
        )}
        {log.cardio?.type && (
          <span className="text-stone-500">
            {log.cardio.type}
            {log.cardio.distance ? ` · ${log.cardio.distance} км` : ''}
            {log.cardio.calories ? ` · ${log.cardio.calories} ккал` : ''}
          </span>
        )}

        {/* Топ 1RM среди всех упражнений */}
        {log.exercises?.map(ex => {
          const rm = exerciseBest1RM(ex.sets);
          if (!rm) return null;
          return (
            <span key={ex.name} className="text-stone-500">
              {ex.name}: <b className="text-forest-600" title="Расчётный максимум на 1 повторение">{rm} кг (1RM)</b>
            </span>
          );
        })}
      </div>

      {/* Развёрнутые детали */}
      {expanded && (
        <div className="space-y-4 pt-2 border-t border-stone-100">
          {/* Упражнения */}
          {log.exercises?.length > 0 && (
            <div className="space-y-3">
              {log.exercises.map((ex, i) => (
                <ExerciseCard key={i} exercise={ex} />
              ))}
            </div>
          )}

          {/* Заметки */}
          {log.notes && (
            <p className="text-xs text-stone-500 italic bg-stone-50 rounded-lg px-3 py-2">
              {log.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
