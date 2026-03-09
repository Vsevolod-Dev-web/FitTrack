import { TrendingDown, TrendingUp, Leaf, Flame, Droplets, Target, Zap } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts';
import { useAppStore } from '../store/app-store.js';
import { useDashboardData } from '../hooks/use-dashboard-data.js';
import {
  buildSparkline, calcStreak, calcActualWeeklyChange,
  calcAvgMacros,
} from './stats/chart-helpers.js';
import { calcWeeksToGoal } from '../utils/calculations.js';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

// ─── Режим ───────────────────────────────────────────────────────────────────

const MODE_INFO = {
  cutting:       { label: 'Катинг',       icon: TrendingDown, color: 'badge-amber' },
  bulking:       { label: 'Булкинг',      icon: TrendingUp,   color: 'badge-green' },
  recomposition: { label: 'Рекомпозиция', icon: Leaf,         color: 'badge-stone' },
};

// ─── Сегодняшний прогресс питания ────────────────────────────────────────────

function todayTotals(todayLogs) {
  if (!todayLogs.length) return null;
  // todayLogs может содержать несколько объектов (один на каждый приём пищи)
  // или один с totals. Берём первый, который имеет totals.
  const log = todayLogs[0];
  return log?.totals ?? null;
}

// ─── Виджет: маленькая карточка ──────────────────────────────────────────────

function Widget({ icon: Icon, emoji, iconColor, iconBg, label, value, unit, sub, children }) {
  return (
    <div className="card flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {Icon
          ? <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconBg}`}>
              <Icon size={14} className={iconColor} />
            </span>
          : <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-stone-100 text-base leading-none">{emoji}</span>
        }
        <span className="text-xs text-stone-500">{label}</span>
      </div>
      {children ?? (
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-stone-800 tabular-nums">{value}</span>
          {unit && <span className="text-xs text-stone-400">{unit}</span>}
        </div>
      )}
      {sub && <p className="text-[11px] text-stone-400">{sub}</p>}
    </div>
  );
}

// ─── Виджет: прогресс калорий сегодня ────────────────────────────────────────

function CaloriesTodayWidget({ todayLogs, targetCalories }) {
  const totals = todayTotals(todayLogs);
  const actual = totals?.calories ?? 0;
  const pct    = targetCalories ? Math.min(100, Math.round((actual / targetCalories) * 100)) : 0;
  const over   = actual > targetCalories;

  return (
    <div className="card space-y-2">
      <div className="flex items-center gap-2">
        <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-orange-50">
          <Flame size={14} className="text-orange-500" />
        </span>
        <span className="text-xs text-stone-500">Калории сегодня</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold tabular-nums ${over ? 'text-red-500' : 'text-stone-800'}`}>
          {actual}
        </span>
        <span className="text-xs text-stone-400">/ {targetCalories} ккал</span>
      </div>
      <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${over ? 'bg-red-400' : 'bg-orange-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[11px] text-stone-400">{pct}% от цели</p>
    </div>
  );
}

// ─── Виджет: макросы сегодня ──────────────────────────────────────────────────

