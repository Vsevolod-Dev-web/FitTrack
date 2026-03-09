import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api.js';

export function useTraining() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['training-logs'],
    queryFn: api.getTrainingLogs,
  });

  const addLog = useMutation({
    mutationFn: api.postTrainingLog,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['training-logs'] }),
  });

  const deleteLog = useMutation({
    mutationFn: api.deleteTrainingLog,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['training-logs'] }),
  });

  return { ...query, addLog, deleteLog };
}
