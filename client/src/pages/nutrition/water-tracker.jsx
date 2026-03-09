import { useState } from 'react';
import { Droplets, Plus } from 'lucide-react';

const QUICK_AMOUNTS = [200, 300, 500];

export default function WaterTracker({ water = 0, onUpdate }) {
  const [custom, setCustom] = useState('');
  const target = 2500; // мл
  const pct = Math.min(100, Math.round((water / target) * 100));

  function add(ml) {
    onUpdate(water + ml);
  }

  function handleCustom(e) {
    e.preventDefault();
    const ml = parseInt(custom, 10);
    if (!isNaN(ml) && ml > 0) {
      add(ml);
      setCustom('');
    }
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplets size={16} className="text-sky-500" />
          <span className="text-sm font-semibold text-stone-700">Вода</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold text-sky-600 tabular-nums">
            {water >= 1000 ? `${(water / 1000).toFixed(1)}` : water}
          </span>
          <span className="text-xs text-stone-400">
            {water >= 1000 ? 'л' : 'мл'}
          </span>
          <span className="text-xs text-stone-400">/ {target / 1000}л</span>
        </div>
      </div>

      {/* Прогресс */}
      <div className="h-2 bg-sky-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-sky-400 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Быстрые кнопки */}
      <div className="flex gap-2">
        {QUICK_AMOUNTS.map(ml => (
          <button
            key={ml} type="button"
            onClick={() => add(ml)}
            className="flex-1 flex items-center justify-center gap-1 text-xs font-medium
                       bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200
                       rounded-lg py-1.5 transition-colors"
          >
            <Plus size={11} />
            {ml}мл
          </button>
        ))}

        {/* Ручной ввод */}
        <form onSubmit={handleCustom} className="flex gap-1 flex-1">
          <input
            type="number" min="1" max="2000"
            placeholder="мл"
            className="input text-xs py-1.5 text-center"
            value={custom}
            onChange={e => setCustom(e.target.value)}
          />
          <button
            type="submit"
            className="bg-sky-500 hover:bg-sky-600 text-white rounded-lg px-2.5 text-xs transition-colors"
          >
            +
          </button>
        </form>
      </div>

      {water > 0 && (
        <button
          type="button"
          onClick={() => onUpdate(0)}
          className="text-xs text-stone-400 hover:text-red-400 transition-colors w-full text-right"
        >
          Сбросить
        </button>
      )}
    </div>
  );
}
