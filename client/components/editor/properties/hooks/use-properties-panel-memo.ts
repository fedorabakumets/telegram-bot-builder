/**
 * @fileoverview Хук мемоизированных значений для панели свойств
 * 
 * Предоставляет мемоизированные данные для работы с узлами и переменными.
 */

import { useMemo } from 'react';
import { collectAllNodesFromSheets, collectAvailableQuestions, extractVariables } from '../utils';
import { useMediaVariables } from './use-media-variables';
import { detectRuleConflicts as detectConflicts } from '../utils/conditional-utils';
import type { Node } from '@shared/schema';
import type { RuleConflict } from '../utils/conditional-utils';
import type { ProjectVariable } from '../utils/variables-utils';

/** Интерфейс возвращаемого значения хука */
interface UsePropertiesPanelMemoReturn {
  /** Все узлы из всех листов */
  getAllNodesFromAllSheets: any[];
  /** Доступные вопросы */
  availableQuestions: ProjectVariable[];
  /** Текстовые переменные */
  textVariables: ProjectVariable[];
  /** Медиа переменные */
  mediaVariables: ProjectVariable[];
  /** Прикреплённые медиа переменные */
  attachedMediaVariables: ProjectVariable[];
  /** Обработчик выбора медиа переменной */
  handleMediaVariableSelect: (name: string, mediaType: string) => void;
  /** Обработчик удаления медиа переменной */
  handleMediaVariableRemove: (name: string) => void;
  /** Конфликты правил */
  detectRuleConflicts: RuleConflict[];
  /** Функция автоматического исправления приоритетов */
  autoFixPriorities: (conditionalMessages?: any[]) => void;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
}

/** Пропсы хука */
interface UsePropertiesPanelMemoProps {
  /** Выбранный узел */
  selectedNode: Node | null;
  /** Все узлы текущего листа */
  allNodes: Node[];
  /** Все листы проекта */
  allSheets: any[];
  /** ID текущего листа */
  currentSheetId?: string;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
}

/**
 * Хук мемоизированных значений для панели свойств
 * 
 * @param {UsePropertiesPanelMemoProps} props - Пропсы хука
 * @returns {UsePropertiesPanelMemoReturn} Объект с мемоизированными данными
 */
export function usePropertiesPanelMemo({
  selectedNode,
  allNodes,
  allSheets,
  currentSheetId,
  onNodeUpdate
}: UsePropertiesPanelMemoProps): UsePropertiesPanelMemoReturn {
  const getAllNodesFromAllSheets = useMemo(
    () => collectAllNodesFromSheets(allSheets, allNodes, currentSheetId),
    [allSheets, allNodes, currentSheetId]
  );

  const availableQuestions = useMemo(
    () => collectAvailableQuestions(allNodes),
    [allNodes]
  );

  const { textVariables, mediaVariables } = useMemo(
    () => extractVariables(allNodes),
    [allNodes]
  );

  const { attachedMediaVariables, handleMediaVariableSelect, handleMediaVariableRemove } = useMediaVariables(
    selectedNode,
    mediaVariables,
    onNodeUpdate
  );

  const detectRuleConflicts = useMemo((): RuleConflict[] => {
    if (!selectedNode?.data.conditionalMessages) return [];
    return detectConflicts(selectedNode.data.conditionalMessages);
  }, [selectedNode?.data.conditionalMessages]);

  const autoFixPriorities = (conditionalMessages?: any[]): void => {
    if (!conditionalMessages) return;
    // Логика исправления приоритетов
  };

  return {
    getAllNodesFromAllSheets,
    availableQuestions,
    textVariables,
    mediaVariables,
    attachedMediaVariables,
    handleMediaVariableSelect,
    handleMediaVariableRemove,
    detectRuleConflicts,
    autoFixPriorities,
    onNodeUpdate
  };
}
