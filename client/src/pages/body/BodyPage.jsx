import { useState, useRef, useCallback } from 'react';
import {
  Plus, X, Trash2, ChevronDown, ChevronUp,
  Scale, TrendingDown, TrendingUp, Minus,
} from 'lucide-react';
import { format } from 'date-fns';
import { useBodyData } from '../../hooks/use-body-data.js';
import { calcBodyComposition } from '../../utils/calculations.js';

// ─── Константы ────────────────────────────────────────────────────────────────

const TODAY = format(new Date(), 'yyyy-MM-dd');

const MEASUREMENT_FIELDS = [
  { key: 'waist',      label: 'Талия',       unit: 'см' },
  { key: 'chest',      label: 'Грудь',       unit: 'см' },
  { key: 'hips',       label: 'Бёдра',       unit: 'см' },
  { key: 'armLeft',    label: 'Рука лев.',   unit: 'см' },
  { key: 'armRight',   label: 'Рука прав.',  unit: 'см' },
  { key: 'thighLeft',  label: 'Бедро лев.',  unit: 'см' },
  { key: 'thighRight', label: 'Бедро прав.', unit: 'см' },
];

const METHOD_OPTIONS = [
  { value: 'bioimpedance', label: '⚡ Весы' },
  { value: 'caliper',      label: '📏 Калипер' },
  { value: 'visual',       label: '👁 Визуально' },
];

const EMPTY_FORM = {
  date: TODAY,
  weight: '',
  bodyFat: '',
  method: 'bioimpedance',
  measurements: {
    waist: '', chest: '', hips: '',
    armLeft: '', armRight: '',
    thighLeft: '', thighRight: '',
  },
  notes: '',
};

// ─── Утилиты ──────────────────────────────────────────────────────────────────

function getDelta(current, previous) {
  const c = parseFloat(current);
  const p = parseFloat(previous);
  if (isNaN(c) || isNaN(p) || previous === '' || previous == null) return null;
  return Math.round((c - p) * 10) / 10;
}

