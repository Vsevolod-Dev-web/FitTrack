# ТЗ: FitTrack — Персональный трекер трансформации тела

**Версия:** 1.0  
**Стек:** React + Vite · JSON-хранилище · Express (mini-server) · Ubuntu 24.04  
**Режим:** Self-hosted, один запуск (`./start.sh`)

---

## 1. ОБЗОР ПРОЕКТА

Веб-приложение для личного отслеживания трансформации тела: циклы булкинга и катинга, динамическая коррекция калорийности на основе актуальных замеров, журнал питания, дневник тренировок. Все нормы пересчитываются автоматически при каждом новом замере.

---

## 2. СТЕК И АРХИТЕКТУРА

```
fittrack/
├── client/                  # React + Vite SPA
│   ├── src/
│   │   ├── pages/           # Dashboard, Body, Nutrition, Training, Settings
│   │   ├── components/      # Переиспользуемые UI-компоненты
│   │   ├── hooks/           # useBodyData, useNutrition, useTraining
│   │   ├── utils/           # Формулы: BMR, TDEE, нормы макросов
│   │   └── store/           # Zustand (глобальное состояние)
│   └── vite.config.js
├── server/                  # Express (только API для чтения/записи JSON)
│   ├── index.js
│   └── routes/
│       ├── body.js
│       ├── nutrition.js
│       └── training.js
├── data/                    # JSON-файлы (персистентное хранилище)
│   ├── profile.json
│   ├── body-logs.json
│   ├── nutrition-logs.json
│   ├── training-logs.json
│   └── food-db.json         # Личная база продуктов + кэш Open Food Facts
├── start.sh                 # ./start.sh — один запуск всего
├── CLAUDE.md                # Контекст проекта для Claude Code
└── package.json
```

**Порты:** клиент `localhost:5173`, сервер `localhost:3001`  
**start.sh** запускает оба процесса конкурентно через `concurrently`.

---

## 3. ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ

### 3.1 Данные профиля (`data/profile.json`)
```json
{
  "name": "...",
  "birthDate": "YYYY-MM-DD",
  "sex": "male | female",
  "height": 180,
  "activityLevel": "sedentary | light | moderate | active | very_active",
  "currentMode": "cutting | bulking | recomposition",
  "goals": {
    "targetWeight": 80,
    "targetBodyFat": 12,
    "weeklyWeightChange": 0.5
  }
}
```

### 3.2 Уровни активности (коэффициенты Харриса-Бенедикта)
| Уровень | Коэффициент | Описание |
|---|---|---|
| sedentary | 1.2 | Сидячая работа, нет тренировок |
| light | 1.375 | 1–3 тренировки в неделю |
| moderate | 1.55 | 3–5 тренировок в неделю |
| active | 1.725 | 6–7 тренировок, физический труд |
| very_active | 1.9 | 2 тренировки в день |

---

## 4. МОДУЛЬ: ЗАМЕРЫ ТЕЛА

### 4.1 Структура записи (`data/body-logs.json`)
```json
[
  {
    "id": "uuid",
    "date": "YYYY-MM-DD",
    "weight": 85.3,
    "bodyFat": 18.5,
    "measurements": {
      "waist": 88,
      "chest": 102,
      "hips": 98,
      "armLeft": 36,
      "armRight": 36.5,
      "thighLeft": 56,
      "thighRight": 56.5
    },
    "method": "caliper | bioimpedance | visual",
    "notes": "..."
  }
]
```

### 4.2 Вычисляемые показатели (реальное время)
- **Мышечная масса** = weight × (1 - bodyFat/100)
- **Жировая масса** = weight × bodyFat/100
- **Дельта к предыдущему замеру** — по каждому параметру
- **Тренд за 4/8/12 недель** — скользящее среднее по весу
- **Прогноз достижения цели** — линейная экстраполяция по тренду

### 4.3 UI формы замеров
- Большие поля ввода с единицами (кг, см, %)
- Автофокус — переход по Enter к следующему полю
- Последнее значение показывается как placeholder
- Дельта к прошлому замеру — сразу после ввода (зелёный/красный)
- Фото-прогресс: загрузка изображения, привязка к дате

---

## 5. ДИНАМИЧЕСКИЕ ФОРМУЛЫ (ЯДРО ПРИЛОЖЕНИЯ)

### 5.1 Базовый метаболизм (BMR) — формула Миффлина-Сан Жеора
```
Мужчины: BMR = 10 × weight + 6.25 × height - 5 × age + 5
Женщины: BMR = 10 × weight + 6.25 × height - 5 × age - 161
```

