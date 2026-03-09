import { format, addDays, subDays, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Salad, Loader2 } from 'lucide-react';
import { useNutritionDay } from '../../hooks/use-nutrition-day.js';
import { useAppStore }     from '../../store/app-store.js';
import { addItemToMeal, removeItemFromMeal, setWater } from './nutrition-utils.js';
import MacroRings    from './macro-rings.jsx';
import MealSection   from './meal-section.jsx';
import WaterTracker  from './water-tracker.jsx';

// ─── Навигатор даты ───────────────────────────────────────────────────────────

function DateNav({ date, onPrev, onNext }) {
  const d = parseISO(date);
  const today = format(new Date(), 'yyyy-MM-dd');
  const isToday = date === today;

  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={onPrev}
        className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 hover:text-stone-700 transition-colors">
        <ChevronLeft size={16} />
      </button>

      <div className="text-center flex-1">
        <p className="text-sm font-semibold text-stone-800 capitalize">
          {isToday ? 'Сегодня' : format(d, 'EEEE', { locale: ru })}
        </p>
        <p className="text-xs text-stone-400">{format(d, 'd MMMM yyyy', { locale: ru })}</p>
      </div>

      <button
        type="button" onClick={onNext}
        disabled={isToday}
        className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 hover:text-stone-700
                   transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

// ─── Главная страница ─────────────────────────────────────────────────────────

export default function NutritionPage() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const derived = useAppStore(s => s.derived);

  const { log, isLoading, isSaving, saveLog } = useNutritionDay(date);

  function prevDay() { setDate(d => format(subDays(parseISO(d), 1), 'yyyy-MM-dd')); }
  function nextDay() {
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    setDate(d => {
      const next = format(addDays(parseISO(d), 1), 'yyyy-MM-dd');
      return next <= tomorrow ? next : d;
    });
  }

  // Цели из Zustand
  const targets = derived
    ? {
        calories: derived.targetCalories,
        protein:  derived.macros.protein,
        fat:      derived.macros.fat,
        carbs:    derived.macros.carbs,
      }
    : { calories: 0, protein: 0, fat: 0, carbs: 0 };

  function handleAddItem(mealName, item) {
    saveLog(addItemToMeal(log, mealName, item));
  }

  function handleRemoveItem(mealName, idx) {
    saveLog(removeItemFromMeal(log, mealName, idx));
  }

  function handleWater(ml) {
    saveLog(setWater(log, ml));
  }

  return (
    <div className="space-y-4">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <h1 className="page-title">Питание</h1>
        {isSaving && (
          <div className="flex items-center gap-1.5 text-xs text-stone-400">
            <Loader2 size={12} className="animate-spin" />
            Сохранение...
          </div>
        )}
      </div>

      {/* Навигатор */}
      <DateNav date={date} onPrev={prevDay} onNext={nextDay} />

      {/* Загрузка */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-stone-300" />
        </div>
      )}

      {!isLoading && log && (
        <>
          {/* Кольцевые диаграммы макросов */}
          {!derived && (
            <div className="card border-amber-200 bg-amber-50 text-amber-800 text-sm flex gap-2 items-start">
              <span>🌱</span>
              <p>Заполни профиль в Настройках, чтобы видеть нормы</p>
            </div>
          )}
          <MacroRings totals={log.totals} targets={targets} />

          {/* Приёмы пищи */}
          {log.meals.map(meal => (
            <MealSection
              key={meal.name}
              meal={meal}
              onAddItem={(item) => handleAddItem(meal.name, item)}
              onRemoveItem={(idx) => handleRemoveItem(meal.name, idx)}
            />
          ))}

          {/* Вода */}
          <WaterTracker
            water={log.water ?? 0}
            onUpdate={handleWater}
          />

          {/* Итог дня */}
          {log.totals.calories > 0 && (
            <DaySummary totals={log.totals} targets={targets} />
          )}
        </>
      )}

      {/* Пустое состояние */}
      {!isLoading && log && log.totals.calories === 0 && (
        <div className="empty-state">
          <Salad size={36} className="mx-auto mb-3 text-stone-300" />
          <p className="font-medium text-stone-500">День пустой</p>
          <p className="text-xs text-stone-400 mt-1">
            Нажми «Добавить» в любом приёме пищи
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Итог дня ─────────────────────────────────────────────────────────────────

function DaySummary({ totals, targets }) {
  const remaining = {
    calories: targets.calories - totals.calories,
    protein:  targets.protein  - totals.protein,
    fat:      targets.fat      - totals.fat,
    carbs:    targets.carbs    - totals.carbs,
  };

  return (
    <div className="card bg-stone-50 border-stone-200">
      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">
        Итог дня
      </p>
      <div className="grid grid-cols-4 gap-2 text-center">
        {[
          { label: 'Калории', actual: totals.calories, rem: remaining.calories, unit: 'ккал' },
          { label: 'Белок',   actual: totals.protein,  rem: remaining.protein,  unit: 'г'    },
          { label: 'Жиры',    actual: totals.fat,      rem: remaining.fat,      unit: 'г'    },
          { label: 'Углев.',  actual: totals.carbs,    rem: remaining.carbs,    unit: 'г'    },
        ].map(({ label, actual, rem, unit }) => (
          <div key={label}>
            <p className="text-[10px] text-stone-400">{label}</p>
            <p className="text-sm font-bold text-stone-800 tabular-nums">{actual}</p>
            <p className={`text-[11px] tabular-nums ${
              rem >= 0 ? 'text-forest-600' : 'text-red-500'
            }`}>
              {rem >= 0 ? `−${rem}` : `+${Math.abs(rem)}`}{unit}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
