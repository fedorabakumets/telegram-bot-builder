/**
 * @fileoverview Типы узлов бота
 *
 * BotNode — алиас для Node из @shared/schema.
 * Оставлен для обратной совместимости.
 *
 * @module bot-generator/types/bot-node-types
 */

export type { Node as BotNode } from '@shared/schema';

/**
 * Массив узлов бота
 */
import type { Node } from '@shared/schema';
export type BotNodeArray = Node[];
