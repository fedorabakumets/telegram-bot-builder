/**
 * @fileoverview Параметры для шаблона медиа-ноды
 * @module templates/media-node/media-node.params
 */

/** Параметры для генерации обработчика медиа-ноды */
export interface MediaNodeTemplateParams {
  /** Уникальный идентификатор узла */
  nodeId: string;
  /** Массив URL медиафайлов для отправки */
  attachedMedia: string[];
  /** Включить автопереход после отправки медиа */
  enableAutoTransition?: boolean;
  /** ID целевого узла для автоперехода */
  autoTransitionTo?: string;
}
