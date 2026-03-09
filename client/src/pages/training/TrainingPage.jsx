import { Dumbbell } from 'lucide-react';
import { useTraining } from '../../hooks/use-training.js';

const TYPE_LABELS = {
  strength:   { label: 'Силовая',     emoji: '🏋️' },
  cardio:     { label: 'Кардио',      emoji: '🏃' },
  hiit:       { label: 'HIIT',        emoji: '⚡' },
  stretching: { label: 'Растяжка',    emoji: '🧘' },
};

export default function TrainingPage() {
  const { data: logs = [], isLoading } = useTraining();
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Тренировки</h1>
      </div>

      {isLoading && <p className="text-stone-400 text-sm">Загрузка...</p>}

      {sorted.length === 0 && !isLoading && (
        <div className="empty-state">
          <Dumbbell size={36} className="mx-auto mb-3 text-stone-300" />
          <p className="font-medium text-stone-500">Нет тренировок</p>
          <p className="text-stone-400 text-xs mt-1">Добавь первую тренировку</p>
        </div>
      )}

      <ul className="space-y-2">
        {sorted.map(log => {
          const typeInfo = TYPE_LABELS[log.type] ?? { label: log.type, emoji: '🏅' };
          return (
            <li key={log.id} className="card flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">{typeInfo.emoji}</span>
                <div>
                  <p className="font-semibold text-stone-800">{typeInfo.label}</p>
                  <p className="text-xs text-stone-400">{log.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-stone-700 tabular-nums">{log.duration} мин</p>
                {log.rating && (
                  <p className="text-xs text-stone-400 mt-0.5">{'⭐'.repeat(log.rating)}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
