/**
 * @fileoverview Хук для управления панелью свойств
 *
 * Объединяет состояние и мемоизированные значения для PropertiesPanel.
 *
 * @module hooks/use-properties-panel
 */

import { useMemo } from 'react';
import type { Node } from '@shared/schema';
import { usePropertiesPanelState } from './use-properties-panel-state';
import { usePropertiesPanelMemo } from './use-properties-panel-memo';
import type { NodeWithSheet } from '../utils/node-utils';
import type { ProjectVariable } from '../utils/variables-utils';
import type { RuleConflict } from '../utils/conditional-utils';

/**
 * Пропсы хука
 */
interface UsePropertiesPanelProps {
  /** Выбранный узел */
  selectedNode: Node | null;
  /** Все узлы текущего листа */
  allNodes: Node[];
  /** Все листы проекта */
  allSheets: unknown[];
  /** ID текущего листа */
  currentSheetId?: string;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
}

/**
 * Возвращаемое значение хука
 */
interface UsePropertiesPanelReturn {
  /** Состояние панели */
  state: {
    /** Открыты ли основные настройки */
    isBasicSettingsOpen: boolean;
    /** Открыт ли текст сообщения */
    isMessageTextOpen: boolean;
    /** Открыта ли медиа секция */
    isMediaSectionOpen: boolean;
    /** Открыты ли автопереходы */
    isAutoTransitionOpen: boolean;
    /** Открыта ли секция клавиатуры */
    isKeyboardSectionOpen: boolean;
    /** Открыта ли секция условных сообщений */
    isConditionalMessagesSectionOpen: boolean;
    /** Открыта ли секция пользовательского ввода */
    isUserInputSectionOpen: boolean;
    /** Отображаемый ID узла */
    displayNodeId: string;
  };
  /** Установщики состояния */
  setState: {
    setIsBasicSettingsOpen: (open: boolean) => void;
    setIsMessageTextOpen: (open: boolean) => void;
    setIsMediaSectionOpen: (open: boolean) => void;
    setIsAutoTransitionOpen: (open: boolean) => void;
    setIsKeyboardSectionOpen: (open: boolean) => void;
    setIsConditionalMessagesSectionOpen: (open: boolean) => void;
    setIsUserInputSectionOpen: (open: boolean) => void;
    setDisplayNodeId: (id: string) => void;
  };
  /** Мемоизированные значения */
  memo: {
    /** Все узлы из всех листов */
    getAllNodesFromAllSheets: NodeWithSheet[];
    /** Доступные вопросы */
    availableQuestions: ProjectVariable[];
    /** Текстовые переменные */
    textVariables: ProjectVariable[];
    /** Медиа переменные */
    mediaVariables: ProjectVariable[];
    /** Прикреплённые медиа переменные */
    attachedMediaVariables: ProjectVariable[];
    /** Конфликты правил */
    detectRuleConflicts: RuleConflict[];
  };
  /** Обработчики */
  handlers: {
    /** Выбор медиа переменной */
    handleMediaVariableSelect: (name: string, mediaType: string) => void;
    /** Удаление медиа переменной */
    handleMediaVariableRemove: (name: string) => void;
    /** Автоисправление приоритетов */
    autoFixPriorities: () => void;
  };
}

/**
 * Хук для управления панелью свойств
 *
 * @param {UsePropertiesPanelProps} props - Пропсы хука
 * @returns {UsePropertiesPanelReturn} Объект с состоянием, мемо и обработчиками
 */
export function usePropertiesPanel({
  selectedNode,
  allNodes,
  allSheets,
  currentSheetId,
  onNodeUpdate
}: UsePropertiesPanelProps): UsePropertiesPanelReturn {
  const stateHooks = usePropertiesPanelState(selectedNode);
  const memoHooks = usePropertiesPanelMemo({
    selectedNode,
    allNodes,
    allSheets,
    currentSheetId,
    onNodeUpdate
  });

  const state = {
    isBasicSettingsOpen: stateHooks.isBasicSettingsOpen,
    isMessageTextOpen: stateHooks.isMessageTextOpen,
    isMediaSectionOpen: stateHooks.isMediaSectionOpen,
    isAutoTransitionOpen: stateHooks.isAutoTransitionOpen,
    isKeyboardSectionOpen: stateHooks.isKeyboardSectionOpen,
    isConditionalMessagesSectionOpen: stateHooks.isConditionalMessagesSectionOpen ?? true,
    isUserInputSectionOpen: stateHooks.isUserInputSectionOpen ?? true,
    displayNodeId: stateHooks.displayNodeId
  };

  const setState = {
    setIsBasicSettingsOpen: stateHooks.setIsBasicSettingsOpen,
    setIsMessageTextOpen: stateHooks.setIsMessageTextOpen,
    setIsMediaSectionOpen: stateHooks.setIsMediaSectionOpen,
    setIsAutoTransitionOpen: stateHooks.setIsAutoTransitionOpen,
    setIsKeyboardSectionOpen: stateHooks.setIsKeyboardSectionOpen,
    setIsConditionalMessagesSectionOpen: stateHooks.setIsConditionalMessagesSectionOpen ?? (() => {}),
    setIsUserInputSectionOpen: stateHooks.isUserInputSectionOpen ?? (() => {}),
    setDisplayNodeId: stateHooks.setDisplayNodeId
  };

  const memo = {
    getAllNodesFromAllSheets: memoHooks.getAllNodesFromAllSheets,
    availableQuestions: memoHooks.availableQuestions,
    textVariables: memoHooks.textVariables,
    mediaVariables: memoHooks.mediaVariables,
    attachedMediaVariables: memoHooks.attachedMediaVariables,
    detectRuleConflicts: memoHooks.detectRuleConflicts
  };

  const handlers = {
    handleMediaVariableSelect: memoHooks.handleMediaVariableSelect,
    handleMediaVariableRemove: memoHooks.handleMediaVariableRemove,
    autoFixPriorities: memoHooks.autoFixPriorities
  };

  return { state, setState, memo, handlers };
}
