import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine,
} from 'recharts';
import { buildCalorieSeries, calcAvgMacros, fmtTick } from './chart-helpers.js';

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-stone-200 rounded-xl shadow-md px-3 py-2 text-xs space-y-1">
      <p className="font-semibold text-stone-600">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          <span className="text-stone-500">{p.name}:</span>
          <span className="font-semibold text-stone-800">{p.value} ккал</span>
        </div>
      ))}
    </div>
  );
}

// ─── Калории: план vs факт ────────────────────────────────────────────────────

export function CaloriesChart({ nutritionLogs, targetCalories, days }) {
  const data = buildCalorieSeries(nutritionLogs, targetCalories);
  if (!data.length) return <Empty text="Нет данных о питании" />;

  return (
    <div className="card space-y-3">
      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Калории: план vs факт</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
          <XAxis dataKey="date" tickFormatter={d => fmtTick(d, days)} tick={{ fontSize: 10, fill: '#a8a29e' }} />
          <YAxis tick={{ fontSize: 10, fill: '#a8a29e' }} />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <ReferenceLine y={targetCalories} stroke="#16a34a" strokeDasharray="4 2" strokeWidth={1.5} />
          <Bar dataKey="actual" name="Факт" fill="#60a5fa" radius={[3, 3, 0, 0]} />
          <Bar dataKey="target" name="Цель" fill="#bbf7d0" radius={[3, 3, 0, 0]} opacity={0.4} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Средние макросы ─────────────────────────────────────────────────────────

export function AvgMacros({ nutritionLogs }) {
  const avg = calcAvgMacros(nutritionLogs);
  if (!avg) return <Empty text="Нет данных о питании" />;

  const items = [
    { label: 'Калории', value: avg.calories, unit: 'ккал', color: 'bg-orange-400' },
    { label: 'Белок',   value: avg.protein,  unit: 'г',    color: 'bg-forest-500' },
    { label: 'Жиры',    value: avg.fat,       unit: 'г',    color: 'bg-amber-400'  },
    { label: 'Углеводы',value: avg.carbs,     unit: 'г',    color: 'bg-sky-400'    },
  ];

  return (
    <div className="card space-y-3">
      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Средние макросы за период</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map(({ label, value, unit, color }) => (
          <div key={label} className="space-y-1">
            <p className="text-[10px] text-stone-400 uppercase tracking-wide">{label}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-stone-800 tabular-nums">{value}</span>
              <span className="text-xs text-stone-400">{unit}</span>
            </div>
            <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <div className={`h-full ${color} rounded-full`} style={{ width: '100%' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Empty({ text }) {
  return (
    <div className="card flex items-center justify-center h-28 text-stone-400 text-sm">{text}</div>
  );
}
