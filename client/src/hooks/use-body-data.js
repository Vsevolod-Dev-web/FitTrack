import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api.js';
import { useAppStore } from '../store/app-store.js';
import { useEffect } from 'react';

export function useBodyData() {
  const queryClient = useQueryClient();
  const setLatestBodyLog = useAppStore(s => s.setLatestBodyLog);

  const query = useQuery({
    queryKey: ['body-logs'],
    queryFn: api.getBodyLogs,
  });

  useEffect(() => {
    if (query.data?.length) {
      const sorted = [...query.data].sort((a, b) => b.date.localeCompare(a.date));
      setLatestBodyLog(sorted[0]);
    }
  }, [query.data, setLatestBodyLog]);

  const addLog = useMutation({
    mutationFn: api.postBodyLog,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['body-logs'] }),
  });

  const deleteLog = useMutation({
    mutationFn: api.deleteBodyLog,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['body-logs'] }),
  });

  return { ...query, addLog, deleteLog };
}
