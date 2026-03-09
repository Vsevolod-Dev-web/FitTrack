import { Scale } from 'lucide-react';
import { useBodyData } from '../../hooks/use-body-data.js';

export default function BodyPage() {
  const { data: logs = [], isLoading } = useBodyData();
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Замеры тела</h1>
      </div>

      {isLoading && <p className="text-stone-400 text-sm">Загрузка...</p>}

      {sorted.length === 0 && !isLoading && (
        <div className="empty-state">
          <Scale size={36} className="mx-auto mb-3 text-stone-300" />
          <p className="font-medium text-stone-500">Нет замеров</p>
          <p className="text-stone-400 text-xs mt-1">Добавь первый замер, чтобы начать отслеживать прогресс</p>
        </div>
      )}

      <ul className="space-y-2">
        {sorted.map((log, i) => {
          const prev = sorted[i + 1];
          const delta = prev ? (log.weight - prev.weight) : null;
          return (
            <li key={log.id} className="card flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-stone-400">{log.date}</p>
                <p className="font-semibold text-stone-800 text-lg tabular-nums">
                  {log.weight} <span className="text-sm font-normal text-stone-400">кг</span>
                </p>
                {log.bodyFat && (
                  <p className="text-xs text-stone-500">жир {log.bodyFat}%</p>
                )}
              </div>
              <div className="text-right">
                {delta !== null && (
                  <span className={`text-sm font-semibold tabular-nums ${
                    delta < 0 ? 'text-forest-600' : delta > 0 ? 'text-amber-600' : 'text-stone-400'
                  }`}>
                    {delta > 0 ? '+' : ''}{delta.toFixed(1)} кг
                  </span>
                )}
                {log.method && (
                  <p className="text-xs text-stone-400 mt-0.5">{log.method}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
