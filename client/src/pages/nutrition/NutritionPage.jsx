import { useNutrition } from '../../hooks/use-nutrition.js';
import { format } from 'date-fns';

export default function NutritionPage() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: logs = [], isLoading } = useNutrition(today);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Питание</h1>
      <p className="text-gray-400 text-sm">{today}</p>
      {isLoading && <p className="text-gray-400">Загрузка...</p>}
      {logs.length === 0 && !isLoading && (
        <p className="text-gray-500 text-sm">Нет записей за сегодня.</p>
      )}
    </div>
  );
}
