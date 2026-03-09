import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api.js';
import { format } from 'date-fns';

export function useDashboardData() {
  const today = format(new Date(), 'yyyy-MM-dd');

  const bodyLogs = useQuery({
    queryKey: ['body-logs'],
    queryFn:  api.getBodyLogs,
    staleTime: 60_000,
  });

  const todayNutrition = useQuery({
    queryKey: ['nutrition-logs', today],
    queryFn:  () => api.getNutritionLogs(today),
    staleTime: 30_000,
  });

  const allNutrition = useQuery({
    queryKey: ['nutrition-logs-all'],
    queryFn:  () => api.getNutritionLogs(),
    staleTime: 60_000,
  });

  const trainingLogs = useQuery({
    queryKey: ['training-logs'],
    queryFn:  api.getTrainingLogs,
    staleTime: 60_000,
  });

  return {
    bodyLogs:      bodyLogs.data     ?? [],
    todayNutrition: todayNutrition.data ?? [],
    allNutrition:  allNutrition.data  ?? [],
    trainingLogs:  trainingLogs.data  ?? [],
    isLoading: bodyLogs.isLoading || todayNutrition.isLoading || allNutrition.isLoading || trainingLogs.isLoading,
  };
}
