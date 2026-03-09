import { useState, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api.js';

/**
 * Поиск продуктов: сначала локальная БД, потом Open Food Facts.
 * Автоматически сохраняет продукты из OFacts в локальную БД.
 */
export function useFoodSearch() {
  const queryClient = useQueryClient();
  const [localResults,    setLocalResults]    = useState([]);
  const [externalResults, setExternalResults] = useState([]);
  const [isSearchingLocal,    setIsSearchingLocal]    = useState(false);
  const [isSearchingExternal, setIsSearchingExternal] = useState(false);
  const timerLocal    = useRef(null);
  const timerExternal = useRef(null);

  const addToDb = useMutation({
    mutationFn: api.postFoodDb,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['food-db'] }),
  });

  const search = useCallback((q) => {
    clearTimeout(timerLocal.current);
    clearTimeout(timerExternal.current);

    if (!q || q.length < 2) {
      setLocalResults([]);
      setExternalResults([]);
      return;
    }

    // Локальный поиск — быстрый (200 мс)
    timerLocal.current = setTimeout(async () => {
      setIsSearchingLocal(true);
      try {
        const res = await api.getFoodDb(q);
        setLocalResults(res);
        // Если мало локальных — ищем внешне
        if (res.length < 4 && q.length >= 3) {
          timerExternal.current = setTimeout(async () => {
            setIsSearchingExternal(true);
            try {
              const ext = await api.searchFoodExternal(q);
              setExternalResults(ext);
            } catch { setExternalResults([]); }
            finally { setIsSearchingExternal(false); }
          }, 400);
        } else {
          setExternalResults([]);
        }
      } catch { setLocalResults([]); }
      finally { setIsSearchingLocal(false); }
    }, 200);
  }, []);

  const clear = useCallback(() => {
    clearTimeout(timerLocal.current);
    clearTimeout(timerExternal.current);
    setLocalResults([]);
    setExternalResults([]);
  }, []);

  const saveExternalToDb = useCallback((item) => {
    if (item.source === 'openfoodfacts') {
      addToDb.mutate({
        name:    item.name,
        per100g: item.per100g,
        source:  'openfoodfacts',
        barcode: item.barcode,
      });
    }
  }, [addToDb]);

  return {
    localResults,
    externalResults,
    isSearchingLocal,
    isSearchingExternal,
    search,
    clear,
    saveExternalToDb,
  };
}
