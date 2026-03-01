/**
 * @fileoverview Хук для управления состоянием панели свойств
 *
 * Содержит всю бизнес-логику панели свойств узлов:
 * - Управление состоянием сворачивания секций
 * - Валидация команд
 * - Автодополнение команд
 * - Управление displayNodeId
 *
 * @module use-properties-panel
 */

import { useState, useMemo, useEffect } from 'react';
import { Node, Button } from '@shared/schema';
import { validateCommand, getCommandSuggestions, STANDARD_COMMANDS } from '@/lib/commands';
import { collectAllNodesFromSheets } from '../utils/node-utils';
import { collectAvailableQuestions, extractVariables } from '../utils/variables-utils';
import { detectRuleConflicts, autoFixRulePriorities, RuleConflict } from '../utils/conditional-utils';
import { useMediaVariables } from './use-media-variables';
import { getNodeDefaults } from '../utils/node-defaults';

/** Пропсы хука usePropertiesPanel */
export interface UsePropertiesPanelProps {
  projectId: number;
  selectedNode: Node | null;
  allNodes: Node[] | undefined;
  allSheets: any[] | undefined;
  currentSheetId: string | undefined;
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
  onNodeIdChange?: (oldId: string, newId: string) => void;
  onButtonAdd: (nodeId: string, button: Button) => void;
  onButtonUpdate: (nodeId: string, buttonId: string, updates: Partial<Button>) => void;
  onButtonDelete: (nodeId: string, buttonId: string) => void;
}

/** Результат работы хука usePropertiesPanel */
export interface UsePropertiesPanelResult {
  // Состояния сворачивания секций
  isBasicSettingsOpen: boolean;
  isMessageTextOpen: boolean;
  isMediaSectionOpen: boolean;
  isAutoTransitionOpen: boolean;
  isKeyboardSectionOpen: boolean;
  isConditionalMessagesSectionOpen: boolean;
  isUserInputSectionOpen: boolean;
  setIsBasicSettingsOpen: (open: boolean) => void;
  setIsMessageTextOpen: (open: boolean) => void;
  setIsMediaSectionOpen: (open: boolean) => void;
  setIsAutoTransitionOpen: (open: boolean) => void;
  setIsKeyboardSectionOpen: (open: boolean) => void;
  setIsConditionalMessagesSectionOpen: (open: boolean) => void;
  setIsUserInputSectionOpen: (open: boolean) => void;

  // Состояния команд
  commandInput: string;
  showCommandSuggestions: boolean;
  setCommandInput: (value: string) => void;
  setShowCommandSuggestions: (show: boolean) => void;

  // Display Node ID
  displayNodeId: string;
  setDisplayNodeId: (id: string) => void;

  // Мемоизированные данные
  getAllNodesFromAllSheets: ReturnType<typeof collectAllNodesFromSheets>;
  availableQuestions: ReturnType<typeof collectAvailableQuestions>;
  textVariables: ReturnType<typeof extractVariables>['textVariables'];
  mediaVariables: ReturnType<typeof extractVariables>['mediaVariables'];
  detectRuleConflicts: RuleConflict[];
  commandValidation: ReturnType<typeof validateCommand>;
  commandSuggestions: ReturnType<typeof getCommandSuggestions>;

  // Хук медиа-переменных
  attachedMediaVariables: ReturnType<typeof useMediaVariables>['attachedMediaVariables'];
  handleMediaVariableSelect: ReturnType<typeof useMediaVariables>['handleMediaVariableSelect'];
  handleMediaVariableRemove: ReturnType<typeof useMediaVariables>['handleMediaVariableRemove'];

  // Утилиты
  autoFixPriorities: () => void;
  getNodeDefaults: (type: Node['type']) => any;
}

/**
 * Хук управления состоянием панели свойств узлов.
 * @param {UsePropertiesPanelProps} props - Пропсы хука
 * @returns {UsePropertiesPanelResult} Состояния и методы управления
 */
