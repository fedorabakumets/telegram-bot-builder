/**
 * @fileoverview Хук валидации команды узла
 * 
 * Проверяет валидность команды для узлов типа start, command и management.
 */

import { useMemo } from 'react';
import { validateCommand } from '@/lib/commands';
import { getNodeDefaults } from '../utils/node-defaults';
import type { Node } from '@shared/schema';

/** Пропсы хука */
interface UseNodeCommandValidationProps {
  /** Выбранный узел */
  selectedNode: Node | null;
}

/** Типы узлов с командами */
const COMMAND_NODE_TYPES = [
  'start',
  'command',
  'pin_message',
  'unpin_message',
  'delete_message',
  'ban_user',
  'unban_user',
  'mute_user',
  'unmute_user',
  'kick_user',
  'promote_user',
  'demote_user'
] as const;

/**
 * Хук валидации команды узла
 * 
 * @param {UseNodeCommandValidationProps} props - Пропсы хука
 * @returns {{ isValid: boolean; errors: string[] }} Результат валидации
 */
export function useNodeCommandValidation({
  selectedNode
}: UseNodeCommandValidationProps): { isValid: boolean; errors: string[] } {
  return useMemo(() => {
    if (!selectedNode) {
      return { isValid: true, errors: [] };
    }

    const nodeType = selectedNode.type as typeof COMMAND_NODE_TYPES[number];
    const hasCommand = COMMAND_NODE_TYPES.includes(nodeType);

    if (!hasCommand) {
      return { isValid: true, errors: [] };
    }

    const commandValue = selectedNode.data.command || getNodeDefaults(selectedNode.type).command || '';
    return validateCommand(commandValue);
  }, [selectedNode?.data.command, selectedNode?.type]);
}
