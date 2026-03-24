/**
 * @fileoverview Хук для управления медиапеременными
 * Для Telegram Bot Builder.
 * @module use-media-variables
 */

import { useMemo, useCallback } from 'react';
import { Node } from '@shared/schema';
import { ProjectVariable } from '../utils/variables-utils';

function toAttachedMediaToken(variableName: string): string {
  const trimmed = variableName.trim();
  return trimmed.startsWith('{') && trimmed.endsWith('}') ? trimmed : `{${trimmed}}`;
}

/** Результат хука useMediaVariables */
export interface UseMediaVariablesResult {
  attachedMediaVariables: ProjectVariable[];
  handleMediaVariableSelect: (variableName: string) => void;
  handleMediaVariableRemove: (variableName: string) => void;
}

/**
 * Хук для управления прикрепленными медиапеременными узла.
 * @param {Node | null} selectedNode - Выбранный узел
 * @param {ProjectVariable[]} mediaVariables - Все доступные медиапеременные
 * @param {(nodeId: string, updates: Partial<Node['data']>) => void} onNodeUpdate - Функция обновления узла
 * @returns {UseMediaVariablesResult} Методы и данные для управления медиа
 */
export function useMediaVariables(
  selectedNode: Node | null,
  mediaVariables: ProjectVariable[],
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void
): UseMediaVariablesResult {
  // Получаем имена прикрепленных медиа
  const attachedMediaVariables = useMemo(() => {
    if (!selectedNode?.data.attachedMedia || mediaVariables.length === 0) return [];
    const attachedMediaNames = selectedNode.data.attachedMedia as string[];
    return mediaVariables.filter(v => attachedMediaNames.includes(v.name) || attachedMediaNames.includes(toAttachedMediaToken(v.name)));
  }, [selectedNode?.data.attachedMedia, mediaVariables]);

  // Добавление медиапеременной
  const handleMediaVariableSelect = useCallback((variableName: string) => {
    if (!selectedNode) return;
    const currentAttachedMedia = (selectedNode.data.attachedMedia as string[]) || [];
    const mediaToken = toAttachedMediaToken(variableName);
    if (currentAttachedMedia.includes(variableName) || currentAttachedMedia.includes(mediaToken)) return;
    onNodeUpdate(selectedNode.id, { attachedMedia: [...currentAttachedMedia, mediaToken] });
  }, [selectedNode, onNodeUpdate]);

  // Удаление медиапеременной
  const handleMediaVariableRemove = useCallback((variableName: string) => {
    if (!selectedNode) return;
    const currentAttachedMedia = (selectedNode.data.attachedMedia as string[]) || [];
    const mediaToken = toAttachedMediaToken(variableName);
    onNodeUpdate(selectedNode.id, {
      attachedMedia: currentAttachedMedia.filter(name => name !== variableName && name !== mediaToken)
    });
  }, [selectedNode, onNodeUpdate]);

  return { attachedMediaVariables, handleMediaVariableSelect, handleMediaVariableRemove };
}