export function usePropertiesPanel({
  selectedNode,
  allNodes = [],
  allSheets = [],
  currentSheetId,
  onNodeUpdate,
  onNodeIdChange,
  onButtonAdd,
  onButtonUpdate,
  onButtonDelete
}: UsePropertiesPanelProps): UsePropertiesPanelResult {
  // Состояния сворачивания секций
  const [isBasicSettingsOpen, setIsBasicSettingsOpen] = useState(true);
  const [isMessageTextOpen, setIsMessageTextOpen] = useState(true);
  const [isMediaSectionOpen, setIsMediaSectionOpen] = useState(true);
  const [isAutoTransitionOpen, setIsAutoTransitionOpen] = useState(true);
  const [isKeyboardSectionOpen, setIsKeyboardSectionOpen] = useState(true);
  const [isConditionalMessagesSectionOpen, setIsConditionalMessagesSectionOpen] = useState(true);
  const [isUserInputSectionOpen, setIsUserInputSectionOpen] = useState(true);

  // Состояния команд
  const [commandInput, setCommandInput] = useState('');
  const [showCommandSuggestions, setShowCommandSuggestions] = useState(false);

  // Display Node ID
  const [displayNodeId, setDisplayNodeId] = useState(selectedNode?.id || '');

  // Синхронизация displayNodeId с selectedNode.id
  useEffect(() => {
    if (selectedNode?.id) {
      setDisplayNodeId(selectedNode.id);
    }
  }, [selectedNode?.id]);

  // Мемоизация всех узлов из всех листов
  const getAllNodesFromAllSheets = useMemo(
    () => collectAllNodesFromSheets(allSheets, allNodes, currentSheetId),
    [allSheets, allNodes, currentSheetId]
  );

  // Мемоизация доступных вопросов
  const availableQuestions = useMemo(
    () => collectAvailableQuestions(allNodes),
    [allNodes]
  );

  // Мемоизация переменных
  const { textVariables, mediaVariables } = useMemo(
    () => extractVariables(allNodes),
    [allNodes]
  );

  // Хук управления медиа-переменными
  const { attachedMediaVariables, handleMediaVariableSelect, handleMediaVariableRemove } = useMediaVariables(
    selectedNode,
    mediaVariables,
    onNodeUpdate
  );

  // Мемоизация конфликтов условных сообщений
  const detectRuleConflicts = useMemo((): RuleConflict[] => {
    if (!selectedNode?.data.conditionalMessages) return [];
    return detectRuleConflicts(selectedNode.data.conditionalMessages);
  }, [selectedNode?.data.conditionalMessages]);

  // Автоматическое исправление приоритетов
  const autoFixPriorities = (): void => {
    if (!selectedNode?.data.conditionalMessages) return;
    const fixedRules = autoFixRulePriorities(selectedNode.data.conditionalMessages);
    onNodeUpdate(selectedNode.id, { conditionalMessages: fixedRules });
  };

  // Валидация команды
  const commandValidation = useMemo(() => {
    if (selectedNode && (
      selectedNode.type === 'start' ||
      selectedNode.type === 'command' ||
      selectedNode.type === 'pin_message' ||
      selectedNode.type === 'unpin_message' ||
      selectedNode.type === 'delete_message' ||
      selectedNode.type === 'ban_user' ||
      selectedNode.type === 'unban_user' ||
      selectedNode.type === 'mute_user' ||
      selectedNode.type === 'unmute_user' ||
      selectedNode.type === 'kick_user' ||
      selectedNode.type === 'promote_user' ||
      selectedNode.type === 'demote_user'
    )) {
      const commandValue = selectedNode.data.command || getNodeDefaults(selectedNode.type).command || '';
      return validateCommand(commandValue);
    }
    return { isValid: true, errors: [] };
  }, [selectedNode?.data.command, selectedNode?.type]);

  // Автодополнение команд
  const commandSuggestions = useMemo(() => {
    if (commandInput.length > 0) {
      return getCommandSuggestions(commandInput);
    }
    return STANDARD_COMMANDS.slice(0, 5);
  }, [commandInput]);

  // Добавление кнопки
  const handleAddButton = (): void => {
    if (!selectedNode) return;
    const newButton: Button = {
      id: crypto.randomUUID(),
      text: 'Новая кнопка',
      action: 'goto',
      target: '',
      buttonType: 'normal',
      skipDataCollection: false,
      hideAfterClick: false
    };
    onButtonAdd(selectedNode.id, newButton);
  };

  return {
    // Состояния сворачивания
    isBasicSettingsOpen,
    isMessageTextOpen,
    isMediaSectionOpen,
    isAutoTransitionOpen,
    isKeyboardSectionOpen,
    isConditionalMessagesSectionOpen,
    isUserInputSectionOpen,
    setIsBasicSettingsOpen,
    setIsMessageTextOpen,
    setIsMediaSectionOpen,
    setIsAutoTransitionOpen,
    setIsKeyboardSectionOpen,
    setIsConditionalMessagesSectionOpen,
    setIsUserInputSectionOpen,

    // Состояния команд
    commandInput,
    showCommandSuggestions,
    setCommandInput,
    setShowCommandSuggestions,

    // Display Node ID
    displayNodeId,
    setDisplayNodeId,

    // Мемоизированные данные
    getAllNodesFromAllSheets,
    availableQuestions,
    textVariables,
    mediaVariables,
    detectRuleConflicts,
    commandValidation,
    commandSuggestions,

    // Хук медиа-переменных
    attachedMediaVariables,
    handleMediaVariableSelect,
    handleMediaVariableRemove,

    // Утилиты
    autoFixPriorities,
    getNodeDefaults,
    handleAddButton
  };
}
