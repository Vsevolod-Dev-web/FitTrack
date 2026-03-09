import { useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, LineChart, Line,
} from 'recharts';
import { buildMuscleTonnage, buildExerciseProgress, fmtTick } from './chart-helpers.js';

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

// ─── Тоннаж по группам мышц ──────────────────────────────────────────────────

export function MuscleTonnageChart({ trainingLogs }) {
  const data = buildMuscleTonnage(trainingLogs);
  if (!data.length) return <Empty text="Нет данных тренировок" />;

  return (
    <div className="card space-y-3">
      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Тоннаж по группам мышц</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 8, left: 60, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: '#a8a29e' }} unit="кг" />
          <YAxis type="category" dataKey="muscle" tick={{ fontSize: 11, fill: '#78716c' }} width={60} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="tonnage" name="Тоннаж" fill="#86efac" radius={[0, 4, 4, 0]} unit="кг" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Прогресс упражнения ─────────────────────────────────────────────────────

function getExerciseNames(trainingLogs) {
  const names = new Set();
  for (const log of trainingLogs) {
    for (const ex of log.exercises ?? []) {
      if (ex.name?.trim()) names.add(ex.name.trim());
    }
  }
  return [...names].sort();
}

export function ExerciseProgressChart({ trainingLogs, days }) {
  const names = getExerciseNames(trainingLogs);
  const [selected, setSelected] = useState(names[0] ?? '');

  const data = buildExerciseProgress(trainingLogs, selected);

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Прогресс: 1RM</p>
        {names.length > 0 && (
          <select
            className="input text-xs py-1 px-2 max-w-[200px]"
            value={selected}
            onChange={e => setSelected(e.target.value)}
          >
            {names.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        )}
      </div>

      {!data.length ? (
        <div className="flex items-center justify-center h-28 text-stone-400 text-sm">
          {names.length === 0 ? 'Нет данных тренировок' : 'Нет данных для выбранного упражнения'}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
            <XAxis dataKey="date" tickFormatter={d => fmtTick(d, days)} tick={{ fontSize: 10, fill: '#a8a29e' }} />
            <YAxis tick={{ fontSize: 10, fill: '#a8a29e' }} domain={['auto', 'auto']} />
            <Tooltip content={<ChartTooltip />} />
            <Line
              type="monotone" dataKey="oneRM" name="1RM"
              stroke="#16a34a" strokeWidth={2.5} dot={{ r: 4, fill: '#16a34a' }} unit="кг"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function Empty({ text }) {
  return (
    <div className="card flex items-center justify-center h-28 text-stone-400 text-sm">{text}</div>
  );
}
