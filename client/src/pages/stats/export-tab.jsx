import { Download } from 'lucide-react';
import { api } from '../../utils/api.js';

async function downloadJson(key, filename) {
  let data;
  if (key === 'bodyLogs')       data = await api.getBodyLogs();
  else if (key === 'allNutrition') data = await api.getNutritionLogs();
  else if (key === 'trainingLogs') data = await api.getTrainingLogs();
  else if (key === 'profile')   data = await api.getProfile();
  else return;

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadAll() {
  const [bodyLogs, nutrition, training, profile] = await Promise.all([
    api.getBodyLogs(),
    api.getNutritionLogs(),
    api.getTrainingLogs(),
    api.getProfile(),
  ]);
  const all = { profile, bodyLogs, nutritionLogs: nutrition, trainingLogs: training };
  const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `fittrack-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

const EXPORTS = [
  { key: 'bodyLogs',      label: 'Замеры тела',    filename: 'body-logs.json' },
  { key: 'allNutrition',  label: 'Дневник питания', filename: 'nutrition-logs.json' },
  { key: 'trainingLogs',  label: 'Тренировки',      filename: 'training-logs.json' },
  { key: 'profile',       label: 'Профиль',          filename: 'profile.json' },
];

export default function ExportTab() {
  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Экспорт данных</p>
        <p className="text-sm text-stone-500">
          Скачай свои данные в формате JSON. Файлы можно открыть в любом текстовом редакторе.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {EXPORTS.map(({ key, label, filename }) => (
            <button
              key={key}
              type="button"
              onClick={() => downloadJson(key, filename)}
              className="flex items-center gap-3 btn-secondary justify-start"
            >
              <Download size={15} className="text-forest-600 shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium text-stone-700">{label}</p>
                <p className="text-xs text-stone-400">{filename}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={downloadAll}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        <Download size={16} />
        Скачать всё одним файлом
      </button>
    </div>
  );
}
