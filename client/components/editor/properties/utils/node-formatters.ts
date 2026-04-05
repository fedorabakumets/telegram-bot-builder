/**
 * @fileoverview Форматирование узлов для списков выбора.
 */

import { Node } from '@shared/schema';

export function formatNodeDisplay(node: Node, sheetName?: string): string {
  const typeLabel = getNodeTypeLabel(node.type);
  const content = getNodeContent(node);
  return `${node.id} | ${content} | ${typeLabel} | ${sheetName}`;
}

export function getNodeTypeLabel(type: Node['type']): string {
  const types: Partial<Record<Node['type'], string>> = {
    start: 'Старт',
    command: 'Команда',
    message: 'Сообщение',
    location: 'Геолокация',
    contact: 'Контакт',
    sticker: 'Стикер',
    voice: 'Голос',
    animation: 'Анимация',
    command_trigger: 'Триггер команды',
    text_trigger: 'Текстовый триггер',
    media: 'Медиа',
    pin_message: 'Закрепить',
    unpin_message: 'Открепить',
    delete_message: 'Удалить',
    forward_message: 'Переслать',
    ban_user: 'Заблокировать',
    unban_user: 'Разблокировать',
    mute_user: 'Заглушить',
    unmute_user: 'Включить звук',
    kick_user: 'Исключить',
    promote_user: 'Повысить',
    demote_user: 'Понизить',
    admin_rights: 'Права админа',
    broadcast: 'Рассылка',
    photo: 'Фото',
    video: 'Видео',
    audio: 'Аудио',
    document: 'Документ',
    keyboard: 'Клавиатура',
    input: 'Сохранить ответ в переменную',
    condition: 'Условие',
    client_auth: 'Авторизация',
    callback_trigger: 'Триггер inline-кнопки',
    incoming_callback_trigger: 'Триггер нажатия кнопки',
    outgoing_message_trigger: 'Триггер исходящего сообщения',
    managed_bot_updated_trigger: 'Триггер управляемого бота',
  };

  return types[type] || type;
}

function getNodeContent(node: Node): string {
  if (node.type === 'command_trigger') {
    return (node.data.command || '').slice(0, 50);
  }

  if (node.type === 'message') {
    return ((node.data as any).messageText || '').slice(0, 50);
  }

  if (node.type === 'forward_message') {
    const target = ((node.data as any).targetChatId || '').trim();
    const targetVariable = ((node.data as any).targetChatVariableName || '').trim();
    const source = ((node.data as any).sourceMessageIdSource || 'current_message').trim();
    const linkedSourceNodeId = ((node.data as any).sourceMessageNodeId || '').trim();
    const sourceVariable = ((node.data as any).sourceMessageVariableName || '').trim();
    const targetRecipients = Array.isArray((node.data as any).targetChatTargets)
      ? (node.data as any).targetChatTargets
      : [];
    const activeTargetRecipients = targetRecipients.filter((recipient: any) => {
      if (!recipient) return false;
      if (recipient.targetChatIdSource === 'admin_ids') return true;
      return Boolean((recipient.targetChatId || '').trim() || (recipient.targetChatVariableName || '').trim());
    });
    const sourceLabel =
      source === 'current_message' ? 'Текущее сообщение' :
      source === 'last_message' ? 'Последнее сообщение' :
      source === 'manual' ? 'Вручную' : 'Из переменной';
    const linkedSuffix = linkedSourceNodeId ? ' · по связи' : '';
    const sourceSuffix = source === 'manual' ? ` (${((node.data as any).sourceMessageId || '').trim() || 'без ID'})` :
      source === 'variable' ? ` (${sourceVariable || 'переменная'})` : '';
    const formatTargetRecipient = (recipient: any): string => {
      const mode = recipient?.targetChatIdSource;
      if (mode === 'variable') {
        return `переменная: ${recipient?.targetChatVariableName?.trim() || 'пусто'}`;
      }
      if (mode === 'admin_ids') {
        return 'admin ids';
      }
      return recipient?.targetChatId?.trim() || 'без ID';
    };
    const targetLabel = activeTargetRecipients.length > 0
      ? `${activeTargetRecipients.slice(0, 2).map(formatTargetRecipient).join(', ')}${activeTargetRecipients.length > 2 ? ` +${activeTargetRecipients.length - 2}` : ''}`
      : (target || (targetVariable ? `переменная: ${targetVariable}` : ''));
    return (targetLabel ? `${sourceLabel}${sourceSuffix}${linkedSuffix} → ${targetLabel}` : `Источник: ${sourceLabel}${sourceSuffix}${linkedSuffix}`).slice(0, 50);
  }

  if (node.type === 'input') {
    const target = ((node.data as any).inputVariable || '').trim();
    const source = ((node.data as any).inputType || 'any').trim();
    const sourceLabel = source === 'any' ? 'Последний ответ' : source;
    return (target ? `${sourceLabel} → ${target}` : `Источник: ${sourceLabel}`).slice(0, 50);
  }

  if (node.type === 'text_trigger') {
    const textSynonyms = ((node.data as any).textSynonyms || []) as string[];
    return (textSynonyms[0] || '').slice(0, 50);
  }

  if (node.type === 'broadcast') {
    return 'Рассылка';
  }

  if (node.type === 'media') {
    return (((node.data as any).mediaItems || [])[0]?.url || '').slice(0, 50);
  }

  return ((node.data as any).label || '').slice(0, 50);
}
