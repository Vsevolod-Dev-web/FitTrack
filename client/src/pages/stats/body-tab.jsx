import {
  ResponsiveContainer, ComposedChart, LineChart, Line, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, Area,
} from 'recharts';
import {
  buildWeightSeries, buildCompositionSeries, buildMeasurementSeries,
  MEASURE_LINES, fmtTick,
} from './chart-helpers.js';

// ─── Tooltip helpers ─────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-stone-200 rounded-xl shadow-md px-3 py-2 text-xs space-y-1">
      <p className="font-semibold text-stone-600">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          <span className="text-stone-500">{p.name}:</span>
          <span className="font-semibold text-stone-800">{p.value} {p.unit ?? ''}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Блок: вес + скользящее среднее ─────────────────────────────────────────

export function WeightChart({ bodyLogs, days }) {
  const data = buildWeightSeries(bodyLogs);
  if (!data.length) return <Empty text="Нет замеров веса" />;

  return (
    <div className="card space-y-3">
      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Динамика веса</p>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
          <XAxis dataKey="date" tickFormatter={d => fmtTick(d, days)} tick={{ fontSize: 10, fill: '#a8a29e' }} />
          <YAxis tick={{ fontSize: 10, fill: '#a8a29e' }} domain={['auto', 'auto']} />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="weight" name="Вес" fill="#d6d3d1" radius={[3, 3, 0, 0]} unit="кг" />
          <Line
            type="monotone" dataKey="ma" name="Тренд (7д)"
            stroke="#16a34a" strokeWidth={2} dot={false} unit="кг"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Блок: состав тела ───────────────────────────────────────────────────────

export function CompositionChart({ bodyLogs, days }) {
  const data = buildCompositionSeries(bodyLogs);
  if (!data.length) return <Empty text="Нет данных о % жира" />;

  return (
    <div className="card space-y-3">
      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Состав тела</p>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
          <XAxis dataKey="date" tickFormatter={d => fmtTick(d, days)} tick={{ fontSize: 10, fill: '#a8a29e' }} />
          <YAxis tick={{ fontSize: 10, fill: '#a8a29e' }} />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area
            type="monotone" dataKey="leanMass" name="Сухая масса"
            fill="#bbf7d0" stroke="#16a34a" strokeWidth={2} unit="кг" stackId="a"
          />
          <Area
            type="monotone" dataKey="fatMass" name="Жировая масса"
            fill="#fde68a" stroke="#d97706" strokeWidth={2} unit="кг" stackId="a"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Блок: обхваты ───────────────────────────────────────────────────────────

export function MeasurementsChart({ bodyLogs, days }) {
  const data = buildMeasurementSeries(bodyLogs);
  if (!data.length) return <Empty text="Нет данных обхватов" />;

  return (
    <div className="card space-y-3">
      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Обхваты (см)</p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
          <XAxis dataKey="date" tickFormatter={d => fmtTick(d, days)} tick={{ fontSize: 10, fill: '#a8a29e' }} />
          <YAxis tick={{ fontSize: 10, fill: '#a8a29e' }} domain={['auto', 'auto']} />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {MEASURE_LINES.map(m => (
            <Line
              key={m.key}
              type="monotone" dataKey={m.key} name={m.label}
              stroke={m.color} strokeWidth={2} dot={{ r: 3 }} unit="см"
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function Empty({ text }) {
  return (
    <div className="card flex items-center justify-center h-28 text-stone-400 text-sm">{text}</div>
  );
}
