import { PieChart, Pie, Cell } from 'recharts';
import { macroStatus, STATUS_COLORS } from './nutrition-utils.js';

// ─── Одно кольцо ────────────────────────────────────────────────────────────

function Ring({ actual, target, color, label, unit = 'г', size = 72 }) {
  const status = macroStatus(actual, target);
  const fillColor = status === 'neutral' ? color : STATUS_COLORS[status];
  const isOver = actual > target && target > 0;
  const inner = Math.round(size * 0.34);
  const outer = Math.round(size * 0.47);

  const data = isOver || target === 0
    ? [{ value: 1 }]
    : [
        { value: actual },
        { value: Math.max(0, target - actual) },
      ];

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <PieChart width={size} height={size}>
          <Pie
            data={data}
            cx={size / 2} cy={size / 2}
            innerRadius={inner} outerRadius={outer}
            startAngle={90} endAngle={-270}
            dataKey="value"
            strokeWidth={0}
            isAnimationActive={false}
          >
            {isOver || target === 0
              ? <Cell fill={fillColor} />
              : <>
                  <Cell fill={fillColor} />
                  <Cell fill="#e7e5e4" />
                </>
            }
          </Pie>
        </PieChart>
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none gap-0.5">
          <span className="text-sm font-bold text-stone-800 tabular-nums">{actual}</span>
          <span className="text-[9px] text-stone-400">{unit}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-[11px] font-semibold text-stone-700">{label}</p>
        <p className="text-[10px] text-stone-400">{target}{unit}</p>
      </div>
    </div>
  );
}

// ─── Кольцо калорий (большое + горизонтальный бар) ──────────────────────────

function CaloriesBar({ actual, target }) {
  const pct = target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : 0;
  const status = macroStatus(actual, target);
  const barColor =
    status === 'good' ? 'bg-forest-500' :
    status === 'warn' ? 'bg-amber-400'  :
    status === 'over' ? 'bg-red-500'    : 'bg-stone-300';

  return (
    <div className="flex-1 space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-stone-800 tabular-nums">{actual}</span>
          <span className="text-sm text-stone-400">ккал</span>
        </div>
        <span className="text-xs text-stone-500">
          из <span className="font-semibold text-stone-700">{target}</span> ккал
        </span>
      </div>

      <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="text-xs text-stone-500">
        {pct}% дневной нормы
        {actual > target && (
          <span className="text-red-500 ml-1">+{actual - target} сверх нормы</span>
        )}
        {actual <= target && target - actual > 0 && (
          <span className="text-stone-400 ml-1">осталось {target - actual} ккал</span>
        )}
      </p>
    </div>
  );
}

// ─── Экспортируемый блок колец ───────────────────────────────────────────────

export default function MacroRings({ totals, targets }) {
  const { calories = 0, protein = 0, fat = 0, carbs = 0 } = totals ?? {};
  const t = targets ?? {};

  return (
    <div className="card space-y-4">
      {/* Калории — горизонтально */}
      <div className="flex items-center gap-4">
        <Ring
          actual={calories} target={t.calories ?? 0}
          color="#22c55e" label="Ккал" unit=" " size={80}
        />
        <CaloriesBar actual={calories} target={t.calories ?? 0} />
      </div>

      {/* Макросы — три кольца */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-stone-100">
        <Ring actual={protein} target={t.protein ?? 0} color="#16a34a" label="Белок" />
        <Ring actual={fat}     target={t.fat     ?? 0} color="#f59e0b" label="Жиры"  />
        <Ring actual={carbs}   target={t.carbs   ?? 0} color="#0ea5e9" label="Углеводы" />
      </div>
    </div>
  );
}
