/**
 * @fileoverview Рендерер шаблона edit_star_subscription
 * @module templates/edit-star-subscription/edit-star-subscription.renderer
 */

import type { Node } from '@shared/schema';
import type {
  EditStarSubscriptionEntry,
  EditStarSubscriptionTemplateParams,
} from './edit-star-subscription.params';
import { editStarSubscriptionParamsSchema } from './edit-star-subscription.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Собирает записи из узлов холста
 * @param nodes - Узлы
 * @returns Записи шаблона
 */
export function collectEditStarSubscriptionEntries(nodes: Node[]): EditStarSubscriptionEntry[] {
  const validNodes = nodes.filter((n) => n != null);
  const entries: EditStarSubscriptionEntry[] = [];

  for (const node of validNodes) {
    if ((node.type as string) !== 'edit_star_subscription') continue;
    const data = node.data as any;
    entries.push({
      nodeId: node.id,
      safeName: node.id.replace(/[^a-zA-Z0-9_]/g, '_'),
      targetNodeId: data?.autoTransitionTo ?? '',
      subscriptionUserSource: data?.subscriptionUserSource === 'custom' ? 'custom' : 'current_user',
      subscriptionUserId: data?.subscriptionUserId ?? '',
      subscriptionChargeId: data?.subscriptionChargeId ?? '',
      subscriptionAction: data?.subscriptionAction === 'enable' ? 'enable' : 'cancel',
      ignoreErrors: Boolean(data?.ignoreErrors),
      subscriptionMsgEmpty: data?.subscriptionMsgEmpty ?? 'Укажите код покупки подписки',
      subscriptionMsgError:
        data?.subscriptionMsgError
        ?? 'Не удалось изменить автопродление. Проверьте код покупки.',
      subscriptionEmptyTarget: data?.subscriptionEmptyTarget ?? '',
      subscriptionErrorTarget: data?.subscriptionErrorTarget ?? '',
    });
  }

  return entries;
}

/**
 * Генерация Python из параметров
 * @param params - Параметры
 * @returns Код
 */
export function generateEditStarSubscription(params: EditStarSubscriptionTemplateParams): string {
  if (params.entries.length === 0) return '';
  const validated = editStarSubscriptionParamsSchema.parse(params);
  return renderPartialTemplate('edit-star-subscription/edit-star-subscription.py.jinja2', {
    entries: validated.entries,
  });
}

/**
 * Генерация Python из узлов
 * @param nodes - Узлы холста
 * @returns Код
 */
export function generateEditStarSubscriptionHandlers(nodes: Node[]): string {
  const entries = collectEditStarSubscriptionEntries(nodes);
  if (entries.length === 0) return '';
  return generateEditStarSubscription({ entries });
}
