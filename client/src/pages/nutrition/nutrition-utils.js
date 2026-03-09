import { format } from 'date-fns';

export const MEAL_NAMES = ['Завтрак', 'Обед', 'Ужин', 'Перекус'];

export function initLog(date = format(new Date(), 'yyyy-MM-dd')) {
  return {
    date,
    meals: MEAL_NAMES.map(name => ({ name, time: '', items: [] })),
    water: 0,
    totals: { calories: 0, protein: 0, fat: 0, carbs: 0 },
  };
}

export function calcItemMacros(per100g, grams) {
  const f = grams / 100;
  return {
    calories: Math.round(per100g.calories * f),
    protein:  Math.round(per100g.protein  * f),
    fat:      Math.round(per100g.fat      * f),
    carbs:    Math.round(per100g.carbs    * f),
  };
}

export function calcDayTotals(meals) {
  return meals.reduce(
    (sum, meal) => {
      meal.items.forEach(item => {
        sum.calories += item.calories;
        sum.protein  += item.protein;
        sum.fat      += item.fat;
        sum.carbs    += item.carbs;
      });
      return sum;
    },
    { calories: 0, protein: 0, fat: 0, carbs: 0 },
  );
}

export function addItemToMeal(log, mealName, item) {
  const meals = log.meals.map(meal =>
    meal.name === mealName
      ? { ...meal, items: [...meal.items, item] }
      : meal
  );
  return { ...log, meals, totals: calcDayTotals(meals) };
}

export function removeItemFromMeal(log, mealName, itemIdx) {
  const meals = log.meals.map(meal =>
    meal.name === mealName
      ? { ...meal, items: meal.items.filter((_, i) => i !== itemIdx) }
      : meal
  );
  return { ...log, meals, totals: calcDayTotals(meals) };
}

export function setWater(log, ml) {
  return { ...log, water: Math.max(0, ml) };
}

// Цветовой статус по ТЗ §6.3: ±5% — зелёный, ±15% — жёлтый, >15% — красный
export function macroStatus(actual, target) {
  if (!target) return 'neutral';
  const pct = (actual / target) * 100;
  if (pct >= 85 && pct <= 115) return 'good';
  if (pct >= 70 && pct <= 130) return 'warn';
  return 'over';
}

export const STATUS_COLORS = {
  good:    '#22c55e',
  warn:    '#f59e0b',
  over:    '#ef4444',
  neutral: '#a8a29e',
};
