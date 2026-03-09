import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { api } from '../utils/api.js';
import { useAppStore } from '../store/app-store.js';

const EMPTY = {
  name: '', birthDate: '', sex: 'male', height: 175,
  activityLevel: 'moderate', currentMode: 'recomposition',
  goals: { targetWeight: 75, targetBodyFat: 15, weeklyWeightChange: 0.3 },
};

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const setProfile = useAppStore(s => s.setProfile);

  const { data: saved } = useQuery({ queryKey: ['profile'], queryFn: api.getProfile });
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (saved?.name) {
      setForm(saved);
      setProfile(saved);
    }
  }, [saved, setProfile]);

  const save = useMutation({
    mutationFn: api.putProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], data);
      setProfile(data);
    },
  });

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function setGoal(field, value) {
    setForm(f => ({ ...f, goals: { ...f.goals, [field]: value } }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    save.mutate(form);
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold">Настройки профиля</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Имя">
          <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required />
        </Field>
        <Field label="Дата рождения">
          <input type="date" className="input" value={form.birthDate} onChange={e => set('birthDate', e.target.value)} required />
        </Field>
        <Field label="Пол">
          <select className="input" value={form.sex} onChange={e => set('sex', e.target.value)}>
            <option value="male">Мужской</option>
            <option value="female">Женский</option>
          </select>
        </Field>
        <Field label="Рост (см)">
          <input type="number" className="input" value={form.height} onChange={e => set('height', +e.target.value)} min={100} max={250} required />
        </Field>
        <Field label="Активность">
          <select className="input" value={form.activityLevel} onChange={e => set('activityLevel', e.target.value)}>
            <option value="sedentary">Сидячий (×1.2)</option>
            <option value="light">Лёгкий (×1.375)</option>
            <option value="moderate">Умеренный (×1.55)</option>
            <option value="active">Активный (×1.725)</option>
            <option value="very_active">Очень активный (×1.9)</option>
          </select>
        </Field>
        <Field label="Режим">
          <select className="input" value={form.currentMode} onChange={e => set('currentMode', e.target.value)}>
            <option value="cutting">Катинг (дефицит)</option>
            <option value="bulking">Булкинг (профицит)</option>
            <option value="recomposition">Рекомпозиция</option>
          </select>
        </Field>
        <Field label="Целевой вес (кг)">
          <input type="number" className="input" value={form.goals.targetWeight} onChange={e => setGoal('targetWeight', +e.target.value)} step="0.5" />
        </Field>
        <Field label="Целевой % жира">
          <input type="number" className="input" value={form.goals.targetBodyFat} onChange={e => setGoal('targetBodyFat', +e.target.value)} step="0.5" />
        </Field>
        <Field label="Изменение веса в нед. (кг)">
          <input type="number" className="input" value={form.goals.weeklyWeightChange} onChange={e => setGoal('weeklyWeightChange', +e.target.value)} step="0.1" min="0" max="2" />
        </Field>
        <button type="submit" className="btn-primary w-full" disabled={save.isPending}>
          {save.isPending ? 'Сохранение...' : 'Сохранить'}
        </button>
        {save.isSuccess && <p className="text-emerald-400 text-sm text-center">Сохранено!</p>}
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm text-gray-400">{label}</span>
      {children}
    </label>
  );
}
