# FitTrack — Контекст для Claude Code

## Стек
- React 18 + Vite, TypeScript (по желанию), Tailwind CSS
- Express сервер на порту 3001, клиент на 5173
- Zustand для глобального состояния
- JSON-файлы в /data/ как база данных

## Архитектурные решения
- НЕ использовать реальную БД — только JSON через Express API
- Все формулы расчёта в `client/src/utils/calculations.js`
- Хуки useBodyData, useNutrition, useTraining — обёртки над React Query
- При каждом новом замере → автопересчёт TDEE + макросов через Zustand
- Файловый доступ только через ALLOWED_FILES whitelist в `server/lib/json-store.js`

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

## Безопасность
- Все /api/* роуты защищены middleware localOnly (`server/middleware/local-only.js`)
- Входящие данные валидируются zod-схемами (`server/schemas/index.js`)
- data/ в .gitignore — НИКОГДА не коммитить
- Переменные окружения только через .env, не хардкодить
- Новые файловые роуты — только через ALLOWED_FILES whitelist
- helmet и cors подключены в server/index.js глобально
- Pre-commit hook блокирует случайный коммит data/

---

## Статус разработки

### ✅ Фаза 1 — Каркас (DONE)

**Сервер (`server/`)**
- `server/index.js` — Express + helmet + cors + localOnly на всех /api/* роутах
- `server/lib/json-store.js` — абстракция чтения/записи JSON (ALLOWED_FILES whitelist)
- `server/middleware/local-only.js` — 403 для не-localhost запросов
- `server/middleware/auth.js` — опциональный x-app-token (APP_PASSWORD в .env)
- `server/schemas/index.js` — zod-схемы: ProfileSchema, BodyLogSchema, NutritionLogSchema, TrainingLogSchema, FoodItemSchema
- `server/routes/profile.js` — GET /api/profile, PUT /api/profile
- `server/routes/body.js` — GET/POST /api/body-logs, DELETE /api/body-logs/:id
- `server/routes/nutrition.js` — GET/POST /api/nutrition-logs, PUT /api/nutrition-logs/:id
- `server/routes/training.js` — GET/POST /api/training-logs, DELETE /api/training-logs/:id
- `server/routes/food-db.js` — GET/POST /api/food-db, GET /api/food-db/search-external (прокси Open Food Facts)

**Клиент (`client/src/`)**
- `utils/calculations.js` — calcBMR, calcTDEE, calcTargetCalories, calcMacros, calc1RM, calcVolume, calcBodyComposition, calcWeeksToGoal
- `utils/api.js` — все fetch-вызовы к /api
- `store/app-store.js` — Zustand: profile + latestBodyLog → автопересчёт derived (BMR/TDEE/калории/макросы)
- `hooks/use-body-data.js` — React Query обёртка + сайд-эффект обновления store
- `hooks/use-nutrition.js` — React Query обёртка по дате
- `hooks/use-training.js` — React Query обёртка
- `App.jsx` — роутинг + навбар с иконками
- `pages/Dashboard.jsx` — виджеты из store.derived (заготовка)
- `pages/body/BodyPage.jsx` — список замеров (заготовка)
- `pages/nutrition/NutritionPage.jsx` — журнал за сегодня (заготовка)
- `pages/training/TrainingPage.jsx` — список тренировок (заготовка)
- `pages/StatsPage.jsx` — заготовка
- `pages/SettingsPage.jsx` — форма профиля, сохранение через PUT /api/profile

**Инфраструктура**
- `data/*.json` — пустые файлы-заготовки (profile, body-logs, nutrition-logs, training-logs, food-db)
- `start.sh` — `npm run dev:all` (concurrently: клиент + сервер)
- `setup.sh` — `npm run install:all` + установка pre-commit hook
- `.git/hooks/pre-commit` — блокирует коммит файлов из data/
- `.gitignore` — data/, .env, node_modules, dist
- `.env.example` — шаблон переменных окружения

### ✅ Фаза 2 — Данные и формулы (DONE)

**`client/src/utils/calculations.js`** — полная реализация:
- `calcBMR(weight, height, age, sex)` — Миффлин-Сан Жеор
- `calcTDEE(bmr, activityLevel)` — 5 уровней активности
- `calcTargetCalories(tdee, mode, intensity)` — cutting/bulking/recomposition × moderate/standard/aggressive
- `calcRecompCalories(tdee, isTrainingDay)` — цикличность тренировочный (+100) / отдых (−200)
- `calcLeanMass(weight, bodyFatPct)` / `calcFatMass` / `calcBodyComposition`
- `calcMacros(targetCalories, leanMass, weight, mode)` — белок 2.2 г (cutting/bulking) или 2.6 г (recomposition) × сухую массу
- `calc1RM(weight, reps)` — Brzycki, граничные случаи (reps≥37 → null)
- `calcVolume(sets)` — тоннаж
- `calcWeeksToGoal(current, target, weeklyChange)` — прогноз

**`client/src/utils/calculations.test.js`** — 60 unit-тестов (vitest 1.x):
- Покрытие: все 9 функций + экспортированные константы
- Граничные значения: нулевые веса, нулевой темп, reps≥37, отрицательные дельты

**Дизайн — светлая тема «Лесное утро»**
- Цвета: stone-50 фон, white карточки, forest-600 акцент (кастомная палитра)
- SVG-листья в шапке (три листа + ягоды + стебель)
- `tailwind.config.js` — кастомная палитра `forest`
- `index.css` — компоненты: `.card`, `.input`, `.btn-primary`, `.btn-secondary`, `.badge-*`, `.empty-state`
- Dashboard: MetricCard + MacroBar прогресс-бары
- SettingsPage: секции с эмодзи-иконками

### ✅ Фаза 3 — Профиль + замеры тела (DONE)

**`client/src/pages/body/BodyPage.jsx`** — полная реализация:
- `AddForm`: поля date/weight/bodyFat/method/measurements/notes
  - `ref`-массив + `onKeyDown` Enter → следующее поле
  - `placeholder` = последнее значение из предыдущего замера
  - Дельта к предыдущему замеру — в реальном времени (`DeltaBadge`)
  - Превью состава тела (сухая/жировая масса) сразу при вводе
  - Обхваты в раскрываемой секции (7 параметров)
  - Метод: пилюли bioimpedance / caliper / visual
- `LogCard`: карточка записи в истории
  - Вес + % жира + дельты с цветовой индикацией
  - Состав тела (зелёная/янтарная плитка)
  - Обхваты — раскрываемые, каждый с дельтой
  - Кнопка удалить (с подтверждением)
- `CurrentSnapshot`: виджет последнего замера в шапке страницы
- `DeltaBadge`: ↑↓ со smart-окраской (зелёный = хорошо, красный = плохо, учитывает `lowerIsBetter`)

**`client/src/hooks/use-app-init.js`** — инициализация store при старте:
- Загружает profile + body-logs на mount, синхронизирует в Zustand
- Подключён в `App.jsx` → Dashboard сразу показывает расчёты

**`client/src/pages/SettingsPage.jsx`** — форма профиля готова:
- Секции с эмодзи: «Личные данные», «Активность и режим», «Цели»
- При сохранении → Zustand пересчитывает TDEE/макросы мгновенно

**Server `server/routes/body.js`** — GET / POST / DELETE (готово с Фазы 1)

### ✅ Фаза 4 — Питание (DONE)

**`client/src/pages/nutrition/nutrition-utils.js`** — чистые функции:
- `initLog(date)` — инициализирует пустой лог с 4 стандартными приёмами
- `calcItemMacros(per100g, grams)` — расчёт КБЖУ для порции
- `calcDayTotals(meals)` — пересчёт итогов дня
- `addItemToMeal / removeItemFromMeal / setWater`
- `macroStatus(actual, target)` — good/warn/over по ТЗ §6.3 (±5%/±15%)

**`client/src/hooks/use-nutrition-day.js`** — управление дневным журналом:
- POST при первом добавлении, PUT при обновлении — без лишних запросов
- Оптимистичный setLog до ответа сервера

**`client/src/hooks/use-food-db.js`** — поиск продуктов:
- Локальный поиск (200 мс debounce), при < 4 результатов → OFacts (400 мс)
- `saveExternalToDb` — автосохранение OFacts продуктов в личную базу

**`client/src/pages/nutrition/macro-rings.jsx`** — Recharts:
- Кольцо калорий + горизонтальный прогресс-бар (крупный)
- 3 кольца макросов (белок/жир/углеводы)
- Цветовой статус: forest-600 = норма, amber = ±15%, red = >15%
- Поддержка случая "превышение нормы" (полное кольцо)

**`client/src/pages/nutrition/meal-section.jsx`** — приём пищи:
- 4 стандартных приёма с эмодзи + кнопка «Добавить»
- `SearchPanel`: поиск → выбор → ввод граммов → превью макросов → добавить
- Группы результатов: «Моя база» (зелёная) / «Open Food Facts» (янтарная)
- Удаление продукта hover-кнопкой, сворачивание секции

**`client/src/pages/nutrition/water-tracker.jsx`**:
- Быстрые кнопки +200/+300/+500 мл + ручной ввод
- Прогресс-бар до 2500 мл

**`client/src/pages/nutrition/NutritionPage.jsx`**:
- Навигатор дней ← →, нельзя перейти в будущее
- Русские названия дней через `date-fns/locale/ru`
- Итог дня: факт/остаток по каждому макросу

**Server:** добавлен DELETE /api/nutrition-logs/:id

### ✅ Фаза 5 — Тренировки (DONE)

**`training-utils.js`** — чистые функции:
- `formatTimer(seconds)` — HH:MM:SS / MM:SS
- `exerciseTonnage(sets)` / `exerciseBest1RM(sets)` / `totalWorkoutTonnage(exercises)`
- `findLastExercise(logs, name)` — поиск предыдущего выполнения по имени
- `getPreviousExerciseNames(logs)` — список для datalist автодополнения
- `buildPayload(draft, elapsed)` — сборка payload для POST
- `newExercise()` / `newSet(prevSet)` — фабрики с авто-id

**`exercise-sets.jsx`** — таблица сетов с историей:
- Enter weight → focus reps, Enter reps → focus RPE, Enter RPE → добавить сет
- Последний сет автоматически копирует вес/повторы в новый сет
- 1RM (Brzycki) отображается inline для каждого сета после ввода
- Тоннаж + лучший 1RM per-exercise внизу
- `PreviousPerformance` — предыдущий результат по этому упражнению (дата, сеты, тоннаж, 1RM)
- `datalist` с именами упражнений из истории (автодополнение)
- Палитра цветных тегов групп мышц (9 групп)

**`training-form.jsx`** — форма тренировки:
- Таймер на `setInterval`, отображается в зелёной шапке
- Тип тренировки: pill-кнопки (Силовая/Кардио/HIIT/Растяжка)
- Для strength/hiit: список упражнений + кнопка «+ Упражнение»
- Для cardio/hiit: секция кардио (вид, дистанция, ккал)
- Звёздный рейтинг 1–5, поле заметок
- «Завершить» вверху (в шапке) и внизу формы

**`training-card.jsx`** — карточка истории:
- Тип + эмодзи, дата, длительность, звёзды рейтинга
- Краткая сводка: кол-во упражнений, общий тоннаж, лучший 1RM каждого упражнения
- Раскрываемые детали: полные сеты каждого упражнения (компактно: N×вес×повторы), заметки
- Удаление с confirm

**`TrainingPage.jsx`** — главная:
- Статистика-дашборд: кол-во тренировок, часы, суммарный тоннаж, любимый тип
- При нажатии «Начать» → показывается только форма (чтобы не отвлекаться)
- История отсортирована по дате убыванием

### ⬜ Фаза 6 — Dashboard + статистика
Все виджеты, Recharts-графики, прогноз цели
