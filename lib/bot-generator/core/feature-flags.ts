/**
 * @fileoverview Флаги возможностей генератора ботов
 *
 * Вычисляет флаги на основе узлов бота для управления генерацией кода.
 *
 * @module bot-generator/core/feature-flags
 */

import type { EnhancedNode } from '../types/enhanced-node.types';
import type { GenerationContext } from './generation-context';
import { NODE_TYPES } from '../types';
import { hasInlineButtons } from '../../templates/keyboard/keyboard.renderer';
import { hasAutoTransitions, hasMediaNodes, hasUploadImageUrls, hasNodesRequiringSafeEditOrSend, hasReplyKeyboardButtons, hasLocalMediaFiles, hasBotCommands } from '../../templates/filters';

/**
 * Флаги возможностей, вычисленные из узлов бота
 */
export interface FeatureFlags {
  hasInlineButtonsResult: boolean;
  hasAutoTransitionsResult: boolean;
  hasMediaNodesResult: boolean;
  hasUploadImagesResult: boolean;
  hasParseModeNodesResult: boolean;
  hasMediaGroupsResult: boolean;
  hasUrlImagesResult: boolean;
  hasDatetimeNodesResult: boolean;
  hasTimezoneNodesResult: boolean;
  hasNodesRequiringSafeEditOrSendResult: boolean;
  // Флаги для оптимизации импортов
  hasReplyKeyboardResult: boolean;
  hasLocalMediaFilesResult: boolean;
  hasBotCommandsResult: boolean;
}

/**
 * Константа типов узлов, которые уже обрабатываются отдельно
 */
export const ALREADY_HANDLED_TYPES = new Set<string>([
  NODE_TYPES.START,
  NODE_TYPES.COMMAND,
  NODE_TYPES.MESSAGE,
  'command_trigger',
  'text_trigger',
  'condition',
]);

/**
 * Проверяет, требует ли узел режима разбора (HTML/Markdown)
 */
function isParseModeNode(node: EnhancedNode): boolean {
  const data = node.data || {};

  if (
    data.formatMode &&
    (data.formatMode.toLowerCase() === 'html' ||
      data.formatMode.toLowerCase() === 'markdown')
  ) {
    return true;
  }

  if (data.markdown) return true;

  if (
    data.buttons &&
    data.buttons.length > 0 &&
    (data.formatMode === 'html' || data.formatMode === 'markdown' || data.markdown)
  ) {
    return true;
  }

  if (
    (data.imageUrl || data.videoUrl || data.audioUrl || data.documentUrl) &&
    data.mediaCaption
  ) {
    return true;
  }

  if (
    data.collectUserInput &&
    (data.formatMode === 'html' || data.formatMode === 'markdown' || data.markdown)
  ) {
    return true;
  }

  if (
    data.enableConditionalMessages &&
    (data.formatMode === 'html' || data.formatMode === 'markdown' || data.markdown)
  ) {
    return true;
  }

  return false;
}

/**
 * Вычисляет все флаги возможностей из контекста генерации
 *
 * @param context - Контекст генерации
 * @returns Флаги возможностей
 */
export function computeFeatureFlags(context: GenerationContext): FeatureFlags {
  const nodes = context.nodes || [];

  return {
    hasInlineButtonsResult: hasInlineButtons(nodes),
    hasAutoTransitionsResult: hasAutoTransitions(nodes),
    hasMediaNodesResult: hasMediaNodes(nodes),
    hasUploadImagesResult: hasUploadImageUrls(nodes),
    hasParseModeNodesResult: nodes.some(isParseModeNode),
    hasMediaGroupsResult: nodes.some(
      (node) =>
        node.data?.attachedMedia &&
        Array.isArray(node.data.attachedMedia) &&
        node.data.attachedMedia.length > 1
    ),
    hasUrlImagesResult: nodes.some(
      (node) => node.data?.imageUrl && node.data.imageUrl.startsWith('http')
    ),
    hasDatetimeNodesResult: nodes.some(
      (node) =>
        node.type === NODE_TYPES.MUTE_USER ||
        node.type === NODE_TYPES.BAN_USER
    ),
    hasTimezoneNodesResult: nodes.some(
      (node) =>
        node.type === NODE_TYPES.MUTE_USER ||
        node.type === NODE_TYPES.BAN_USER
    ),
    hasNodesRequiringSafeEditOrSendResult: hasNodesRequiringSafeEditOrSend(nodes),
    // Флаги для оптимизации импортов
    hasReplyKeyboardResult: hasReplyKeyboardButtons(nodes),
    hasLocalMediaFilesResult: hasLocalMediaFiles(nodes),
    hasBotCommandsResult: hasBotCommands(nodes),
  };
}
