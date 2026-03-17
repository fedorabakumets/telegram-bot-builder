/**
 * @fileoverview Параметры для шаблона голосового сообщения
 * @module templates/voice/voice.params
 */

/** Параметры для генерации обработчика голосового сообщения */
export interface VoiceTemplateParams {
  // --- Идентификация ---
  /** Уникальный идентификатор узла */
  nodeId: string;

  // --- Медиа ---
  /** URL голосового сообщения для отправки */
  voiceUrl?: string;

  // --- Поведение ---
  /** Подпись к голосовому сообщению */
  mediaCaption?: string;
  /** Длительность голосового сообщения в секундах */
  mediaDuration?: number;
  /** Отправить без уведомления */
  disableNotification?: boolean;
}
