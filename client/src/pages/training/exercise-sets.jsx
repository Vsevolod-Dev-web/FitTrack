import { useRef } from 'react';
import { X, Plus, ChevronDown } from 'lucide-react';
import { calc1RM } from '../../utils/calculations.js';
import {
  MUSCLE_GROUPS, MUSCLE_COLOR, MUSCLE_LABEL,
  exerciseTonnage, exerciseBest1RM, newSet, fmtDate,
} from './training-utils.js';

// ─── Предыдущее выполнение ────────────────────────────────────────────────────

function PreviousPerformance({ prev }) {
  if (!prev) return null;
  const { date, exercise } = prev;
  const tonnage = exerciseTonnage(exercise.sets);
  const best1rm = exerciseBest1RM(exercise.sets);

  return (
    <div className="bg-stone-50 rounded-xl p-3 border border-stone-100 text-xs space-y-2">
      <div className="flex items-center gap-1.5 text-stone-500 font-semibold">
        <span>📅</span>
        <span>Последний раз: {fmtDate(date)}</span>
      </div>
      <div className="space-y-1">
        {exercise.sets.map((s, i) => {
          const rm = calc1RM(s.weight, s.reps);
          return (
            <div key={i} className="flex items-center gap-2 text-stone-600">
              <span className="text-stone-400 w-4 shrink-0">{i + 1}.</span>
              <span className="tabular-nums font-medium">{s.weight} кг × {s.reps}</span>
              {s.rpe && <span className="text-stone-400">RPE {s.rpe}</span>}
              {rm && <span className="text-forest-600 font-semibold">→ {rm} кг</span>}
            </div>
          );
        })}
      </div>
      <div className="flex gap-3 pt-1 border-t border-stone-200 text-stone-500">
        <span>Тоннаж: <b className="text-stone-700">{tonnage}</b> кг</span>
        {best1rm && <span>1RM: <b className="text-forest-700">{best1rm}</b> кг</span>}
      </div>
    </div>
  );
}

// ─── Одна строка сета ─────────────────────────────────────────────────────────

function SetRow({ index, set, onUpdate, onRemove, onEnterAdd, isOnly }) {
  const weightRef = useRef(null);
  const repsRef   = useRef(null);
  const rpeRef    = useRef(null);

  const w = parseFloat(set.weight);
  const r = parseInt(set.reps);
  const oneRM = (w > 0 && r > 0 && r < 37) ? calc1RM(w, r) : null;

  return (
    <div className="grid grid-cols-[22px_1fr_1fr_1fr_40px_22px] gap-1.5 items-center">
      {/* № */}
      <span className="text-[11px] text-stone-400 text-center tabular-nums">{index + 1}</span>

      {/* Вес */}
      <input
        ref={weightRef}
        type="number" step="0.5" min="0" max="999"
        className="input text-sm py-1 text-center px-1"
        value={set.weight}
        placeholder="кг"
        onChange={e => onUpdate({ weight: e.target.value })}
        onKeyDown={e => e.key === 'Enter' && repsRef.current?.focus()}
      />

      {/* Повторы */}
      <input
        ref={repsRef}
        type="number" min="0" max="200"
        className="input text-sm py-1 text-center px-1"
        value={set.reps}
        placeholder="раз"
        onChange={e => onUpdate({ reps: e.target.value })}
        onKeyDown={e => {
          if (e.key === 'Enter') { rpeRef.current?.focus(); }
        }}
      />

      {/* RPE */}
      <input
        ref={rpeRef}
        type="number" min="6" max="10" step="0.5"
        className="input text-sm py-1 text-center px-1"
        value={set.rpe}
        placeholder="—"
        onChange={e => onUpdate({ rpe: e.target.value })}
        onKeyDown={e => e.key === 'Enter' && onEnterAdd()}
      />

      {/* 1RM */}
      <span className={`text-[11px] text-center tabular-nums font-semibold ${
        oneRM ? 'text-forest-600' : 'text-stone-200'
      }`}>
        {oneRM ? `${oneRM}` : '—'}
      </span>

      {/* Удалить */}
      <button
        type="button" onClick={onRemove} disabled={isOnly}
        className="text-stone-300 hover:text-red-400 transition-colors disabled:opacity-0"
      >
        <X size={13} />
      </button>
    </div>
  );
}

