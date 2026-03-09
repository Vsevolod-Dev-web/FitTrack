import { useBodyData } from '../../hooks/use-body-data.js';

export default function BodyPage() {
  const { data: logs = [], isLoading } = useBodyData();
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Замеры тела</h1>
      {isLoading && <p className="text-gray-400">Загрузка...</p>}
      {sorted.length === 0 && !isLoading && (
        <p className="text-gray-500 text-sm">Нет замеров. Добавь первый!</p>
      )}
      <ul className="space-y-2">
        {sorted.map(log => (
          <li key={log.id} className="bg-gray-900 rounded-lg p-3 border border-gray-800 text-sm">
            <span className="font-medium">{log.date}</span>
            {' — '}
            {log.weight} кг
            {log.bodyFat ? `, жир ${log.bodyFat}%` : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}
