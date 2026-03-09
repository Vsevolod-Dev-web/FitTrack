import { useAppStore } from '../store/app-store.js';

export default function Dashboard() {
  const { profile, latestBodyLog, derived } = useAppStore();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Главная</h1>

      {!profile?.name && (
        <div className="bg-yellow-900/40 border border-yellow-700 rounded-lg p-4 text-yellow-300 text-sm">
          Заполни профиль в разделе «Настройки», чтобы начать расчёты.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Режим" value={profile?.currentMode ?? '—'} />
        <StatCard label="Калории (цель)" value={derived ? `${derived.targetCalories} ккал` : '—'} />
        <StatCard label="TDEE" value={derived ? `${derived.tdee} ккал` : '—'} />
        <StatCard label="Вес" value={latestBodyLog ? `${latestBodyLog.weight} кг` : '—'} />
        <StatCard label="% жира" value={latestBodyLog?.bodyFat ? `${latestBodyLog.bodyFat}%` : '—'} />
        <StatCard label="Белок" value={derived ? `${derived.macros.protein} г` : '—'} />
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