function DeltaBadge({ delta, unit = 'кг', lowerIsBetter = false }) {
  if (delta === null) return null;
  const positive = delta > 0;
  const good = lowerIsBetter ? !positive : positive;
  const color = delta === 0
    ? 'text-stone-400 bg-stone-100'
    : good ? 'text-forest-700 bg-forest-50' : 'text-red-600 bg-red-50';
  const Icon = delta === 0 ? Minus : positive ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${color}`}>
      <Icon size={10} />
      {delta > 0 ? '+' : ''}{delta} {unit}
    </span>
  );
}

// ─── Форма добавления замера ───────────────────────────────────────────────────

function AddForm({ lastLog, onSave, onCancel, isSaving }) {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [showMeasurements, setShowMeasurements] = useState(false);

  // Refs для Enter → следующее поле
  const refs = useRef({});
  const reg = useCallback((name) => (el) => { refs.current[name] = el; }, []);

  const FIELD_ORDER = [
    'date', 'weight', 'bodyFat',
    'waist', 'chest', 'hips',
    'armLeft', 'armRight', 'thighLeft', 'thighRight',
    'notes',
  ];

  function nextFocus(name) {
    const i = FIELD_ORDER.indexOf(name);
    for (let j = i + 1; j < FIELD_ORDER.length; j++) {
      const el = refs.current[FIELD_ORDER[j]];
      if (el && !el.disabled) { el.focus(); return; }
    }
  }

  function onKey(name) {
    return (e) => { if (e.key === 'Enter') { e.preventDefault(); nextFocus(name); } };
  }

  function setField(name, value) {
    setForm(f => ({ ...f, [name]: value }));
  }

  function setMeasure(key, value) {
    setForm(f => ({ ...f, measurements: { ...f.measurements, [key]: value } }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      date:    form.date,
      weight:  parseFloat(form.weight),
      method:  form.method,
    };
    if (form.bodyFat !== '') payload.bodyFat = parseFloat(form.bodyFat);
    if (form.notes)         payload.notes = form.notes;

    const measures = {};
    MEASUREMENT_FIELDS.forEach(({ key }) => {
      if (form.measurements[key] !== '') measures[key] = parseFloat(form.measurements[key]);
    });
    if (Object.keys(measures).length) payload.measurements = measures;

    onSave(payload);
  }

  // Вычисленные дельты от последнего замера
  const weightDelta  = getDelta(form.weight,  lastLog?.weight);
  const bodyFatDelta = getDelta(form.bodyFat, lastLog?.bodyFat);

  // Превью состава тела
  const previewComposition = form.weight && form.bodyFat
    ? calcBodyComposition(parseFloat(form.weight), parseFloat(form.bodyFat))
    : null;

  return (
    <form onSubmit={handleSubmit} className="card space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-stone-800 flex items-center gap-2">
          <Scale size={16} className="text-forest-600" /> Новый замер
        </h2>
        <button type="button" onClick={onCancel} className="text-stone-400 hover:text-stone-600 transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Дата */}
      <div>
        <label className="block text-xs font-medium text-stone-600 mb-1">Дата</label>
        <input
          ref={reg('date')} type="date" className="input" value={form.date}
          onChange={e => setField('date', e.target.value)} onKeyDown={onKey('date')}
        />
      </div>

      {/* Основные поля: вес + жир */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Вес</label>
          <div className="relative">
            <input
              ref={reg('weight')} type="number" step="0.1" min="20" max="300"
              className="input pr-10" value={form.weight}
              placeholder={lastLog?.weight ?? '85.0'}
              onChange={e => setField('weight', e.target.value)} onKeyDown={onKey('weight')}
              required
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400">кг</span>
          </div>
          {weightDelta !== null && (
            <div className="mt-1">
              <DeltaBadge delta={weightDelta} unit="кг"
                lowerIsBetter={/* для рекомпозиции неоднозначно, для катинга true */false} />
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">% жира</label>
          <div className="relative">
            <input
              ref={reg('bodyFat')} type="number" step="0.1" min="1" max="70"
              className="input pr-7" value={form.bodyFat}
              placeholder={lastLog?.bodyFat ?? '18.0'}
              onChange={e => setField('bodyFat', e.target.value)} onKeyDown={onKey('bodyFat')}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400">%</span>
          </div>
          {bodyFatDelta !== null && (
            <div className="mt-1">
              <DeltaBadge delta={bodyFatDelta} unit="%" lowerIsBetter />
            </div>
          )}
        </div>
      </div>

      {/* Превью состава тела */}
      {previewComposition && (
        <div className="bg-forest-50 rounded-xl p-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-stone-500">Сухая масса</p>
            <p className="font-bold text-forest-700">{previewComposition.leanMass} кг</p>
          </div>
          <div>
            <p className="text-xs text-stone-500">Жировая масса</p>
            <p className="font-bold text-amber-600">{previewComposition.fatMass} кг</p>
          </div>
        </div>
      )}

      {/* Метод измерения */}
      <div>
        <label className="block text-xs font-medium text-stone-600 mb-2">Метод</label>
        <div className="flex gap-2 flex-wrap">
          {METHOD_OPTIONS.map(o => (
            <button
              key={o.value} type="button"
              onClick={() => setField('method', o.value)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${
                form.method === o.value
                  ? 'bg-forest-600 text-white border-forest-600'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-forest-300'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Обхваты — раскрываемая секция */}
      <div>
        <button
          type="button"
          onClick={() => setShowMeasurements(v => !v)}
          className="flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-800 transition-colors"
        >
          {showMeasurements ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          Обхваты тела
          {lastLog?.measurements && (
            <span className="text-xs text-stone-400 font-normal">
              (прошлый: {lastLog.measurements.waist ?? '—'} см)
            </span>
          )}
        </button>

        {showMeasurements && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            {MEASUREMENT_FIELDS.map(({ key, label, unit }, i) => {
              const prevVal = lastLog?.measurements?.[key];
              const delta = getDelta(form.measurements[key], prevVal);
              return (
                <div key={key}>
                  <label className="block text-xs text-stone-500 mb-1">
                    {label}
                    {prevVal && (
                      <span className="ml-1 text-stone-400">({prevVal})</span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      ref={reg(key)}
                      type="number" step="0.5" min="10" max="300"
                      className="input pr-10 text-sm py-1.5"
                      value={form.measurements[key]}
                      placeholder={prevVal ?? ''}
                      onChange={e => setMeasure(key, e.target.value)}
                      onKeyDown={onKey(key)}
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400">{unit}</span>
                  </div>
                  {delta !== null && (
                    <div className="mt-0.5">
                      <DeltaBadge delta={delta} unit="см" lowerIsBetter={key === 'waist' || key === 'hips'} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Заметки */}
      <div>
        <label className="block text-xs font-medium text-stone-600 mb-1">Заметки</label>
        <textarea
          ref={reg('notes')} rows={2}
          className="input resize-none" value={form.notes}
          placeholder="Самочувствие, условия замера..."
          onChange={e => setField('notes', e.target.value)}
        />
      </div>

      <button type="submit" className="btn-primary w-full" disabled={isSaving}>
        {isSaving ? 'Сохранение...' : '💾 Сохранить замер'}
      </button>
    </form>
  );
}

// ─── Карточка записи в истории ────────────────────────────────────────────────

function LogCard({ log, prevLog, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  const weightDelta  = prevLog ? getDelta(log.weight,  prevLog.weight)  : null;
  const bodyFatDelta = prevLog ? getDelta(log.bodyFat, prevLog.bodyFat) : null;

  const composition = log.bodyFat
    ? calcBodyComposition(log.weight, log.bodyFat)
    : null;

  const hasMeasurements = log.measurements &&
    Object.values(log.measurements).some(v => v != null);

  return (
    <div className="card space-y-3">
      {/* Верхняя строка */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-stone-400 font-medium">{log.date}</p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-bold text-stone-800 tabular-nums">{log.weight}</span>
            <span className="text-sm text-stone-400">кг</span>
            {weightDelta !== null && <DeltaBadge delta={weightDelta} unit="кг" />}
          </div>
        </div>

        <div className="text-right">
          {log.bodyFat != null && (
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-sm font-semibold text-stone-700 tabular-nums">{log.bodyFat}%</span>
              <span className="text-xs text-stone-400">жира</span>
              {bodyFatDelta !== null && <DeltaBadge delta={bodyFatDelta} unit="%" lowerIsBetter />}
            </div>
          )}
          {log.method && (
            <span className="text-xs text-stone-400">
              {METHOD_OPTIONS.find(m => m.value === log.method)?.label ?? log.method}
            </span>
          )}
        </div>
      </div>

      {/* Состав тела */}
      {composition && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-forest-50 rounded-lg px-3 py-2">
            <p className="text-[11px] text-stone-500">Сухая масса</p>
            <p className="text-sm font-bold text-forest-700">{composition.leanMass} кг</p>
          </div>
          <div className="bg-amber-50 rounded-lg px-3 py-2">
            <p className="text-[11px] text-stone-500">Жировая масса</p>
            <p className="text-sm font-bold text-amber-600">{composition.fatMass} кг</p>
          </div>
        </div>
      )}

      {/* Обхваты — раскрываемые */}
      {hasMeasurements && (
        <>
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-700 transition-colors"
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            Обхваты
          </button>

          {expanded && (
            <div className="grid grid-cols-3 gap-x-4 gap-y-2 pt-1 border-t border-stone-100">
              {MEASUREMENT_FIELDS.map(({ key, label, unit }) => {
                const val = log.measurements?.[key];
                const prevVal = prevLog?.measurements?.[key];
                const delta = getDelta(val, prevVal);
                if (val == null) return null;
                return (
                  <div key={key}>
                    <p className="text-[11px] text-stone-400">{label}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-semibold text-stone-700 tabular-nums">{val}</span>
                      <span className="text-[11px] text-stone-400">{unit}</span>
                    </div>
                    {delta !== null && (
                      <DeltaBadge delta={delta} unit="см"
                        lowerIsBetter={key === 'waist' || key === 'hips'} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Заметки */}
      {log.notes && (
        <p className="text-xs text-stone-500 italic border-t border-stone-100 pt-2">
          {log.notes}
        </p>
      )}

      {/* Удалить */}
      <div className="flex justify-end border-t border-stone-100 pt-2">
        <button
          type="button"
          onClick={() => onDelete(log.id)}
          className="flex items-center gap-1 text-xs text-stone-400 hover:text-red-500 transition-colors"
        >
          <Trash2 size={12} /> Удалить
        </button>
      </div>
    </div>
  );
}

// ─── Карточка текущего состояния ──────────────────────────────────────────────

function CurrentSnapshot({ log, prevLog }) {
  const composition = log.bodyFat ? calcBodyComposition(log.weight, log.bodyFat) : null;
  const weightDelta  = prevLog ? getDelta(log.weight,  prevLog.weight)  : null;
  const bodyFatDelta = prevLog ? getDelta(log.bodyFat, prevLog.bodyFat) : null;
  const leanDelta    = (composition && prevLog?.bodyFat)
    ? getDelta(composition.leanMass, calcBodyComposition(prevLog.weight, prevLog.bodyFat).leanMass)
    : null;

  return (
    <div className="card bg-gradient-to-br from-forest-50 to-white border-forest-100">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Последний замер</p>
        <span className="text-xs text-stone-400">{log.date}</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Вес" value={`${log.weight}`} unit="кг" delta={weightDelta} />
        <Stat label="% жира" value={log.bodyFat ?? '—'} unit={log.bodyFat ? '%' : ''}
          delta={bodyFatDelta} lowerIsBetter />
        <Stat label="Сухая масса" value={composition ? `${composition.leanMass}` : '—'}
          unit={composition ? 'кг' : ''} delta={leanDelta} />
      </div>
    </div>
  );
}

function Stat({ label, value, unit, delta, lowerIsBetter }) {
  return (
    <div>
      <p className="text-[11px] text-stone-500 mb-0.5">{label}</p>
      <div className="flex items-baseline gap-0.5">
        <span className="text-lg font-bold text-stone-800 tabular-nums">{value}</span>
        {unit && <span className="text-xs text-stone-400">{unit}</span>}
      </div>
      {delta !== null && <DeltaBadge delta={delta} unit={unit} lowerIsBetter={lowerIsBetter} />}
    </div>
  );
}

// ─── Главная страница ─────────────────────────────────────────────────────────

export default function BodyPage() {
  const [showForm, setShowForm] = useState(false);
  const { data: logs = [], isLoading, addLog, deleteLog } = useBodyData();

  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  const latest  = sorted[0] ?? null;
  const hasData = sorted.length > 0;

  function handleSave(payload) {
    addLog.mutate(payload, {
      onSuccess: () => setShowForm(false),
    });
  }

  function handleDelete(id) {
    if (window.confirm('Удалить замер?')) deleteLog.mutate(id);
  }

  return (
    <div className="space-y-5">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <h1 className="page-title">Замеры тела</h1>
        {!showForm && (
          <button className="btn-primary flex items-center gap-1.5" onClick={() => setShowForm(true)}>
            <Plus size={15} /> Добавить
          </button>
        )}
      </div>

      {/* Форма */}
      {(showForm || !hasData) && (
        <AddForm
          lastLog={latest}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
          isSaving={addLog.isPending}
        />
      )}

      {/* Сообщение об ошибке */}
      {addLog.isError && (
        <div className="card border-red-200 bg-red-50 text-red-700 text-sm">
          Ошибка: {addLog.error?.message}
        </div>
      )}

      {/* Текущий снапшот */}
      {latest && !showForm && (
        <CurrentSnapshot log={latest} prevLog={sorted[1] ?? null} />
      )}

      {/* Загрузка */}
      {isLoading && <p className="text-stone-400 text-sm">Загрузка...</p>}

      {/* Пустое состояние */}
      {!hasData && !isLoading && !showForm && (
        <div className="empty-state">
          <Scale size={36} className="mx-auto mb-3 text-stone-300" />
          <p className="font-medium text-stone-500">Нет замеров</p>
          <p className="text-stone-400 text-xs mt-1">Добавь первый замер выше</p>
        </div>
      )}

      {/* История */}
      {sorted.length > 0 && (
        <section className="space-y-3">
          <h2 className="section-title flex items-center gap-2">
            История
            <span className="text-sm font-normal text-stone-400">
              {sorted.length} {sorted.length === 1 ? 'запись' : 'записей'}
            </span>
          </h2>
          {sorted.map((log, i) => (
            <LogCard
              key={log.id}
              log={log}
              prevLog={sorted[i + 1] ?? null}
              onDelete={handleDelete}
            />
          ))}
        </section>
      )}
    </div>
  );
}