### 5.2 TDEE (суточные энергозатраты)
```
TDEE = BMR × activityLevel
```

### 5.3 Целевая калорийность по режиму
```
Катинг (похудение):
  Умеренный дефицит: TDEE - 300 (потеря ~0.3кг/нед)
  Стандартный:       TDEE - 500 (потеря ~0.5кг/нед)
  Агрессивный:       TDEE - 750 (потеря ~0.75кг/нед)

Булкинг (набор массы):
  Лёгкий профицит:   TDEE + 200 (минимум жира)
  Стандартный:       TDEE + 300 (баланс)
  Агрессивный:       TDEE + 500 (максимум массы)

⭐ Рекомпозиция (сброс жира + набор мышц одновременно):
  Калории:  TDEE - 100..+100 (поддержание — малый дефицит)
  Белок:    2.4–2.8 г × сухая масса (выше, чем в других режимах)
  Цикл:     тренировочные дни → TDEE + 100
            дни отдыха        → TDEE - 200
  Условие:  работает надёжно при % жира > 15% (мужчины) / > 23% (женщины)
  Темп:     медленный — 1–2кг жира/мес, +0.5–1кг мышц/мес
  Индикатор прогресса: не вес, а соотношение жира и мышц
```

### 5.4 Макросы
```
Белок:  2.2 г × сухая масса тела (кг)  — всегда
Жиры:   0.8–1.0 г × вес тела (кг)
Углеводы: остаток калорий / 4
```

### 5.5 Автоматический пересчёт
**Триггер:** каждый новый замер веса или % жира обновляет:
1. BMR
2. TDEE
3. Целевые калории на сегодня
4. Норму макросов
5. Прогноз достижения цели

---

## 6. МОДУЛЬ: ПИТАНИЕ

### 6.1 Структура дня (`data/nutrition-logs.json`)
```json
[
  {
    "id": "uuid",
    "date": "YYYY-MM-DD",
    "meals": [
      {
        "name": "Завтрак",
        "time": "08:30",
        "items": [
          {
            "foodId": "...",
            "name": "Куриная грудка",
            "grams": 200,
            "calories": 220,
            "protein": 46,
            "fat": 5,
            "carbs": 0
          }
        ]
      }
    ],
    "water": 2400,
    "totals": { "calories": 2100, "protein": 180, "fat": 65, "carbs": 220 }
  }
]
```

### 6.2 База продуктов (`data/food-db.json`)
Гибридная: личная база + кэш Open Food Facts API
```json
[
  {
    "id": "uuid",
    "name": "Куриная грудка варёная",
    "per100g": { "calories": 110, "protein": 23, "fat": 2.5, "carbs": 0 },
    "source": "custom | openfoodfacts",
    "barcode": "...",
    "lastUsed": "YYYY-MM-DD"
  }
]
```

### 6.3 UI питания
- **Быстрое добавление:** поиск по имени с автодополнением
- **Open Food Facts:** если продукт не найден локально → запрос к API
- **Сохранение в личную базу** после первого использования
- **Кольцевые диаграммы** калории/макросы: факт vs норма
- **Визуальный прогресс дня:** горизонтальный прогресс-бар по калориям
- **Цветовая индикация:** зелёный (в норме ±5%), жёлтый (±15%), красный (>15%)
- **Вода:** кнопки +200мл / +500мл / ввод вручную

### 6.4 Приём пищи — структура
4 стандартных приёма: Завтрак / Обед / Ужин / Перекус  
Возможность добавить кастомный приём.

---

## 7. МОДУЛЬ: ТРЕНИРОВКИ

### 7.1 Структура тренировки (`data/training-logs.json`)
```json
[
  {
    "id": "uuid",
    "date": "YYYY-MM-DD",
    "type": "strength | cardio | hiit | stretching",
    "duration": 65,
    "exercises": [
      {
        "name": "Жим лёжа",
        "muscleGroup": "chest",
        "sets": [
          { "weight": 80, "reps": 8, "rpe": 7 },
          { "weight": 80, "reps": 8, "rpe": 8 },
          { "weight": 80, "reps": 6, "rpe": 9 }
        ]
      }
    ],
    "cardio": { "type": "running", "distance": 5, "calories": 380 },
    "notes": "...",
    "rating": 4
  }
]
```

### 7.2 UI тренировок
- Быстрый старт тренировки — таймер, автосохранение
- История предыдущего выполнения упражнения рядом с формой
- Объём нагрузки (тоннаж) = сумма weight × reps по всем сетам
- График прогресса по упражнению (1RM estimate = weight × (1 + reps/30))

---

