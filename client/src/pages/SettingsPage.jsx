import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
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
      <h1 className="page-title">Профиль</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Личные данные */}
        <Section title="Личные данные" emoji="🌿">
          <Field label="Имя">
            <input className="input" value={form.name}
              onChange={e => set('name', e.target.value)} required placeholder="Твоё имя" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Дата рождения">
              <input type="date" className="input" value={form.birthDate}
                onChange={e => set('birthDate', e.target.value)} required />
            </Field>
            <Field label="Пол">
              <select className="input" value={form.sex} onChange={e => set('sex', e.target.value)}>
                <option value="male">Мужской</option>
                <option value="female">Женский</option>
              </select>
            </Field>
          </div>
          <Field label="Рост (см)">
            <input type="number" className="input" value={form.height}
              onChange={e => set('height', +e.target.value)} min={100} max={250} required />
          </Field>
        </Section>

        {/* Активность и режим */}
        <Section title="Активность и режим" emoji="💪">
          <Field label="Уровень активности">
            <select className="input" value={form.activityLevel}
              onChange={e => set('activityLevel', e.target.value)}>
              <option value="sedentary">Сидячий (×1.2)</option>
              <option value="light">Лёгкий (×1.375)</option>
              <option value="moderate">Умеренный (×1.55)</option>
              <option value="active">Активный (×1.725)</option>
              <option value="very_active">Очень активный (×1.9)</option>
            </select>
          </Field>
          <Field label="Режим трансформации">
            <select className="input" value={form.currentMode}
              onChange={e => set('currentMode', e.target.value)}>
              <option value="cutting">Катинг — дефицит калорий</option>
              <option value="bulking">Булкинг — профицит калорий</option>
              <option value="recomposition">Рекомпозиция — баланс</option>
            </select>
          </Field>
        </Section>

        {/* Цели */}
        <Section title="Цели" emoji="🎯">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Целевой вес (кг)">
              <input type="number" className="input" value={form.goals.targetWeight}
                onChange={e => setGoal('targetWeight', +e.target.value)} step="0.5" />
            </Field>
            <Field label="Целевой % жира">
              <input type="number" className="input" value={form.goals.targetBodyFat}
                onChange={e => setGoal('targetBodyFat', +e.target.value)} step="0.5" />
            </Field>
          </div>
          <Field label="Изменение веса в нед. (кг)">
            <input type="number" className="input" value={form.goals.weeklyWeightChange}
              onChange={e => setGoal('weeklyWeightChange', +e.target.value)}
              step="0.1" min="0" max="2" />
          </Field>
        </Section>

        <button type="submit" className="btn-primary w-full" disabled={save.isPending}>
          {save.isPending ? 'Сохранение...' : 'Сохранить профиль'}
        </button>

        {save.isSuccess && (
          <div className="flex items-center justify-center gap-2 text-forest-600 text-sm font-medium">
            <CheckCircle size={16} />
            Профиль сохранён — нормы пересчитаны
          </div>
        )}
      </form>
    </div>
  );
}

function Section({ title, emoji, children }) {
  return (
    <div className="card space-y-3">
      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide flex items-center gap-1.5">
        <span>{emoji}</span>{title}
      </p>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-stone-600">{label}</span>
      {children}
    </label>
  );
}
