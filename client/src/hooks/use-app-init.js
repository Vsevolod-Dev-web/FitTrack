import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api.js';
import { useAppStore } from '../store/app-store.js';

/**
 * Инициализирует Zustand-стор при старте приложения:
 * загружает профиль и последний замер тела из API.
 */
export function useAppInit() {
  const setProfile      = useAppStore(s => s.setProfile);
  const setLatestBodyLog = useAppStore(s => s.setLatestBodyLog);

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: api.getProfile,
    staleTime: 60_000,
  });

  const { data: bodyLogs } = useQuery({
    queryKey: ['body-logs'],
    queryFn: api.getBodyLogs,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (profile?.name) setProfile(profile);
  }, [profile, setProfile]);

  useEffect(() => {
    if (bodyLogs?.length) {
      const sorted = [...bodyLogs].sort((a, b) => b.date.localeCompare(a.date));
      setLatestBodyLog(sorted[0]);
    }
  }, [bodyLogs, setLatestBodyLog]);
}
