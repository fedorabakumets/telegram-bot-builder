/**
 * @fileoverview Форматирование узлов для списков выбора.
 */

import { Node } from '@shared/schema';
import { getNodeName } from '../../shared/node-registry';

export function formatNodeDisplay(node: Node, sheetName?: string): string {
  const typeLabel = getNodeTypeLabel(node.type);
  const content = getNodeContent(node);
  return `${node.id} | ${content} | ${typeLabel} | ${sheetName}`;
}

export function getNodeTypeLabel(type: Node['type']): string {
  return getNodeName(type as string);
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

  if ((node.type as any) === 'set_variable') {
    const assignments = ((node.data as any).assignments || []) as Array<{ variable: string; value: string }>;
    if (assignments.length === 0) return '';
    return assignments.slice(0, 2).map(a => `${a.variable}=${a.value}`).join(', ').slice(0, 50);
  }

  if (node.type === 'media') {
    return (((node.data as any).mediaItems || [])[0]?.url || '').slice(0, 50);
  }

  return ((node.data as any).label || '').slice(0, 50);
}
