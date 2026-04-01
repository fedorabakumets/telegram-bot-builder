/**
 * @fileoverview Рендерер шаблона пересылки сообщения
 * @module templates/forward-message/forward-message.renderer
 */

import type { Node } from '@shared/schema';
import type {
  ForwardMessageTemplateParams,
  ForwardMessageTargetRecipient,
  ForwardMessageSourceMode,
  ForwardMessageTargetMode,
} from './forward-message.params';
import {
  forwardMessageParamsSchema,
  forwardMessageSourceModeSchema,
  forwardMessageTargetModeSchema,
} from './forward-message.schema';
import { renderPartialTemplate } from '../template-renderer';

/** Проверяет корректность режима источника сообщения */
function isSourceMode(value: unknown): value is ForwardMessageSourceMode {
  return forwardMessageSourceModeSchema.safeParse(value).success;
}

/** Проверяет корректность режима чата назначения */
function isTargetMode(value: unknown): value is ForwardMessageTargetMode {
  return forwardMessageTargetModeSchema.safeParse(value).success;
}

/** Нормализует одного получателя пересылки */
function normalizeRecipient(recipient: unknown, index: number): ForwardMessageTargetRecipient {
  const rawRecipient = recipient as {
    id?: unknown;
    targetChatIdSource?: unknown;
    targetChatId?: unknown;
    targetChatVariableName?: unknown;
    targetChatType?: unknown;
    targetThreadId?: unknown;
  } | null | undefined;

  return {
    id: typeof rawRecipient?.id === 'string' && rawRecipient.id.trim() ? rawRecipient.id.trim() : `target-${index + 1}`,
    targetChatIdSource: isTargetMode(rawRecipient?.targetChatIdSource) ? rawRecipient.targetChatIdSource : 'manual',
    targetChatId: typeof rawRecipient?.targetChatId === 'string' ? rawRecipient.targetChatId : '',
    targetChatVariableName: typeof rawRecipient?.targetChatVariableName === 'string' ? rawRecipient.targetChatVariableName : '',
    targetChatType: rawRecipient?.targetChatType === 'group' ? 'group' : 'user',
    targetThreadId: typeof rawRecipient?.targetThreadId === 'string' ? rawRecipient.targetThreadId : '',
  };
}

/** Собирает список получателей из данных узла */
function collectRecipients(data: any): ForwardMessageTargetRecipient[] {
  const rawTargets: unknown[] = Array.isArray(data?.targetChatTargets) ? data.targetChatTargets : [];
  if (rawTargets.length > 0) {
    return rawTargets.map((recipient: unknown, index: number) => normalizeRecipient(recipient, index));
  }

  return [
    normalizeRecipient(
      {
        id: 'legacy-target',
        targetChatIdSource: data?.targetChatIdSource,
        targetChatId: data?.targetChatId,
        targetChatVariableName: data?.targetChatVariableName,
        targetChatType: data?.targetChatType,
        targetThreadId: data?.targetThreadId,
      },
      0
    ),
  ];
}

/** Преобразует узел графа в параметры шаблона */
export function nodeToForwardMessageParams(node: Node): ForwardMessageTemplateParams {
  const data = node.data as any;

  return {
    nodeId: node.id,
    safeName: node.id.replace(/[^a-zA-Z0-9_]/g, '_'),
    sourceMessageIdSource: isSourceMode(data?.sourceMessageIdSource) ? data.sourceMessageIdSource : 'current_message',
    sourceMessageId: typeof data?.sourceMessageId === 'string' ? data.sourceMessageId : '',
    sourceMessageVariableName: typeof data?.sourceMessageVariableName === 'string' ? data.sourceMessageVariableName : '',
    sourceMessageNodeId: typeof data?.sourceMessageNodeId === 'string' ? data.sourceMessageNodeId : '',
    targetRecipients: collectRecipients(data),
    disableNotification: data?.disableNotification ?? false,
  };
}

/** Генерирует Python-код из параметров шаблона */
export function generateForwardMessage(params: ForwardMessageTemplateParams): string {
  const validated = forwardMessageParamsSchema.parse(params);
  return renderPartialTemplate('forward-message/forward-message.py.jinja2', validated);
}

/** Генерирует Python-код из узла графа */
export function generateForwardMessageFromNode(node: Node): string {
  return generateForwardMessage(nodeToForwardMessageParams(node));
}