## 8. DASHBOARD (ГЛАВНЫЙ ЭКРАН)

### Виджеты (все адаптивные к текущим данным):
1. **Текущий режим** — катинг/булкинг/рекомпозиция с переключателем
2. **Норма калорий на сегодня** — пересчитана по последнему замеру + учёт тренировочный/отдых день
3. **Выполнение питания сегодня** — % от нормы
4. **Прогресс рекомпозиции** — два независимых трекера: жировая масса (↓) и мышечная масса (↑)
5. **Последний замер** — дата + ключевые показатели + дельта
6. **Тренд** — мини-график: вес серым, мышцы синим, жир оранжевым (30 дней)
7. **Прогноз** — "При текущем темпе цели по % жира достигнешь через X недель"
8. **Стрик** — дней ведения журнала питания подряд

---

## 9. ЭКРАН СТАТИСТИКИ

### Графики (библиотека: Recharts)
- Вес тела + тренд (7/30/90 дней / всё время)
- % жира и мышечная масса на одном графике
- Обхваты — многолинейный график
- Калории: план vs факт (столбчатая диаграмма)
- Макросы — средние за период
- Тоннаж по группам мышц
- Прогресс по ключевым упражнениям (жим, присед, тяга)

### Экспорт
- Скачать JSON-дамп всех данных (бэкап)
- Импорт JSON (восстановление)

---

## 10. НАСТРОЙКИ

- Редактирование профиля (рост, возраст, пол, активность)
- Смена режима катинг/булкинг — с подтверждением и записью даты смены
- Выбор дефицита/профицита (умеренный/стандартный/агрессивный)
- Целевой вес и % жира
- Единицы (кг/фунты, см/дюймы) — глобальная настройка

---

## 11. ТЕХНИЧЕСКИЕ ТРЕБОВАНИЯ

### Сервер (Express)
```
GET  /api/profile
PUT  /api/profile
GET  /api/body-logs
POST /api/body-logs
GET  /api/nutrition-logs?date=YYYY-MM-DD
POST /api/nutrition-logs
GET  /api/training-logs
POST /api/training-logs
GET  /api/food-db?q=query
POST /api/food-db
GET  /api/food-db/search-external?q=query   ← Open Food Facts proxy
```

### Frontend зависимости
```
react, react-router-dom
zustand                    # state management
recharts                   # графики
@tanstack/react-query      # запросы к API
date-fns                   # работа с датами
lucide-react               # иконки
tailwindcss                # стили
```

### start.sh
```bash
#!/bin/bash
echo "🚀 Запуск FitTrack..."
cd "$(dirname "$0")"
npm run dev:all    # concurrently запускает client + server
```

---

## 12. CLAUDE.md ДЛЯ ПРОЕКТА

```markdown
# FitTrack — Контекст для Claude Code

## Стек
- React 18 + Vite, TypeScript (по желанию), Tailwind CSS
- Express сервер на порту 3001, клиент на 5173
- Zustand для глобального состояния
- JSON-файлы в /data/ как база данных

## Архитектурные решения
- НЕ использовать реальную БД — только JSON через Express API
- Все формулы расчёта в src/utils/calculations.js
- Хуки useBodyData, useNutrition, useTraining — обёртки над React Query
- При каждом новом замере → автопересчёт TDEE + макросов через Zustand

## Формулы
- BMR: Миффлин-Сан Жеора (см calculations.js)
- TDEE = BMR × activityCoefficient
- Целевые калории = TDEE ± deficit/surplus из профиля

## Структура данных
- Все даты: ISO 8601 (YYYY-MM-DD)
- Вес: килограммы (float)
- Обхваты: сантиметры (float)
- Калории/макросы: целые числа

## Стиль кода
- Компоненты: функциональные, хуки
- Именование: camelCase JS, kebab-case файлы
- Каждый модуль (body/nutrition/training) — своя папка в pages/

## Важно
- Не использовать localStorage — данные только через API
- Все расчёты выполняются на клиенте, сервер только читает/пишет JSON
- Open Food Facts API: https://world.openfoodfacts.org/api/v0/product/{barcode}.json
```

---

## 13. СПЕЦИФИКАЦИЯ БЕЗОПАСНОСТИ (PUBLIC GITHUB)

### 13.1 Что НИКОГДА не попадает в репозиторий

```
# .gitignore — обязательные исключения
data/                    # все личные данные (вес, замеры, питание)
.env
.env.local
.env.*.local
*.env
node_modules/
dist/
```

> ⚠️ `data/` — твои личные биометрические данные. Хранятся только локально.
> В репо идёт лишь `data/.gitkeep` + пустые схемы-примеры.

