/**
 * @fileoverview Хук состояния режима обучения редактора
 * @module components/editor/canvas/learn/use-editor-learn
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import type { EditorLearnStep } from './editor-learn-steps';
import { getEditorLearnSection, type EditorLearnSectionId } from './editor-learn-sections';
import { isEditorTaskDone, snapshotLearnNodes, type LearnNode, type LearnSnapshot } from './editor-learn-task';
import { useEditorLearnClick } from './use-editor-learn-click';
import {
  clearEditorLearnDismissed,
  dismissEditorLearn,
  isEditorLearnDismissed,
  markEditorLearnSectionDone,
} from './editor-learn-storage';

/** Результат хука обучения редактора */
export interface UseEditorLearnResult {
  /** Активен ли режим */
  active: boolean;
  /** Текущий раздел */
  sectionId: EditorLearnSectionId;
  /** Текущий шаг */
  step: EditorLearnStep;
  /** Всего шагов в разделе */
  totalSteps: number;
  /** Номер шага (1-based) */
  stepNumber: number;
  /** Реплика допечатана */
  lineReady: boolean;
  /** Задание шага выполнено */
  taskDone: boolean;
  /** Подсказка, пока задание не сделано */
  waitHint?: string;
  /** Последний шаг */
  isLast: boolean;
  /** Первый шаг */
  isFirst: boolean;
  /** Реплика допечатана */
  markLineReady: () => void;
  /** Далее */
  goNext: () => void;
  /** Назад */
  goBack: () => void;
  /** Пропустить раздел */
  skip: () => void;
  /** Раздел пройден до конца */
  finish: () => void;
  /** Запуск раздела с первого шага */
  start: (sectionId?: EditorLearnSectionId) => void;
}

/**
 * Управляет пошаговым обучением редактора по разделам
 * @param nodes - Узлы текущего листа
 * @param autoStart - Автостарт «Основ» на пустом холсте, если не пропускали
 * @returns Состояние и действия
 */
export function useEditorLearn(nodes: LearnNode[], autoStart: boolean): UseEditorLearnResult {
  const [sectionId, setSectionId] = useState<EditorLearnSectionId>('basics');
  const [stepIndex, setStepIndex] = useState(0);
  const [lineReady, setLineReady] = useState(false);
  const [manual, setManual] = useState(false);
  const [closed, setClosed] = useState(() => isEditorLearnDismissed());

  const steps = getEditorLearnSection(sectionId).steps;
  const active = manual || (autoStart && !closed);
  const totalSteps = steps.length;
  const safeIndex = Math.min(stepIndex, totalSteps - 1);
  const step = steps[safeIndex];
  const isLast = safeIndex >= totalSteps - 1;
  const isFirst = safeIndex <= 0;
  const stepKey = `${sectionId}:${step.id}`;

  const baselineRef = useRef<LearnSnapshot | null>(null);
  const baselineStepRef = useRef<string | null>(null);
  if (baselineStepRef.current !== stepKey) {
    baselineStepRef.current = stepKey;
    baselineRef.current = snapshotLearnNodes(nodes);
  }
  const clicked = useEditorLearnClick(stepKey, step.clickTarget);
  const taskDone = step.task === 'click'
    ? clicked
    : isEditorTaskDone(step.task, nodes, baselineRef.current ?? snapshotLearnNodes(nodes));

  const markLineReady = useCallback(() => setLineReady(true), []);

  const goNext = useCallback(() => {
    if (!lineReady || !taskDone || isLast) return;
    setLineReady(false);
    setStepIndex((i) => Math.min(i + 1, totalSteps - 1));
  }, [isLast, lineReady, taskDone, totalSteps]);

  const goBack = useCallback(() => {
    if (isFirst) return;
    setLineReady(false);
    setStepIndex((i) => Math.max(i - 1, 0));
  }, [isFirst]);

  const skip = useCallback(() => {
    dismissEditorLearn();
    setClosed(true);
    setManual(false);
    setLineReady(false);
    setStepIndex(0);
  }, []);

  const finish = useCallback(() => {
    markEditorLearnSectionDone(sectionId);
    skip();
  }, [sectionId, skip]);

  const start = useCallback((next: EditorLearnSectionId = 'basics') => {
    clearEditorLearnDismissed();
    setSectionId(next);
    setClosed(false);
    setManual(true);
    setLineReady(false);
    setStepIndex(0);
  }, []);

  return useMemo(
    () => ({
      active, sectionId, step, totalSteps, stepNumber: safeIndex + 1, lineReady, taskDone,
      waitHint: step.waitHint, isLast, isFirst, markLineReady, goNext, goBack, skip, finish, start,
    }),
    [active, sectionId, step, totalSteps, safeIndex, lineReady, taskDone, isLast, isFirst,
      markLineReady, goNext, goBack, skip, finish, start],
  );
}
