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

  // --- Статическое изображение ---
  /** URL статического изображения из nodeData.imageUrl */
  staticImageUrl?: string;

  // --- Динамическое медиа из БД ---
  /** Имя переменной медиа (из mediaVariablesMap) */
  mediaVariable?: string;
  /** Тип медиа переменной (photo/video/audio/document) */
  mediaType?: MediaFileType;

  // --- Автопереход ---
  /** ID узла для автоперехода (FakeCallbackQuery) */
  autoTransitionTo?: string;

  // --- Waiting state ---
  /** Готовый Python-код установки состояния ожидания (генерируется снаружи) */
  waitingStateCode?: string;

  // --- Поведение ---
  /** Обернуть отправку статического изображения в `if not is_fake_callback:` */
  isFakeCallbackCheck?: boolean;
  /** Использовать safe_edit_or_send в fallback вместо msg.answer */
  fallbackUseSafeEdit?: boolean;
}
