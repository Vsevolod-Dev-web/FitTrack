import { useState } from 'react';
import { Plus, Dumbbell, BarChart2 } from 'lucide-react';
import { useTraining } from '../../hooks/use-training.js';
import TrainingForm from './training-form.jsx';
import TrainingCard from './training-card.jsx';
import { totalWorkoutTonnage, TRAINING_TYPES } from './training-utils.js';

// ─── Статистика сессий ────────────────────────────────────────────────────────

function WorkoutStats({ logs }) {
  if (!logs.length) return null;

  const totalSessions  = logs.length;
  const totalMinutes   = logs.reduce((s, l) => s + (l.duration || 0), 0);
  const totalTonnage   = logs.reduce((s, l) => s + totalWorkoutTonnage(l.exercises), 0);
  const typeCount      = logs.reduce((acc, l) => {
    acc[l.type] = (acc[l.type] || 0) + 1;
    return acc;
  }, {});
  const topType = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0];
  const topTypeInfo = TRAINING_TYPES.find(t => t.value === topType?.[0]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        { label: 'Тренировок',   value: totalSessions,  unit: '' },
        { label: 'Часов',        value: (totalMinutes / 60).toFixed(1), unit: 'ч' },
        { label: 'Тоннаж всего', value: totalTonnage > 1000 ? `${(totalTonnage/1000).toFixed(1)}т` : `${totalTonnage}`, unit: totalTonnage > 1000 ? '' : 'кг' },
        { label: 'Чаще всего',   value: topTypeInfo ? `${topTypeInfo.emoji} ${topTypeInfo.label}` : '—', unit: '' },
      ].map(({ label, value, unit }) => (
        <div key={label} className="card">
          <p className="text-xs text-stone-400">{label}</p>
          <p className="text-lg font-bold text-stone-800 tabular-nums mt-0.5">
            {value}<span className="text-sm font-normal text-stone-400 ml-0.5">{unit}</span>
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Главная страница ─────────────────────────────────────────────────────────

export default function TrainingPage() {
  const [showForm, setShowForm] = useState(false);
  const { data: logs = [], isLoading, addLog, deleteLog } = useTraining();

  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));

  function handleSave(payload) {
    addLog.mutate(payload, {
      onSuccess: () => setShowForm(false),
    });
  }

  function handleDelete(id) {
    if (window.confirm('Удалить тренировку?')) deleteLog.mutate(id);
  }

  // Форма активна — показываем только её
  if (showForm) {
    return (
      <div className="space-y-4">
        <TrainingForm
          trainingLogs={logs}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
          isSaving={addLog.isPending}
        />
        {addLog.isError && (
          <div className="card border-red-200 bg-red-50 text-red-700 text-sm">
            Ошибка: {addLog.error?.message}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <h1 className="page-title">Тренировки</h1>
        <button
          className="btn-primary flex items-center gap-1.5"
          onClick={() => setShowForm(true)}
        >
          <Plus size={15} /> Начать
        </button>
      </div>

      {/* Загрузка */}
      {isLoading && <p className="text-stone-400 text-sm">Загрузка...</p>}

      {/* Статистика */}
      {sorted.length > 0 && <WorkoutStats logs={sorted} />}

      {/* Пустое состояние */}
      {!isLoading && sorted.length === 0 && (
        <div className="empty-state">
          <Dumbbell size={36} className="mx-auto mb-3 text-stone-300" />
          <p className="font-medium text-stone-500">Нет тренировок</p>
          <p className="text-stone-400 text-xs mt-1">
            Нажми «Начать» — и отслеживай каждый подход
          </p>
          <button
            className="btn-primary mt-4 inline-flex items-center gap-1.5"
            onClick={() => setShowForm(true)}
          >
            <Plus size={15} /> Первая тренировка
          </button>
        </div>
      )}

      {/* История */}
      {sorted.length > 0 && (
        <section className="space-y-3">
          <h2 className="section-title flex items-center gap-2">
            <BarChart2 size={17} className="text-forest-600" />
            История
            <span className="text-sm font-normal text-stone-400">
              {sorted.length} {sorted.length === 1 ? 'запись' : 'записей'}
            </span>
          </h2>
          {sorted.map(log => (
            <TrainingCard key={log.id} log={log} onDelete={handleDelete} />
          ))}
        </section>
      )}
    </div>
  );
}
