import { BarChart2 } from 'lucide-react';

export default function StatsPage() {
  return (
    <div className="space-y-5">
      <h1 className="page-title">Статистика</h1>
      <div className="empty-state">
        <BarChart2 size={36} className="mx-auto mb-3 text-stone-300" />
        <p className="font-medium text-stone-500">Графики появятся после добавления данных</p>
        <p className="text-stone-400 text-xs mt-1">Добавь замеры тела и журнал питания</p>
      </div>
    </div>
  );
}
