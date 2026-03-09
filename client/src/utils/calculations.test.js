import { describe, it, expect } from 'vitest';
import {
  calcBMR,
  calcTDEE,
  calcTargetCalories,
  calcRecompCalories,
  calcFatMass,
  calcLeanMass,
  calcBodyComposition,
  calcMacros,
  calc1RM,
  calcVolume,
  calcWeeksToGoal,
  ACTIVITY_COEFFICIENTS,
  MODE_ADJUSTMENTS,
  PROTEIN_RATIO,
} from './calculations.js';

// ─── calcBMR ─────────────────────────────────────────────────────────────────
describe('calcBMR', () => {
  it('мужчина, типичные значения', () => {
    // 10×85 + 6.25×180 − 5×30 + 5 = 850 + 1125 − 150 + 5 = 1830
    expect(calcBMR(85, 180, 30, 'male')).toBe(1830);
  });

  it('женщина, типичные значения', () => {
    // 10×60 + 6.25×165 − 5×25 − 161 = 600 + 1031.25 − 125 − 161 = 1345.25 → 1345
    expect(calcBMR(60, 165, 25, 'female')).toBe(1345);
  });

  it('нижняя граница: 40 кг, 150 см, 15 лет, мужской', () => {
    const bmr = calcBMR(40, 150, 15, 'male');
    expect(bmr).toBeGreaterThan(0);
    // 10×40 + 6.25×150 − 5×15 + 5 = 400 + 937.5 − 75 + 5 = 1267.5 → 1268
    expect(bmr).toBe(1268);
  });

  it('верхняя граница: 200 кг, 220 см, 80 лет, женский', () => {
    const bmr = calcBMR(200, 220, 80, 'female');
    expect(bmr).toBeGreaterThan(0);
  });

  it('женщина BMR < мужчина при одинаковых параметрах (разница 166)', () => {
    const male   = calcBMR(80, 175, 35, 'male');
    const female = calcBMR(80, 175, 35, 'female');
    expect(male - female).toBe(166);
  });
});

// ─── calcTDEE ────────────────────────────────────────────────────────────────
describe('calcTDEE', () => {
  const bmr = 1800;

  it('sedentary ×1.2', () => {
    expect(calcTDEE(bmr, 'sedentary')).toBe(Math.round(1800 * 1.2));
  });

  it('light ×1.375', () => {
    expect(calcTDEE(bmr, 'light')).toBe(Math.round(1800 * 1.375));
  });

  it('moderate ×1.55', () => {
    expect(calcTDEE(bmr, 'moderate')).toBe(Math.round(1800 * 1.55));
  });

  it('active ×1.725', () => {
    expect(calcTDEE(bmr, 'active')).toBe(Math.round(1800 * 1.725));
  });

  it('very_active ×1.9', () => {
    expect(calcTDEE(bmr, 'very_active')).toBe(Math.round(1800 * 1.9));
  });

  it('неизвестный уровень → fallback sedentary', () => {
    expect(calcTDEE(bmr, 'unknown')).toBe(Math.round(1800 * 1.2));
  });

  it('все коэффициенты экспортированы', () => {
    expect(Object.keys(ACTIVITY_COEFFICIENTS)).toHaveLength(5);
  });
});

// ─── calcTargetCalories ──────────────────────────────────────────────────────
describe('calcTargetCalories', () => {
  const tdee = 2500;

  it('cutting умеренный −300', () => {
    expect(calcTargetCalories(tdee, 'cutting', 'moderate')).toBe(2200);
  });

  it('cutting стандартный −500', () => {
    expect(calcTargetCalories(tdee, 'cutting', 'standard')).toBe(2000);
  });

  it('cutting агрессивный −750', () => {
    expect(calcTargetCalories(tdee, 'cutting', 'aggressive')).toBe(1750);
  });

  it('bulking умеренный +200', () => {
    expect(calcTargetCalories(tdee, 'bulking', 'moderate')).toBe(2700);
  });

  it('bulking стандартный +300', () => {
    expect(calcTargetCalories(tdee, 'bulking', 'standard')).toBe(2800);
  });

  it('bulking агрессивный +500', () => {
    expect(calcTargetCalories(tdee, 'bulking', 'aggressive')).toBe(3000);
  });

  it('recomposition стандартный = TDEE', () => {
    expect(calcTargetCalories(tdee, 'recomposition', 'standard')).toBe(2500);
  });

  it('recomposition умеренный −100', () => {
    expect(calcTargetCalories(tdee, 'recomposition', 'moderate')).toBe(2400);
  });

  it('recomposition агрессивный +100', () => {
    expect(calcTargetCalories(tdee, 'recomposition', 'aggressive')).toBe(2600);
  });

  it('intensity по умолчанию = standard', () => {
    expect(calcTargetCalories(tdee, 'cutting')).toBe(2000);
  });

  it('неизвестный режим → 0 корректировки', () => {
    expect(calcTargetCalories(tdee, 'unknown')).toBe(tdee);
  });
});

