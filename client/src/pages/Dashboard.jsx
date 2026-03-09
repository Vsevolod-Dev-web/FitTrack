import { Flame, Dumbbell, Droplets, TrendingDown, TrendingUp, Leaf } from 'lucide-react';
import { useAppStore } from '../store/app-store.js';

const MODE_LABELS = {
  cutting:       { label: 'Катинг',       icon: TrendingDown, color: 'badge-amber' },
  bulking:       { label: 'Булкинг',      icon: TrendingUp,   color: 'badge-green' },
  recomposition: { label: 'Рекомпозиция', icon: Leaf,         color: 'badge-stone' },
};

export default function Dashboard() {
  const { profile, latestBodyLog, derived } = useAppStore();
  const mode = profile?.currentMode;
  const modeInfo = MODE_LABELS[mode];

  return (
    <div className="space-y-5">
      {/* Заголовок */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">
            {profile?.name ? `Привет, ${profile.name} 👋` : 'Добро пожаловать'}
          </h1>
          <p className="text-stone-500 text-sm mt-0.5">Сегодня хороший день для прогресса</p>
        </div>
        {modeInfo && (
          <span className={modeInfo.color}>
            <modeInfo.icon size={11} />
            {modeInfo.label}
          </span>
        )}
      </div>

      {/* Баннер-подсказка */}
      {!profile?.name && (
        <div className="card border-l-4 border-l-amber-400 bg-amber-50 flex gap-3 items-start">
          <span className="text-lg">🌱</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">Начнём?</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Заполни профиль в «Настройках» — и все нормы пересчитаются автоматически.
            </p>
          </div>
        </div>
      )}

      {/* Главные показатели */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <MetricCard
          icon={Flame}
          iconColor="text-orange-500"
          iconBg="bg-orange-50"
          label="Калории (цель)"
          value={derived ? `${derived.targetCalories}` : '—'}
          unit={derived ? 'ккал' : ''}
        />
        <MetricCard
          icon={Flame}
          iconColor="text-amber-500"
          iconBg="bg-amber-50"
          label="TDEE"
          value={derived ? `${derived.tdee}` : '—'}
          unit={derived ? 'ккал' : ''}
        />
        <MetricCard
          icon={Dumbbell}
          iconColor="text-forest-600"
          iconBg="bg-forest-50"
          label="Белок"
          value={derived ? `${derived.macros.protein}` : '—'}
          unit={derived ? 'г' : ''}
        />
        <MetricCard
          icon={Droplets}
          iconColor="text-sky-500"
          iconBg="bg-sky-50"
          label="Вес"
          value={latestBodyLog ? `${latestBodyLog.weight}` : '—'}
          unit={latestBodyLog ? 'кг' : ''}
        />
        <MetricCard
          iconEmoji="🔥"
          label="% жира"
          value={latestBodyLog?.bodyFat ? `${latestBodyLog.bodyFat}` : '—'}
          unit={latestBodyLog?.bodyFat ? '%' : ''}
        />
        <MetricCard
          iconEmoji="💪"
          label="Сухая масса"
          value={derived ? `${derived.leanMass.toFixed(1)}` : '—'}
          unit={derived ? 'кг' : ''}
        />
      </div>

      {/* Макросы */}
      {derived && (
        <div className="card">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">
            Макросы на день
          </p>
          <div className="grid grid-cols-3 gap-3">
            <MacroBar label="Белок" grams={derived.macros.protein} color="bg-forest-500" max={300} />
            <MacroBar label="Жиры" grams={derived.macros.fat} color="bg-amber-400" max={200} />
            <MacroBar label="Углеводы" grams={derived.macros.carbs} color="bg-sky-400" max={500} />
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon: Icon, iconEmoji, iconColor, iconBg, label, value, unit }) {
  return (
    <div className="card flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {Icon
          ? <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconBg}`}>
              <Icon size={14} className={iconColor} />
            </span>
          : <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-stone-100 text-base leading-none">
              {iconEmoji}
            </span>
        }
        <span className="text-xs text-stone-500">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-stone-800 tabular-nums">{value}</span>
        {unit && <span className="text-xs text-stone-400">{unit}</span>}
      </div>
    </div>
  );
}

function MacroBar({ label, grams, color, max }) {
  const pct = Math.min(100, Math.round((grams / max) * 100));
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-stone-600 font-medium">{label}</span>
        <span className="text-stone-500 tabular-nums">{grams}г</span>
      </div>
      <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
