/**
 * @fileoverview Параметры для шаблона голосового сообщения
 * @module templates/voice/voice.params
 */

/** Параметры для генерации обработчика голосового сообщения */
export interface VoiceTemplateParams {
  /** Уникальный идентификатор узла */
  nodeId: string;
  /** URL голосового сообщения для отправки */
  voiceUrl: string;
  /** Подпись к голосовому сообщению */
  mediaCaption: string;
  /** Длительность голосового сообщения в секундах */
  mediaDuration: number;
  /** Отправить без уведомления */
  disableNotification: boolean;
}
