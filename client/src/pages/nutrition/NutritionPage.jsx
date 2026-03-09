import { Salad } from 'lucide-react';
import { useNutrition } from '../../hooks/use-nutrition.js';
import { format } from 'date-fns';

export default function NutritionPage() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: logs = [], isLoading } = useNutrition(today);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Питание</h1>
        <span className="text-xs text-stone-400 bg-stone-100 px-2.5 py-1 rounded-full">{today}</span>
      </div>

      {isLoading && <p className="text-stone-400 text-sm">Загрузка...</p>}

      {logs.length === 0 && !isLoading && (
        <div className="empty-state">
          <Salad size={36} className="mx-auto mb-3 text-stone-300" />
          <p className="font-medium text-stone-500">Нет записей за сегодня</p>
          <p className="text-stone-400 text-xs mt-1">Добавь первый приём пищи</p>
        </div>
      )}
    </div>
  );
}
