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

### ⬜ Фаза 2 — Данные и формулы
Unit-тесты (vitest) для calculations.js

### ⬜ Фаза 3 — Профиль + замеры тела
Полный UI: форма замеров с дельтами, история, фото-прогресс

### ⬜ Фаза 4 — Питание
Дневной журнал, поиск продуктов, кольцевые диаграммы

### ⬜ Фаза 5 — Тренировки
Форма тренировки, таймер, история сетов, тоннаж

### ⬜ Фаза 6 — Dashboard + статистика
Все виджеты, Recharts-графики, прогноз цели
