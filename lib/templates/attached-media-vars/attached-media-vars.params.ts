/**
 * @fileoverview Параметры шаблона attached-media-vars
 * @module templates/attached-media-vars/attached-media-vars.params
 */

export interface AttachedMediaVarsTemplateParams {
  /** ID узла */
  nodeId: string;
  /** Массив имён медиа-переменных */
  attachedMedia: string[];
  /** URL изображения */
  imageUrl?: string;
  /** URL видео */
  videoUrl?: string;
  /** URL аудио */
  audioUrl?: string;
  /** URL документа */
  documentUrl?: string;
  /** Уровень отступа */
  indentLevel?: string;
  /** Включить сохранение данных пользователя в БД */
  userDatabaseEnabled?: boolean;
}
