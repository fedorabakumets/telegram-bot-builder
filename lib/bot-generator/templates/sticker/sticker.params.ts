/**
 * @fileoverview Параметры для шаблона стикера
 * @module templates/sticker/sticker.params
 */

/** Параметры для генерации обработчика стикера */
export interface StickerTemplateParams {
  /** Уникальный идентификатор узла */
  nodeId: string;
  /** URL стикера для отправки */
  stickerUrl: string;
  /** File ID стикера */
  stickerFileId: string;
  /** Название набора стикеров */
  stickerSetName: string;
  /** Подпись к стикеру */
  mediaCaption: string;
  /** Отправить без уведомления */
  disableNotification: boolean;
}
