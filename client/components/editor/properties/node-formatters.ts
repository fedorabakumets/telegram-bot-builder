/**
 * @fileoverview Функции форматирования узлов
 * Для отображения в списках выбора.
 * @module node-formatters
 */

import { Node } from '@shared/schema';

/**
 * Форматирует отображение узла в списках выбора.
 * Создает читаемое представление: "ID | Содержимое | Тип | Лист"
 * @param {Node} node - Узел для форматирования
 * @param {string} sheetName - Название листа
 * @returns {string} Отформатированная строка
 */
export function formatNodeDisplay(node: Node, sheetName: string): string {
  const typeLabel = getNodeTypeLabel(node.type);
  const content = getNodeContent(node);
  return `${node.id} | ${content} | ${typeLabel} | ${sheetName}`;
}

/** Получает локализованное название типа узла */
function getNodeTypeLabel(type: Node['type']): string {
  const types: Record<Node['type'], string> = {
    start: 'Старт', command: 'Команда', message: 'Сообщение', location: 'Геолокация',
    contact: 'Контакт', sticker: 'Стикер', voice: 'Голос', animation: 'Анимация',
    pin_message: 'Закрепить', unpin_message: 'Открепить', delete_message: 'Удалить',
    ban_user: 'Заблокировать', unban_user: 'Разблокировать', mute_user: 'Заглушить',
    unmute_user: 'Включить звук', kick_user: 'Исключить', promote_user: 'Повысить',
    demote_user: 'Понизить', admin_rights: 'Права админа'
  };
  return types[type] || type;
}

/** Извлекает содержимое узла (обрезанное до 50 символов) */
function getNodeContent(node: Node): string {
  if (node.type === 'start') return ((node.data as any).messageText || node.data.command || '').slice(0, 50);
  if (node.type === 'command') return (node.data.command || '').slice(0, 50);
  if (node.type === 'message') return ((node.data as any).messageText || '').slice(0, 50);
  return ((node.data as any).label || '').slice(0, 50);
}