function MacrosTodayWidget({ todayLogs, macros }) {
  const totals = todayTotals(todayLogs);

  const items = [
    { label: 'Б', actual: totals?.protein ?? 0, target: macros?.protein ?? 0, color: 'bg-forest-500' },
    { label: 'Ж', actual: totals?.fat     ?? 0, target: macros?.fat     ?? 0, color: 'bg-amber-400'  },
    { label: 'У', actual: totals?.carbs   ?? 0, target: macros?.carbs   ?? 0, color: 'bg-sky-400'    },
  ];

  return (
    <div className="card space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-stone-500 font-semibold">Макросы сегодня</span>
      </div>
      <div className="space-y-1.5">
        {items.map(({ label, actual, target, color }) => {
          const pct = target ? Math.min(100, Math.round((actual / target) * 100)) : 0;
          return (
            <div key={label} className="space-y-0.5">
              <div className="flex justify-between text-xs">
                <span className="text-stone-500">{label}</span>
                <span className="tabular-nums text-stone-600">{actual}<span className="text-stone-400">/{target}г</span></span>
              </div>
              <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Виджет: мини-спарклайн веса ─────────────────────────────────────────────

function WeightSparklineWidget({ bodyLogs, latestBodyLog }) {
  const sparkData = buildSparkline(bodyLogs);
  const change    = calcActualWeeklyChange(bodyLogs);

  return (
    <div className="card space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚖️</span>
          <span className="text-xs text-stone-500">Вес (30 дней)</span>
        </div>
        {change !== null && (
          <span className={`text-xs font-semibold ${change < 0 ? 'text-forest-600' : change > 0 ? 'text-amber-600' : 'text-stone-400'}`}>
            {change > 0 ? '+' : ''}{change.toFixed(2)} кг/нед
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-stone-800 tabular-nums">
          {latestBodyLog?.weight ?? '—'}
        </span>
        <span className="text-xs text-stone-400">кг</span>
      </div>
      {sparkData.length >= 2 ? (
        <ResponsiveContainer width="100%" height={50}>
          <LineChart data={sparkData}>
            <Line
              type="monotone" dataKey="weight"
              stroke="#16a34a" strokeWidth={2} dot={false}
            />
            <Tooltip
              content={({ active, payload }) =>
                active && payload?.length
                  ? <div className="bg-white border border-stone-200 rounded-lg px-2 py-1 text-xs shadow">
                      {payload[0].payload.date}: <b>{payload[0].value} кг</b>
                    </div>
                  : null
              }
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-xs text-stone-300 italic">Мало данных для графика</p>
      )}
    </div>
  );
}

// ─── Виджет: прогноз ─────────────────────────────────────────────────────────

function ForecastWidget({ profile, bodyLogs }) {
  const current = bodyLogs[bodyLogs.length - 1]?.weight;
  const target  = profile?.goals?.targetWeight;
  const weekly  = calcActualWeeklyChange(bodyLogs);

  if (!current || !target || weekly === null || weekly === 0) {
    return (
      <Widget emoji="🎯" label="Прогноз цели">
        <p className="text-sm text-stone-400">Недостаточно данных</p>
      </Widget>
    );
  }

  const weeks = calcWeeksToGoal(current, target, weekly);
  const diff  = Math.abs(current - target);

  if (weeks === null) {
    return (
      <Widget emoji="🎯" label="Прогноз цели">
        <p className="text-sm text-stone-400">Темп не ведёт к цели</p>
      </Widget>
    );
  }

  const months = (weeks / 4.33).toFixed(1);

  return (
    <div className="card space-y-2">
      <div className="flex items-center gap-2">
        <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-violet-50">
          <Target size={14} className="text-violet-600" />
        </span>
        <span className="text-xs text-stone-500">Прогноз цели</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-stone-800 tabular-nums">~{Math.round(weeks)}</span>
        <span className="text-xs text-stone-400">нед</span>
      </div>
      <p className="text-[11px] text-stone-400">
        До {target} кг · осталось {diff.toFixed(1)} кг
      </p>
      <p className="text-[11px] text-stone-400">≈ {months} мес при текущем темпе</p>
    </div>
  );
}

// ─── Виджет: рекомпозиция (два трекера) ──────────────────────────────────────

function RecompWidget({ latestBodyLog, derived }) {
  if (!latestBodyLog || !derived) return null;

  const fatPct   = latestBodyLog.bodyFat;
  const leanMass = derived.leanMass;
  const weight   = latestBodyLog.weight;

  return (
    <div className="card space-y-3">
      <div className="flex items-center gap-2">
        <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-50">
          <Zap size={14} className="text-emerald-600" />
        </span>
        <span className="text-xs text-stone-500">Рекомпозиция</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-0.5">
          <p className="text-[10px] text-stone-400 uppercase">Сухая масса</p>
          <p className="text-xl font-bold text-forest-700 tabular-nums">{leanMass.toFixed(1)} <span className="text-xs font-normal text-stone-400">кг</span></p>
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] text-stone-400 uppercase">Жир</p>
          <p className="text-xl font-bold text-amber-600 tabular-nums">
            {fatPct ?? '—'}<span className="text-xs font-normal text-stone-400">{fatPct ? '%' : ''}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Виджет: стрик питания ───────────────────────────────────────────────────

function StreakWidget({ allNutrition }) {
  const streak = calcStreak(allNutrition);
  const avg    = calcAvgMacros(allNutrition);

  return (
    <div className="card space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xl">🔥</span>
        <span className="text-xs text-stone-500">Стрик питания</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-orange-500 tabular-nums">{streak}</span>
        <span className="text-xs text-stone-400">{streak === 1 ? 'день' : streak < 5 ? 'дня' : 'дней'}</span>
      </div>
      {avg && (
        <p className="text-[11px] text-stone-400">
          Ср. {avg.calories} ккал · {avg.protein}г белка
        </p>
      )}
    </div>
  );
}

// ─── Главная страница ─────────────────────────────────────────────────────────

export default function Dashboard() {
  const { profile, latestBodyLog, derived } = useAppStore();
  const { bodyLogs, todayNutrition, allNutrition, trainingLogs } = useDashboardData();

  const mode     = profile?.currentMode;
  const modeInfo = MODE_INFO[mode];
  const today    = format(new Date(), 'd MMMM', { locale: ru });

  const sortedBody = [...bodyLogs].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-5">
      {/* Заголовок */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">
            {profile?.name ? `Привет, ${profile.name} 👋` : 'Добро пожаловать'}
          </h1>
          <p className="text-stone-500 text-sm mt-0.5">{today}</p>
        </div>
        {modeInfo && (
          <span className={modeInfo.color}>
            <modeInfo.icon size={11} />
            {modeInfo.label}
          </span>
        )}
      </div>

      {/* Баннер первого запуска */}
      {!profile?.name && (
        <div className="card border-l-4 border-l-amber-400 bg-amber-50 flex gap-3 items-start">
          <span className="text-lg">🌱</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">Начнём?</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Заполни профиль в «Настройках» — все нормы пересчитаются автоматически.
            </p>
          </div>
        </div>
      )}

      {/* Строка 1: Калории + Макросы (2 колонки) */}
      {derived && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <CaloriesTodayWidget
            todayLogs={todayNutrition}
            targetCalories={derived.targetCalories}
          />
          <MacrosTodayWidget
            todayLogs={todayNutrition}
            macros={derived.macros}
          />
        </div>
      )}

      {/* Строка 2: Вес-спарклайн + Прогноз */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <WeightSparklineWidget bodyLogs={sortedBody} latestBodyLog={latestBodyLog} />
        <ForecastWidget profile={profile} bodyLogs={sortedBody} />
      </div>

      {/* Строка 3: Рекомпозиция + Стрик */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {mode === 'recomposition' && derived
          ? <RecompWidget latestBodyLog={latestBodyLog} derived={derived} />
          : derived && (
            <div className="grid grid-cols-2 gap-3">
              <Widget
                icon={Flame} iconColor="text-orange-500" iconBg="bg-orange-50"
                label="Цель (ккал)"
                value={derived.targetCalories} unit="ккал"
              />
              <Widget
                emoji="💪" label="Сухая масса"
                value={derived.leanMass.toFixed(1)} unit="кг"
              />
            </div>
          )
        }
        <StreakWidget allNutrition={allNutrition} />
      </div>

      {/* Строка 4: быстрые метрики */}
      {derived && (
        <div className="grid grid-cols-3 gap-3">
          <Widget
            icon={Droplets} iconColor="text-sky-500" iconBg="bg-sky-50"
            label="TDEE"
            value={derived.tdee} unit="ккал"
          />
          <Widget
            emoji="🥩" label="Белок"
            value={derived.macros.protein} unit="г"
          />
          <Widget
            emoji="📊" label="Тренировок"
            value={trainingLogs.length} unit=""
          />
        </div>
      )}
    </div>
  );
}
