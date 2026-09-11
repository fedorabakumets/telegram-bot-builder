/**
 * @fileoverview Хук публичного списка выключенных типов блоков
 * @module hooks/use-disabled-node-types
 */

import { useQuery } from '@tanstack/react-query';

/** Ответ GET /api/disabled-node-types */
export interface PublicDisabledNodeTypes {
  /** Выключенные внутренние имена типов */
  disabled: string[];
}

/**
 * Загружает типы, скрытые из набора блоков слева
 * @returns Запрос со списком выключенных типов
 */
export function useDisabledNodeTypes() {
  return useQuery<PublicDisabledNodeTypes>({
    queryKey: ['disabled-node-types'],
    queryFn: async () => {
      const res = await fetch('/api/disabled-node-types');
      if (!res.ok) throw new Error('Не удалось загрузить список типов');
      return res.json();
    },
    staleTime: 30_000,
  });
}