// ─── calcRecompCalories ──────────────────────────────────────────────────────
describe('calcRecompCalories', () => {
  const tdee = 2500;

  it('тренировочный день → TDEE + 100', () => {
    expect(calcRecompCalories(tdee, true)).toBe(2600);
  });

  it('день отдыха → TDEE − 200', () => {
    expect(calcRecompCalories(tdee, false)).toBe(2300);
  });

  it('разница тренировочный/отдых = 300 ккал', () => {
    const diff = calcRecompCalories(tdee, true) - calcRecompCalories(tdee, false);
    expect(diff).toBe(300);
  });
});

// ─── calcFatMass / calcLeanMass / calcBodyComposition ─────────────────────────
describe('calcFatMass', () => {
  it('85 кг, 18% жира → 15.3 кг', () => {
    expect(calcFatMass(85, 18)).toBe(15.3);
  });

  it('100 кг, 25% жира → 25.0 кг', () => {
    expect(calcFatMass(100, 25)).toBe(25);
  });
});

describe('calcLeanMass', () => {
  it('85 кг, 18% жира → 69.7 кг', () => {
    expect(calcLeanMass(85, 18)).toBe(69.7);
  });

  it('70 кг, 20% жира → 56.0 кг', () => {
    expect(calcLeanMass(70, 20)).toBe(56);
  });

  it('fatMass + leanMass = вес тела (с точностью до 0.1)', () => {
    const w = 90;
    const bf = 22;
    const fat  = calcFatMass(w, bf);
    const lean = calcLeanMass(w, bf);
    expect(fat + lean).toBeCloseTo(w, 1);
  });
});

describe('calcBodyComposition', () => {
  it('возвращает оба поля', () => {
    const result = calcBodyComposition(80, 15);
    expect(result).toHaveProperty('fatMass');
    expect(result).toHaveProperty('leanMass');
  });

  it('совпадает с отдельными функциями', () => {
    const w = 75, bf = 17;
    const { fatMass, leanMass } = calcBodyComposition(w, bf);
    expect(fatMass).toBe(calcFatMass(w, bf));
    expect(leanMass).toBe(calcLeanMass(w, bf));
  });
});

// ─── calcMacros ──────────────────────────────────────────────────────────────
describe('calcMacros', () => {
  // leanMass = 70 кг, weight = 85 кг, calories = 2200
  const calories = 2200;
  const lean = 70;
  const weight = 85;

  it('cutting: protein = 2.2 × lean', () => {
    const { protein } = calcMacros(calories, lean, weight, 'cutting');
    expect(protein).toBe(Math.round(2.2 * lean)); // 154
  });

  it('bulking: protein = 2.2 × lean', () => {
    const { protein } = calcMacros(calories, lean, weight, 'bulking');
    expect(protein).toBe(Math.round(2.2 * lean));
  });

  it('recomposition: protein = 2.6 × lean (повышенный)', () => {
    const { protein } = calcMacros(calories, lean, weight, 'recomposition');
    expect(protein).toBe(Math.round(2.6 * lean)); // 182
  });

  it('recomposition белок > cutting белок', () => {
    const { protein: pRecomp } = calcMacros(calories, lean, weight, 'recomposition');
    const { protein: pCut }    = calcMacros(calories, lean, weight, 'cutting');
    expect(pRecomp).toBeGreaterThan(pCut);
  });

  it('fat = 0.9 × weight', () => {
    const { fat } = calcMacros(calories, lean, weight, 'cutting');
    expect(fat).toBe(Math.round(0.9 * weight)); // 77
  });

  it('калории из макросов ≤ targetCalories (карбы не отрицательные)', () => {
    const { protein, fat, carbs } = calcMacros(calories, lean, weight, 'cutting');
    const total = protein * 4 + fat * 9 + carbs * 4;
    expect(total).toBeLessThanOrEqual(calories + 4); // погрешность округления
    expect(carbs).toBeGreaterThanOrEqual(0);
  });

  it('при очень малых калориях carbs = 0, не отрицательные', () => {
    const { carbs } = calcMacros(500, lean, weight, 'recomposition');
    expect(carbs).toBe(0);
  });

  it('mode по умолчанию = cutting', () => {
    const m1 = calcMacros(calories, lean, weight);
    const m2 = calcMacros(calories, lean, weight, 'cutting');
    expect(m1).toEqual(m2);
  });
});

