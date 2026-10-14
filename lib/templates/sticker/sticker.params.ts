/**
 * @fileoverview Параметры для шаблона стикера
 * @module templates/sticker/sticker.params
 */

/** Параметры для генерации шага отправки стикера */
export interface StickerTemplateParams {
  /** Уникальный идентификатор узла */
  nodeId: string;

  /** URL стикера (HTTP или путь /uploads/) */
  stickerUrl?: string;
  /** File ID стикера */
  stickerFileId?: string;
  /** Запасной идентификатор стикера из набора */
  stickerSetName?: string;

  /**
   * Подпись из старых проектов.
   * В код не попадает: у sendSticker нет caption.
   */
  mediaCaption?: string;
  /** Отправить без уведомления */
  disableNotification?: boolean;
  /** ID следующего узла автоперехода */
  autoTransitionTo?: string;
  /** stickerUrl — локальный путь /uploads/ */
  isLocalStickerUrl?: boolean;
}
