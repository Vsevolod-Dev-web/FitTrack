import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api.js';
import { useAppStore } from '../store/app-store.js';
import { filterByPeriod, PERIODS } from './stats/chart-helpers.js';
import { WeightChart, CompositionChart, MeasurementsChart } from './stats/body-tab.jsx';
import { CaloriesChart, AvgMacros } from './stats/nutrition-tab.jsx';
import { MuscleTonnageChart, ExerciseProgressChart } from './stats/training-tab.jsx';
import ExportTab from './stats/export-tab.jsx';

const TABS = [
  { key: 'body',      label: 'Тело'       },
  { key: 'nutrition', label: 'Питание'    },
  { key: 'training',  label: 'Тренировки' },
  { key: 'export',    label: 'Экспорт'    },
];

export default function StatsPage() {
  const [tab, setTab]       = useState('body');
  const [period, setPeriod] = useState(30);
  const { derived } = useAppStore();

  const { data: bodyLogs     = [] } = useQuery({ queryKey: ['body-logs'],         queryFn: api.getBodyLogs,        staleTime: 60_000 });
  const { data: nutritionLogs = [] } = useQuery({ queryKey: ['nutrition-logs-all'], queryFn: () => api.getNutritionLogs(), staleTime: 60_000 });
  const { data: trainingLogs = [] } = useQuery({ queryKey: ['training-logs'],      queryFn: api.getTrainingLogs,    staleTime: 60_000 });

  const filteredBody      = filterByPeriod(bodyLogs,      period);
  const filteredNutrition = filterByPeriod(nutritionLogs, period);
  const filteredTraining  = filterByPeriod(trainingLogs,  period);

  return (
    <div className="space-y-5">
      {/* Заголовок */}
      <h1 className="page-title">Статистика</h1>

      {/* Период */}
      <div className="flex gap-2 flex-wrap">
        {PERIODS.map(p => (
          <button
            key={p.label}
            type="button"
            onClick={() => setPeriod(p.days)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${
              period === p.days
                ? 'bg-forest-600 text-white border-forest-600'
                : 'bg-white text-stone-600 border-stone-200 hover:border-forest-300'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Табы */}
      <div className="flex border-b border-stone-200 gap-4">
        {TABS.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`pb-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? 'border-forest-600 text-forest-700'
                : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Содержимое вкладки */}
      {tab === 'body' && (
        <div className="space-y-4">
          <WeightChart      bodyLogs={filteredBody} days={period} />
          <CompositionChart bodyLogs={filteredBody} days={period} />
          <MeasurementsChart bodyLogs={filteredBody} days={period} />
        </div>
      )}

      {tab === 'nutrition' && (
        <div className="space-y-4">
          <CaloriesChart
            nutritionLogs={filteredNutrition}
            targetCalories={derived?.targetCalories ?? 2000}
            days={period}
          />
          <AvgMacros nutritionLogs={filteredNutrition} />
        </div>
      )}

      {tab === 'training' && (
        <div className="space-y-4">
          <MuscleTonnageChart   trainingLogs={filteredTraining} />
          <ExerciseProgressChart trainingLogs={filteredTraining} days={period} />
        </div>
      )}

      {tab === 'export' && <ExportTab />}
    </div>
  );
}
