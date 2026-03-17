/**
 * @fileoverview Параметры для шаблона отправки прикреплённых медиафайлов
 * @module templates/attached-media/attached-media.params
 */

/** Тип медиафайла */
export type MediaFileType = 'photo' | 'video' | 'audio' | 'document';

/** Режим форматирования */
export type FormatMode = 'html' | 'markdown' | 'none';

/** Параметры для генерации кода отправки прикреплённых медиафайлов */
export interface AttachedMediaTemplateParams {
  /** ID узла */
  nodeId: string;
  /** Массив URL медиафайлов (/uploads/... или http...) */
  attachedMedia: string[];
  /** Режим форматирования текста */
  formatMode?: FormatMode;
  /** Тип клавиатуры (влияет на скрытие файлов при наличии кнопок) */
  keyboardType?: 'inline' | 'reply' | 'none';
  /** Контекст обработчика: message или callback */
  handlerContext?: 'message' | 'callback';
}
