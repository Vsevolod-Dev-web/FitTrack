import { Routes, Route, NavLink } from 'react-router-dom';
import { Activity, BarChart2, Dumbbell, Salad, Settings, User } from 'lucide-react';
import { useAppInit } from './hooks/use-app-init.js';
import Dashboard from './pages/Dashboard.jsx';
import BodyPage from './pages/body/BodyPage.jsx';
import NutritionPage from './pages/nutrition/NutritionPage.jsx';
import TrainingPage from './pages/training/TrainingPage.jsx';
import StatsPage from './pages/StatsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

const navItems = [
  { to: '/', icon: Activity, label: 'Главная' },
  { to: '/body', icon: User, label: 'Тело' },
  { to: '/nutrition', icon: Salad, label: 'Питание' },
  { to: '/training', icon: Dumbbell, label: 'Тренировки' },
  { to: '/stats', icon: BarChart2, label: 'Статистика' },
  { to: '/settings', icon: Settings, label: 'Настройки' },
];

// Декоративные листья в шапке
function HeaderLeaves() {
  return (
    <svg
      aria-hidden="true"
      className="absolute right-0 top-0 h-full w-48 pointer-events-none select-none opacity-60"
      viewBox="0 0 192 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Большой лист справа */}
      <ellipse cx="168" cy="10" rx="14" ry="22"
        transform="rotate(-38 168 10)" fill="#bbdebb" opacity="0.7"/>
      <line x1="168" y1="10" x2="155" y2="38"
        stroke="#88c488" strokeWidth="1.2" opacity="0.6"/>
      {/* Средний лист */}
      <ellipse cx="148" cy="6" rx="10" ry="17"
        transform="rotate(-20 148 6)" fill="#319031" opacity="0.25"/>
      <line x1="148" y1="6" x2="140" y2="30"
        stroke="#319031" strokeWidth="1" opacity="0.3"/>
      {/* Маленький листик слева от букета */}
      <ellipse cx="130" cy="14" rx="7" ry="12"
        transform="rotate(15 130 14)" fill="#bbdebb" opacity="0.4"/>
      {/* Стебель */}
      <path d="M168 32 Q162 44 155 54" stroke="#319031" strokeWidth="1.5"
        fill="none" opacity="0.35" strokeLinecap="round"/>
      {/* Точки-ягоды */}
      <circle cx="158" cy="44" r="2.5" fill="#55a855" opacity="0.4"/>
      <circle cx="163" cy="50" r="1.8" fill="#55a855" opacity="0.3"/>
    </svg>
  );
}

export default function App() {
  useAppInit();

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* ── Шапка ── */}
      <header className="relative bg-white border-b border-stone-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 flex items-center gap-2.5 max-w-5xl mx-auto w-full">
          <div className="flex items-center justify-center w-9 h-9 bg-forest-600 rounded-xl shadow-sm">
            <Activity className="text-white" size={18} />
          </div>
          <div>
            <span className="font-bold text-lg text-stone-800 tracking-tight leading-none">FitTrack</span>
            <p className="text-[11px] text-stone-400 leading-none mt-0.5">Трекер трансформации</p>
          </div>
        </div>
        <HeaderLeaves />
      </header>

      {/* ── Навигация ── */}
      <nav className="bg-white border-b border-stone-100 px-2 flex gap-0.5 overflow-x-auto sticky top-0 z-10 shadow-sm">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                isActive
                  ? 'text-forest-700 border-forest-500 bg-forest-50/60'
                  : 'text-stone-500 border-transparent hover:text-stone-800 hover:bg-stone-50'
              }`
            }
          >
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* ── Контент ── */}
      <main className="flex-1 p-4 max-w-5xl mx-auto w-full">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/body" element={<BodyPage />} />
          <Route path="/nutrition" element={<NutritionPage />} />
          <Route path="/training" element={<TrainingPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>

      {/* ── Подвал с природным мотивом ── */}
      <footer className="bg-white border-t border-stone-100 py-3 px-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-xs text-stone-400">🌿 FitTrack — только для тебя</span>
          <span className="text-xs text-stone-300">localhost</span>
        </div>
      </footer>
    </div>
  );
}
