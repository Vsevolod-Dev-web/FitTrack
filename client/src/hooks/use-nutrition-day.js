import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api.js';
import { initLog } from '../pages/nutrition/nutrition-utils.js';

/**
 * Полное управление дневным журналом питания.
 * POST при создании, PUT при обновлении.
 */
export function useNutritionDay(date) {
  const queryClient = useQueryClient();
  const [log, setLog] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const logRef = useRef(null);

  const { data: serverLogs, isLoading } = useQuery({
    queryKey: ['nutrition-logs', date],
    queryFn:  () => api.getNutritionLogs(date),
    staleTime: 10_000,
  });

  // Инициализация локального состояния из сервера
  useEffect(() => {
    if (serverLogs === undefined) return;
    const existing = serverLogs[0] ?? null;
    const next = existing ?? initLog(date);
    setLog(next);
    logRef.current = next;
  }, [serverLogs, date]);

  const saveLog = useCallback(async (updatedLog) => {
    setIsSaving(true);
    logRef.current = updatedLog;
    setLog(updatedLog);
    try {
      if (updatedLog.id) {
        await api.putNutritionLog(updatedLog.id, updatedLog);
      } else {
        const created = await api.postNutritionLog(updatedLog);
        // Добавляем id из ответа сервера
        const withId = { ...updatedLog, id: created.id };
        logRef.current = withId;
        setLog(withId);
      }
      queryClient.invalidateQueries({ queryKey: ['nutrition-logs', date] });
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  }, [date, queryClient]);

  return {
    log,
    isLoading: isLoading || log === null,
    isSaving,
    saveLog,
  };
}
