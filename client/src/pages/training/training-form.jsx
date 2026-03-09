import { useState, useEffect } from 'react';
import { Plus, Save, X, Timer, Star } from 'lucide-react';
import ExerciseSets from './exercise-sets.jsx';
import {
  TRAINING_TYPES, CARDIO_TYPES,
  formatTimer, buildPayload,
  newExercise, findLastExercise, getPreviousExerciseNames,
} from './training-utils.js';

// ─── Выбор типа тренировки ────────────────────────────────────────────────────

function TypeSelector({ value, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {TRAINING_TYPES.map(t => (
        <button
          key={t.value} type="button"
          onClick={() => onChange(t.value)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
            value === t.value
              ? 'bg-forest-600 text-white border-forest-600 shadow-sm'
              : 'bg-white text-stone-600 border-stone-200 hover:border-forest-300'
          }`}
        >
          <span>{t.emoji}</span> {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── Секция кардио ────────────────────────────────────────────────────────────

function CardioSection({ cardio, onChange }) {
  function upd(field, value) { onChange({ ...cardio, [field]: value }); }

  return (
    <div className="card space-y-3">
      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Кардио</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-stone-500 mb-1">Вид</label>
          <select className="input" value={cardio.type} onChange={e => upd('type', e.target.value)}>
            <option value="">Выбрать...</option>
            {CARDIO_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-stone-500 mb-1">Дистанция (км)</label>
          <input type="number" step="0.1" min="0" className="input"
            value={cardio.distance} placeholder="5.0"
            onChange={e => upd('distance', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-stone-500 mb-1">Сожжено (ккал)</label>
          <input type="number" min="0" className="input"
            value={cardio.calories} placeholder="380"
            onChange={e => upd('calories', e.target.value)} />
        </div>
      </div>
    </div>
  );
}

// ─── Звёздный рейтинг ─────────────────────────────────────────────────────────

function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n} type="button" onClick={() => onChange(value === n ? 0 : n)}
          className={`transition-colors ${n <= value ? 'text-amber-400' : 'text-stone-200 hover:text-amber-300'}`}
        >
          <Star size={22} fill={n <= value ? '#fbbf24' : 'none'} />
        </button>
      ))}
    </div>
  );
}

// ─── Форма тренировки ─────────────────────────────────────────────────────────

const INIT_DRAFT = {
  type:      'strength',
  exercises: [],
  cardio:    { type: '', distance: '', calories: '' },
  rating:    0,
  notes:     '',
};

export default function TrainingForm({ trainingLogs, onSave, onCancel, isSaving }) {
  const [draft,   setDraft]   = useState({ ...INIT_DRAFT, exercises: [newExercise()] });
  const [elapsed, setElapsed] = useState(0);

  // Таймер
  useEffect(() => {
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const suggestions = getPreviousExerciseNames(trainingLogs);
  const showExercises = ['strength', 'hiit'].includes(draft.type);

  function updDraft(patch) { setDraft(d => ({ ...d, ...patch })); }

  // Упражнения
  function addExercise() {
    setDraft(d => ({ ...d, exercises: [...d.exercises, newExercise()] }));
  }

  function updateExercise(idx, ex) {
    setDraft(d => ({
      ...d,
      exercises: d.exercises.map((e, i) => i === idx ? ex : e),
    }));
  }

  function removeExercise(idx) {
    setDraft(d => ({
      ...d,
      exercises: d.exercises.filter((_, i) => i !== idx),
    }));
  }

  function handleSave() {
    const payload = buildPayload(draft, elapsed);
    onSave(payload);
  }

  return (
    <div className="space-y-4">
      {/* Шапка: таймер + кнопки */}
      <div className="card bg-forest-600 border-forest-700 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-forest-500 rounded-xl px-4 py-2 flex items-center gap-2">
              <Timer size={16} className="opacity-80" />
              <span className="font-mono text-xl font-bold tabular-nums tracking-widest">
                {formatTimer(elapsed)}
              </span>
            </div>
            <div>
              <p className="text-xs text-forest-200">Тренировка</p>
              <p className="text-sm font-semibold">в процессе</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button" onClick={handleSave} disabled={isSaving}
              className="flex items-center gap-1.5 bg-white text-forest-700
                         hover:bg-forest-50 font-semibold px-4 py-2 rounded-xl
                         transition-all text-sm disabled:opacity-60 shadow-sm"
            >
              <Save size={14} /> Завершить
            </button>
            <button
              type="button" onClick={onCancel}
              className="p-2 rounded-xl text-forest-200 hover:text-white hover:bg-forest-500 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Тип тренировки */}
      <div className="card space-y-3">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Тип</p>
        <TypeSelector
          value={draft.type}
          onChange={type => updDraft({ type })}
        />
      </div>

      {/* Упражнения (силовая/HIIT) */}
      {showExercises && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Упражнения</h2>
            <button
              type="button" onClick={addExercise}
              className="btn-secondary flex items-center gap-1.5"
            >
              <Plus size={14} /> Упражнение
            </button>
          </div>

          {draft.exercises.map((ex, idx) => (
            <ExerciseSets
              key={ex._id}
              exercise={ex}
              prev={findLastExercise(trainingLogs, ex.name)}
              suggestions={suggestions}
              onUpdate={updated => updateExercise(idx, updated)}
              onRemove={() => removeExercise(idx)}
            />
          ))}

          {draft.exercises.length === 0 && (
            <button
              type="button" onClick={addExercise}
              className="w-full card border-dashed border-stone-200 text-stone-400
                         hover:border-forest-300 hover:text-forest-600 transition-all
                         flex items-center justify-center gap-2 py-6 text-sm"
            >
              <Plus size={16} /> Добавить первое упражнение
            </button>
          )}
        </div>
      )}

      {/* Кардио */}
      {['cardio', 'hiit'].includes(draft.type) && (
        <CardioSection
          cardio={draft.cardio}
          onChange={cardio => updDraft({ cardio })}
        />
      )}

      {/* Оценка + заметки */}
      <div className="card space-y-4">
        <div>
          <p className="text-xs text-stone-500 mb-2">Оценка тренировки</p>
          <StarRating value={draft.rating} onChange={r => updDraft({ rating: r })} />
        </div>

        <div>
          <label className="block text-xs text-stone-500 mb-1">Заметки</label>
          <textarea
            rows={2} className="input resize-none"
            value={draft.notes}
            placeholder="Как прошла тренировка?"
            onChange={e => updDraft({ notes: e.target.value })}
          />
        </div>
      </div>

      {/* Кнопка снизу */}
      <button
        type="button" onClick={handleSave} disabled={isSaving}
        className="btn-primary w-full text-base py-3"
      >
        {isSaving ? 'Сохранение...' : '✅ Завершить тренировку'}
      </button>
    </div>
  );
}