// ─── Компонент упражнения ─────────────────────────────────────────────────────

export default function ExerciseSets({ exercise, prev, suggestions, onUpdate, onRemove }) {
  const nameRef = useRef(null);

  function updField(field, value) {
    onUpdate({ ...exercise, [field]: value });
  }

  function addSet() {
    const last = exercise.sets[exercise.sets.length - 1];
    onUpdate({ ...exercise, sets: [...exercise.sets, newSet(last)] });
  }

  function updateSet(idx, patch) {
    onUpdate({
      ...exercise,
      sets: exercise.sets.map((s, i) => i === idx ? { ...s, ...patch } : s),
    });
  }

  function removeSet(idx) {
    if (exercise.sets.length === 1) return;
    onUpdate({ ...exercise, sets: exercise.sets.filter((_, i) => i !== idx) });
  }

  const tonnage = exerciseTonnage(exercise.sets);
  const best1rm = exerciseBest1RM(exercise.sets);
  const muscle  = MUSCLE_GROUPS.find(m => m.value === exercise.muscleGroup);

  return (
    <div className="card space-y-3 border-l-4 border-l-forest-200">
      {/* Заголовок: название + группа мышц */}
      <div className="flex items-start gap-2">
        <div className="flex-1 space-y-2">
          {/* Название с автодополнением из истории */}
          <div className="relative">
            <input
              ref={nameRef}
              list={`ex-suggestions-${exercise._id}`}
              className="input font-semibold"
              value={exercise.name}
              placeholder="Название упражнения"
              onChange={e => updField('name', e.target.value)}
            />
            {suggestions.length > 0 && (
              <datalist id={`ex-suggestions-${exercise._id}`}>
                {suggestions.map(s => <option key={s} value={s} />)}
              </datalist>
            )}
          </div>

          {/* Группа мышц */}
          <div className="flex flex-wrap gap-1.5">
            {MUSCLE_GROUPS.map(m => (
              <button
                key={m.value} type="button"
                onClick={() => updField('muscleGroup', exercise.muscleGroup === m.value ? '' : m.value)}
                className={`text-[11px] px-2 py-0.5 rounded-full border transition-all font-medium ${
                  exercise.muscleGroup === m.value
                    ? m.color + ' border-transparent'
                    : 'bg-white text-stone-400 border-stone-200 hover:border-stone-300'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Удалить упражнение */}
        <button
          type="button" onClick={onRemove}
          className="text-stone-300 hover:text-red-400 transition-colors mt-1 shrink-0"
          title="Удалить упражнение"
        >
          <X size={16} />
        </button>
      </div>

      {/* Предыдущий результат */}
      {prev && exercise.name && <PreviousPerformance prev={prev} />}

      {/* Таблица сетов */}
      <div className="space-y-1.5">
        {/* Заголовок колонок */}
        <div className="grid grid-cols-[22px_1fr_1fr_1fr_40px_22px] gap-1.5 px-0.5">
          {['№', 'Вес', 'Повторы', 'RPE', '1RM', ''].map((h, i) => (
            <span key={i} className="text-[10px] text-stone-400 text-center">{h}</span>
          ))}
        </div>

        {exercise.sets.map((set, idx) => (
          <SetRow
            key={idx}
            index={idx}
            set={set}
            isOnly={exercise.sets.length === 1}
            onUpdate={patch => updateSet(idx, patch)}
            onRemove={() => removeSet(idx)}
            onEnterAdd={addSet}
          />
        ))}
      </div>

      {/* Добавить сет + статистика */}
      <div className="flex items-center justify-between">
        <button
          type="button" onClick={addSet}
          className="flex items-center gap-1 text-xs text-forest-600 hover:text-forest-700
                     font-medium hover:bg-forest-50 px-2 py-1 rounded-lg transition-colors"
        >
          <Plus size={13} /> Добавить сет
        </button>

        {tonnage > 0 && (
          <div className="flex gap-3 text-xs text-stone-500">
            <span>Тоннаж: <b className="text-stone-700">{tonnage}</b> кг</span>
            {best1rm && <span>1RM: <b className="text-forest-700">{best1rm}</b> кг</span>}
          </div>
        )}
      </div>
    </div>
  );
}
