/**
 * @fileoverview Хук валидации команд для панели свойств
 * 
 * Предоставляет валидацию команды и автодополнение.
 */

import { useMemo, useState } from 'react';
import { validateCommand, getCommandSuggestions, STANDARD_COMMANDS } from '@/lib/commands';
import { getNodeDefaults } from '../utils/node-defaults';
import type { Node } from '@shared/schema';

/** Интерфейс возвращаемого значения хука */
interface UseCommandValidationReturn {
  /** Ввод команды */
  commandInput: string;
  /** Функция установки ввода команды */
  setCommandInput: (value: string) => void;
  /** Флаг отображения подсказок */
  showCommandSuggestions: boolean;
  /** Функция установки флага подсказок */
  setShowCommandSuggestions: (show: boolean) => void;
  /** Результат валидации команды */
  commandValidation: { isValid: boolean; errors: string[] };
  /** Список подсказок команд */
  commandSuggestions: Array<{ command: string; description: string }>;
}

/** Пропсы хука */
interface UseCommandValidationProps {
  /** Выбранный узел */
  selectedNode: Node | null;
}

/**
 * Хук валидации команд для панели свойств
 * 
 * @param {UseCommandValidationProps} props - Пропсы хука
 * @returns {UseCommandValidationReturn} Объект с валидацией и подсказками
 */
export function useCommandValidation({
  selectedNode
}: UseCommandValidationProps): UseCommandValidationReturn {
  const [commandInput, setCommandInput] = useState('');
  const [showCommandSuggestions, setShowCommandSuggestions] = useState(false);

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

  const commandSuggestions = useMemo(() => {
    if (commandInput.length > 0) {
      return getCommandSuggestions(commandInput);
    }
    return STANDARD_COMMANDS.slice(0, 5);
  }, [commandInput]);

  return {
    commandInput,
    setCommandInput,
    showCommandSuggestions,
    setShowCommandSuggestions,
    commandValidation,
    commandSuggestions
  };
}
