import { useTraining } from '../../hooks/use-training.js';

export default function TrainingPage() {
  const { data: logs = [], isLoading } = useTraining();
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Тренировки</h1>
      {isLoading && <p className="text-gray-400">Загрузка...</p>}
      {sorted.length === 0 && !isLoading && (
        <p className="text-gray-500 text-sm">Нет тренировок. Добавь первую!</p>
      )}
      <ul className="space-y-2">
        {sorted.map(log => (
          <li key={log.id} className="bg-gray-900 rounded-lg p-3 border border-gray-800 text-sm">
            <span className="font-medium">{log.date}</span>
            {' — '}
            {log.type}, {log.duration} мин
          </li>
        ))}
      </ul>
    </div>
  );
}
