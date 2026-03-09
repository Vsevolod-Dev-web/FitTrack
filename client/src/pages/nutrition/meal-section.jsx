import { useState, useRef, useEffect } from 'react';
import { Plus, X, Search, Loader2, ExternalLink, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useFoodSearch } from '../../hooks/use-food-db.js';
import { calcItemMacros } from './nutrition-utils.js';

// ─── Строка продукта ─────────────────────────────────────────────────────────

function FoodItemRow({ item, onRemove }) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-3 rounded-lg hover:bg-stone-50 group transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-stone-800 truncate">{item.name}</span>
          <span className="text-xs text-stone-400 shrink-0">{item.grams}г</span>
        </div>
        <div className="flex gap-2 mt-0.5 text-[11px] text-stone-400">
          <span className="text-stone-600 font-medium">{item.calories} ккал</span>
          <span title="Белок">{item.protein}г б</span>
          <span title="Жиры">{item.fat}г ж</span>
          <span title="Углеводы">{item.carbs}г у</span>
        </div>
      </div>
      <button
        type="button" onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-500 transition-all shrink-0"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

// ─── Панель поиска продукта ───────────────────────────────────────────────────

function SearchPanel({ onAdd, onClose }) {
  const [query, setQuery]       = useState('');
  const [selected, setSelected] = useState(null); // выбранный продукт
  const [grams, setGrams]       = useState('100');
  const inputRef = useRef(null);
  const gramsRef = useRef(null);

  const {
    localResults, externalResults,
    isSearchingLocal, isSearchingExternal,
    search, clear, saveExternalToDb,
  } = useFoodSearch();

  useEffect(() => { inputRef.current?.focus(); }, []);

  function handleQueryChange(e) {
    const q = e.target.value;
    setQuery(q);
    setSelected(null);
    search(q);
  }

  function handleSelect(item) {
    setSelected(item);
    setGrams('100');
    clear();
    setTimeout(() => gramsRef.current?.focus(), 50);
  }

  function handleAdd(e) {
    e.preventDefault();
    if (!selected) return;
    const g = parseFloat(grams);
    if (isNaN(g) || g <= 0) return;
    const macros = calcItemMacros(selected.per100g, g);
    onAdd({
      foodId:   selected.id ?? null,
      name:     selected.name,
      grams:    g,
      ...macros,
    });
    if (selected.source === 'openfoodfacts') saveExternalToDb(selected);
    onClose();
  }

  const hasResults = localResults.length > 0 || externalResults.length > 0;
  const preview    = selected && parseFloat(grams) > 0
    ? calcItemMacros(selected.per100g, parseFloat(grams))
    : null;

  return (
    <div className="border border-stone-200 rounded-xl bg-white shadow-md overflow-hidden">
      {/* Поле поиска */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-stone-100">
        <Search size={14} className="text-stone-400 shrink-0" />
        <input
          ref={inputRef}
          className="flex-1 text-sm outline-none placeholder-stone-400 bg-transparent"
          placeholder="Название продукта..."
          value={query}
          onChange={handleQueryChange}
        />
        {(isSearchingLocal || isSearchingExternal) && (
          <Loader2 size={13} className="text-stone-400 animate-spin shrink-0" />
        )}
        <button type="button" onClick={onClose} className="text-stone-400 hover:text-stone-600">
          <X size={14} />
        </button>
      </div>

      {/* Результаты */}
      {!selected && hasResults && (
        <div className="max-h-52 overflow-y-auto divide-y divide-stone-50">
          {localResults.length > 0 && (
            <ResultGroup label="Моя база" items={localResults} onSelect={handleSelect} />
          )}
          {externalResults.length > 0 && (
            <ResultGroup
              label="Open Food Facts" items={externalResults}
              onSelect={handleSelect} external
            />
          )}
        </div>
      )}

      {/* Нет результатов */}
      {!selected && query.length >= 2 && !hasResults && !isSearchingLocal && !isSearchingExternal && (
        <p className="text-xs text-stone-400 text-center py-4">Ничего не найдено</p>
      )}

      {/* Выбранный продукт — ввод граммов */}
      {selected && (
        <form onSubmit={handleAdd} className="p-3 space-y-3">
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-stone-800 truncate">{selected.name}</p>
              <p className="text-xs text-stone-400">
                {selected.per100g.calories} ккал/100г ·
                белок {selected.per100g.protein}г ·
                жиры {selected.per100g.fat}г ·
                углев. {selected.per100g.carbs}г
              </p>
            </div>
            <button type="button" onClick={() => setSelected(null)}
              className="text-stone-400 hover:text-stone-600 shrink-0">
              <X size={14} />
            </button>
          </div>

          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-xs text-stone-500 mb-1">Граммы</label>
              <div className="relative">
                <input
                  ref={gramsRef}
                  type="number" min="1" max="5000" step="5"
                  className="input pr-7 text-sm"
                  value={grams}
                  onChange={e => setGrams(e.target.value)}
                  required
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400">г</span>
              </div>
            </div>
            {preview && (
              <div className="bg-forest-50 rounded-lg px-3 py-2 text-xs text-stone-600 shrink-0">
                <span className="font-bold text-forest-700">{preview.calories}</span> ккал ·
                белок <span className="font-medium">{preview.protein}</span>г
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1 py-2">
              Добавить
            </button>
            <button type="button" onClick={onClose} className="btn-secondary px-4 py-2">
              Отмена
            </button>
          </div>
        </form>
      )}

      {/* Подсказка при пустом запросе */}
      {!selected && query.length < 2 && (
        <p className="text-xs text-stone-400 text-center py-3">
          Введите от 2 символов для поиска
        </p>
      )}
    </div>
  );
}

function ResultGroup({ label, items, onSelect, external = false }) {
  return (
    <div>
      <p className={`px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ${
        external ? 'text-amber-600 bg-amber-50' : 'text-forest-600 bg-forest-50'
      }`}>
        {external && <ExternalLink size={9} className="inline mr-1" />}
        {label}
      </p>
      {items.map((item, i) => (
        <button
          key={item.id ?? i} type="button"
          onClick={() => onSelect(item)}
          className="w-full text-left px-3 py-2 hover:bg-stone-50 transition-colors flex items-center justify-between gap-2"
        >
          <span className="text-sm text-stone-800 truncate">{item.name}</span>
          <span className="text-xs text-stone-400 shrink-0 tabular-nums">
            {item.per100g.calories} ккал
          </span>
        </button>
      ))}
    </div>
  );
}

// ─── Секция приёма пищи ──────────────────────────────────────────────────────

const MEAL_EMOJIS = {
  'Завтрак': '🌅',
  'Обед':    '☀️',
  'Ужин':    '🌙',
  'Перекус': '🍎',
};

export default function MealSection({ meal, onAddItem, onRemoveItem }) {
  const [searching, setSearching] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const mealCalories = meal.items.reduce((s, i) => s + i.calories, 0);
  const mealProtein  = meal.items.reduce((s, i) => s + i.protein,  0);

  return (
    <div className="card">
      {/* Заголовок секции */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setCollapsed(v => !v)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
        >
          <span className="text-lg leading-none">{MEAL_EMOJIS[meal.name] ?? '🍽'}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-800 text-sm">{meal.name}</span>
              {meal.items.length > 0 && (
                <span className="text-xs text-stone-400 tabular-nums">
                  {mealCalories} ккал · белок {mealProtein}г
                </span>
              )}
            </div>
            {meal.time && <p className="text-[11px] text-stone-400">{meal.time}</p>}
          </div>
          {collapsed
            ? <ChevronDown size={14} className="text-stone-400 shrink-0" />
            : <ChevronUp   size={14} className="text-stone-400 shrink-0" />
          }
        </button>

        <button
          type="button"
          onClick={() => { setCollapsed(false); setSearching(true); }}
          className="flex items-center gap-1 text-xs font-medium text-forest-600
                     hover:bg-forest-50 px-2.5 py-1.5 rounded-lg transition-colors shrink-0"
        >
          <Plus size={13} /> Добавить
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Список продуктов */}
          {meal.items.length > 0 && (
            <div className="mt-2 -mx-1">
              {meal.items.map((item, idx) => (
                <FoodItemRow
                  key={idx}
                  item={item}
                  onRemove={() => onRemoveItem(idx)}
                />
              ))}
            </div>
          )}

          {/* Пустой приём */}
          {meal.items.length === 0 && !searching && (
            <p className="text-xs text-stone-400 mt-2 text-center py-2">
              Пусто — нажми «Добавить»
            </p>
          )}

          {/* Поиск продукта */}
          {searching && (
            <div className="mt-3">
              <SearchPanel
                onAdd={(item) => { onAddItem(item); setSearching(false); }}
                onClose={() => setSearching(false)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
