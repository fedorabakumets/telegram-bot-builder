/**
 * @fileoverview Хук состояния режима обучения сценариев
 * @module components/editor/scenariy/learn/use-scenariy-learn
 */

import { useCallback, useMemo, useState } from 'react';
import {
  SCENARIY_LEARN_STEPS,
  type ScenariyLearnStep,
} from './scenariy-learn-steps';
import {
  clearScenariyLearnDismissed,
  dismissScenariyLearn,
  isScenariyLearnDismissed,
} from './scenariy-learn-storage';
import type { TabValue } from '../types/scenariy-tipy';

/** Результат хука обучения */
export interface UseScenariyLearnResult {
  /** Активен ли режим обучения */
  active: boolean;
  /** Индекс текущего шага (0-based) */
  stepIndex: number;
  /** Текущий шаг */
  step: ScenariyLearnStep;
  /** Всего шагов */
  totalSteps: number;
  /** Номер шага для UI (1-based) */
  stepNumber: number;
  /** Реплика допечатана — можно «Далее» */
  lineReady: boolean;
  /** Это последний шаг */
  isLast: boolean;
  /** Это первый шаг */
  isFirst: boolean;
  /** Отметить реплику допечатанной */
  markLineReady: () => void;
  /** Перейти к следующему шагу */
  goNext: () => void;
  /** Вернуться к предыдущему шагу */
  goBack: () => void;
  /** Пропустить / закрыть обучение */
  skip: () => void;
  /** Запустить или пройти обучение снова с первого шага */
  restart: () => void;
  /** Вкладки / фильтры / карточки по текущему шагу */
  visibleTabs: number;
  showFilters: boolean;
  showCards: boolean;
  focusTab: TabValue | undefined;
}

/**
 * Управляет пошаговым режимом обучения
 * @param autoStart - Автостарт (нет проектов и не пропущено)
 * @returns Состояние и действия
 */
export function useScenariyLearn(autoStart: boolean): UseScenariyLearnResult {
  const [stepIndex, setStepIndex] = useState(0);
  const [lineReady, setLineReady] = useState(false);
  const [manual, setManual] = useState(false);
  const [closed, setClosed] = useState(() => isScenariyLearnDismissed());

  const active = manual || (autoStart && !closed);
  const totalSteps = SCENARIY_LEARN_STEPS.length;
  const safeIndex = Math.min(stepIndex, totalSteps - 1);
  const step = SCENARIY_LEARN_STEPS[safeIndex];
  const isLast = safeIndex >= totalSteps - 1;
  const isFirst = safeIndex <= 0;

  const markLineReady = useCallback(() => setLineReady(true), []);

  const goNext = useCallback(() => {
    if (!lineReady) return;
    if (isLast) return;
    setLineReady(false);
    setStepIndex((i) => Math.min(i + 1, totalSteps - 1));
  }, [isLast, lineReady, totalSteps]);

  const goBack = useCallback(() => {
    if (isFirst) return;
    setLineReady(false);
    setStepIndex((i) => Math.max(i - 1, 0));
  }, [isFirst]);

  const skip = useCallback(() => {
    dismissScenariyLearn();
    setClosed(true);
    setManual(false);
    setLineReady(true);
    setStepIndex(totalSteps - 1);
  }, [totalSteps]);

  const restart = useCallback(() => {
    clearScenariyLearnDismissed();
    setClosed(false);
    setManual(true);
    setLineReady(false);
    setStepIndex(0);
  }, []);

  return useMemo(
    () => ({
      active,
      stepIndex: safeIndex,
      step,
      totalSteps,
      stepNumber: safeIndex + 1,
      lineReady,
      isLast,
      isFirst,
      markLineReady,
      goNext,
      goBack,
      skip,
      restart,
      visibleTabs: active ? step.visibleTabs : 4,
      showFilters: active ? Boolean(step.showFilters) : true,
      showCards: active ? Boolean(step.showCards) : true,
      focusTab: active ? step.focusTab : undefined,
    }),
    [
      active,
      safeIndex,
      step,
      totalSteps,
      lineReady,
      isLast,
      isFirst,
      markLineReady,
      goNext,
      goBack,
      skip,
      restart,
    ],
  );
}