---

### 13.2 Структура .env файлов

**`.env.example`** — коммитится в репо (шаблон без значений):
```env
PORT=3001
CLIENT_URL=http://localhost:5173
APP_PASSWORD=
```

**`.env`** — только локально, в .gitignore:
```env
PORT=3001
CLIENT_URL=http://localhost:5173
APP_PASSWORD=my_secret_password
```

---

### 13.3 Middleware: только локальный доступ

```javascript
// server/middleware/localOnly.js
export function localOnly(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const allowed = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
  if (!allowed.includes(ip)) {
    return res.status(403).json({ error: 'Local access only' });
  }
  next();
}
```

Применяется ко всем `/api/*` роутам автоматически.

---

### 13.4 Опциональная парольная защита (локальная сеть)

Если откроешь доступ с телефона/ноутбука в той же сети:
```javascript
// server/middleware/auth.js
export function passwordAuth(req, res, next) {
  if (!process.env.APP_PASSWORD) return next();
  const token = req.headers['x-app-token'];
  if (token !== process.env.APP_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}
```

Клиент хранит токен в `sessionStorage` (не `localStorage`) и добавляет заголовок к каждому запросу.

---

### 13.5 Защита от Path Traversal

JSON-файлы читаются строго по whitelist, **не из параметров запроса**:
```javascript
// ✅ Правильно — whitelist
const ALLOWED_FILES = {
  profile:       'data/profile.json',
  bodyLogs:      'data/body-logs.json',
  nutritionLogs: 'data/nutrition-logs.json',
  trainingLogs:  'data/training-logs.json',
  foodDb:        'data/food-db.json',
};

// ❌ Никогда так — уязвимость path traversal
app.get('/api/data/:filename', (req, res) => {
  fs.readFile(`data/${req.params.filename}`, ...)
});
```

---

### 13.6 Валидация входящих данных (zod)

```javascript
import { z } from 'zod';

const BodyLogSchema = z.object({
  date:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weight:  z.number().min(20).max(300),
  bodyFat: z.number().min(1).max(70).optional(),
  measurements: z.object({
    waist: z.number().min(40).max(200).optional(),
    chest: z.number().min(40).max(200).optional(),
    // ...
  }).optional(),
});
```

Добавить `zod` в зависимости сервера. Каждый POST-роут валидирует тело запроса.

---

### 13.7 CORS — только свой клиент

```javascript
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'x-app-token'],
}));
```

---

### 13.8 Заголовки безопасности (helmet)

```javascript
import helmet from 'helmet';
app.use(helmet());
// Добавляет: X-Frame-Options, X-XSS-Protection, HSTS,
//            Content-Security-Policy, X-Content-Type-Options
```

Добавить `helmet` в зависимости.

---

### 13.9 Pre-commit hook — защита от случайного коммита данных

```bash
# Установить один раз после git init:
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
if git diff --cached --name-only | grep -qE "^data/[^.]"; then
  echo ""
  echo "❌ СТОП: файлы из data/ попали в коммит!"
  echo "   Это твои личные данные — они не должны быть в репо."
  echo "   Убери их: git reset HEAD data/"
  echo ""
  exit 1
fi
EOF
chmod +x .git/hooks/pre-commit
```

Добавить установку этого хука в `README.md` как обязательный шаг после клонирования.

---

### 13.10 Бэкап данных (data/ не в гите → нужен отдельный механизм)

```bash
# backup.sh
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf ~/fittrack-backup-$DATE.tar.gz ./data/
echo "✅ Бэкап: ~/fittrack-backup-$DATE.tar.gz"
```

В UI: кнопка "Экспорт всех данных" → скачивает ZIP со всеми JSON.

---

### 13.11 README для публичного репо

```markdown
## ⚠️ Privacy

All personal data (weight, measurements, nutrition) is stored **locally only**
in `/data/` — excluded from git via `.gitignore`. Your data never leaves your machine.

## Setup

1. `git clone ...`
2. `cp .env.example .env`
3. `./setup.sh`   # установит зависимости и pre-commit hook
4. `./start.sh`
```

---

### 13.12 Добавить в CLAUDE.md

```markdown
## Безопасность
- Все /api/* роуты защищены middleware localOnly
- Входящие данные валидируются zod-схемами (схемы в server/schemas/)
- data/ в .gitignore — НИКОГДА не коммитить
- Переменные окружения только через .env, не хардкодить
- Новые файловые роуты — только через ALLOWED_FILES whitelist
- helmet и cors подключены в server/index.js глобально
```

---

