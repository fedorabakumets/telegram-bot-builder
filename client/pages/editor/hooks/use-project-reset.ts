/**
 * @fileoverview Хук сброса состояния редактора при смене проекта
 * При переключении на другой проект сбрасывает данные листов и флаг локальных изменений
 * @module pages/editor/hooks/use-project-reset
 */

import { useEffect, useRef } from 'react';
import type { BotDataWithSheets } from '@shared/schema';

/**
 * Параметры хука сброса проекта
 */
export interface UseProjectResetOptions {
  /** ID активного проекта */
  activeProjectId: number | undefined;
  /** Сеттер данных листов */
  setBotDataWithSheets: (data: BotDataWithSheets) => void;
  /** Сеттер флага локальных изменений */
  setHasLocalChanges: (has: boolean) => void;
}

/**
 * Сбрасывает состояние редактора при смене активного проекта.
 * Предотвращает отображение листов предыдущего проекта до загрузки нового.
 * @param options - Параметры хука
 */
export function useProjectReset({
  activeProjectId,
  setBotDataWithSheets,
  setHasLocalChanges,
}: UseProjectResetOptions): void {
  /** Предыдущий ID проекта для сравнения */
  const prevProjectIdRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const prevId = prevProjectIdRef.current;
    const currId = activeProjectId;

    // Сбрасываем только если ID реально изменился (не первая загрузка)
    if (prevId !== undefined && prevId !== currId) {
      setHasLocalChanges(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setBotDataWithSheets(null as any);
    }

    prevProjectIdRef.current = currId;
  }, [activeProjectId, setBotDataWithSheets, setHasLocalChanges]);
}