// ─── calc1RM ─────────────────────────────────────────────────────────────────
describe('calc1RM', () => {
  it('reps=1 → weight', () => {
    expect(calc1RM(100, 1)).toBe(100);
  });

  it('reps=5, weight=100 → Brzycki', () => {
    // 100 × (36 / (37-5)) = 100 × (36/32) = 112.5 → 113
    expect(calc1RM(100, 5)).toBe(113);
  });

  it('reps=10, weight=80', () => {
    // 80 × (36 / 27) = 80 × 1.3333 = 106.67 → 107
    expect(calc1RM(80, 10)).toBe(107);
  });

  it('reps=3, weight=120', () => {
    // 120 × (36 / 34) = 120 × 1.0588 = 127.06 → 127
    expect(calc1RM(120, 3)).toBe(127);
  });

  it('1RM всегда ≥ weight при reps ≥ 1', () => {
    expect(calc1RM(100, 8)).toBeGreaterThanOrEqual(100);
  });

  it('reps ≥ 37 → null (формула недопустима)', () => {
    expect(calc1RM(100, 37)).toBeNull();
    expect(calc1RM(100, 40)).toBeNull();
  });

  it('нулевой вес → null', () => {
    expect(calc1RM(0, 5)).toBeNull();
  });

  it('нулевые повторы → null', () => {
    expect(calc1RM(100, 0)).toBeNull();
  });
});

// ─── calcVolume ──────────────────────────────────────────────────────────────
describe('calcVolume', () => {
  it('пустой массив → 0', () => {
    expect(calcVolume([])).toBe(0);
  });

  it('один сет', () => {
    expect(calcVolume([{ weight: 80, reps: 8 }])).toBe(640);
  });

  it('несколько сетов', () => {
    const sets = [
      { weight: 80, reps: 8 },
      { weight: 80, reps: 8 },
      { weight: 80, reps: 6 },
    ];
    expect(calcVolume(sets)).toBe(80 * 8 + 80 * 8 + 80 * 6); // 1760
  });

  it('разные веса', () => {
    const sets = [
      { weight: 100, reps: 5 },
      { weight: 90,  reps: 6 },
    ];
    expect(calcVolume(sets)).toBe(500 + 540); // 1040
  });

  it('не массив → 0', () => {
    expect(calcVolume(null)).toBe(0);
  });
});

// ─── calcWeeksToGoal ─────────────────────────────────────────────────────────
describe('calcWeeksToGoal', () => {
  it('катинг: похудеть с 90 до 80 по 0.5 кг/нед = 20 недель', () => {
    expect(calcWeeksToGoal(90, 80, 0.5)).toBe(20);
  });

  it('булкинг: набрать с 70 до 80 по 0.3 кг/нед ≈ 33 недели', () => {
    expect(calcWeeksToGoal(70, 80, 0.3)).toBe(33);
  });

  it('уже достиг цели → 0', () => {
    expect(calcWeeksToGoal(80, 80, 0.5)).toBe(0);
  });

  it('weeklyChange = 0 → null', () => {
    expect(calcWeeksToGoal(85, 75, 0)).toBeNull();
  });

  it('weeklyChange = undefined → null', () => {
    expect(calcWeeksToGoal(85, 75, undefined)).toBeNull();
  });

  it('отрицательный темп (неправильное направление) → использует abs', () => {
    expect(calcWeeksToGoal(90, 80, -0.5)).toBe(20);
  });
});