## 14. ПЛАН РАЗРАБОТКИ С CLAUDE CODE

### Фаза 1 — Каркас (1 сессия)
```
> Инициализируй проект FitTrack по CLAUDE.md.
  Создай структуру папок, package.json с зависимостями,
  базовый Express сервер с роутами, Vite + React с роутингом,
  пустые JSON-файлы в /data/, start.sh.
  Убедись что ./start.sh поднимает оба сервера.
```

### Фаза 2 — Данные и формулы (1 сессия)
```
> Реализуй src/utils/calculations.js:
  BMR (Mifflin-St Jeor), TDEE, целевые калории для катинга/булкинга,
  нормы макросов, расчёт сухой массы, 1RM estimate.
  Покрой каждую функцию unit-тестами (vitest).
```

### Фаза 3 — Профиль + замеры тела (1 сессия)
```
> Реализуй модуль Body:
  страница Settings с формой профиля,
  страница Body Logs с формой замеров и историей,
  хук useBodyData, API роуты /api/body-logs.
```

### Фаза 4 — Питание (1-2 сессии)
```
> Реализуй модуль Nutrition:
  дневной журнал питания, поиск продуктов,
  интеграция Open Food Facts API,
  личная база food-db.json,
  кольцевые диаграммы макросов.
```

### Фаза 5 — Тренировки (1 сессия)
```
> Реализуй модуль Training:
  форма тренировки с упражнениями и сетами,
  история последней тренировки рядом с формой,
  расчёт тоннажа и 1RM.
```

### Фаза 6 — Dashboard + статистика (1 сессия)
```
> Реализуй Dashboard и Statistics:
  все виджеты с реальными данными,
  графики Recharts (вес, жир, обхваты, калории),
  прогноз достижения цели.
```

---

## 14. SKILLS ДЛЯ CLAUDE CODE

Создай файлы в `.claude/agents/`:

### `calorie-calculator.md`
```markdown
---
name: calorie-calculator
description: Проверяет и пересчитывает все формулы калорийности и макросов, включая режим рекомпозиции
tools: read, write, bash
---
Ты эксперт в спортивном питании и расчёте TDEE.
Знаешь специфику рекомпозиции тела: калории на уровне поддержания,
высокий белок 2.4-2.8г/кг сухой массы, цикличность тренировочные/отдых дни.
При изменении формул — проверяй граничные значения:
вес 40-200кг, рост 140-220см, возраст 15-80 лет.
Убедись что при смене режима все значения пересчитываются.
В режиме рекомпозиции прогресс измеряется не весом, а составом тела.
```

### `data-validator.md`
```markdown
---
name: data-validator
description: Валидирует структуру JSON-файлов и целостность данных
tools: read, bash
---
Проверяй что все JSON-файлы в /data/ соответствуют схеме.
Ищи: отсутствующие поля, неверные типы, даты в неверном формате,
отрицательные значения где их не должно быть.
```

### `ui-reviewer.md`
```markdown
---
name: ui-reviewer
description: Проверяет удобство форм ввода и визуальную понятность
tools: read
---
Оценивай формы с точки зрения пользователя, который вводит данные
каждый день. Критерии: минимум кликов, понятные подписи,
мгновенная обратная связь, видны ли дельты к предыдущим значениям.
```

---

## 15. КОНТЕКСТ-РОТ: КАК ИЗБЕЖАТЬ

При долгих сессиях Claude теряет контекст. Стратегия:

1. **CLAUDE.md** — весь контекст проекта, Claude читает при каждом запуске
2. **`/compact`** — когда сессия становится длинной, жми `/compact` → Claude сожмёт историю
3. **Один модуль за сессию** — не пытайся сделать всё за раз
4. **Явные ссылки на файлы** в промптах:
   ```
   > В файле src/utils/calculations.js есть функция calcTDEE.
     Обнови её чтобы учитывала lean body mass вместо total weight.
   ```
5. **Checkpoints** — после каждой фазы проси:
   ```
   > Обнови CLAUDE.md — добавь что уже реализовано в фазах 1-3
   ```
```

---

## 16. MCP СЕРВЕРЫ (ОПЦИОНАЛЬНО)

Для расширения возможностей Claude Code в этом проекте:

| MCP Сервер | Польза |
|---|---|
| `filesystem` | Прямое чтение/запись JSON без API (отладка) |
| `fetch` | Claude сам тестирует Open Food Facts API |
| `git` | Автокоммиты после каждой фазы |

Добавить в `.mcp.json`:
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "./data"]
    }
  }
}
```

---

*Документ создан для разработки с Claude Code Pro на Ubuntu 24.04*
