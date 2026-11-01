/** @fileoverview Проверка поддержки вложений обработчиком блока перед выбором цели прикрепления. */

/** Типы блоков, генераторы которых обрабатывают массив attachedMedia. */
const MEDIA_NODE_TYPES = new Set(['message', 'start', 'command', 'media', 'broadcast', 'userbot_message']);

/**
 * Проверяет, умеет ли блок отправлять прикреплённые медиа.
 * @param node - Блок проекта или отсутствующая цель
 * @returns Доступность прикрепления файлов
 */
export function canAttachNodeMedia(node: { type?: string } | null | undefined): boolean {
  return !!node?.type && MEDIA_NODE_TYPES.has(node.type);
}
