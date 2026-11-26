/** @fileoverview Проверяет совместимость сценария с общим Telegram-клиентом до остановки ботов. */
import type { BotData, BotDataWithSheets } from '@shared/schema';
import { collectBroadcastNodes } from '../../lib/templates/broadcast-client/broadcast-client.renderer';

/**
 * Возвращает идентификаторы узлов, для которых пока нужен отдельный клиент.
 * @param data - Сохранённый сценарий проекта.
 * @returns Узлы, блокирующие переход.
 */
export function unsupportedSharedTelegramNodes(data: unknown): string[] {
  if (!data || typeof data !== 'object') return [];
  const scenario = data as Partial<BotData & BotDataWithSheets>;
  const nodes = Array.isArray(scenario.sheets)
    ? scenario.sheets.flatMap(sheet => Array.isArray(sheet?.nodes) ? sheet.nodes : [])
    : Array.isArray(scenario.nodes) ? scenario.nodes : [];
  return nodes.filter(node => {
    if (node.type === 'code') return /\b(?:userbot_client|TelegramClient|StringSession)\b/.test(String(node.data?.code ?? ''));
    if (node.type === 'userbot_message') return !!node.data?.attachedMedia?.length;
    if (node.type === 'broadcast' && node.data?.broadcastApiType === 'client') {
      return collectBroadcastNodes(nodes, node.id).some(message => !!message.attachedMedia?.length
        || !!(message.imageUrl || message.audioUrl || message.videoUrl || message.documentUrl));
    }
    return false;
  }).map(node => node.id);
}
