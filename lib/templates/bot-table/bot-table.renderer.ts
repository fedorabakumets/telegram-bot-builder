/**
 * @fileoverview Функции рендеринга шаблона узла bot_table
 * @module templates/bot-table/bot-table.renderer
 */

import type { Node } from '@shared/schema';
import type { BotTableEntry } from './bot-table.params';
import { botTableEntrySchema } from './bot-table.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Собирает параметры для всех узлов типа bot_table
 * @param nodes - Массив узлов холста
 * @returns Массив BotTableEntry
 */
export function collectBotTableEntries(nodes: Node[]): BotTableEntry[] {
  return nodes
    .filter(n => n != null && (n.type as string) === 'bot_table')
    .map(node => ({
      nodeId: node.id,
      tableName: (node.data as any)?.tableName || '',
      operation: (node.data as any)?.operation || 'read',
      where: (node.data as any)?.where || [],
      updates: (node.data as any)?.updates || [],
      row: (node.data as any)?.row || {},
      key: (node.data as any)?.key || '',
      onConflict: (node.data as any)?.onConflict || 'ignore',
      saveResultTo: (node.data as any)?.saveResultTo || '',
      resultFormat: (node.data as any)?.resultFormat || 'first_row',
      returnColumns: (node.data as any)?.returnColumns || [],
      orderBy: (node.data as any)?.orderBy || '',
      orderDirection: (node.data as any)?.orderDirection || 'desc',
      limit: (node.data as any)?.limit || 0,
      autoTransitionTo: (node.data as any)?.autoTransitionTo || '',
    }));
}

/**
 * Генерирует Python-код обработчиков для всех узлов bot_table
 * @param nodes - Массив узлов холста
 * @returns Сгенерированный Python-код или пустая строка
 */
export function generateBotTableHandlers(nodes: Node[]): string {
  const entries = collectBotTableEntries(nodes);
  if (entries.length === 0) return '';

  return entries
    .filter(e => e.tableName)
    .map(entry => {
      const validated = botTableEntrySchema.parse(entry);
      return renderPartialTemplate('bot-table/bot-table.py.jinja2', validated);
    })
    .join('\n');
}
