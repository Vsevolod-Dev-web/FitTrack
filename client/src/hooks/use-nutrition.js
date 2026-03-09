import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api.js';
import { format } from 'date-fns';

export function useNutrition(date = format(new Date(), 'yyyy-MM-dd')) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['nutrition-logs', date],
    queryFn: () => api.getNutritionLogs(date),
  });

  const addLog = useMutation({
    mutationFn: api.postNutritionLog,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['nutrition-logs'] }),
  });

  const updateLog = useMutation({
    mutationFn: ({ id, data }) => api.putNutritionLog(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['nutrition-logs'] }),
  });

  return { ...query, addLog, updateLog };
}
