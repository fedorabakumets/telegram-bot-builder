/**
 * @fileoverview Перенос устаревшего узла animation в блок «Медиафайл».
 * @module bot-generator/core/migrate-animation-to-media
 */

import type { Node } from '@shared/schema';

/**
 * Кладёт animationUrl в attachedMedia и сохраняет автопереход с подписью.
 * Подпись остаётся в mediaCaption: шаблон медиа отдаёт её только в send_animation.
 * @param data - Данные старого узла animation
 * @returns Данные узла media
 */
function toMediaData(data: Record<string, unknown>): Record<string, unknown> {
  const url = String(data.animationUrl || '').trim();
  const attached = Array.isArray(data.attachedMedia)
    ? (data.attachedMedia as unknown[]).filter((item): item is string => typeof item === 'string')
    : [];
  const attachedMedia = url
    ? [url, ...attached.filter((item) => item !== url)]
    : attached;
  const autoTransitionTo = String(data.autoTransitionTo || '').trim();
  return {
    ...data,
    attachedMedia,
    enableAutoTransition: Boolean(data.enableAutoTransition) || Boolean(autoTransitionTo),
    ...(autoTransitionTo ? { autoTransitionTo } : {}),
  };
}

/**
 * Превращает узлы type animation в type media.
 * Вызывается при открытии проекта и перед генерацией кода.
 * @param nodes - Узлы листа или проекта
 * @returns Тот же список, старые анимации уже медиафайлы
 */
export function migrateAnimationNodesToMedia(nodes: Node[]): Node[] {
  if (!Array.isArray(nodes)) return [];
  return nodes.map((node) => {
    if (!node || node.type !== 'animation') return node;
    const data = (node.data || {}) as Record<string, unknown>;
    return {
      ...node,
      type: 'media',
      data: toMediaData(data),
    } as Node;
  });
}
