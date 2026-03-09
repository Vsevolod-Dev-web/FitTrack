import { Routes, Route, NavLink } from 'react-router-dom';
import { Activity, BarChart2, Dumbbell, Salad, Settings, User } from 'lucide-react';
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

export default function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-2">
        <Activity className="text-emerald-400" size={22} />
        <span className="font-bold text-lg tracking-tight">FitTrack</span>
      </header>

      <nav className="bg-gray-900 border-b border-gray-800 px-2 flex gap-1 overflow-x-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-t whitespace-nowrap transition-colors ${
                isActive
                  ? 'text-emerald-400 border-b-2 border-emerald-400'
                  : 'text-gray-400 hover:text-gray-100'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

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
    </div>
  );
}
